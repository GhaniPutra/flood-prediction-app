-- ============================================
-- MIGRASI DATABASE UNTUK SISTEM PREDIKSI BANJIR
-- Dibuat untuk: phpMyAdmin / MySQL
-- ============================================

-- 1. Membuat database (jika belum ada)
CREATE DATABASE IF NOT EXISTS flood_prediksi
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Gunakan database
USE flood_prediksi;

-- ============================================
-- TABEL 1: kecamatan (master wilayah)
-- ============================================
CREATE TABLE IF NOT EXISTS kecamatan (
    id_kecamatan INT PRIMARY KEY AUTO_INCREMENT,
    nama_kecamatan VARCHAR(100) NOT NULL,
    kabupaten_kota VARCHAR(50),
    luas_km2 DECIMAL(10,2),
    jumlah_penduduk INT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    geojson TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- TABEL 2: data_historis (untuk training model)
-- ============================================
CREATE TABLE IF NOT EXISTS data_historis (
    id_data INT PRIMARY KEY AUTO_INCREMENT,
    id_kecamatan INT NOT NULL,
    tanggal DATE NOT NULL,
    curah_hujan_mm DECIMAL(8,2),
    ketinggian_mdpl DECIMAL(6,2),
    tingkat_pencemaran INT CHECK (tingkat_pencemaran BETWEEN 1 AND 10),
    laju_resapan INT CHECK (laju_resapan BETWEEN 1 AND 10),
    ketinggian_banjir_cm DECIMAL(8,2),
    sumber_data VARCHAR(100),
    FOREIGN KEY (id_kecamatan) REFERENCES kecamatan(id_kecamatan) ON DELETE CASCADE,
    INDEX idx_training (id_kecamatan, tanggal),
    INDEX idx_tanggal (tanggal)
) ENGINE=InnoDB;

-- ============================================
-- TABEL 3: model_coefficients (hasil training SAR)
-- ============================================
CREATE TABLE IF NOT EXISTS model_coefficients (
    id_model INT PRIMARY KEY AUTO_INCREMENT,
    tanggal_training DATE NOT NULL,
    rho DECIMAL(10,6),
    beta_curah_hujan DECIMAL(10,6),
    beta_ketinggian DECIMAL(10,6),
    beta_pencemaran DECIMAL(10,6),
    beta_resapan DECIMAL(10,6),
    intercept DECIMAL(10,6),
    mae DECIMAL(10,4),
    mape DECIMAL(10,4),
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- ============================================
-- TABEL 4: prediksi (log hasil prediksi)
-- ============================================
CREATE TABLE IF NOT EXISTS prediksi (
    id_prediksi INT PRIMARY KEY AUTO_INCREMENT,
    id_kecamatan INT NOT NULL,
    tanggal_prediksi DATE NOT NULL,
    curah_hujan_input DECIMAL(8,2),
    ketinggian_input DECIMAL(6,2),
    pencemaran_input INT,
    resapan_input INT,
    hasil_ketinggian_cm DECIMAL(8,2),
    zona_kerawanan ENUM('Rendah','Sedang','Tinggi','Sangat Tinggi'),
    id_model_used INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_kecamatan) REFERENCES kecamatan(id_kecamatan) ON DELETE CASCADE,
    FOREIGN KEY (id_model_used) REFERENCES model_coefficients(id_model) ON DELETE SET NULL,
    INDEX idx_tanggal (tanggal_prediksi),
    INDEX idx_kecamatan (id_kecamatan)
) ENGINE=InnoDB;

-- ============================================
-- TABEL 5: user_log (opsional, untuk aktivitas admin)
-- ============================================
CREATE TABLE IF NOT EXISTS user_log (
    id_log INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50),
    aksi VARCHAR(100),
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (username),
    INDEX idx_tanggal_log (created_at)
) ENGINE=InnoDB;

-- ============================================
-- DATA DUMMY (contoh untuk testing)
-- ============================================

-- Insert beberapa kecamatan di DIY
INSERT INTO kecamatan (nama_kecamatan, kabupaten_kota, luas_km2, jumlah_penduduk, latitude, longitude) VALUES
('Gondokusuman', 'Kota Yogyakarta', 3.99, 45000, -7.7828, 110.3685),
('Depok', 'Sleman', 35.55, 185000, -7.7648, 110.4289),
('Pleret', 'Bantul', 27.72, 50000, -7.8512, 110.4125),
('Pakem', 'Sleman', 86.25, 71000, -7.6566, 110.4212),
('Ngaglik', 'Sleman', 39.48, 125000, -7.7112, 110.3889),
('Kotagede', 'Kota Yogyakarta', 3.07, 32000, -7.8186, 110.4017),
('Banguntapan', 'Bantul', 28.61, 115000, -7.8133, 110.4032);

-- Insert dummy data historis (untuk training)
-- Asumsikan id_kecamatan 1 s.d. 7
INSERT INTO data_historis (id_kecamatan, tanggal, curah_hujan_mm, ketinggian_mdpl, tingkat_pencemaran, laju_resapan, ketinggian_banjir_cm, sumber_data) VALUES
(1, '2022-01-15', 120, 120, 5, 6, 15.2, 'BMKG'),
(1, '2022-02-20', 180, 120, 6, 6, 35.7, 'BMKG'),
(2, '2022-01-10', 150, 110, 7, 4, 48.5, 'BNPB'),
(2, '2022-02-18', 210, 110, 8, 4, 85.3, 'BNPB'),
(3, '2022-01-12', 130, 90, 6, 5, 52.0, 'BMKG'),
(3, '2022-02-25', 190, 90, 7, 5, 78.2, 'BMKG'),
(4, '2022-01-05', 100, 350, 2, 8, 2.5, 'BNPB'),
(5, '2022-01-08', 110, 180, 4, 7, 8.1, 'BNPB'),
(6, '2022-01-20', 140, 95, 5, 6, 28.3, 'BMKG'),
(7, '2022-02-01', 160, 85, 6, 5, 65.0, 'BMKG');

-- Insert dummy model coefficient (aktif)
INSERT INTO model_coefficients (tanggal_training, rho, beta_curah_hujan, beta_ketinggian, beta_pencemaran, beta_resapan, intercept, mae, mape, is_active) VALUES
(CURDATE(), 0.65, 0.42, -0.18, 2.35, -1.50, 5.20, 1.35, 2.16, TRUE);

-- Insert dummy prediksi (contoh hasil)
INSERT INTO prediksi (id_kecamatan, tanggal_prediksi, curah_hujan_input, ketinggian_input, pencemaran_input, resapan_input, hasil_ketinggian_cm, zona_kerawanan, id_model_used) VALUES
(1, CURDATE(), 120, 120, 5, 6, 18.4, 'Rendah', 1),
(2, CURDATE(), 150, 110, 7, 4, 52.7, 'Sedang', 1),
(3, CURDATE(), 130, 90, 6, 5, 47.2, 'Sedang', 1);

-- ============================================
-- SELESAI
-- ============================================