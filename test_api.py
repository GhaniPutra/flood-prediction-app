"""
Test script untuk Flask API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:5000"

def test_features_endpoint():
    """Test /features endpoint"""
    print("\n=== Testing /features endpoint ===")
    try:
        response = requests.get(f"{BASE_URL}/features")
        data = response.json()
        print(f"✓ Status: {response.status_code}")
        print(f"✓ Features count: {data.get('count')}")
        print(f"✓ Model status: {data.get('model_status')}")
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_predict_endpoint():
    """Test /predict endpoint dengan sample data"""
    print("\n=== Testing /predict endpoint ===")
    
    # Sample data
    sample_data = {
        'MonsoonIntensity': 5,
        'TopographyDrainage': 8,
        'RiverManagement': 6,
        'Deforestation': 4,
        'Urbanization': 5,
        'ClimateChange': 6,
        'DamsQuality': 5,
        'Siltation': 3,
        'AgriculturalPractices': 4,
        'Encroachments': 5,
        'IneffectiveDisasterPreparedness': 6,
        'DrainageSystems': 7,
        'CoastalVulnerability': 5,
        'Landslides': 4,
        'Watersheds': 6,
        'DeterioratingInfrastructure': 5,
        'PopulationScore': 4,
        'WetlandLoss': 3,
        'InadequatePlanning': 5,
        'PoliticalFactors': 6
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/predict",
            json=sample_data,
            headers={'Content-Type': 'application/json'}
        )
        data = response.json()
        print(f"✓ Status: {response.status_code}")
        print(f"✓ Flood Probability: {data.get('flood_probability')}")
        print(f"✓ Risk Zone: {data.get('risk_zone')}")
        print(f"✓ Status: {data.get('status')}")
        return True
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

if __name__ == '__main__':
    print("Starting API tests...")
    print("Make sure Flask app is running on http://localhost:5000")
    
    try:
        test_features_endpoint()
        test_predict_endpoint()
        print("\n✓ All tests passed!")
    except requests.exceptions.ConnectionError:
        print("\n✗ Cannot connect to Flask app. Make sure it's running!")
