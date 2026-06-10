/**
 * main.js — SIG Prediksi Banjir DIY
 * Updated untuk support prediksi per kabupaten dengan interaksi peta
 */

// ============================================================
// KONSTANTA & STATE
// ============================================================
const FEATURES = [
    'MonsoonIntensity', 'TopographyDrainage', 'RiverManagement', 'Deforestation',
    'Urbanization', 'ClimateChange', 'DamsQuality', 'Siltation',
    'AgriculturalPractices', 'Encroachments', 'IneffectiveDisasterPreparedness',
    'DrainageSystems', 'CoastalVulnerability', 'Landslides', 'Watersheds',
    'DeterioratingInfrastructure', 'PopulationScore', 'WetlandLoss',
    'InadequatePlanning', 'PoliticalFactors'
];

const RISK_COLORS = {
    rendah:        '#2ecc71',
    sedang:        '#f39c12',
    tinggi:        '#e74c3c',
    sangat_tinggi: '#8b0000'
};

let selectedDistrictId = null;
let districtPredictions = {}; // Cache prediksi per distrik
let districtLayers = {}; // Store reference layer per distrik
let dbDistricts = {}; // Cache data kecamatan dari database
let districtMarkers = {}; // Store reference marker per distrik
let districtSliders = {}; // Cache slider values per distrik

// List parameter yang bersifat spesifik wilayah (karakteristik bawaan daerah)
const DISTRICT_SPECIFIC_FEATURES = [
    'TopographyDrainage', 
    'Deforestation', 
    'Urbanization', 
    'CoastalVulnerability', 
    'Landslides', 
    'PopulationScore',
    'WetlandLoss'
];

// Baseline karakteristik masing-masing wilayah (sesuai kondisi demografis/geografis nyata)
const DISTRICT_BASELINES = {
    1: { // Kota Yogyakarta (Sangat Padat, Urban, Rata, Landlocked)
        MonsoonIntensity: 5, TopographyDrainage: 4, RiverManagement: 6, Deforestation: 2,
        Urbanization: 9, ClimateChange: 5, DamsQuality: 5, Siltation: 6,
        AgriculturalPractices: 2, Encroachments: 7, IneffectiveDisasterPreparedness: 5,
        DrainageSystems: 4, CoastalVulnerability: 1, Landslides: 1, Watersheds: 4,
        DeterioratingInfrastructure: 5, PopulationScore: 9, WetlandLoss: 8,
        InadequatePlanning: 6, PoliticalFactors: 5
    },
    2: { // Kabupaten Sleman (Lereng Merapi, Pertanian/Suburban, Landlocked)
        MonsoonIntensity: 5, TopographyDrainage: 6, RiverManagement: 6, Deforestation: 4,
        Urbanization: 6, ClimateChange: 5, DamsQuality: 6, Siltation: 4,
        AgriculturalPractices: 6, Encroachments: 4, IneffectiveDisasterPreparedness: 4,
        DrainageSystems: 5, CoastalVulnerability: 1, Landslides: 5, Watersheds: 6,
        DeterioratingInfrastructure: 4, PopulationScore: 6, WetlandLoss: 5,
        InadequatePlanning: 4, PoliticalFactors: 5
    },
    3: { // Kabupaten Bantul (Muara Sungai, Pesisir, Pertanian)
        MonsoonIntensity: 5, TopographyDrainage: 3, RiverManagement: 5, Deforestation: 3,
        Urbanization: 5, ClimateChange: 5, DamsQuality: 5, Siltation: 7,
        AgriculturalPractices: 7, Encroachments: 5, IneffectiveDisasterPreparedness: 5,
        DrainageSystems: 4, CoastalVulnerability: 6, Landslides: 3, Watersheds: 5,
        DeterioratingInfrastructure: 5, PopulationScore: 5, WetlandLoss: 6,
        InadequatePlanning: 5, PoliticalFactors: 5
    },
    4: { // Kabupaten Gunung Kidul (Pegunungan Karst, Pesisir, Kepadatan Rendah)
        MonsoonIntensity: 5, TopographyDrainage: 7, RiverManagement: 4, Deforestation: 5,
        Urbanization: 3, ClimateChange: 5, DamsQuality: 4, Siltation: 3,
        AgriculturalPractices: 5, Encroachments: 3, IneffectiveDisasterPreparedness: 6,
        DrainageSystems: 3, CoastalVulnerability: 7, Landslides: 8, Watersheds: 4,
        DeterioratingInfrastructure: 6, PopulationScore: 2, WetlandLoss: 3,
        InadequatePlanning: 5, PoliticalFactors: 5
    },
    5: { // Kabupaten Kulon Progo (Dataran Rendah & Perbukitan, Bandara YIA, Pesisir)
        MonsoonIntensity: 5, TopographyDrainage: 5, RiverManagement: 5, Deforestation: 5,
        Urbanization: 4, ClimateChange: 5, DamsQuality: 5, Siltation: 5,
        AgriculturalPractices: 6, Encroachments: 4, IneffectiveDisasterPreparedness: 5,
        DrainageSystems: 4, CoastalVulnerability: 6, Landslides: 5, Watersheds: 5,
        DeterioratingInfrastructure: 5, PopulationScore: 3, WetlandLoss: 4,
        InadequatePlanning: 5, PoliticalFactors: 5
    }
};

// ============================================================
// INISIALISASI PETA
// ============================================================
var map = L.map('map', { zoomControl: false }).setView([-7.7956, 110.3695], 10);

L.control.zoom({ position: 'bottomright' }).addTo(map);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(map);

// ============================================================
// LOAD GEOJSON KABUPATEN/KOTA
// ============================================================
var geojsonLayer = null;

function getDistrictStyle(districtId = null) {
    let fillColor = '#3b82f6';
    let opacity = 0.18;
    
    if (districtId && districtPredictions[districtId]) {
        const pred = districtPredictions[districtId];
        const prob = pred.flood_probability;
        fillColor = prob <= 0.35 ? RISK_COLORS.rendah
                  : prob <= 0.50 ? RISK_COLORS.sedang
                  : prob <= 0.75 ? RISK_COLORS.tinggi
                  : RISK_COLORS.sangat_tinggi;
        opacity = 0.55;
    }
    
    return {
        color: '#1a2f50',
        weight: 1.5,
        fillColor: fillColor,
        fillOpacity: opacity,
        dashArray: districtPredictions[districtId] ? '' : '4 3'
    };
}

function defaultStyle(feature) {
    return getDistrictStyle(feature.properties.id_kecamatan);
}

// Load data kecamatan dari database, kemudian muat GeoJSON
function loadMapData() {
    fetch('/districts')
        .then(r => r.json())
        .then(res => {
            if (res.status === 'success') {
                res.data.forEach(district => {
                    dbDistricts[district.id_kecamatan] = district;
                });
            }
            loadGeoJSON();
        })
        .catch(err => {
            console.error('Database districts error:', err);
            loadGeoJSON(); // Tetap muat GeoJSON jika gagal
        });
}

function loadGeoJSON() {
    fetch('/static/data/diy-districts.geojson')
        .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(data => {
            geojsonLayer = L.geoJSON(data, {
                style: defaultStyle,
                onEachFeature: function (feature, layer) {
                    const districtId = feature.properties.id_kecamatan;
                    const dbData = dbDistricts[districtId] || {};
                    const name = dbData.nama_kecamatan || feature.properties.nama || 'Unknown';
                    const lat = dbData.latitude ? parseFloat(dbData.latitude) : feature.properties.latitude;
                    const lng = dbData.longitude ? parseFloat(dbData.longitude) : feature.properties.longitude;
                    
                    districtLayers[districtId] = layer;
                    
                    // Tambah Marker Koordinat dari Database ke Peta
                    if (lat && lng) {
                        const marker = L.marker([lat, lng]).addTo(map);
                        marker.bindPopup(`<strong style="font-size:13px;">${name}</strong><br><span style="color:#2563eb;font-size:11px;">Koordinat DB: ${lat}, ${lng}</span>`);
                        
                        marker.on('click', function() {
                            selectDistrict(districtId, dbData);
                        });
                        districtMarkers[districtId] = marker;
                    }
                    
                    // Popup dengan info kabupaten
                    let popupContent = '<strong style="font-size:13px;">' + name + '</strong>' +
                        '<br><span style="color:#4b6080;font-size:11px;">Klik untuk prediksi</span>';
                    
                    if (districtPredictions[districtId]) {
                        const pred = districtPredictions[districtId];
                        popupContent += '<br><span style="font-weight:600;color:#0f1f38;font-size:12px;">' + 
                            (pred.flood_probability * 100).toFixed(1) + '% - ' + pred.risk_zone + '</span>';
                    }
                    
                    layer.bindPopup(popupContent, { maxWidth: 250 });
                    
                    // Event handlers untuk polygon
                    layer.on({
                        mouseover: function (e) {
                            const weight = selectedDistrictId === districtId ? 3 : 2.5;
                            e.target.setStyle({ weight: weight, fillOpacity: 0.65 });
                            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                                e.target.bringToFront();
                            }
                        },
                        mouseout: function (e) {
                            const style = getDistrictStyle(districtId);
                            style.weight = selectedDistrictId === districtId ? 2.5 : 1.5;
                            e.target.setStyle(style);
                        },
                        click: function (e) {
                            selectDistrict(districtId, dbData);
                        }
                    });
                }
            }).addTo(map);
            
            map.fitBounds(geojsonLayer.getBounds(), { padding: [30, 30] });
        })
        .catch(err => {
            console.error('GeoJSON error:', err);
            document.getElementById('error').textContent = '❌ Gagal memuat peta: ' + err.message;
            document.getElementById('error').style.display = 'block';
        });
}

// Mulai loading data
loadMapData();

// ============================================================
// FUNGSI PILIH KABUPATEN
// ============================================================
function selectDistrict(districtId, properties) {
    selectedDistrictId = districtId;
    
    // Update style semua layer
    Object.keys(districtLayers).forEach(dId => {
        const style = getDistrictStyle(parseInt(dId));
        if (parseInt(dId) === districtId) {
            style.weight = 3;
            style.fillOpacity = 0.65;
        }
        districtLayers[dId].setStyle(style);
    });
    
    // Ambil data detail wilayah dari database cache
    const dbData = dbDistricts[districtId] || properties || {};
    
    // Update Tampilan Informasi Wilayah dari Database
    const name = dbData.nama_kecamatan || dbData.nama || '—';
    const kab = dbData.kabupaten_kota || dbData.kabupaten || '—';
    const luas = dbData.luas_km2 || '—';
    const penduduk = dbData.jumlah_penduduk ? parseInt(dbData.jumlah_penduduk).toLocaleString('id-ID') : '—';
    const lat = dbData.latitude;
    const lng = dbData.longitude;
    const koordinatStr = (lat && lng) ? `${lat}, ${lng}` : '—';
    
    document.getElementById('info-name').textContent = name;
    document.getElementById('info-kabupaten').textContent = kab;
    document.getElementById('info-luas').textContent = luas;
    document.getElementById('info-penduduk').textContent = penduduk;
    document.getElementById('info-koordinat').textContent = koordinatStr;
    
    // Buat result-panel visible agar info wilayah terlihat
    document.getElementById('result-panel').classList.add('visible');
    
    // Pan peta ke titik koordinat dari database
    if (lat && lng) {
        map.panTo([parseFloat(lat), parseFloat(lng)]);
    }
    
    // Buka popup marker dari database jika ada
    if (districtMarkers[districtId]) {
        districtMarkers[districtId].openPopup();
    }
    
    console.log('Selected district (DB Sync - Persistent Sliders):', districtId, dbData);
    
    // Reset status prediksi ke cached value atau kosong jika belum diprediksi
    if (districtPredictions[districtId]) {
        displayResult(districtPredictions[districtId], districtId);
    } else {
        document.getElementById('probability').textContent = '—';
        document.getElementById('risk').textContent        = '—';
        document.getElementById('status').textContent      = '—';
        document.getElementById('result-badge').className   = 'result-badge';
        document.getElementById('result-badge').textContent = '';
        document.getElementById('prob-fill').style.width    = '0%';
    }
    
    // Auto prediksi untuk district ini dengan nilai slider yang sedang aktif
    predictFloodForDistrict(districtId);
}

// ============================================================
// CEK STATUS MODEL
// ============================================================
fetch('/features')
    .then(r => r.json())
    .then(data => {
        const dot  = document.getElementById('status-dot');
        const text = document.getElementById('status-text');
        if (data.model_status === 'loaded') {
            dot.className  = 'status-dot ok';
            text.textContent = 'Model aktif';
        } else {
            dot.className  = 'status-dot warn';
            text.textContent = 'Model tidak aktif';
        }
    })
    .catch(() => {
        const dot  = document.getElementById('status-dot');
        const text = document.getElementById('status-text');
        dot.className  = 'status-dot err';
        text.textContent = 'Server offline';
    });

// ============================================================
// SLIDER — update nilai & track gradient
// ============================================================
function updateSliderTrack(slider) {
    const min = parseFloat(slider.min) || 1;
    const max = parseFloat(slider.max) || 10;
    const val = parseFloat(slider.value);
    const pct = ((val - min) / (max - min)) * 100;
    slider.style.background =
        'linear-gradient(to right, var(--accent) 0%, var(--accent) ' + pct + '%, var(--border) ' + pct + '%)';
}

// ============================================================
// INISIALISASI UI
// ============================================================
document.addEventListener('DOMContentLoaded', function () {

    // Inisialisasi slider
    FEATURES.forEach(function (feature) {
        var slider = document.getElementById(feature);
        var valEl  = document.getElementById(feature + '_val');
        if (!slider || !valEl) return;
        updateSliderTrack(slider);
        slider.addEventListener('input', function () {
            valEl.textContent = this.value;
            updateSliderTrack(this);
            
            // Jalankan prediksi secara real-time saat user menggeser slider
            if (selectedDistrictId) {
                predictFloodForDistrict(selectedDistrictId);
            }
        });
    });

    // Accordion
    document.querySelectorAll('.group-header').forEach(function (header) {
        header.addEventListener('click', function (e) {
            e.preventDefault();
            var body   = this.closest('.param-group').querySelector('.group-body');
            var isOpen = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', String(!isOpen));
            if (isOpen) {
                body.classList.add('collapsed');
            } else {
                body.classList.remove('collapsed');
            }
        });
    });

    // Tombol Prediksi
    document.getElementById('predictBtn').addEventListener('click', predictFlood);

    // Tombol Reset
    document.getElementById('resetBtn').addEventListener('click', function () {
        FEATURES.forEach(function (feature) {
            var slider = document.getElementById(feature);
            var valEl  = document.getElementById(feature + '_val');
            if (!slider) return;
            slider.value = 5;
            updateSliderTrack(slider);
            if (valEl) valEl.textContent = '5';
        });
        
        // Reset Info Wilayah
        document.getElementById('info-name').textContent = '—';
        document.getElementById('info-kabupaten').textContent = '—';
        document.getElementById('info-luas').textContent = '—';
        document.getElementById('info-penduduk').textContent = '—';
        document.getElementById('info-koordinat').textContent = '—';
        
        document.getElementById('result-panel').classList.remove('visible');
        selectedDistrictId = null;
        districtPredictions = {};
        districtSliders = {}; // Reset sliders cache
        
        // Reset peta
        if (geojsonLayer) {
            geojsonLayer.eachLayer(layer => {
                layer.setStyle(getDistrictStyle(layer.feature.properties.id_kecamatan));
            });
        }
        
        // Close popups
        map.closePopup();
    });

    // Enter di sidebar = prediksi
    document.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && e.target.closest('.sidebar')) predictFlood();
    });
});

// ============================================================
// FUNGSI PREDIKSI
// ============================================================
async function predictFlood() {
    if (!selectedDistrictId) {
        showError('Pilih wilayah di peta terlebih dahulu');
        return;
    }
    
    predictFloodForDistrict(selectedDistrictId);
}

async function predictFloodForDistrict(districtId) {
    var btn    = document.getElementById('predictBtn');
    var errorEl = document.getElementById('error');

    // Kumpulkan data parameter
    var requestData = { district_id: districtId };
    FEATURES.forEach(function (feature) {
        var el = document.getElementById(feature);
        if (el) requestData[feature] = parseFloat(el.value);
    });

    // Loading state
    btn.classList.add('loading');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;animation:spin 1s linear infinite"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Memproses…';
    errorEl.style.display = 'none';

    try {
        var response = await fetch('/predict-district', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'HTTP ' + response.status);
        }
        
        var result = await response.json();

        if (result.status === 'success') {
            // Cache hasil prediksi
            districtPredictions[districtId] = result;
            
            // Tampilkan hasil
            displayResult(result, districtId);
            
            // Update peta
            updateMapForDistrict(districtId);
        } else {
            throw new Error(result.error || 'Respons tidak valid');
        }

    } catch (err) {
        console.error('Predict error:', err);
        showError(err.message || 'Tidak dapat menghubungi server');
    } finally {
        btn.classList.remove('loading');
        btn.innerHTML =
            '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style="width:13px;height:13px;flex-shrink:0">' +
            '<polygon points="5 3 19 12 5 21 5 3"/></svg> Prediksi Banjir';
    }
}

// ============================================================
// TAMPILKAN HASIL
// ============================================================
function displayResult(result, districtId) {
    var prob     = result.flood_probability;     // 0.0–1.0
    var probPct  = (prob * 100).toFixed(1) + '%';
    var riskZone = result.risk_zone;

    var statusMap = {
        'Rendah':        '✓ Aman',
        'Sedang':        '⚠ Waspada',
        'Tinggi':        '⚠ Bahaya',
        'Sangat Tinggi': '🚨 Siaga Darurat'
    };
    var badgeMap = {
        'Rendah':        'low',
        'Sedang':        'medium',
        'Tinggi':        'high',
        'Sangat Tinggi': 'critical'
    };

    // Get district name
    let districtName = 'Kabupaten';
    if (geojsonLayer) {
        geojsonLayer.eachLayer(layer => {
            if (layer.feature.properties.id_kecamatan === districtId) {
                districtName = layer.feature.properties.nama || 'Kabupaten';
            }
        });
    }

    // Isi teks
    document.getElementById('probability').textContent = probPct;
    document.getElementById('risk').textContent        = riskZone;
    document.getElementById('status').textContent      = statusMap[riskZone] || riskZone;
    document.getElementById('error').style.display     = 'none';
    
    // Tambah nama wilayah di badge (opsional - update title panel)
    let resultTitle = document.querySelector('.result-title');
    if (resultTitle) {
        resultTitle.textContent = districtName;
    }

    // Badge
    var badge = document.getElementById('result-badge');
    badge.textContent = riskZone;
    badge.className   = 'result-badge ' + (badgeMap[riskZone] || '');

    // Progress bar
    var fillColor = prob <= 0.35 ? '#22c55e'
                  : prob <= 0.50 ? '#fbbf24'
                  : prob <= 0.75 ? '#f87171'
                  : '#fca5a5';
    var fill = document.getElementById('prob-fill');
    fill.style.width      = probPct;
    fill.style.background = fillColor;

    // Tampilkan panel
    document.getElementById('result-panel').classList.add('visible');
}

function updateMapForDistrict(districtId) {
    if (districtLayers[districtId]) {
        const style = getDistrictStyle(districtId);
        style.weight = 2.5;
        districtLayers[districtId].setStyle(style);
        
        // Update popup
        const layer = districtLayers[districtId];
        const feature = layer.feature;
        const pred = districtPredictions[districtId];
        let name = feature.properties.nama || 'Unknown';
        
        let popupContent = '<strong style="font-size:13px;">' + name + '</strong>' +
            '<br><span style="color:#4b6080;font-size:11px;">Klik untuk prediksi</span>' +
            '<br><span style="font-weight:600;color:#0f1f38;font-size:12px;">' + 
            (pred.flood_probability * 100).toFixed(1) + '% - ' + pred.risk_zone + '</span>';
        
        layer.setPopupContent(popupContent);
    }
}

function showError(message) {
    document.getElementById('error').textContent  = '❌ ' + message;
    document.getElementById('error').style.display = 'block';
    document.getElementById('result-panel').classList.add('visible');
    document.getElementById('probability').textContent = '—';
    document.getElementById('risk').textContent        = '—';
    document.getElementById('status').textContent      = '—';
}