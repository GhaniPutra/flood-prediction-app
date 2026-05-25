# 🗺️ SIG Prediksi Banjir DIY - Panduan Update UI & Database Sync

## 📝 Ringkasan Perubahan

Sistem telah diperbarui untuk mendukung **prediksi per kabupaten/kota** dengan UI yang interaktif dan sinkronisasi database yang lebih baik.

### ✨ Fitur Baru

1. **Peta Interaktif per Distrik**
   - Tampilkan 5 kabupaten/kota DIY di peta
   - Klik distrik untuk memilih → otomatis trigger prediksi
   - Warna distrik berubah sesuai hasil prediksi (Rendah/Sedang/Tinggi/Sangat Tinggi)

2. **Database Synchronization**
   - Setiap prediksi di-log ke tabel `prediksi` dengan `id_kecamatan`
   - Prediksi ter-cache untuk tampilan cepat
   - Support riwayat prediksi per distrik

3. **API Endpoints Baru**
   - `GET /districts` - Daftar semua kabupaten
   - `GET /district/<id>` - Detail kabupaten + data historis
   - `POST /predict-district` - Prediksi dengan ID distrik (ter-log ke DB)
   - `GET /prediction-history/<id>` - Riwayat prediksi per distrik

---

## 🚀 Setup & Cara Menggunakan

### Step 1: Setup Database Kecamatan

Pastikan Anda sudah membuat database sesuai `migrasi_flood_prediksi.sql`, lalu jalankan script untuk insert district master data:

```bash
mysql -u root flood_prediksi < setup_kecamatan.sql
```

Atau manual di phpMyAdmin:
1. Buka database `flood_prediksi`
2. Jalankan SQL dari file `setup_kecamatan.sql`
3. Verifikasi: `SELECT * FROM kecamatan;` → harus ada 5 baris

### Step 2: Pastikan Model Terpasang

File model harus ada di:
- `models/flood_predictor.pkl` ✓
- `models/flood_scaler.pkl` ✓

Jika belum ada, jalankan `train_model.py` terlebih dahulu.

### Step 3: Jalankan Flask Server

```bash
cd /home/maku/flood-prediction-app
source .venv/bin/activate
python3 app.py
```

Akses di: **http://localhost:5000**

### Step 4: Gunakan Aplikasi

1. **Muat Peta** → 5 distrik ditampilkan dalam warna biru (belum diprediksi)

2. **Klik Distrik di Peta**
   - Distrik ter-highlight
   - Sidebar siap untuk input parameter

3. **Sesuaikan Parameter** (20 fitur)
   - Tarik slider untuk setiap faktor risiko
   - Nilai berkisar 1-10

4. **Klik "Prediksi Banjir"**
   - Backend mengambil parameter + district_id
   - Jalankan model ML
   - **Log hasil ke tabel `prediksi`** ✓
   - Tampilkan hasil di panel kiri bawah

5. **Lihat Hasil**
   - Probabilitas dalam %
   - Zona risiko (Rendah/Sedang/Tinggi/Sangat Tinggi)
   - Distrik berubah warna sesuai risiko:
     - 🟢 Hijau: ≤35% (Rendah)
     - 🟡 Kuning: 35-50% (Sedang)
     - 🟠 Oranye: 50-75% (Tinggi)
     - 🔴 Merah Tua: >75% (Sangat Tinggi)

6. **Reset** → Bersihkan semua hasil, distrik kembali biru

---

## 🗄️ Database Schema yang Digunakan

### Tabel: `kecamatan`
| Field | Type | Keterangan |
|-------|------|-----------|
| `id_kecamatan` | INT PK | ID unik (1-5 untuk DIY) |
| `nama_kecamatan` | VARCHAR | Nama distrik (misal: "Kota Yogyakarta") |
| `kabupaten_kota` | VARCHAR | Kategori |
| `luas_km2` | DECIMAL | Luas wilayah |
| `jumlah_penduduk` | INT | Jumlah penduduk |
| `latitude` | DECIMAL | Koordinat |
| `longitude` | DECIMAL | Koordinat |

### Tabel: `prediksi`
| Field | Type | Keterangan |
|-------|------|-----------|
| `id_prediksi` | INT PK | ID unik |
| `id_kecamatan` | INT FK | Referensi ke kecamatan |
| `tanggal_prediksi` | DATE | Tanggal prediksi |
| `hasil_ketinggian_cm` | DECIMAL | **Probability × 100** disimpan di sini |
| `zona_kerawanan` | ENUM | 'Rendah', 'Sedang', 'Tinggi', 'Sangat Tinggi' |
| `created_at` | TIMESTAMP | Waktu auto-insert |

**Catatan:** Sekarang field `hasil_ketinggian_cm` menyimpan `flood_probability * 100` untuk fleksibilitas.

---

## 📍 File-File yang Diubah

### 1. **Backend (`app.py`)**
- ✅ Tambah 4 endpoint baru
- ✅ Fungsi `predict_district()` untuk logging per distrik
- ✅ Support query ke table `kecamatan` dan `prediksi`

### 2. **Frontend (`static/js/main.js`)**
- ✅ Load GeoJSON dari `/static/data/diy-districts.geojson`
- ✅ Fungsi `selectDistrict()` untuk pilih distrik
- ✅ Cache prediksi per distrik di `districtPredictions{}`
- ✅ Click handler pada distrik → auto predict
- ✅ Update popup dengan nama distrik + probability

### 3. **Data (`static/data/diy-districts.geojson`)**
- ✅ GeoJSON baru dengan 5 polygon distrik DIY
- ✅ Properties: id_kecamatan, nama, luas_km2, jumlah_penduduk, koordinat

### 4. **Setup SQL (`setup_kecamatan.sql`)**
- ✅ Script untuk insert master kecamatan ke database

---

## 🔧 Troubleshooting

### ❌ "Pilih wilayah di peta terlebih dahulu"
**Solusi:** Klik pada salah satu distrik di peta terlebih dahulu sebelum klik tombol "Prediksi Banjir"

### ❌ "District not found"
**Solusi:** 
- Verifikasi `kecamatan` table sudah punya data: `SELECT * FROM kecamatan;`
- Jalankan `setup_kecamatan.sql` jika belum

### ❌ "Database connection failed"
**Solusi:**
- Cek config di `app.py`: `DB_CONFIG = {...}`
- Pastikan MySQL berjalan: `sudo systemctl status mysql`
- Cek user `root` bisa akses: `mysql -u root`

### ❌ Peta tidak memuat
**Solusi:**
- Buka console browser (F12) → cek error
- Verifikasi file `/static/data/diy-districts.geojson` ada
- Cek CORS/network errors

### ❌ Model tidak aktif / "Server offline"
**Solusi:**
- Pastikan `flood_predictor.pkl` dan `flood_scaler.pkl` di folder `models/`
- Jalankan `python3 train_model.py` untuk regenerate
- Restart Flask server

---

## 📊 Contoh API Response

### GET /districts
```json
{
  "status": "success",
  "data": [
    {
      "id_kecamatan": 1,
      "nama_kecamatan": "Kota Yogyakarta",
      "kabupaten_kota": "Yogyakarta",
      "luas_km2": 32.5,
      "jumlah_penduduk": 417710,
      "latitude": -7.7956,
      "longitude": 110.3695
    },
    ...
  ],
  "count": 5
}
```

### POST /predict-district
**Request:**
```json
{
  "district_id": 2,
  "MonsoonIntensity": 6,
  "TopographyDrainage": 5,
  ... (18 fitur lainnya)
}
```

**Response:**
```json
{
  "flood_probability": 0.5234,
  "risk_zone": "Tinggi",
  "district_id": 2,
  "status": "success"
}
```

---

## ✅ Testing Checklist

- [ ] Database `flood_prediksi` sudah buat
- [ ] Tabel `kecamatan` sudah ada + populated 5 distrik
- [ ] Tabel `prediksi` sudah ada
- [ ] Model files ada: `models/flood_predictor.pkl`, `models/flood_scaler.pkl`
- [ ] Flask server berjalan di port 5000
- [ ] Peta muncul dengan 5 distrik biru
- [ ] Klik distrik → highlight + popup
- [ ] Ubah parameter slider
- [ ] Klik "Prediksi Banjir" → hasil muncul + distrik berubah warna
- [ ] Query database: `SELECT * FROM prediksi;` → ada data baru
- [ ] Reset → semua distrik kembali biru

---

## 💡 Tips Pengembangan Lebih Lanjut

1. **Tambah Detail per Distrik**
   - Gunakan endpoint `GET /district/<id>` untuk tampilkan data historis
   - Buat grafik trend prediksi per bulan

2. **Export Laporan**
   - Tambah button export PDF/Excel hasil prediksi
   - Gunakan endpoint `GET /prediction-history/<id>`

3. **Auto-update Map Styling**
   - Warna distrik bisa di-update real-time saat parameter berubah
   - Tambah toggle "Live Preview"

4. **Multi-Model Selection**
   - Buat dropdown untuk pilih model yang berbeda
   - Bandingkan hasil antar model

---

## 📞 Support

Jika ada masalah atau pertanyaan, periksa:
1. Console browser (F12) untuk error JavaScript
2. Terminal Flask untuk error backend
3. `SELECT * FROM prediksi LIMIT 10;` untuk verifikasi logging database

---

**Last Updated:** May 25, 2026
**Version:** 2.0 - Interactive District Predictions
