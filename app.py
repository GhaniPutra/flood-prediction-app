from flask import Flask, render_template, request, jsonify
import mysql.connector
from mysql.connector import Error
from datetime import date
import joblib
import numpy as np
import os
from config import DB_CONFIG, FEATURE_NAMES, RISK_THRESHOLDS, MODEL_PATH, SCALER_PATH

app = Flask(__name__)

try:
    flood_model = joblib.load(MODEL_PATH)
    flood_scaler = joblib.load(SCALER_PATH)
    print("✓ Model dan scaler berhasil dimuat")
except Exception as e:
    print(f"⚠ Warning: Tidak bisa load model - {e}")
    flood_model = None
    flood_scaler = None

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

if __name__ == '__main__':
    app.run(debug=True)