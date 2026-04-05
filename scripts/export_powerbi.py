"""Export clustering data as CSV files for PowerBI."""
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score, silhouette_samples
from sklearn.decomposition import PCA
from pathlib import Path
import os

df = pd.read_csv('data/clean/data_HEROS_clean.csv')

PM25_COL = 'pa_mean_pm2_5_atm_b_corr_2'
TEMP_COL = 'kes_mean_temp_f'
WBGT_COL = 'kes_mean_wbgt_f'
HUMID_COL = 'kes_mean_humid_pct'

site_names = {
    'berkley': 'Berkeley Garden', 'castle': 'Castle Square', 'chin': 'Chin Park',
    'dewey': 'Dewey Square', 'eliotnorton': 'Eliot Norton', 'greenway': 'One Greenway',
    'lyndenboro': 'Lyndboro Park', 'msh': 'Mary Soo Hoo', 'oxford': 'Oxford Plaza',
    'reggie': 'Reggie Wong', 'taitung': 'Tai Tung Park', 'tufts': 'Tufts Garden',
}

SITE_COORDS = {
    'berkley': (42.34483, -71.06857), 'castle': (42.3440, -71.0663),
    'chin': (42.3512, -71.0595), 'dewey': (42.3534, -71.0551),
    'eliotnorton': (42.3509, -71.0644), 'greenway': (42.35012, -71.06012),
    'lyndenboro': (42.35001, -71.06614), 'msh': (42.35129, -71.05997),
    'oxford': (42.35252, -71.06107), 'reggie': (42.3497, -71.0609),
    'taitung': (42.34901, -71.06192), 'tufts': (42.3474, -71.0656),
}

features = ['pm25_mean', 'temp_mean', 'wbgt_mean', 'humid_mean']

site_profiles = df.groupby('site_id').agg(
    pm25_mean=(PM25_COL, 'mean'), temp_mean=(TEMP_COL, 'mean'),
    wbgt_mean=(WBGT_COL, 'mean'), humid_mean=(HUMID_COL, 'mean'),
    pm25_std=(PM25_COL, 'std'), n_obs=(PM25_COL, 'count'),
).round(2)

scaler = StandardScaler()
X_scaled = scaler.fit_transform(site_profiles[features].values)

inertias, silhouettes = [], []
for k in range(2, 8):
    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    km.fit(X_scaled)
    inertias.append(float(km.inertia_))
    silhouettes.append(float(silhouette_score(X_scaled, km.labels_)))

km3 = KMeans(n_clusters=3, random_state=42, n_init=10)
labels_3 = km3.fit_predict(X_scaled)
sil_samples = silhouette_samples(X_scaled, labels_3)
avg_sil = silhouette_score(X_scaled, labels_3)
centers_original = scaler.inverse_transform(km3.cluster_centers_)

pm25_avg = site_profiles['pm25_mean'].mean()
cluster_names, color_map, emoji_map = {}, {}, {}
for i in range(3):
    pm25_c, temp_c, humid_c = centers_original[i][0], centers_original[i][1], centers_original[i][3]
    if pm25_c > pm25_avg and humid_c > 66:
        cluster_names[i] = 'High Pollution + Humid'
        color_map[i] = '#C62828'; emoji_map[i] = '🔴'
    elif pm25_c < pm25_avg and humid_c < 65:
        cluster_names[i] = 'Cleaner & Drier'
        color_map[i] = '#2E7D32'; emoji_map[i] = '🟢'
    elif temp_c > 75:
        cluster_names[i] = 'Urban Heat Island'
        color_map[i] = '#DAA520'; emoji_map[i] = '🟡'
    else:
        cluster_names[i] = 'Moderate'
        color_map[i] = '#87512d'; emoji_map[i] = '🟠'

pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)

EXPORT_DIR = Path('data/powerbi')
EXPORT_DIR.mkdir(exist_ok=True)

# 1. Site assignments
e1 = site_profiles.copy()
e1['cluster'] = labels_3
e1['cluster_name'] = [cluster_names[c] for c in labels_3]
e1['cluster_color'] = [color_map[c] for c in labels_3]
e1['cluster_emoji'] = [emoji_map[c] for c in labels_3]
e1['site_name'] = [site_names[s] for s in site_profiles.index]
e1['lat'] = [SITE_COORDS[s][0] for s in site_profiles.index]
e1['lon'] = [SITE_COORDS[s][1] for s in site_profiles.index]
e1['pca1'] = X_pca[:, 0].round(3)
e1['pca2'] = X_pca[:, 1].round(3)
e1['silhouette'] = sil_samples.round(3)
e1.to_csv(EXPORT_DIR / 'site_cluster_assignments.csv')
print(f'✅ site_cluster_assignments.csv ({len(e1)} rows)')

# 2. Cluster centers
feat_labels = ['PM2.5 (µg/m³)', 'Temp (°F)', 'WBGT (°F)', 'Humidity (%)']
e2 = pd.DataFrame(centers_original, columns=feat_labels)
e2['cluster'] = range(3)
e2['cluster_name'] = [cluster_names[i] for i in range(3)]
e2['cluster_color'] = [color_map[i] for i in range(3)]
e2['n_sites'] = [int((labels_3 == i).sum()) for i in range(3)]
e2['sites'] = [', '.join(site_profiles.index[labels_3 == i].tolist()) for i in range(3)]
norm_vals = MinMaxScaler().fit_transform(centers_original)
for j, feat in enumerate(['pm25_norm', 'temp_norm', 'wbgt_norm', 'humidity_norm']):
    e2[feat] = norm_vals[:, j].round(3)
e2.to_csv(EXPORT_DIR / 'cluster_centers.csv', index=False)
print(f'✅ cluster_centers.csv ({len(e2)} rows)')

# 3. Elbow/silhouette
e3 = pd.DataFrame({
    'k': list(range(2, 8)),
    'inertia': [round(x, 2) for x in inertias],
    'silhouette': [round(x, 3) for x in silhouettes],
    'is_optimal': [k == 3 for k in range(2, 8)],
})
e3.to_csv(EXPORT_DIR / 'elbow_silhouette.csv', index=False)
print(f'✅ elbow_silhouette.csv ({len(e3)} rows)')

# 4. Per-site silhouette
e4 = pd.DataFrame({
    'site_id': site_profiles.index, 'site_name': [site_names[s] for s in site_profiles.index],
    'cluster': labels_3, 'cluster_name': [cluster_names[c] for c in labels_3],
    'cluster_color': [color_map[c] for c in labels_3], 'silhouette': sil_samples.round(3),
})
e4.to_csv(EXPORT_DIR / 'site_silhouette_scores.csv', index=False)
print(f'✅ site_silhouette_scores.csv ({len(e4)} rows)')

# 5. PCA projection
e5 = pd.DataFrame({
    'site_id': site_profiles.index, 'site_name': [site_names[s] for s in site_profiles.index],
    'cluster': labels_3, 'cluster_name': [cluster_names[c] for c in labels_3],
    'cluster_color': [color_map[c] for c in labels_3],
    'pca1': X_pca[:, 0].round(3), 'pca2': X_pca[:, 1].round(3),
})
e5.to_csv(EXPORT_DIR / 'pca_projection.csv', index=False)
print(f'✅ pca_projection.csv ({len(e5)} rows)')

# PCA loadings
feat_names = ['PM2.5', 'Temperature', 'WBGT', 'Humidity']
e5b = pd.DataFrame(pca.components_.T, columns=['PC1_loading', 'PC2_loading'], index=feat_names)
e5b.to_csv(EXPORT_DIR / 'pca_loadings.csv')
print(f'✅ pca_loadings.csv ({len(e5b)} rows)')

# 6. KPI
e6 = pd.DataFrame([{
    'n_sites': 12, 'n_clusters': 3,
    'silhouette_score': round(float(avg_sil), 3),
    'pca_variance_pct': round(float(pca.explained_variance_ratio_.sum() * 100), 1),
    'pm25_boundary': 9.2, 'temp_boundary': 75.25,
    'pm25_overall_mean': round(float(site_profiles['pm25_mean'].mean()), 2),
    'temp_overall_mean': round(float(site_profiles['temp_mean'].mean()), 2),
    'study_period': 'Jul 19 – Aug 23, 2023',
    'dataset_rows': len(df),
}])
e6.to_csv(EXPORT_DIR / 'clustering_kpi.csv', index=False)
print(f'✅ clustering_kpi.csv')

print()
print('📁 PowerBI Export Summary')
print('=' * 60)
for f in sorted(EXPORT_DIR.glob('*.csv')):
    size_kb = os.path.getsize(f) / 1024
    rows = len(pd.read_csv(f))
    print(f'  {f.name:<35} {rows:>3} rows  ({size_kb:.1f} KB)')
print('=' * 60)
print(f'📂 All files saved to: {EXPORT_DIR.resolve()}')
