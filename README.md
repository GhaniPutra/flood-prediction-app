# 🌊 Sistem Prediksi Kerawanan Banjir DIY

Sistem Informasi Geografis untuk prediksi kerawanan banjir di Daerah Istimewa Yogyakarta menggunakan Machine Learning (Random Forest Regressor).

## 📋 Daftar Isi
- [Setup](#setup)
- [Konfigurasi Database](#konfigurasi-database)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [API Endpoints](#api-endpoints)
- [Struktur Direktori](#struktur-direktori)

## 🚀 Setup

### Prerequisites
- Python 3.8+
- MySQL 8.0+
- Git

### 1. Clone Repository
```bash
git clone https://github.com/GhaniPutra/flood-prediction-app.git
cd flood-prediction-app
```

### 2. Setup Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# atau
venv\Scripts\activate  # Windows
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Setup Environment Variables
Copy `.env.example` ke `.env` dan sesuaikan konfigurasi:
```bash
cp .env.example .env
```

Edit `.env` dengan credentials MySQL Anda:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=flood_prediksi
DB_PORT=3306
```

## 🗄️ Konfigurasi Database

### 1. Create Database & Tables
Jalankan SQL migration di phpMyAdmin atau via CLI:
```bash
mysql -u root -p < migrasi_flood_prediksi.sql
```

### 2. Verify Database Connection
```bash
python -c "from app import get_db_connection; c = get_db_connection(); print('✓ Connected' if c else '✗ Failed')"
```

## ▶️ Menjalankan Aplikasi

### Development Mode
```bash
source venv/bin/activate
python app.py
```

Aplikasi akan running di `http://localhost:5000`

### Production Mode
```bash
export FLASK_ENV=production
python app.py
```

## 📡 API Endpoints

### 1. GET `/` - Homepage
Menampilkan interface aplikasi dengan peta interaktif.

### 2. GET `/features` - Daftar Fitur
```bash
curl http://localhost:5000/features
```

Response:
```json
{
  "count": 20,
  "features": ["MonsoonIntensity", "TopographyDrainage", ...],
  "model_status": "loaded"
}
```

### 3. POST `/predict` - Prediksi Banjir
Mengirim 20 fitur untuk mendapat prediksi.

**Request:**
```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "MonsoonIntensity": 5,
    "TopographyDrainage": 8,
    "RiverManagement": 6,
    ... (18 fitur lainnya)
  }'
```

**Response:**
```json
{
  "flood_probability": 0.5088,
  "risk_zone": "Tinggi",
  "status": "success"
}
```

## 📁 Struktur Direktori

```
flood-prediction-app/
├── app.py                      # Main Flask application
├── config.py                   # Configuration & settings
├── train_model.py              # Model training script
├── test_api.py                 # API test script
├── requirements.txt            # Python dependencies
├── .env                        # Environment variables (ignored)
├── .env.example                # Environment template
├── .gitignore                  # Git ignore rules
│
├── models/
│   ├── flood_predictor.pkl     # Trained Random Forest model
│   ├── flood_scaler.pkl        # Feature scaler
│   └── feature_importance.csv  # Feature importance scores
│
├── data/
│   ├── flood.csv               # Real dataset (50k records)
│   └── dummy_flood_data.csv    # Dummy data
│
├── static/
│   ├── css/
│   │   └── style.css           # Styling
│   ├── js/
│   │   └── main.js             # Frontend logic
│   └── data/
│       └── yogyakarta.geojson  # GeoJSON untuk peta
│
├── templates/
│   └── index.html              # Main HTML template
│
└── migrasi_flood_prediksi.sql  # Database schema
```

## 🤖 Model Info

**Algoritma:** Random Forest Regressor
- **Estimators:** 100 trees
- **Max Depth:** 15
- **Training Data:** 50,000 samples
- **Features:** 20 (monsun, topografi, urbanisasi, dll)
- **Target:** Flood Probability (0-1)

**Performance:**
- Training R² Score: 0.9220
- Testing R² Score: 0.7104
- RMSE: 0.0269
- MAE: 0.0212

## 🗺️ Peta Interaktif

Aplikasi menggunakan **Leaflet.js** dengan CartoDB basemap.
Warna peta berubah sesuai risk zone:
- 🟢 Hijau: Rendah (≤0.35)
- 🟡 Orange: Sedang (0.35-0.50)
- 🔴 Merah: Tinggi (0.50-0.75)
- 🟣 Merah Gelap: Sangat Tinggi (>0.75)

## 📊 Database Schema

### Tabel: `kecamatan`
Master data wilayah administrasi.

### Tabel: `data_historis`
Data historis untuk training model.

### Tabel: `model_coefficients`
Koefisien hasil training model.

### Tabel: `prediksi`
Log hasil prediksi dari pengguna.

### Tabel: `user_log`
Log aktivitas admin.

## 🔧 Development Tips

### Train Model dengan Data Baru
```bash
python train_model.py
```

### Test API
```bash
python test_api.py
```

### Debug Mode
Set `DEBUG=True` di `.env` untuk hot-reload.

## 📝 License
MIT License

## 👤 Author
Ghani Putra

## 📧 Contact
Email: ghaniputra@example.com
