import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-surface text-on-surface selection:bg-secondary-container">
      <Sidebar />
      <main className="md:ml-72 flex-1 min-h-screen">
        <Header />
        <Outlet />
      </main>
    </div>
  )
}
