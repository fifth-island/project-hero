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
        <Route path="/sensors" element={<Navigate to="/sensors/calibration" replace />} />
        <Route path="/sensors/calibration" element={<ResearchQ1 />} />
        <Route path="/sensors/temperature" element={<ResearchQ2 />} />
        <Route path="/community" element={<CommunityImpact />} />
      </Route>
    </Routes>
  )
}
