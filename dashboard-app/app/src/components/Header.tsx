import { useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface HeaderProps {
  children?: React.ReactNode
}

export default function Header({ children }: HeaderProps) {
  const { pathname } = useLocation()
  const { t, i18n } = useTranslation()
  const isSensors = pathname.startsWith('/sensors')
  const isAnalytics = pathname.startsWith('/analytics')
  const isRisk = pathname.startsWith('/risk')
  const isCauses = pathname.startsWith('/causes')

  const sensorTabs = [
    { to: '/sensors/calibration', label: t('tabs.calibration'), full: t('tabs.calibrationFull') },
    { to: '/sensors/temperature', label: t('tabs.temperature'), full: t('tabs.temperatureFull') },
  ]

  const analyticsTabs = [
    { to: '/analytics/distributions', label: t('tabs.distributions'), full: t('tabs.distributionsFull') },
    { to: '/analytics/aqi', label: t('tabs.aqi'), full: t('tabs.aqiFull') },
    { to: '/analytics/temporal', label: t('tabs.temporal'), full: t('tabs.temporalFull') },
    { to: '/analytics/clustering', label: t('tabs.clustering'), full: t('tabs.clusteringFull') },
  ]

  const riskTabs = [
    { to: '/risk/hottest-days', label: t('tabs.hottestDays'), full: t('tabs.hottestDaysFull') },
    { to: '/risk/deep-dive', label: t('tabs.deepDive'), full: t('tabs.deepDiveFull') },
    { to: '/risk/highest-aqi', label: t('tabs.highestAqi'), full: t('tabs.highestAqiFull') },
  ]

  const causesTabs = [
    { to: '/causes/heat-pm25', label: t('tabs.heatPm25'), full: t('tabs.heatPm25Full') },
    { to: '/causes/heterogeneity', label: t('tabs.heterogeneity'), full: t('tabs.heterogeneityFull') },
    { to: '/causes/land-use', label: t('tabs.landUse'), full: t('tabs.landUseFull') },
    { to: '/causes/land-use-clusters', label: t('tabs.luClustering'), full: t('tabs.luClusteringFull') },
  ]

  const hasTabs = isSensors || isAnalytics || isRisk || isCauses
  const tabs = isSensors ? sensorTabs : isRisk ? riskTabs : isCauses ? causesTabs : analyticsTabs
  const sectionTitle = isSensors ? t('nav.sensors') : isRisk ? t('nav.risk') : isCauses ? t('nav.causes') : t('nav.analytics')

  const isZh = i18n.language === 'zh'
  const toggleLang = () => i18n.changeLanguage(isZh ? 'en' : 'zh')

  return (
    <>
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 shadow-sm flex justify-between items-center px-10 py-6 w-full">
      <div className="flex items-center gap-8">
        {hasTabs ? (
          <>
            <h2 className="text-2xl font-[family-name:var(--font-family-headline)] font-black text-red-900 tracking-tighter">{sectionTitle}</h2>
            <nav className="flex gap-6 text-lg font-[family-name:var(--font-family-headline)]">
              {tabs.map(tab => (
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
              {t('nav.chinatownHeros')}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-6">
        {children}
        {isSensors && (
          <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant/20">
            <span className="w-2 h-2 rounded-full bg-tertiary" />
            <span className="text-xs font-bold text-on-surface-variant">{t('nav.networkStatus')}</span>
          </div>
        )}
        <button
          onClick={toggleLang}
          className="flex items-center gap-2 bg-surface-container-highest/40 px-3 py-1.5 rounded-full border border-outline-variant/20 hover:bg-surface-container-highest/70 transition-colors cursor-pointer"
          title={t('lang.toggle')}
        >
          <span className="material-symbols-outlined text-sm text-stone-600">translate</span>
          <span className={`text-xs font-bold transition-colors ${!isZh ? 'text-red-800' : 'text-stone-400'}`}>EN</span>
          <span className="text-stone-300">/</span>
          <span className={`text-xs font-bold transition-colors ${isZh ? 'text-red-800' : 'text-stone-400'}`}>中文</span>
        </button>
      </div>
    </header>
    {hasTabs && (
      <div className="px-8 mt-4 bg-white/50 backdrop-blur-sm">
        <div className="flex gap-4 border-b border-outline-variant/30">
          {tabs.map(tab => (
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
