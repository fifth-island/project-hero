# Q9 — Land-Use Buffer Characteristics and Environmental Associations

## Research Question
> Look at the landuse buffer characteristics across sites and whether they are associated with PM2.5 and heat indicators.

## Study Overview
- **Period:** July 19 – August 23, 2023 (36 days)
- **Sites:** 12 open-space monitoring locations in Chinatown
- **Observations:** 48,123 rows (10-min intervals)
- **Land-use data:** 5 categories × 2 buffer sizes = 10 variables
- **Buffer sizes:** 25 m and 50 m radius around each monitoring site
- **Land-use categories:** Trees, Grass, Bare Soil, Impervious, Roads

---

## Key Performance Indicators

| Metric | PM2.5 (µg/m³) | WBGT (°F) |
|---|---|---|
| **Strongest positive land-use correlate** | Roads 50m (r=0.680, p=0.015) | Trees 50m (r=0.506, p=0.093) |
| **Strongest negative land-use correlate** | Trees 50m (r=−0.206) | Impervious 25m (r=−0.566) |
| **Best single-predictor R²** | Roads 50m (R²=0.462) | Trees 50m (R²=0.256) |
| **Significant predictors (p<0.05)** | Roads 50m, Roads 25m | None |
| **Optimal site clusters** | 2 (silhouette=0.317) | — |

---

## PM2.5 and Land-Use Associations

**Road proximity is the strongest and only significant predictor of PM2.5 differences across sites.**

- **Roads within 50 m:** r = 0.680 (p = 0.015), R² = 46.2% — sites with more road area in their 50 m buffer have substantially higher mean PM2.5.
- **Roads within 25 m:** r = 0.634 (p = 0.027) — consistent at the smaller buffer.
- **Trees within 50 m:** r = −0.206 — weak negative association (more trees → slightly lower PM2.5), not significant.
- All other land-use variables show weak, non-significant correlations with PM2.5.

**Environmental justice implication:** Road proximity explains nearly half of the inter-site PM2.5 variance. Sites closer to roads — where foot traffic and community activity may also be higher — bear a disproportionate air quality burden.

![PM2.5 scatter plots](../../figures/phase3_refined/q9_scatter_landuse_vs_pm25.png)

---

## WBGT and Land-Use Associations

**No land-use variable significantly predicts WBGT at p < 0.05**, though some notable patterns emerge:

- **Trees within 50 m:** r = 0.506 (p = 0.093) — surprisingly positive. This counterintuitive result may reflect confounding: tree-covered sites in Chinatown tend to be inland and sheltered from cooling harbor breezes.
- **Impervious surface within 25 m:** r = −0.566 (p = 0.055) — also counterintuitive (more impervious → lower WBGT). Likely reflects that heavily paved sites near the waterfront benefit from maritime cooling.
- The small sample size (n = 12) limits statistical power for WBGT associations.

![WBGT scatter plots](../../figures/phase3_refined/q9_scatter_landuse_vs_wbgt.png)

---

## Correlation Heatmap

The combined land-use × environmental outcomes heatmap reveals:
- Strong positive block: Roads (25m & 50m) ↔ PM2.5
- Land-use intercorrelation: Trees and Grass are positively correlated; Impervious and Roads form a separate block
- WBGT correlations are weaker and mostly non-significant

![Correlation heatmap](../../figures/phase3_refined/q9_heatmap_landuse_vs_outcomes.png)
![Land-use intercorrelation](../../figures/phase3_refined/q9_heatmap_landuse_intercorrelation.png)

---

## Regression Analysis

Standardized regression coefficients show:
- **PM2.5:** Roads 50m has the largest positive coefficient; all other predictors are weaker
- **WBGT:** No single predictor achieves significance; multivariate models are unreliable with n = 12
- Multivariate regression is limited by the degrees-of-freedom constraint (10 predictors, 12 observations)

![Regression coefficients](../../figures/phase3_refined/q9_regression_coefficients.png)

---

## PCA and Site Clustering

### Principal Component Analysis
- **PC1 (44.1% variance):** Separates sites along an impervious-vs-vegetation gradient
- **PC2 (28.6% variance):** Captures secondary variation in grass and bare soil
- Together, PC1 + PC2 explain **72.7%** of land-use variation across sites

![PCA colored by PM2.5](../../figures/phase3_refined/q9_pca_sites_pm25.png)
![PCA colored by WBGT](../../figures/phase3_refined/q9_pca_sites_wbgt.png)

### K-Means Clustering
- **Optimal k = 2** (highest silhouette score = 0.317)
- **Cluster 0** (4 sites: Berkley, Castle, Eliot Norton, Lyndenboro): Higher impervious surface, slightly higher WBGT (66.0 °F)
- **Cluster 1** (8 sites: Chin, Dewey, Greenway, MSH, Oxford, Reggie, Tai Tung, Tufts): Mixed land-use, slightly lower WBGT (65.8 °F)
- **No significant difference** in PM2.5 (p = 0.95) or WBGT (p = 0.31) between clusters

![Dendrogram](../../figures/phase3_refined/q9_dendrogram_landuse.png)
![Cluster comparison](../../figures/phase3_refined/q9_cluster_comparison.png)

---

## Limitations

1. **Small sample size (n = 12 sites):** Low statistical power for cross-sectional correlations; only very strong effects (r > 0.6) reach significance.
2. **Small buffer zones (25–50 m):** May not capture the broader urban context influencing PM2.5 and WBGT.
3. **Urban homogeneity:** All sites are in dense urban Chinatown — impervious surface dominates everywhere, limiting variance.
4. **Confounding:** Waterfront proximity, building height, wind corridors, and other unmeasured factors likely confound land-use associations, especially for WBGT.
5. **Temporal aggregation:** Site-level means collapse rich temporal variation into a single number per site.

---

## Key Findings

1. **Road proximity is the dominant land-use driver of PM2.5** — sites with more road area within 50 m have ~46% of their PM2.5 variance explained by this single variable (r = 0.680, p = 0.015).
2. **No land-use variable significantly predicts WBGT** in this dense urban context, suggesting that microscale factors (shade, wind, building geometry) matter more than buffer-level land cover.
3. **Counterintuitive WBGT associations** (trees ↑ → WBGT ↑; impervious ↑ → WBGT ↓) likely reflect confounding with waterfront proximity and prevailing wind patterns.
4. **Two distinct land-use clusters** emerge but do not translate to significant environmental outcome differences — spatial heterogeneity in Chinatown operates at scales finer than buffer-level land-use can capture.
5. **Environmental justice insight:** Road proximity is the actionable finding — traffic management, buffer vegetation, and pedestrian routing near high-road-area sites (Chin, Oxford, Reggie) could meaningfully reduce PM2.5 exposure.

---

## Figures

| # | Figure | Description |
|---|---|---|
| 1 | `q9_scatter_landuse_vs_pm25.png` | Scatter plots: each land-use variable vs site-mean PM2.5 |
| 2 | `q9_scatter_landuse_vs_wbgt.png` | Scatter plots: each land-use variable vs site-mean WBGT |
| 3 | `q9_heatmap_landuse_vs_outcomes.png` | Correlation heatmap: land-use × environmental outcomes |
| 4 | `q9_heatmap_landuse_intercorrelation.png` | Land-use variable intercorrelation matrix |
| 5 | `q9_regression_coefficients.png` | Standardized regression coefficients |
| 6 | `q9_pca_sites_pm25.png` | PCA biplot colored by PM2.5 |
| 7 | `q9_pca_sites_wbgt.png` | PCA biplot colored by WBGT |
| 8 | `q9_dendrogram_landuse.png` | Hierarchical clustering dendrogram |
| 9 | `q9_cluster_comparison.png` | Environmental outcomes by land-use cluster |
