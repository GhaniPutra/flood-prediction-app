from flask import Flask, render_template, request, jsonify
import mysql.connector
from mysql.connector import Error
from datetime import date
import joblib
import numpy as np
import os

app = Flask(__name__)

# Konfigurasi database (bisa pindah ke config file nanti)
DB_CONFIG = {
    'host': 'localhost',
    'user': 'admin',
    'password': 'admin123',
    'database': 'flood_prediksi'
}

# Load trained model dan scaler
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'flood_predictor.pkl')
SCALER_PATH = os.path.join(os.path.dirname(__file__), 'models', 'flood_scaler.pkl')

try:
    flood_model = joblib.load(MODEL_PATH)
    flood_scaler = joblib.load(SCALER_PATH)
    print("✓ Model dan scaler berhasil dimuat")
except Exception as e:
    print(f"⚠ Warning: Tidak bisa load model - {e}")
    flood_model = None
    flood_scaler = None

# Feature names yang digunakan model
FEATURE_NAMES = [
    'MonsoonIntensity', 'TopographyDrainage', 'RiverManagement', 'Deforestation',
    'Urbanization', 'ClimateChange', 'DamsQuality', 'Siltation',
    'AgriculturalPractices', 'Encroachments', 'IneffectiveDisasterPreparedness',
    'DrainageSystems', 'CoastalVulnerability', 'Landslides', 'Watersheds',
    'DeterioratingInfrastructure', 'PopulationScore', 'WetlandLoss',
    'InadequatePlanning', 'PoliticalFactors'
]

def get_db_connection():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def get_risk_zone(probability):
    """Konversi flood probability ke zona kerawanan"""
    if probability <= 0.35:
        return 'Rendah'
    elif probability <= 0.50:
        return 'Sedang'
    elif probability <= 0.75:
        return 'Tinggi'
    else:
        return 'Sangat Tinggi'

@app.route('/')
def index():
    return render_template('index.html', title="Prediksi Banjir DIY")

@app.route('/predict', methods=['POST'])
def predict():
    """Predict flood probability menggunakan trained Random Forest model"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Validasi bahwa semua fitur ada di request
    missing_features = [f for f in FEATURE_NAMES if f not in data]
    if missing_features:
        return jsonify({
            'error': f'Missing features: {", ".join(missing_features)}',
            'required_features': FEATURE_NAMES
        }), 400
    
    try:
        # Ekstrak dan validate fitur dari request
        feature_values = []
        for feature in FEATURE_NAMES:
            value = data.get(feature)
            if value is None:
                return jsonify({'error': f'Feature {feature} tidak boleh kosong'}), 400
            try:
                feature_values.append(float(value))
            except ValueError:
                return jsonify({'error': f'Feature {feature} harus berupa angka'}), 400
        
        # Convert ke numpy array dan scale
        X = np.array([feature_values])
        X_scaled = flood_scaler.transform(X)
        
        # Predict dengan model
        flood_probability = flood_model.predict(X_scaled)[0]
        
        # Ensure probability dalam range 0-1
        flood_probability = float(np.clip(flood_probability, 0, 1))
        
        # Tentukan risk zone
        risk_zone = get_risk_zone(flood_probability)
        
        # Log ke database (opsional)
        conn = get_db_connection()
        if conn:
            try:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO prediksi_log (
                        tanggal_prediksi, flood_probability, risk_zone, features_json
                    ) VALUES (%s, %s, %s, %s)
                """, (date.today(), flood_probability, risk_zone, str(data)))
                conn.commit()
            except Exception as e:
                print(f"Warning: Database log error - {e}")
            finally:
                conn.close()
        
        return jsonify({
            'flood_probability': round(flood_probability, 4),
            'risk_zone': risk_zone,
            'status': 'success'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/features', methods=['GET'])
def get_features():
    """Return daftar fitur yang diperlukan untuk prediksi"""
    return jsonify({
        'features': FEATURE_NAMES,
        'count': len(FEATURE_NAMES),
        'model_status': 'loaded' if flood_model is not None else 'not_loaded'
    })

@app.route('/districts', methods=['GET'])
def get_districts():
    """Return daftar kabupaten/kota dengan data dari database"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id_kecamatan, nama_kecamatan, kabupaten_kota, 
                   luas_km2, jumlah_penduduk, latitude, longitude
            FROM kecamatan
            ORDER BY id_kecamatan ASC
        """)
        districts = cursor.fetchall()
        return jsonify({
            'status': 'success',
            'data': districts,
            'count': len(districts)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/district/<int:district_id>', methods=['GET'])
def get_district_detail(district_id):
    """Return detail kabupaten spesifik"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id_kecamatan, nama_kecamatan, kabupaten_kota,
                   luas_km2, jumlah_penduduk, latitude, longitude
            FROM kecamatan
            WHERE id_kecamatan = %s
        """, (district_id,))
        district = cursor.fetchone()
        
        if not district:
            return jsonify({'error': 'District not found'}), 404
        
        # Get historical data
        cursor.execute("""
            SELECT tanggal, curah_hujan_mm, ketinggian_mdpl, 
                   tingkat_pencemaran, laju_resapan, ketinggian_banjir_cm
            FROM data_historis
            WHERE id_kecamatan = %s
            ORDER BY tanggal DESC
            LIMIT 10
        """, (district_id,))
        historical = cursor.fetchall()
        
        return jsonify({
            'status': 'success',
            'district': district,
            'historical_data': historical
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/predict-district', methods=['POST'])
def predict_district():
    """Predict flood untuk kabupaten spesifik dan log ke database"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    district_id = data.get('district_id')
    if not district_id:
        return jsonify({'error': 'district_id required'}), 400
    
    # Validasi bahwa semua fitur ada di request
    missing_features = [f for f in FEATURE_NAMES if f not in data]
    if missing_features:
        return jsonify({
            'error': f'Missing features: {", ".join(missing_features)}',
            'required_features': FEATURE_NAMES
        }), 400
    
    try:
        # Ekstrak dan validate fitur dari request
        feature_values = []
        for feature in FEATURE_NAMES:
            value = data.get(feature)
            if value is None:
                return jsonify({'error': f'Feature {feature} tidak boleh kosong'}), 400
            try:
                feature_values.append(float(value))
            except ValueError:
                return jsonify({'error': f'Feature {feature} harus berupa angka'}), 400
        
        # Convert ke numpy array dan scale
        X = np.array([feature_values])
        X_scaled = flood_scaler.transform(X)
        
        # Predict dengan model
        flood_probability = flood_model.predict(X_scaled)[0]
        
        # Ensure probability dalam range 0-1
        flood_probability = float(np.clip(flood_probability, 0, 1))
        
        # Tentukan risk zone
        risk_zone = get_risk_zone(flood_probability)
        
        # Log ke database per district
        conn = get_db_connection()
        if conn:
            try:
                cursor = conn.cursor()
                # Verifikasi district ada
                cursor.execute("SELECT id_kecamatan FROM kecamatan WHERE id_kecamatan = %s", (district_id,))
                if not cursor.fetchone():
                    return jsonify({'error': 'District not found'}), 404
                
                # Log prediksi
                cursor.execute("""
                    INSERT INTO prediksi (
                        id_kecamatan, tanggal_prediksi, 
                        hasil_ketinggian_cm, zona_kerawanan
                    ) VALUES (%s, %s, %s, %s)
                """, (district_id, date.today(), 
                      flood_probability * 100, risk_zone))  # Simpan probability as cm height
                conn.commit()
            except Exception as e:
                print(f"Warning: Database log error - {e}")
            finally:
                conn.close()
        
        return jsonify({
            'flood_probability': round(flood_probability, 4),
            'risk_zone': risk_zone,
            'district_id': district_id,
            'status': 'success'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/prediction-history/<int:district_id>', methods=['GET'])
def get_prediction_history(district_id):
    """Get riwayat prediksi untuk kabupaten"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id_prediksi, tanggal_prediksi, 
                   hasil_ketinggian_cm as flood_probability,
                   zona_kerawanan as risk_zone
            FROM prediksi
            WHERE id_kecamatan = %s
            ORDER BY tanggal_prediksi DESC
            LIMIT 30
        """, (district_id,))
        history = cursor.fetchall()
        
        return jsonify({
            'status': 'success',
            'data': history,
            'count': len(history)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(debug=True)