// Daftar semua fitur yang dibutuhkan model
const FEATURES = [
    'MonsoonIntensity', 'TopographyDrainage', 'RiverManagement', 'Deforestation',
    'Urbanization', 'ClimateChange', 'DamsQuality', 'Siltation',
    'AgriculturalPractices', 'Encroachments', 'IneffectiveDisasterPreparedness',
    'DrainageSystems', 'CoastalVulnerability', 'Landslides', 'Watersheds',
    'DeterioratingInfrastructure', 'PopulationScore', 'WetlandLoss',
    'InadequatePlanning', 'PoliticalFactors'
];

// ========== INISIALISASI PETA ==========
var map = L.map('map').setView([-7.7956, 110.3695], 11);

// Base map
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(map);

// Variabel untuk menyimpan layer GeoJSON
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
                var name = feature.properties.name || 
                           feature.properties.NAMOBJ || 
                           feature.properties.WILAYAH ||
                           'Wilayah';
                layer.bindPopup('<b>' + name + '</b>');
            }
        }).addTo(map);
        
        map.fitBounds(geojsonLayer.getBounds());
    })
    .catch(error => {
        console.error('Error loading GeoJSON:', error);
        L.marker([-7.7956, 110.3695]).addTo(map)
            .bindPopup('Yogyakarta (GeoJSON belum tersedia)')
            .openPopup();
    });

// ========== RANGE SLIDER UPDATES ==========
// Update tampilan nilai ketika slider berubah
FEATURES.forEach(feature => {
    const slider = document.getElementById(feature);
    const valueDisplay = document.getElementById(feature + '_val');
    
    if (slider && valueDisplay) {
        slider.addEventListener('input', function() {
            valueDisplay.textContent = this.value;
        });
    }
});

// ========== RESET BUTTON ==========
document.getElementById('resetBtn').addEventListener('click', function() {
    FEATURES.forEach(feature => {
        const slider = document.getElementById(feature);
        const valueDisplay = document.getElementById(feature + '_val');
        if (slider) {
            slider.value = 5; // Reset ke nilai tengah
            if (valueDisplay) valueDisplay.textContent = '5';
        }
    });
    
    // Reset hasil prediksi
    document.getElementById('probability').textContent = '-';
    document.getElementById('risk').textContent = '-';
    document.getElementById('status').textContent = '-';
    document.getElementById('error').style.display = 'none';
});

// ========== PREDIKSI BANJIR ==========
async function predictFlood() {
    try {
        // Kumpulkan nilai dari semua fitur
        const requestData = {};
        FEATURES.forEach(feature => {
            const element = document.getElementById(feature);
            if (element) {
                requestData[feature] = parseFloat(element.value);
            }
        });
        
        console.log('Sending prediction request:', requestData);
        
        // Kirim ke backend /predict endpoint
        const response = await fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Tampilkan hasil prediksi
        if (result.status === 'success') {
            const probability = (result.flood_probability * 100).toFixed(2);
            
            document.getElementById('probability').innerHTML = 
                `${result.flood_probability.toFixed(4)} (${probability}%)`;
            document.getElementById('risk').innerHTML = result.risk_zone;
            
            // Status visual berdasarkan zona risiko
            let statusText = '';
            switch(result.risk_zone) {
                case 'Rendah':
                    statusText = '✓ Aman';
                    break;
                case 'Sedang':
                    statusText = '⚠ Waspada';
                    break;
                case 'Tinggi':
                    statusText = '⚠ Bahaya';
                    break;
                case 'Sangat Tinggi':
                    statusText = '🚨 Siaga Darurat';
                    break;
                default:
                    statusText = '-';
            }
            
            document.getElementById('status').innerHTML = statusText;
            document.getElementById('error').style.display = 'none';
            
            // Update warna peta berdasarkan probabilitas
            updateMapColor(result.flood_probability);
            
            console.log('Prediction successful:', result);
        } else {
            throw new Error(result.error || 'Unknown error');
        }
        
    } catch (error) {
        console.error('Prediction error:', error);
        const errorMsg = error.message || 'Terjadi kesalahan saat prediksi';
        document.getElementById('error').textContent = '❌ Error: ' + errorMsg;
        document.getElementById('error').style.display = 'block';
        
        // Reset hasil
        document.getElementById('probability').textContent = '-';
        document.getElementById('risk').textContent = '-';
        document.getElementById('status').textContent = '-';
    }
}

// ========== UPDATE WARNA PETA ==========
function updateMapColor(probability) {
    if (!geojsonLayer) return;
    
    // Tentukan warna berdasarkan probabilitas
    let color;
    if (probability <= 0.35) {
        color = '#2ecc71'; // Hijau - Rendah
    } else if (probability <= 0.50) {
        color = '#f39c12'; // Orange - Sedang
    } else if (probability <= 0.75) {
        color = '#e74c3c'; // Merah - Tinggi
    } else {
        color = '#8b0000'; // Merah gelap - Sangat Tinggi
    }
    
    // Update warna GeoJSON layer
    geojsonLayer.setStyle({
        fillColor: color,
        color: color,
        weight: 2,
        fillOpacity: 0.5
    });
}

// ========== EVENT LISTENER TOMBOL PREDIKSI ==========
document.getElementById('predictBtn').addEventListener('click', predictFlood);

// Bonus: Allow Enter key untuk prediksi
document.addEventListener('keypress', function(event) {
    if (event.key === 'Enter' && event.target.closest('.sidebar')) {
        predictFlood();
    }
});

// Event listener untuk tombol prediksi
document.addEventListener('DOMContentLoaded', function() {
    const predictBtn = document.getElementById('predictBtn');
    if (predictBtn) {
        predictBtn.addEventListener('click', predictFlood);
    }
});