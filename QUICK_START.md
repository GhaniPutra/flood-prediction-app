# 🚀 QUICK START GUIDE - Flood Prediction App v2.0

Panduan cepat untuk setup dan jalankan aplikasi dengan fitur interactive district predictions.

---

## ⏱️ 5 Menit Setup

### 1️⃣ **Database Setup** (2 menit)
```bash
# Pastikan MySQL server berjalan
sudo systemctl start mysql

# Import database structure
mysql -u root flood_prediksi < migrasi_flood_prediksi.sql

# Populate 5 districts master data
mysql -u root flood_prediksi < setup_kecamatan.sql

# Verify (harus keluar 5 baris)
mysql -u root flood_prediksi -e "SELECT id_kecamatan, nama_kecamatan FROM kecamatan;"
```

### 2️⃣ **Verify Model Files** (30 detik)
```bash
# Check model files exist
ls -la models/flood_predictor.pkl models/flood_scaler.pkl

# If not, train model:
python3 train_model.py  # ~2 menit
```

### 3️⃣ **Start Flask Server** (30 detik)
```bash
# Activate virtual environment
source .venv/bin/activate

# Run Flask app
python3 app.py

# Lihat output:
# * Running on http://127.0.0.1:5000
```

### 4️⃣ **Open Browser** (30 detik)
```
Visit: http://localhost:5000
```

---

## ✅ Usage - 3 Langkah Simpel

### 1. **Klik Distrik di Peta**
![Gambar: 5 distrik biru muncul di peta]
- Pilih salah satu dari 5 kabupaten/kota
- Distrik akan ter-highlight

### 2. **Ubah Parameter**
```
Cuaca & Iklim:
  - Intensitas Monsun: [===    ] 5
  - Perubahan Iklim:   [    ===] 7
...
(Slide 20 parameter sesuai skenario)
```

### 3. **Klik "Prediksi Banjir"**
```
Result:
  Probabilitas: 52.3%
  Zona Risiko: Tinggi
  Status: ⚠ Bahaya
```
✅ Distrik berubah warna oranye = Tinggi risk
✅ Hasil otomatis ter-save ke database

---

## 🗂️ File Struktur Penting

```
flood-prediction-app/
├── app.py                          ← Backend dengan 4 endpoint baru
├── static/
│   ├── js/main.js                  ← Frontend interactive (UPDATED)
│   ├── css/style.css               ← Styling
│   └── data/
│       └── diy-districts.geojson   ← 5 distrik DIY (NEW)
├── templates/
│   └── index.html                  ← UI
├── models/
│   ├── flood_predictor.pkl         ← ML Model
│   └── flood_scaler.pkl            ← Data scaler
├── migrasi_flood_prediksi.sql      ← Database structure
├── setup_kecamatan.sql             ← Master data (NEW)
├── PANDUAN_UPDATE_UI.md            ← Detailed guide (NEW)
├── RINGKASAN_PERBAIKAN.md          ← Summary (NEW)
└── README.md                       ← Updated with v2.0 features
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Pilih wilayah" error | Klik distrik di peta dulu! |
| "District not found" | Jalankan `setup_kecamatan.sql` |
| Peta tidak muncul | Check browser console (F12) |
| "Database connection failed" | Cek DB_CONFIG di app.py, pastikan MySQL running |
| Model error | Jalankan `python3 train_model.py` |

---

## 📊 API Quick Test

```bash
# Get all districts
curl http://localhost:5000/districts | jq .

# Get prediction history for district 2 (Sleman)
curl http://localhost:5000/prediction-history/2 | jq .

# Test predict endpoint (manual)
curl -X POST http://localhost:5000/predict-district \
  -H "Content-Type: application/json" \
  -d '{
    "district_id": 1,
    "MonsoonIntensity": 5,
    "TopographyDrainage": 5,
    "RiverManagement": 5,
    "Deforestation": 5,
    "Urbanization": 5,
    "ClimateChange": 5,
    "DamsQuality": 5,
    "Siltation": 5,
    "AgriculturalPractices": 5,
    "Encroachments": 5,
    "IneffectiveDisasterPreparedness": 5,
    "DrainageSystems": 5,
    "CoastalVulnerability": 5,
    "Landslides": 5,
    "Watersheds": 5,
    "DeterioratingInfrastructure": 5,
    "PopulationScore": 5,
    "WetlandLoss": 5,
    "InadequatePlanning": 5,
    "PoliticalFactors": 5
  }' | jq .
```

---

## 📱 Features Checklist

- ✅ **Interactive Map** - 5 kabupaten DIY dengan polygon boundaries
- ✅ **Click to Select** - Klik distrik → highlight + auto-prepare for prediction
- ✅ **Per-District Prediction** - Setiap prediksi spesifik untuk distrik pilihan
- ✅ **Real-time Coloring** - Warna berubah sesuai hasil (Hijau → Merah)
- ✅ **Database Logging** - Otomatis simpan ke tabel `prediksi` dengan id_kecamatan
- ✅ **Prediction History** - API untuk akses riwayat per distrik
- ✅ **20 Parameters** - Full factor input untuk prediksi akurat

---

## 🎓 Learn More

Untuk dokumentasi lengkap:
1. **`PANDUAN_UPDATE_UI.md`** - Panduan komprehensif (20 halaman)
2. **`RINGKASAN_PERBAIKAN.md`** - Technical summary
3. **`README.md`** - Project overview updated

---

## ⏰ Expected Time

- Setup: **5-10 menit**
- First prediction: **2 menit**
- Full testing: **15-20 menit**

---

## 🎯 Next Steps

1. ✅ Run setup commands above
2. ✅ Open http://localhost:5000
3. ✅ Click a district on the map
4. ✅ Adjust parameters
5. ✅ Click "Prediksi Banjir"
6. ✅ See district color change on map
7. ✅ Check database: `SELECT * FROM prediksi;`

---

## 💬 Questions?

Check:
- `PANDUAN_UPDATE_UI.md` → Section "Troubleshooting"
- Terminal error messages
- Browser console (F12)

**Happy predicting! 🗺️🚨**

---

Version: 2.0 - Interactive District Predictions
Last Updated: May 25, 2026
