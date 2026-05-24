// Inisialisasi peta
var map = L.map('map').setView([-7.7956, 110.3695], 11);

// Base map
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(map);

// Variabel untuk menyimpan layer GeoJSON (agar bisa di-update nanti)
var geojsonLayer;

// Load GeoJSON
fetch('/static/data/yogyakarta.geojson')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        geojsonLayer = L.geoJSON(data, {
            style: {
                color: '#3388ff',
                weight: 2,
                fillColor: '#3388ff',
                fillOpacity: 0.2
            },
            onEachFeature: function (feature, layer) {
                // Ambil nama wilayah (sesuaikan dengan properti di GeoJSON)
                var name = feature.properties.name || 
                           feature.properties.NAMOBJ || 
                           feature.properties.WILAYAH ||
                           'Wilayah';
                layer.bindPopup('<b>' + name + '</b>');
            }
        }).addTo(map);
        
        // Sesuaikan zoom agar muat semua data
        map.fitBounds(geojsonLayer.getBounds());
    })
    .catch(error => {
        console.error('Error loading GeoJSON:', error);
        // Tambahkan marker default sebagai fallback
        L.marker([-7.7956, 110.3695]).addTo(map)
            .bindPopup('Yogyakarta (GeoJSON belum tersedia)')
            .openPopup();
    });

// Fungsi prediksi (masih dummy, nanti akan dihubungkan ke backend)
function predictFlood() {
    const rainfall = parseFloat(document.getElementById('curah_hujan').value);
    const height = parseFloat(document.getElementById('ketinggian').value);
    const pollution = parseInt(document.getElementById('pencemaran').value);
    const infiltration = parseInt(document.getElementById('resapan').value);
    
    // Validasi input
    if (isNaN(rainfall) || isNaN(height)) {
        alert('Mohon isi Curah Hujan dan Ketinggian Wilayah dengan angka!');
        return;
    }
    
    if (rainfall < 0 || height < 0) {
        alert('Nilai tidak boleh negatif!');
        return;
    }
    
    // Dummy prediction (simulasi model SAR sederhana)
    // Ketinggian banjir = (curah_hujan / 10) - (ketinggian / 20) + (pencemaran/5) - (resapan/5)
    let floodHeight = (rainfall / 10) - (height / 20) + (pollution / 5) - (infiltration / 5);
    if (floodHeight < 0) floodHeight = 0;
    if (floodHeight > 200) floodHeight = 200; // batas maksimal
    
    let riskLevel = '';
    let statusText = '';
    
    if (floodHeight <= 10) {
        riskLevel = 'Rendah';
        statusText = 'Aman';
    } else if (floodHeight <= 30) {
        riskLevel = 'Sedang';
        statusText = 'Waspada';
    } else if (floodHeight <= 60) {
        riskLevel = 'Tinggi';
        statusText = 'Bahaya';
    } else {
        riskLevel = 'Sangat Tinggi';
        statusText = 'Siaga Darurat';
    }
    
    // Tampilkan hasil
    document.getElementById('height').innerHTML = floodHeight.toFixed(2);
    document.getElementById('risk').innerHTML = riskLevel;
    document.getElementById('status').innerHTML = statusText;
    document.getElementById('result').style.display = 'block';
    
    // Opsional: beri warna pada peta berdasarkan prediksi (akan dikembangkan nanti)
}

// Event listener untuk tombol prediksi
document.addEventListener('DOMContentLoaded', function() {
    const predictBtn = document.getElementById('predictBtn');
    if (predictBtn) {
        predictBtn.addEventListener('click', predictFlood);
    }
});