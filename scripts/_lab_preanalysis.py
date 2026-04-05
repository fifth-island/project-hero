"""Pre-analysis script for k-means clustering lab — runs clustering to understand results before building notebook."""
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.decomposition import PCA

df = pd.read_csv('data/clean/data_HEROS_clean.csv')
print('Shape:', df.shape)

# Site-level profiles
profiles = df.groupby('site_id').agg(
    pm25=('pa_mean_pm2_5_atm_b_corr_2', 'mean'),
    temp=('kes_mean_temp_f', 'mean'),
    wbgt=('kes_mean_wbgt_f', 'mean'),
    humid=('kes_mean_humid_pct', 'mean'),
).round(3)

print('\n=== Site Profiles ===')
print(profiles.to_string())

print('\n=== Correlation Matrix ===')
print(profiles.corr().round(3).to_string())

# Standardize
X = profiles.values
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Elbow + Silhouette
print('\n=== Elbow Method ===')
for k in range(2, 7):
    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    km.fit(X_scaled)
    sil = silhouette_score(X_scaled, km.labels_)
    print(f'k={k}: inertia={km.inertia_:.2f}, silhouette={sil:.3f}')

# Best k=3
km3 = KMeans(n_clusters=3, random_state=42, n_init=10)
labels = km3.fit_predict(X_scaled)
profiles['cluster'] = labels

print('\n=== Cluster Assignments (k=3) ===')
print(profiles.to_string())

# Cluster centers in original scale
centers = scaler.inverse_transform(km3.cluster_centers_)
print('\n=== Cluster Centers (original scale) ===')
for i, c in enumerate(centers):
    print(f'Cluster {i}: PM2.5={c[0]:.2f}, Temp={c[1]:.2f}, WBGT={c[2]:.2f}, Humid={c[3]:.2f}')

# PCA for 2D visualization
pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)
print(f'\nPCA explained variance: {pca.explained_variance_ratio_.round(3)}')
print(f'Total: {pca.explained_variance_ratio_.sum():.3f}')

# Quadrant analysis: PM2.5 vs Temp means
pm25_mean = profiles['pm25'].mean()
temp_mean = profiles['temp'].mean()
print(f'\n=== Quadrant thresholds ===')
print(f'PM2.5 mean: {pm25_mean:.2f}, Temp mean: {temp_mean:.2f}')
for site in profiles.index:
    q_pm = 'High' if profiles.loc[site, 'pm25'] > pm25_mean else 'Low'
    q_temp = 'Warm' if profiles.loc[site, 'temp'] > temp_mean else 'Cool'
    print(f'  {site}: {q_pm} PM2.5 / {q_temp} ({profiles.loc[site, "pm25"]:.2f}, {profiles.loc[site, "temp"]:.2f}) -> cluster {profiles.loc[site, "cluster"]}')

# Overall stats
print(f'\n=== Overall Data Summary ===')
for col in ['pa_mean_pm2_5_atm_b_corr_2', 'kes_mean_temp_f', 'kes_mean_wbgt_f', 'kes_mean_humid_pct']:
    print(f'{col}: mean={df[col].mean():.2f}, std={df[col].std():.2f}, min={df[col].min():.2f}, max={df[col].max():.2f}')
