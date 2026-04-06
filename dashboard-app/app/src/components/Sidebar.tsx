import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const IMG_SEAL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAVJMT2ltJZIE9rHu3hE9WBuM5VL3p_u0Jy0tXKvbZfGmmn7AtOC0t7CVuD7J7mLqJDbFv8XfUJsAOK6lfl84IE2vmoUiC6gGU4SQoqY8tcggbl4SHivYBZ8Taohq08R-w-U6LSH4WVy5qUzgwxuVxBp57XpITHjwy4ds8wPX1E0DrGlsILhG3JnSaQZhUoWSN3iHUw_0-EmaB0I9JfVKt6VlBdNvNAP8cjikRwV0tT9WTSSdB_i8K6nAdA7T01JUJ6S_jz2bVc5m8l'

const navKeys = [
  { to: '/overview', icon: 'map', labelKey: 'nav.overview' },
  { to: '/analytics/distributions', icon: 'analytics', labelKey: 'nav.analytics' },
  { to: '/risk/hottest-days', icon: 'emergency_heat', labelKey: 'nav.risk' },
  { to: '/causes/heat-pm25', icon: 'psychiatry', labelKey: 'nav.causes' },
  { to: '/sensors/calibration', icon: 'precision_manufacturing', labelKey: 'nav.sensors' },
  { to: '/community', icon: 'diversity_1', labelKey: 'nav.community' },
]

export default function Sidebar() {
  const { pathname } = useLocation()
  const { t } = useTranslation()
  return (
    <aside className="hidden md:flex flex-col h-screen w-72 fixed left-0 top-0 bg-stone-50 z-50">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-8">
          <img
            alt="Tufts University Logo Seal"
            className="w-10 h-10 object-contain opacity-90"
            src={IMG_SEAL}
          />
          <div>
            <h1 className="font-[family-name:var(--font-family-headline)] text-lg text-red-900 leading-tight">
              {t('nav.title')}
            </h1>
            <p className="uppercase text-[10px] font-semibold tracking-widest text-stone-500">
              {t('nav.subtitle')}
            </p>
          </div>
        </div>

        <nav className="space-y-1">
          <div className="px-4 py-2 text-[10px] font-[family-name:var(--font-family-headline)] uppercase tracking-widest text-stone-400 font-bold mb-2">
            {t('nav.mainNav')}
          </div>
          {navKeys.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 uppercase text-xs font-semibold tracking-widest transition-all ${
                  isActive
                    || (item.to === '/sensors/calibration' && pathname.startsWith('/sensors/'))
                    || (item.to === '/analytics/distributions' && pathname.startsWith('/analytics/'))
                    || (item.to === '/risk/hottest-days' && pathname.startsWith('/risk/'))
                    || (item.to === '/causes/heat-pm25' && pathname.startsWith('/causes/'))
                    ? 'text-red-900 font-bold bg-stone-200/50 rounded-r-full'
                    : 'text-stone-500 hover:bg-stone-200'
                }`
              }
            >
              <span className="material-symbols-outlined text-red-900">{item.icon}</span>
              <span>{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-8 space-y-4">
        <button className="w-full py-3 px-4 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-md text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform">
          <span className="material-symbols-outlined text-sm">download</span>
          {t('nav.downloadData')}
        </button>
        <div className="pt-4 border-t border-outline-variant/30 space-y-1">
          <a className="flex items-center gap-3 px-4 py-2 text-stone-500 uppercase text-xs font-semibold tracking-widest hover:bg-stone-200 transition-all" href="#">
            <span className="material-symbols-outlined text-sm">settings</span>
            <span>{t('nav.settings')}</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-2 text-stone-500 uppercase text-xs font-semibold tracking-widest hover:bg-stone-200 transition-all" href="#">
            <span className="material-symbols-outlined text-sm">help</span>
            <span>{t('nav.support')}</span>
          </a>
        </div>
      </div>
    </aside>
  )
}
