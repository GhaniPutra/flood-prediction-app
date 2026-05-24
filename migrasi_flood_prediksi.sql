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
-- SELESAI
-- ============================================