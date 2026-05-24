"""
Configuration file untuk Flood Prediction App
Menyimpan database credentials dan settings
"""
import os
from dotenv import load_dotenv

# Load environment variables dari .env file
load_dotenv()

# Database Configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', 'Ghaniputr@1!'),
    'database': os.getenv('DB_NAME', 'flood_prediksi'),
    'port': int(os.getenv('DB_PORT', 3306))
}

# Flask Configuration
FLASK_ENV = os.getenv('FLASK_ENV', 'development')
DEBUG = os.getenv('DEBUG', 'True') == 'True'
HOST = os.getenv('HOST', '0.0.0.0')
PORT = int(os.getenv('PORT', 5000))

# Model Paths
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
MODEL_PATH = os.path.join(MODEL_DIR, 'flood_predictor.pkl')
SCALER_PATH = os.path.join(MODEL_DIR, 'flood_scaler.pkl')

# Features
FEATURE_NAMES = [
    'MonsoonIntensity', 'TopographyDrainage', 'RiverManagement', 'Deforestation',
    'Urbanization', 'ClimateChange', 'DamsQuality', 'Siltation',
    'AgriculturalPractices', 'Encroachments', 'IneffectiveDisasterPreparedness',
    'DrainageSystems', 'CoastalVulnerability', 'Landslides', 'Watersheds',
    'DeterioratingInfrastructure', 'PopulationScore', 'WetlandLoss',
    'InadequatePlanning', 'PoliticalFactors'
]

# Risk Zone Thresholds
RISK_THRESHOLDS = {
    'Rendah': 0.35,
    'Sedang': 0.50,
    'Tinggi': 0.75,
    'Sangat Tinggi': 1.0
}

# Risk Zone Colors (untuk peta)
RISK_COLORS = {
    'Rendah': '#2ecc71',           # Hijau
    'Sedang': '#f39c12',           # Orange
    'Tinggi': '#e74c3c',           # Merah
    'Sangat Tinggi': '#8b0000'     # Merah gelap
}

print(f"Config loaded: {FLASK_ENV} mode")
