"""
Generate pre-aggregated JSON data files for the Clustering Analysis dashboard page.
Runs k-means (k=3) on site-level environmental profiles and exports all chart data.
"""
import pandas as pd
import numpy as np
import json
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score, silhouette_samples
from sklearn.decomposition import PCA

OUT_DIR = '/Users/joaoquintanilha/Downloads/project-hero/dashboard-app/app/public/data'

df = pd.read_csv('/Users/joaoquintanilha/Downloads/project-hero/data/clean/data_HEROS_clean.csv')

PM25_COL = 'pa_mean_pm2_5_atm_b_corr_2'
TEMP_COL = 'kes_mean_temp_f'
WBGT_COL = 'kes_mean_wbgt_f'
HUMID_COL = 'kes_mean_humid_pct'

SITE_LABELS = {
    'berkley': 'Berkeley Garden', 'castle': 'Castle Square', 'chin': 'Chin Park',
    'dewey': 'Dewey Square', 'eliotnorton': 'Eliot Norton', 'greenway': 'One Greenway',
    'lyndenboro': 'Lyndboro Park', 'msh': 'Mary Soo Hoo', 'oxford': 'Oxford Plaza',
    'reggie': 'Reggie Wong', 'taitung': 'Tai Tung Park', 'tufts': 'Tufts Garden',
}

FEATURES = ['pm25_mean', 'temp_mean', 'wbgt_mean', 'humid_mean']

SITE_COORDS = {
    'berkley': (42.34483, -71.06857), 'castle': (42.3440, -71.0663),
    'chin': (42.3512, -71.0595), 'dewey': (42.3534, -71.0551),
    'eliotnorton': (42.3509, -71.0644), 'greenway': (42.35012, -71.06012),
    'lyndenboro': (42.35001, -71.06614), 'msh': (42.35129, -71.05997),
    'oxford': (42.35252, -71.06107), 'reggie': (42.3497, -71.0609),
    'taitung': (42.34901, -71.06192), 'tufts': (42.3474, -71.0656),
}

# ── 1. Build site-level profiles ──
site_profiles = df.groupby('site_id').agg(
    pm25_mean=(PM25_COL, 'mean'),
    temp_mean=(TEMP_COL, 'mean'),
    wbgt_mean=(WBGT_COL, 'mean'),
    humid_mean=(HUMID_COL, 'mean'),
    pm25_std=(PM25_COL, 'std'),
    n_obs=(PM25_COL, 'count'),
).round(2)

# ── 2. Standardize and run k-means ──
scaler = StandardScaler()
X_scaled = scaler.fit_transform(site_profiles[FEATURES].values)

# Elbow + silhouette for k=2..7
elbow_data = []
for k in range(2, 8):
    km = KMeans(n_clusters=k, random_state=42, n_init=10)
    km.fit(X_scaled)
    sil = silhouette_score(X_scaled, km.labels_)
    elbow_data.append({
        'k': k,
        'inertia': round(float(km.inertia_), 2),
        'silhouette': round(float(sil), 3),
    })

with open(f'{OUT_DIR}/clustering_elbow.json', 'w') as f:
    json.dump(elbow_data, f, indent=2)
print(f"Elbow data: {len(elbow_data)} entries")

# ── 3. Final model k=3 ──
km3 = KMeans(n_clusters=3, random_state=42, n_init=10)
labels = km3.fit_predict(X_scaled)
sil_samples_arr = silhouette_samples(X_scaled, labels)
avg_sil = silhouette_score(X_scaled, labels)

# Cluster centers in original scale
centers_original = scaler.inverse_transform(km3.cluster_centers_)

# Determine cluster names based on profile
pm25_avg = site_profiles['pm25_mean'].mean()
cluster_names = {}
for i in range(3):
    pm25_c = centers_original[i][0]
    temp_c = centers_original[i][1]
    humid_c = centers_original[i][3]
    if pm25_c > pm25_avg and humid_c > 66:
        cluster_names[i] = 'High Pollution + Humid'
    elif pm25_c < pm25_avg and humid_c < 65:
        cluster_names[i] = 'Cleaner & Drier'
    elif temp_c > 75:
        cluster_names[i] = 'Urban Heat Island'
    else:
        cluster_names[i] = 'Moderate'

# Cluster colors matched to emoji labels: 🟡 Urban Heat Island, 🔴 High Pollution, 🟢 Cleaner
CLUSTER_COLORS = {}
for i, name in cluster_names.items():
    if 'Heat' in name:
        CLUSTER_COLORS[i] = '#DAA520'
    elif 'Pollution' in name:
        CLUSTER_COLORS[i] = '#C62828'
    elif 'Cleaner' in name:
        CLUSTER_COLORS[i] = '#2E7D32'
    else:
        CLUSTER_COLORS[i] = '#87512d'

CLUSTER_EMOJI = {}
for i, name in cluster_names.items():
    if 'Heat' in name:
        CLUSTER_EMOJI[i] = '🟡'
    elif 'Pollution' in name:
        CLUSTER_EMOJI[i] = '🔴'
    elif 'Cleaner' in name:
        CLUSTER_EMOJI[i] = '🟢'
    else:
        CLUSTER_EMOJI[i] = '🟠'

# ── 4. KPI ──
pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)

kpi = {
    'n_sites': 12,
    'n_clusters': 3,
    'silhouette': round(float(avg_sil), 3),
    'pca_variance': round(float(pca.explained_variance_ratio_.sum() * 100), 0),
    'pm25_boundary': 9.2,
    'temp_boundary': 75.25,
    'pm25_avg': round(float(pm25_avg), 1),
    'temp_avg': round(float(site_profiles['temp_mean'].mean()), 1),
}

with open(f'{OUT_DIR}/clustering_kpi.json', 'w') as f:
    json.dump(kpi, f, indent=2)
print(f"KPI: {kpi}")

# ── 5. Site scatter data (quadrant plot) ──
scatter_data = []
for idx, (site_id, row) in enumerate(site_profiles.iterrows()):
    scatter_data.append({
        'site_id': site_id,
        'site_name': SITE_LABELS.get(site_id, site_id),
        'pm25': round(float(row['pm25_mean']), 2),
        'temp': round(float(row['temp_mean']), 2),
        'wbgt': round(float(row['wbgt_mean']), 2),
        'humidity': round(float(row['humid_mean']), 2),
        'pm25_std': round(float(row['pm25_std']), 2),
        'n_obs': int(row['n_obs']),
        'cluster': int(labels[idx]),
        'cluster_name': cluster_names[int(labels[idx])],
        'cluster_color': CLUSTER_COLORS[int(labels[idx])],
        'cluster_emoji': CLUSTER_EMOJI[int(labels[idx])],
        'silhouette': round(float(sil_samples_arr[idx]), 3),
        'pca1': round(float(X_pca[idx, 0]), 3),
        'pca2': round(float(X_pca[idx, 1]), 3),
        'lat': SITE_COORDS[site_id][0],
        'lon': SITE_COORDS[site_id][1],
        'photo': f'/photos/sites/{site_id}.jpg',
    })

with open(f'{OUT_DIR}/clustering_sites.json', 'w') as f:
    json.dump(scatter_data, f, indent=2)
print(f"Sites: {len(scatter_data)} entries")

# ── 6. Cluster centers ──
centers_pca = pca.transform(km3.cluster_centers_)
centers_norm = MinMaxScaler().fit_transform(centers_original)

cluster_centers = []
for i in range(3):
    cluster_centers.append({
        'cluster': i,
        'cluster_name': cluster_names[i],
        'cluster_color': CLUSTER_COLORS[i],
        'cluster_emoji': CLUSTER_EMOJI[i],
        'pm25': round(float(centers_original[i][0]), 2),
        'temp': round(float(centers_original[i][1]), 2),
        'wbgt': round(float(centers_original[i][2]), 2),
        'humidity': round(float(centers_original[i][3]), 2),
        'pm25_norm': round(float(centers_norm[i][0]), 3),
        'temp_norm': round(float(centers_norm[i][1]), 3),
        'wbgt_norm': round(float(centers_norm[i][2]), 3),
        'humidity_norm': round(float(centers_norm[i][3]), 3),
        'pca1': round(float(centers_pca[i][0]), 3),
        'pca2': round(float(centers_pca[i][1]), 3),
        'n_sites': int(np.sum(labels == i)),
        'sites': [SITE_LABELS.get(site_profiles.index[j], site_profiles.index[j])
                  for j in range(len(labels)) if labels[j] == i],
    })

with open(f'{OUT_DIR}/clustering_centers.json', 'w') as f:
    json.dump(cluster_centers, f, indent=2)
print(f"Centers: {len(cluster_centers)} clusters")

# ── 7. Per-site silhouette bars ──
silhouette_data = []
for idx, (site_id, _row) in enumerate(site_profiles.iterrows()):
    silhouette_data.append({
        'site_name': SITE_LABELS.get(site_id, site_id),
        'cluster': int(labels[idx]),
        'cluster_name': cluster_names[int(labels[idx])],
        'cluster_color': CLUSTER_COLORS[int(labels[idx])],
        'silhouette': round(float(sil_samples_arr[idx]), 3),
    })
silhouette_data.sort(key=lambda x: (x['cluster'], -x['silhouette']))

with open(f'{OUT_DIR}/clustering_silhouette.json', 'w') as f:
    json.dump(silhouette_data, f, indent=2)
print(f"Silhouette: {len(silhouette_data)} entries")

# ── 8. PCA metadata ──
pca_meta = {
    'pc1_variance': round(float(pca.explained_variance_ratio_[0] * 100), 1),
    'pc2_variance': round(float(pca.explained_variance_ratio_[1] * 100), 1),
    'total_variance': round(float(pca.explained_variance_ratio_.sum() * 100), 1),
    'loadings': {
        'pm25': {'pc1': round(float(pca.components_[0][0]), 3), 'pc2': round(float(pca.components_[1][0]), 3)},
        'temp': {'pc1': round(float(pca.components_[0][1]), 3), 'pc2': round(float(pca.components_[1][1]), 3)},
        'wbgt': {'pc1': round(float(pca.components_[0][2]), 3), 'pc2': round(float(pca.components_[1][2]), 3)},
        'humidity': {'pc1': round(float(pca.components_[0][3]), 3), 'pc2': round(float(pca.components_[1][3]), 3)},
    }
}

with open(f'{OUT_DIR}/clustering_pca.json', 'w') as f:
    json.dump(pca_meta, f, indent=2)
print(f"PCA: {pca_meta['total_variance']}% variance explained")

print("\n✅ All clustering chart data generated successfully!")
