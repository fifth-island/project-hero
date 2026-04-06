import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProjectOverview from './pages/ProjectOverview'
import CommunityImpact from './pages/CommunityImpact'
import ResearchQ1 from './pages/ResearchQ1'
import ResearchQ2 from './pages/ResearchQ2'
import ResearchQ3 from './pages/ResearchQ3'
import ResearchQ4 from './pages/ResearchQ4'
import ResearchQ8 from './pages/ResearchQ8'
import ClusteringAnalysis from './pages/ClusteringAnalysis'
import ResearchQ5 from './pages/ResearchQ5'
import ResearchQ5Deep from './pages/ResearchQ5Deep'
import ResearchQ6 from './pages/ResearchQ6'
import ResearchQ7 from './pages/ResearchQ7'
import ResearchQ7Het from './pages/ResearchQ7Het'
import ResearchQ9 from './pages/ResearchQ9'
import ResearchQ9Clust from './pages/ResearchQ9Clust'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<ProjectOverview />} />
        <Route path="/analytics" element={<Navigate to="/analytics/distributions" replace />} />
        <Route path="/analytics/distributions" element={<ResearchQ3 />} />
        <Route path="/analytics/aqi" element={<ResearchQ4 />} />
        <Route path="/analytics/temporal" element={<ResearchQ8 />} />
        <Route path="/analytics/clustering" element={<ClusteringAnalysis />} />
        <Route path="/risk" element={<Navigate to="/risk/hottest-days" replace />} />
        <Route path="/risk/hottest-days" element={<ResearchQ5 />} />
        <Route path="/risk/deep-dive" element={<ResearchQ5Deep />} />
        <Route path="/risk/highest-aqi" element={<ResearchQ6 />} />
        <Route path="/causes" element={<Navigate to="/causes/heat-pm25" replace />} />
        <Route path="/causes/heat-pm25" element={<ResearchQ7 />} />
        <Route path="/causes/heterogeneity" element={<ResearchQ7Het />} />
        <Route path="/causes/land-use" element={<ResearchQ9 />} />
        <Route path="/causes/land-use-clusters" element={<ResearchQ9Clust />} />
        <Route path="/sensors" element={<Navigate to="/sensors/calibration" replace />} />
        <Route path="/sensors/calibration" element={<ResearchQ1 />} />
        <Route path="/sensors/temperature" element={<ResearchQ2 />} />
        <Route path="/community" element={<CommunityImpact />} />
      </Route>
    </Routes>
  )
}
