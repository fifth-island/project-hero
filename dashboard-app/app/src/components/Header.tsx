import { useLocation, Link } from 'react-router-dom'

interface HeaderProps {
  children?: React.ReactNode
}

export default function Header({ children }: HeaderProps) {
  const { pathname } = useLocation()
  const isSensors = pathname.startsWith('/sensors')
  const isAnalytics = pathname === '/analytics'

  const sensorTabs = [
    { to: '/sensors/calibration', label: 'Calibration', full: 'Calibration Fidelity Ledger' },
    { to: '/sensors/temperature', label: 'Temperature Report', full: 'Temperature Sensor Comparison' },
  ]

  return (
    <>
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 shadow-sm flex justify-between items-center px-10 py-6 w-full">
      <div className="flex items-center gap-8">
        {isSensors ? (
          <>
            <h2 className="text-2xl font-[family-name:var(--font-family-headline)] font-black text-red-900 tracking-tighter">Sensor Validation</h2>
            <nav className="flex gap-6 text-lg font-[family-name:var(--font-family-headline)]">
              {sensorTabs.map(tab => (
                <Link key={tab.to} to={tab.to}
                  className={pathname === tab.to
                    ? 'text-red-800 border-b-2 border-red-800 pb-1'
                    : 'text-stone-500 hover:text-red-700'}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
          </>
        ) : (
          <>
            <span className="text-xl font-[family-name:var(--font-family-headline)] font-bold text-red-900 italic tracking-tight">
              Chinatown HEROS
            </span>
            {isAnalytics && (
              <>
                <div className="h-6 w-[1px] bg-outline-variant/40 mx-2" />
                <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded-full">
                  <span className="material-symbols-outlined text-sm text-tertiary">calendar_today</span>
                  <span className="text-xs font-bold text-on-surface-variant tracking-tight uppercase">
                    July 19 – Aug 23, 2023
                  </span>
                </div>
              </>
            )}
          </>
        )}
      </div>
      <div className="flex items-center gap-6">
        {children}
        {isSensors && (
          <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant/20">
            <span className="w-2 h-2 rounded-full bg-tertiary" />
            <span className="text-xs font-bold text-on-surface-variant">NETWORK STATUS: OPTIMAL</span>
          </div>
        )}
        {isAnalytics && (
          <div className="flex items-center gap-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Site Filter:</label>
            <select className="bg-surface-container-low border-none rounded-lg text-xs font-bold text-primary focus:ring-1 focus:ring-primary py-1 pl-3 pr-8 cursor-pointer">
              <option>Auntie Kay &amp; Uncle Frank Chin Park</option>
              <option>Phillips Square</option>
              <option>Hudson Street</option>
              <option>Chinatown Gate</option>
            </select>
          </div>
        )}
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-stone-600 hover:text-red-800 transition-colors cursor-pointer">
            notifications
          </span>
          <span className="material-symbols-outlined text-stone-600 hover:text-red-800 transition-colors cursor-pointer">
            account_circle
          </span>
        </div>
      </div>
    </header>
    {isSensors && (
      <div className="px-8 mt-4 bg-white/50 backdrop-blur-sm">
        <div className="flex gap-4 border-b border-outline-variant/30">
          {sensorTabs.map(tab => (
            <Link key={tab.to} to={tab.to}
              className={`px-4 py-2 text-sm transition-colors ${
                pathname === tab.to
                  ? 'font-bold text-primary border-b-2 border-primary'
                  : 'font-medium text-stone-500 hover:text-primary'
              }`}
            >
              {tab.full}
            </Link>
          ))}
        </div>
      </div>
    )}
    </>
  )
}
