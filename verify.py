#!/usr/bin/env python
"""
Verification script untuk memastikan semua komponen bekerja dengan baik
"""
import sys
from pathlib import Path

def check_imports():
    """Check semua required imports"""
    print("\n📦 Checking imports...")
    try:
        import flask
        print("  ✓ Flask")
        import mysql.connector
        print("  ✓ MySQL Connector")
        import sklearn
        print("  ✓ Scikit-learn")
        import joblib
        print("  ✓ Joblib")
        import numpy
        print("  ✓ NumPy")
        import pandas
        print("  ✓ Pandas")
        import dotenv
        print("  ✓ Python-dotenv")
        return True
    except ImportError as e:
        print(f"  ✗ Missing: {e}")
        return False

def check_files():
    """Check semua required files exist"""
    print("\n📁 Checking files...")
    required_files = [
        'app.py',
        'config.py',
        '.env',
        'requirements.txt',
        'README.md',
        'models/flood_predictor.pkl',
        'models/flood_scaler.pkl',
        'static/css/style.css',
        'static/js/main.js',
        'templates/index.html',
        'data/flood.csv'
    ]
    
    all_exist = True
    for file in required_files:
        if Path(file).exists():
            print(f"  ✓ {file}")
        else:
            print(f"  ✗ {file} (MISSING)")
            all_exist = False
    
    return all_exist

def check_config():
    """Check configuration"""
    print("\n⚙️  Checking configuration...")
    try:
        from config import DB_CONFIG, FEATURE_NAMES, MODEL_PATH, SCALER_PATH
        print(f"  ✓ Database: {DB_CONFIG.get('database')}")
        print(f"  ✓ Features: {len(FEATURE_NAMES)} loaded")
        print(f"  ✓ Model path: {MODEL_PATH}")
        return True
    except Exception as e:
        print(f"  ✗ Config error: {e}")
        return False

def check_database():
    """Check database connection"""
    print("\n🗄️  Checking database...")
    try:
        from app import get_db_connection
        conn = get_db_connection()
        if conn and conn.is_connected():
            cursor = conn.cursor()
            cursor.execute("SELECT DATABASE()")
            db_name = cursor.fetchone()[0]
            print(f"  ✓ Connected to: {db_name}")
            
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            print(f"  ✓ Tables: {len(tables)} found")
            
            cursor.close()
            conn.close()
            return True
        else:
            print("  ✗ Database connection failed")
            return False
    except Exception as e:
        print(f"  ✗ Database error: {e}")
        return False

def check_model():
    """Check model loading"""
    print("\n🤖 Checking model...")
    try:
        from app import flood_model, flood_scaler
        
        if flood_model is None:
            print("  ✗ Model not loaded")
            return False
        
        if flood_scaler is None:
            print("  ✗ Scaler not loaded")
            return False
        
        print(f"  ✓ Model type: {type(flood_model).__name__}")
        print(f"  ✓ Scaler type: {type(flood_scaler).__name__}")
        return True
    except Exception as e:
        print(f"  ✗ Model error: {e}")
        return False

def main():
    """Run all checks"""
    print("=" * 60)
    print("🌊 FLOOD PREDICTION APP - VERIFICATION")
    print("=" * 60)
    
    results = {
        "Imports": check_imports(),
        "Files": check_files(),
        "Configuration": check_config(),
        "Database": check_database(),
        "Model": check_model()
    }
    
    print("\n" + "=" * 60)
    print("📊 VERIFICATION SUMMARY")
    print("=" * 60)
    
    for check, passed in results.items():
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{check:.<40} {status}")
    
    all_passed = all(results.values())
    print("=" * 60)
    
    if all_passed:
        print("\n✓✓✓ ALL CHECKS PASSED ✓✓✓")
        print("\n🚀 Ready to run:")
        print("   python app.py")
        return 0
    else:
        print("\n✗✗✗ SOME CHECKS FAILED ✗✗✗")
        print("\nPlease fix the issues above before running the app.")
        return 1

if __name__ == '__main__':
    sys.exit(main())
