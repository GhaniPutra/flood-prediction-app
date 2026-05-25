-- ============================================
-- SETUP KECAMATAN TABLE UNTUK DIY DISTRICTS
-- Jalankan script ini setelah membuat database
-- ============================================

USE flood_prediksi;

-- Hapus data lama (opsional)
-- TRUNCATE TABLE kecamatan;

-- Insert 5 kabupaten/kota DIY
INSERT INTO kecamatan (id_kecamatan, nama_kecamatan, kabupaten_kota, luas_km2, jumlah_penduduk, latitude, longitude, geojson) VALUES
(1, 'Kota Yogyakarta', 'Yogyakarta', 32.5, 417710, -7.7956, 110.3695, NULL),
(2, 'Kabupaten Sleman', 'Sleman', 574.82, 1158440, -7.5912, 110.4045, NULL),
(3, 'Kabupaten Bantul', 'Bantul', 506.85, 953738, -7.9833, 110.3167, NULL),
(4, 'Kabupaten Gunung Kidul', 'Gunung Kidul', 1485.31, 713937, -8.2547, 110.6428, NULL),
(5, 'Kabupaten Kulon Progo', 'Kulon Progo', 586.27, 385088, -7.8275, 110.0183, NULL)
ON DUPLICATE KEY UPDATE
  luas_km2 = VALUES(luas_km2),
  jumlah_penduduk = VALUES(jumlah_penduduk),
  latitude = VALUES(latitude),
  longitude = VALUES(longitude);

-- Verifikasi data
SELECT id_kecamatan, nama_kecamatan, kabupaten_kota, jumlah_penduduk 
FROM kecamatan 
ORDER BY id_kecamatan;

-- ============================================
-- CONTOH: Tambah historical data test (opsional)
-- ============================================

-- INSERT INTO data_historis 
-- (id_kecamatan, tanggal, curah_hujan_mm, ketinggian_mdpl, tingkat_pencemaran, laju_resapan, ketinggian_banjir_cm)
-- VALUES 
-- (1, '2024-01-15', 150.5, 112, 6, 4, 45.2),
-- (2, '2024-01-15', 165.3, 180, 5, 5, 38.1),
-- (3, '2024-01-15', 142.8, 100, 7, 3, 52.5);
