import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProjectOverview from './pages/ProjectOverview'
import EnvironmentalAnalytics from './pages/EnvironmentalAnalytics'
import CommunityImpact from './pages/CommunityImpact'
import ResearchQ1 from './pages/ResearchQ1'
import ResearchQ2 from './pages/ResearchQ2'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<ProjectOverview />} />
        <Route path="/analytics" element={<EnvironmentalAnalytics />} />
        <Route path="/sensors" element={<Navigate to="/sensors/calibration" replace />} />
        <Route path="/sensors/calibration" element={<ResearchQ1 />} />
        <Route path="/sensors/temperature" element={<ResearchQ2 />} />
        <Route path="/community" element={<CommunityImpact />} />
      </Route>
    </Routes>
  )
}
