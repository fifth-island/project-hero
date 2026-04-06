#!/usr/bin/env python3
"""Generate JSON data for Q9 Land-Use Associations dashboard pages."""

import json, pathlib
import pandas as pd
import numpy as np
from scipy import stats
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans

CSV = pathlib.Path("data/clean/data_HEROS_clean.csv")
OUT = pathlib.Path("dashboard-app/app/public/data")
OUT.mkdir(parents=True, exist_ok=True)

SITE_LABELS = {
    "berkley": "Berkeley Garden", "castle": "Castle Square", "chin": "Chin Park",
    "dewey": "Dewey Square", "eliotnorton": "Eliot Norton", "greenway": "One Greenway",
    "lyndenboro": "Lyndboro Park", "msh": "Mary Soo Hoo", "oxford": "Oxford Place",
    "reggie": "Reggie Wong", "taitung": "Tai Tung", "tufts": "Tufts Garden",
}

LU_COLS_25 = [
    "Roads_Area_Percent_25m", "Trees_Area_Percent_25m", "Impervious_Area_Percent_25m",
    "Greenspace_Area_Percent_25m", "Industrial_Area_Percent_25m",
]
LU_COLS_50 = [
    "Roads_Area_Percent_50m", "Trees_Area_Percent_50m", "Impervious_Area_Percent_50m",
    "Greenspace_Area_Percent_50m", "Industrial_Area_Percent_50m",
]
LU_ALL = LU_COLS_25 + LU_COLS_50
LU_SHORT = {
    "Roads_Area_Percent_25m": "Roads 25m", "Trees_Area_Percent_25m": "Trees 25m",
    "Impervious_Area_Percent_25m": "Impervious 25m", "Greenspace_Area_Percent_25m": "Greenspace 25m",
    "Industrial_Area_Percent_25m": "Industrial 25m",
    "Roads_Area_Percent_50m": "Roads 50m", "Trees_Area_Percent_50m": "Trees 50m",
    "Impervious_Area_Percent_50m": "Impervious 50m", "Greenspace_Area_Percent_50m": "Greenspace 50m",
    "Industrial_Area_Percent_50m": "Industrial 50m",
}

PM25 = "pa_mean_pm2_5_atm_b_corr_2"
WBGT = "kes_mean_wbgt_f"


def _sanitize(obj):
    if isinstance(obj, (np.floating, float)):
        if np.isnan(obj) or np.isinf(obj):
            return None
        return round(float(obj), 4)
    if isinstance(obj, (np.integer, int)):
        return int(obj)
    if isinstance(obj, dict):
        return {k: _sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize(v) for v in obj]
    if isinstance(obj, np.ndarray):
        return [_sanitize(v) for v in obj.tolist()]
    return obj


def save(name, data):
    p = OUT / f"{name}.json"
    p.write_text(json.dumps(_sanitize(data), default=str))
    print(f"  {p.name}")


def main():
    print("Loading data…")
    df = pd.read_csv(CSV)
    df = df.dropna(subset=[PM25, WBGT, "site_id"])
    print(f"  Rows: {len(df)}")

    # ── Build site-level summary ──
    site_agg = df.groupby("site_id").agg(
        pm25_mean=(PM25, "mean"), pm25_median=(PM25, "median"),
        wbgt_mean=(WBGT, "mean"), wbgt_median=(WBGT, "median"),
        n=(PM25, "count"),
    ).reset_index()

    # Land-use values are constant per site — take first
    lu_site = df.groupby("site_id")[LU_ALL].first().reset_index()
    site = site_agg.merge(lu_site, on="site_id")
    site["site_label"] = site["site_id"].map(SITE_LABELS)

    # ═══ 1. KPIs ═══
    # Best PM2.5 correlate
    pm25_corrs = {}
    for col in LU_ALL:
        r, p = stats.pearsonr(site[col], site["pm25_mean"])
        pm25_corrs[col] = {"r": r, "p": p, "label": LU_SHORT[col]}
    best_pm25 = max(pm25_corrs.items(), key=lambda x: abs(x[1]["r"]))
    worst_pm25 = min(pm25_corrs.items(), key=lambda x: x[1]["r"])

    wbgt_corrs = {}
    for col in LU_ALL:
        r, p = stats.pearsonr(site[col], site["wbgt_mean"])
        wbgt_corrs[col] = {"r": r, "p": p, "label": LU_SHORT[col]}
    best_wbgt = max(wbgt_corrs.items(), key=lambda x: abs(x[1]["r"]))

    kpi = {
        "n_sites": len(site),
        "n_obs": len(df),
        "n_lu_vars": len(LU_ALL),
        "best_pm25_predictor": best_pm25[1]["label"],
        "best_pm25_r": round(best_pm25[1]["r"], 3),
        "best_pm25_r2": round(best_pm25[1]["r"] ** 2, 3),
        "best_pm25_p": round(best_pm25[1]["p"], 4),
        "neg_pm25_predictor": worst_pm25[1]["label"],
        "neg_pm25_r": round(worst_pm25[1]["r"], 3),
        "best_wbgt_predictor": best_wbgt[1]["label"],
        "best_wbgt_r": round(best_wbgt[1]["r"], 3),
        "best_wbgt_p": round(best_wbgt[1]["p"], 4),
        "sig_pm25_count": sum(1 for v in pm25_corrs.values() if v["p"] < 0.05),
        "sig_wbgt_count": sum(1 for v in wbgt_corrs.values() if v["p"] < 0.05),
    }
    save("q9_kpi", kpi)

    # ═══ 2. Site land-use profiles ═══
    profiles = []
    for _, row in site.iterrows():
        rec = {
            "site_id": row["site_id"],
            "site_label": row["site_label"],
            "pm25_mean": round(row["pm25_mean"], 1),
            "wbgt_mean": round(row["wbgt_mean"], 1),
            "n": int(row["n"]),
        }
        for col in LU_ALL:
            rec[LU_SHORT[col].replace(" ", "_").lower()] = round(row[col], 1)
        profiles.append(rec)
    profiles.sort(key=lambda x: -x["pm25_mean"])
    save("q9_profiles", profiles)

    # ═══ 3. Scatter data: land-use vs PM2.5 and WBGT ═══
    scatter_pm25 = []
    scatter_wbgt = []
    for col in LU_ALL:
        r_pm, p_pm = stats.pearsonr(site[col], site["pm25_mean"])
        r_wb, p_wb = stats.pearsonr(site[col], site["wbgt_mean"])
        # OLS for trend line
        sl_pm, it_pm, _, _, _ = stats.linregress(site[col], site["pm25_mean"])
        sl_wb, it_wb, _, _, _ = stats.linregress(site[col], site["wbgt_mean"])
        x_min, x_max = site[col].min(), site[col].max()
        for _, row in site.iterrows():
            scatter_pm25.append({
                "lu_var": LU_SHORT[col],
                "lu_val": round(row[col], 1),
                "pm25": round(row["pm25_mean"], 2),
                "site_id": row["site_id"],
                "site_label": row["site_label"],
            })
            scatter_wbgt.append({
                "lu_var": LU_SHORT[col],
                "lu_val": round(row[col], 1),
                "wbgt": round(row["wbgt_mean"], 2),
                "site_id": row["site_id"],
                "site_label": row["site_label"],
            })
        # We'll also store regression line info per variable
        scatter_pm25.append({
            "lu_var": LU_SHORT[col],
            "_type": "regression",
            "x1": round(x_min, 1), "y1": round(it_pm + sl_pm * x_min, 2),
            "x2": round(x_max, 1), "y2": round(it_pm + sl_pm * x_max, 2),
            "r": round(r_pm, 3), "p": round(p_pm, 4),
        })
        scatter_wbgt.append({
            "lu_var": LU_SHORT[col],
            "_type": "regression",
            "x1": round(x_min, 1), "y1": round(it_wb + sl_wb * x_min, 2),
            "x2": round(x_max, 1), "y2": round(it_wb + sl_wb * x_max, 2),
            "r": round(r_wb, 3), "p": round(p_wb, 4),
        })
    save("q9_scatter_pm25", scatter_pm25)
    save("q9_scatter_wbgt", scatter_wbgt)

    # ═══ 4. Correlation summary (bar chart data) ═══
    corr_summary = []
    for col in LU_ALL:
        r_pm, p_pm = stats.pearsonr(site[col], site["pm25_mean"])
        r_wb, p_wb = stats.pearsonr(site[col], site["wbgt_mean"])
        corr_summary.append({
            "lu_var": LU_SHORT[col],
            "r_pm25": round(r_pm, 3),
            "p_pm25": round(p_pm, 4),
            "sig_pm25": bool(p_pm < 0.05),
            "r_wbgt": round(r_wb, 3),
            "p_wbgt": round(p_wb, 4),
            "sig_wbgt": bool(p_wb < 0.05),
        })
    corr_summary.sort(key=lambda x: -abs(x["r_pm25"]))
    save("q9_corr_summary", corr_summary)

    # ═══ 5. Correlation heatmap (land-use × outcomes) ═══
    heatmap_cols = LU_ALL + [PM25, WBGT]
    heatmap_labels = {**LU_SHORT, PM25: "PM2.5", WBGT: "WBGT"}
    hm_data = []
    for c1 in LU_ALL:
        for c2 in [PM25, WBGT]:
            r, p = stats.pearsonr(site[c1] if c1 in LU_ALL else df.groupby("site_id")[c1].mean(),
                                  site["pm25_mean"] if c2 == PM25 else site["wbgt_mean"])
            hm_data.append({
                "x": heatmap_labels[c2],
                "y": heatmap_labels[c1],
                "r": round(r, 3),
                "p": round(p, 4),
                "sig": bool(p < 0.05),
            })
    # Land-use intercorrelation
    for c1 in LU_ALL:
        for c2 in LU_ALL:
            r, p = stats.pearsonr(site[c1], site[c2])
            hm_data.append({
                "x": heatmap_labels[c2],
                "y": heatmap_labels[c1],
                "r": round(r, 3),
                "p": round(p, 4),
                "sig": bool(p < 0.05),
            })
    save("q9_heatmap", hm_data)

    # ═══ 6. Regression coefficients (standardized) ═══
    scaler = StandardScaler()
    X = scaler.fit_transform(site[LU_ALL])
    y_pm = (site["pm25_mean"] - site["pm25_mean"].mean()) / site["pm25_mean"].std()
    y_wb = (site["wbgt_mean"] - site["wbgt_mean"].mean()) / site["wbgt_mean"].std()

    reg_data = []
    for i, col in enumerate(LU_ALL):
        sl_pm, _, _, p_pm, se_pm = stats.linregress(X[:, i], y_pm)
        sl_wb, _, _, p_wb, se_wb = stats.linregress(X[:, i], y_wb)
        reg_data.append({
            "lu_var": LU_SHORT[col],
            "beta_pm25": round(sl_pm, 3),
            "se_pm25": round(se_pm, 3),
            "p_pm25": round(p_pm, 4),
            "beta_wbgt": round(sl_wb, 3),
            "se_wbgt": round(se_wb, 3),
            "p_wbgt": round(p_wb, 4),
        })
    reg_data.sort(key=lambda x: -abs(x["beta_pm25"]))
    save("q9_regression", reg_data)

    # ═══ 7. PCA ═══
    X_pca = scaler.fit_transform(site[LU_ALL])
    pca = PCA(n_components=3)
    coords = pca.fit_transform(X_pca)

    pca_sites = []
    for i, (_, row) in enumerate(site.iterrows()):
        pca_sites.append({
            "site_id": row["site_id"],
            "site_label": row["site_label"],
            "pc1": round(coords[i, 0], 3),
            "pc2": round(coords[i, 1], 3),
            "pc3": round(coords[i, 2], 3),
            "pm25_mean": round(row["pm25_mean"], 1),
            "wbgt_mean": round(row["wbgt_mean"], 1),
        })

    pca_loadings = []
    for i, col in enumerate(LU_ALL):
        pca_loadings.append({
            "lu_var": LU_SHORT[col],
            "pc1": round(pca.components_[0, i], 3),
            "pc2": round(pca.components_[1, i], 3),
        })

    pca_info = {
        "explained": [round(v * 100, 1) for v in pca.explained_variance_ratio_[:3]],
        "cumulative": round(sum(pca.explained_variance_ratio_[:2]) * 100, 1),
    }
    save("q9_pca_sites", pca_sites)
    save("q9_pca_loadings", pca_loadings)
    save("q9_pca_info", pca_info)

    # ═══ 8. K-Means clustering ═══
    from sklearn.metrics import silhouette_score

    # Test k=2,3,4
    sil_scores = []
    for k in range(2, 5):
        km = KMeans(n_clusters=k, n_init=20, random_state=42)
        labels = km.fit_predict(X_pca)
        sil = silhouette_score(X_pca, labels)
        sil_scores.append({"k": k, "silhouette": round(sil, 3)})

    best_k = max(sil_scores, key=lambda x: x["silhouette"])["k"]
    km_final = KMeans(n_clusters=best_k, n_init=20, random_state=42)
    cluster_labels = km_final.fit_predict(X_pca)

    cluster_sites = []
    for i, (_, row) in enumerate(site.iterrows()):
        cluster_sites.append({
            "site_id": row["site_id"],
            "site_label": row["site_label"],
            "cluster": int(cluster_labels[i]),
            "pm25_mean": round(row["pm25_mean"], 1),
            "wbgt_mean": round(row["wbgt_mean"], 1),
            "pc1": round(coords[i, 0], 3),
            "pc2": round(coords[i, 1], 3),
        })

    # Cluster summary
    site["cluster"] = cluster_labels
    cluster_summary = []
    for c in range(best_k):
        csub = site[site["cluster"] == c]
        lu_means = {}
        for col in LU_ALL:
            lu_means[LU_SHORT[col].replace(" ", "_").lower()] = round(csub[col].mean(), 1)
        cluster_summary.append({
            "cluster": int(c),
            "n_sites": len(csub),
            "sites": list(csub["site_label"]),
            "pm25_mean": round(csub["pm25_mean"].mean(), 1),
            "wbgt_mean": round(csub["wbgt_mean"].mean(), 1),
            **lu_means,
        })

    save("q9_clusters", {
        "best_k": best_k,
        "silhouette_scores": sil_scores,
        "sites": cluster_sites,
        "summary": cluster_summary,
    })

    print("\nAll Q9 data generated!")


if __name__ == "__main__":
    main()
