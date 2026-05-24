import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import joblib
import os

# Load dataset dari folder data/
print("Loading dataset...")
df = pd.read_csv('data/flood.csv')

# Lihat informasi awal
print(f"Dataset shape: {df.shape}")
print(df.head())
print(f"Columns: {df.columns.tolist()}")

# Semua kolom kecuali yang terakhir (FloodProbability) adalah fitur
# FloodProbability adalah target (nilai 0-1)
features = [col for col in df.columns if col != 'FloodProbability']
target = 'FloodProbability'

print(f"\nFeatures yang digunakan: {features}")
print(f"Target: {target}")

# Drop baris dengan missing values
df_clean = df[features + [target]].dropna()
print(f"Data after dropping missing values: {df_clean.shape}")

# Pisahkan fitur dan target
X = df_clean[features]
y = df_clean[target]

# Split data (80% training, 20% testing)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Scaling fitur
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Training Random Forest Regressor (untuk prediksi probabilitas 0-1)
print("\nTraining Random Forest Regressor...")
model = RandomForestRegressor(
    n_estimators=100, 
    max_depth=15, 
    random_state=42, 
    n_jobs=-1,
    min_samples_split=5,
    min_samples_leaf=2
)
model.fit(X_train_scaled, y_train)

# Evaluasi model
y_pred_train = model.predict(X_train_scaled)
y_pred_test = model.predict(X_test_scaled)

train_r2 = r2_score(y_train, y_pred_train)
test_r2 = r2_score(y_test, y_pred_test)
test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
test_mae = mean_absolute_error(y_test, y_pred_test)

print(f"\n=== Model Performance ===")
print(f"Training R² Score: {train_r2:.4f}")
print(f"Testing R² Score: {test_r2:.4f}")
print(f"Testing RMSE: {test_rmse:.4f}")
print(f"Testing MAE: {test_mae:.4f}")

# Simpan model dan scaler
os.makedirs('models', exist_ok=True)
joblib.dump(model, 'models/flood_predictor.pkl')
joblib.dump(scaler, 'models/flood_scaler.pkl')
print("\n✓ Model dan scaler disimpan di folder 'models/'")

# Feature importance
print("\n=== Feature Importance ===")
importances = model.feature_importances_
feature_importance_df = pd.DataFrame({
    'feature': features,
    'importance': importances
}).sort_values('importance', ascending=False)

print(feature_importance_df.to_string(index=False))

# Simpan feature importance ke CSV
feature_importance_df.to_csv('models/feature_importance.csv', index=False)
print("\n✓ Feature importance disimpan di 'models/feature_importance.csv'")