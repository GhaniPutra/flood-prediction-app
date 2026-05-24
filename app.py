from flask import Flask, render_template, request, jsonify
import mysql.connector
from mysql.connector import Error
from datetime import date

app = Flask(__name__)

# Konfigurasi database (bisa pindah ke config file nanti)
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'flood_prediksi'
}

def get_db_connection():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

@app.route('/')
def index():
    return render_template('index.html', title="Prediksi Banjir DIY")

@app.route('/predict', methods=['POST'])
def predict():
    # Ambil data dari request JSON (dikirim dari frontend)
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    rainfall = data.get('curah_hujan')
    elevation = data.get('ketinggian')
    pollution = data.get('pencemaran')
    infiltration = data.get('resapan')
    
    # Validasi input
    if None in [rainfall, elevation, pollution, infiltration]:
        return jsonify({'error': 'Parameter tidak lengkap'}), 400
    
    # TODO: ambil koefisien model aktif dari database
    conn = get_db_connection()
    if conn is None:
        # Fallback ke dummy jika database error
        flood_height = (rainfall / 10) - (elevation / 20) + (pollution / 5) - (infiltration / 5)
        if flood_height < 0: flood_height = 0
        return jsonify({
            'ketinggian_banjir': round(flood_height, 2),
            'zona_kerawanan': 'Rendah' if flood_height <= 20 else 'Sedang' if flood_height <= 50 else 'Tinggi' if flood_height <= 100 else 'Sangat Tinggi'
        })
    
    try:
        cursor = conn.cursor(dictionary=True)
        # Ambil model aktif
        cursor.execute("""
            SELECT beta_curah_hujan, beta_ketinggian, beta_pencemaran, beta_resapan, intercept, rho
            FROM model_coefficients WHERE is_active = TRUE LIMIT 1
        """)
        model = cursor.fetchone()
        
        if model:
            # Hitung prediksi linear (sederhana, tanpa lag spasial untuk sementara)
            # nanti akan ditambahkan matriks bobot
            flood_height = (model['intercept'] +
                           model['beta_curah_hujan'] * rainfall +
                           model['beta_ketinggian'] * elevation +
                           model['beta_pencemaran'] * pollution +
                           model['beta_resapan'] * infiltration)
            if flood_height < 0: flood_height = 0
        else:
            # Dummy jika belum ada model
            flood_height = (rainfall / 10) - (elevation / 20) + (pollution / 5) - (infiltration / 5)
            if flood_height < 0: flood_height = 0
        
        # Tentukan zona kerawanan
        if flood_height <= 20:
            zona = 'Rendah'
        elif flood_height <= 50:
            zona = 'Sedang'
        elif flood_height <= 100:
            zona = 'Tinggi'
        else:
            zona = 'Sangat Tinggi'
        
        # Simpan log prediksi ke database (opsional)
        cursor.execute("""
            INSERT INTO prediksi (id_kecamatan, tanggal_prediksi, curah_hujan_input, ketinggian_input,
                                  pencemaran_input, resapan_input, hasil_ketinggian_cm, zona_kerawanan, id_model_used)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (1, date.today(), rainfall, elevation, pollution, infiltration, flood_height, zona, model['id_model'] if model else None))
        conn.commit()
        
        return jsonify({
            'ketinggian_banjir': round(flood_height, 2),
            'zona_kerawanan': zona
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    app.run(debug=True)