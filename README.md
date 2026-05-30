## 🗺️ SIG Prediksi Banjir DIY - Interactive District Predictions

Sistem Informasi Geografis untuk memprediksi tingkat risiko banjir di **Daerah Istimewa Yogyakarta** menggunakan model **Random Forest Machine Learning**.

### ✨ Fitur Utama (v2.0)

- **Prediksi Per Kabupaten/Kota**: Pilih distrik di peta interaktif → dapatkan prediksi spesifik
- **UI Interaktif**: Klik distrik untuk memilih, lihat hasil langsung di peta
- **Sinkronisasi Database**: Setiap prediksi otomatis ter-log ke database dengan ID kabupaten
- **20 Parameter Risiko**: Input berbagai faktor (iklim, topografi, infrastruktur, dll)
- **Real-time Map Coloring**: Distrik berubah warna sesuai tingkat risiko (Hijau → Merah)
- **Riwayat Prediksi**: Akses data historis prediksi per distrik

### 🗺️ Coverage Area
5 Kabupaten/Kota di DIY:
- 🏙️ Kota Yogyakarta
- 🌄 Kabupaten Sleman
- 🌾 Kabupaten Bantul
- ⛰️ Kabupaten Gunung Kidul
- 🌳 Kabupaten Kulon Progo

---

### 📝 Panduan Persiapan

Sebelum memulai, pastikan komputer Anda sudah memiliki:
*   **Git**: Untuk mengunduh (clone) repositori dari GitHub.
*   **Python**: Proyek ini menggunakan Python. Versi yang paling umum dan stabil digunakan adalah **Python 3.8, 3.9, 3.10, atau 3.11**. Anda bisa cek dengan mengetik `python --version` atau `python3 --version` di terminal atau command prompt.
*   **pip**: Manajer paket untuk Python. Biasanya sudah termasuk dalam instalasi Python.
*   **MySQL Server**: Aplikasi ini membutuhkan database MySQL. Anda bisa mengunduh dan menginstalnya dari situs resmi MySQL.
*   **Command Line Interface (CLI)**: Seperti Terminal (macOS/Linux), Command Prompt, atau PowerShell (Windows).

---

### 🚀 Panduan Langkah demi Langkah

#### **1. Clone Repository**
Langkah pertama adalah menyalin proyek ini ke komputer Anda. Buka terminal/CMD dan jalankan perintah berikut:
```bash
git clone https://github.com/GhaniPutra/flood-prediction-app.git
```
Kemudian, masuk ke direktori proyek:
```bash
cd flood-prediction-app
```

#### **2. Siapkan Lingkungan Virtual (Virtual Environment)**
Menggunakan lingkungan virtual adalah praktik yang baik untuk mengisolasi dependensi proyek agar tidak bentrok dengan proyek Python lain di komputer Anda.

*   **Buat virtual environment:**
    ```bash
    python -m venv venv
    ```
*   **Aktifkan virtual environment:**
    *   **Windows:**
        ```bash
        venv\Scripts\activate
        ```
    *   **macOS / Linux:**
        ```bash
        source venv/bin/activate
        ```
    Setelah diaktifkan, Anda akan melihat `(venv)` di awal baris terminal Anda.

#### **3. Instal Dependensi Python**
Proyek ini mencantumkan semua paket Python yang dibutuhkan dalam file `requirements.txt`. Gunakan `pip` untuk menginstalnya sekaligus di dalam virtual environment yang telah aktif.
```bash
pip install -r requirements.txt
```
Perintah ini akan menginstal library seperti **Flask** (framework web), **scikit-learn** (untuk model machine learning), **pandas** (untuk memproses data), dan lainnya.

#### **4. Siapkan Database MySQL**
Aplikasi ini menggunakan database MySQL untuk menyimpan data. File `migrasi_flood_prediksi.sql` berisi struktur tabel yang diperlukan.

1.  **Buat database baru** di MySQL server Anda, misalnya dengan nama `flood_prediksi_db`.
2.  **Impor struktur tabel**: Buka terminal MySQL atau gunakan tool seperti phpMyAdmin, lalu jalankan perintah:
    ```sql
    SOURCE /path/ke/proyek/anda/migrasi_flood_prediksi.sql;
    ```
    Atau, jika melalui command line, Anda bisa langsung mengimpor file-nya:
    ```bash
    mysql -u username -p nama_database < migrasi_flood_prediksi.sql
    ```
    Ganti `username` dan `nama_database` sesuai dengan konfigurasi MySQL Anda.

3. **Populate Tabel Kecamatan** (Master District Data):
   ```bash
   mysql -u username -p flood_prediksi < setup_kecamatan.sql
   ```
   Ini akan memasukkan 5 kabupaten/kota DIY ke tabel `kecamatan` beserta koordinat dan data demografisnya.
   
   Verifikasi dengan menjalankan:
   ```bash
   mysql -u root flood_prediksi -e "SELECT * FROM kecamatan;"
   ```

#### **5. Konfigurasi Koneksi Database**
Aplikasi perlu tahu cara terhubung ke database yang telah dibuat. Biasanya, informasi ini disimpan dalam file konfigurasi seperti `.env` atau langsung di file `app.py`. Lihatlah file `app.py` untuk mencari baris yang berisi konfigurasi koneksi, mirip seperti ini:
```python
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://username:password@localhost/db_name'
```
Ubah bagian `username`, `password`, dan `db_name` sesuai dengan kredensial MySQL Anda.

#### **6. (Opsional) Latih Ulang Model Machine Learning**
Jika Anda ingin melatih ulang model prediksi menggunakan data terbaru di `data/flood.csv`, Anda bisa menjalankan file `train_model.py`:
```bash
python train_model.py
```
Skrip ini akan menghasilkan file model (`flood_predictor.pkl`) dan `scaler` (`flood_scaler.pkl`) baru di dalam folder `models/`.

#### **7. Jalankan Aplikasi Web**
Untuk memulai server web dan menjalankan aplikasi, Anda perlu menjalankan file `app.py`.
```bash
python app.py
```
Jika berhasil, Anda akan melihat pesan seperti ini di terminal:
```text
 * Running on http://127.0.0.1:5000/ (Press CTRL+C to quit)
```
Buka browser web Anda dan kunjungi alamat `http://127.0.0.1:5000` untuk mulai menggunakan aplikasi prediksi banjir.

---

### 🎯 Cara Menggunakan Aplikasi (v2.0)

Setelah aplikasi berjalan di `http://127.0.0.1:5000`:

1. **Lihat Peta Interaktif**
   - 5 kabupaten/kota DIY ditampilkan dengan warna biru (status unpredicted)

2. **Pilih Kabupaten**
   - Klik pada salah satu distrik di peta
   - Distrik akan ter-highlight dengan border tebal

3. **Atur Parameter Risiko**
   - Slide 20 parameter di panel kiri (Cuaca, Topografi, Lahan, Air, Infrastruktur, Risiko, Populasi)
   - Nilai berkisar 1-10 untuk setiap faktor

4. **Jalankan Prediksi**
   - Klik tombol **"Prediksi Banjir"**
   - Sistem akan:
     - Menjalankan model ML dengan parameter yang Anda input
     - **Menyimpan hasil ke database** `prediksi` tabel ✓
     - Menampilkan probabilitas banjir dalam %
     - Menentukan zona risiko (Rendah/Sedang/Tinggi/Sangat Tinggi)

5. **Lihat Hasil di Peta**
   - Distrik yang dipilih berubah warna sesuai tingkat risiko:
     - 🟢 **Hijau**: ≤35% probabilitas (Rendah)
     - 🟡 **Kuning**: 35-50% (Sedang)
     - 🟠 **Oranye**: 50-75% (Tinggi)
     - 🔴 **Merah Tua**: >75% (Sangat Tinggi)
   - Popup distrik menampilkan nama + probability terbaru

6. **Reset Semua**
   - Klik **"Reset"** untuk kembali ke state awal (semua biru)

### 📊 Akses Data Prediksi

Query database untuk melihat riwayat prediksi:
```sql
SELECT id_prediksi, id_kecamatan, tanggal_prediksi, 
       hasil_ketinggian_cm as probability, zona_kerawanan 
FROM prediksi 
ORDER BY tanggal_prediksi DESC 
LIMIT 10;
```

Atau gunakan API endpoint:
```bash
curl http://localhost:5000/prediction-history/2
```

---



*   **Pastikan Port 5000 Tersedia**: Aplikasi Flask biasanya berjalan di port 5000. Jika port ini sedang digunakan oleh program lain (misalnya, AirPlay Receiver di macOS), Anda bisa menghentikan program tersebut atau mengganti port di file `app.py`.
*   **Periksa Kembali Dependensi**: Jika ada error saat instalasi, pastikan `pip` Anda sudah versi terbaru dengan menjalankan `python -m pip install --upgrade pip`. Jika instalasi berjalan lambat, Anda bisa menggunakan server cermin (mirror) dengan perintah `pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple`.
*   **Gunakan Akun MySQL yang Tepat**: Pastikan akun MySQL yang Anda gunakan memiliki hak akses penuh (`ALL PRIVILEGES`) untuk database `flood_prediksi_db`.
*   **Uji Coba API**: Setelah aplikasi berjalan, Anda bisa menguji fungsionalitas API-nya secara terpisah dengan menjalankan `python test_api.py` di terminal baru (pastikan server utama masih berjalan).
*   **Struktur Direktori Penting**: Memahami struktur folder proyek akan memudahkan jika terjadi error:
    *   `app.py`: File utama untuk menjalankan aplikasi web.
    *   `templates/`: Berisi file HTML (seperti `index.html`) untuk tampilan antarmuka pengguna.
    *   `static/`: Menyimpan file pendukung seperti CSS dan JavaScript.
    *   `models/`: Tempat file model (`flood_predictor.pkl`) dan `scaler` (.pkl) disimpan.
    *   `data/`: Menyimpan file data historis (`flood.csv`) yang digunakan untuk melatih model.

