import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import OverviewMap from '../components/OverviewMap'

const IMG_GATE = '/photos/chinatown_gate.jpg'
const IMG_FOOTER = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAAGxa0t4jL43JeB2mp6LyvlqtpPbynaPpnMwoxyrTx6hMCkDv9HFt-kSx5aNzvi6Lrfm87gvR0j6P3Le6MfA8pa8cHRweBR1phtz2cc7plVAjytbFuvjbXHsmAm0OhvvQmoGlNLGlkEZzk8yWqNui9ykspSlQtLLMI2UEg0huMgCUybonJvWoisSHw74KIpiTM_pvlGUvvngr1QahyLYMl9mOPF1tNiw_T5LWED58aKpcsFIhGbUu1fp-0PHytRKHFP6IwKLO3IJn9'

/* ── Policy Narrative Groups ────────────────────────────── */
const NARRATIVE_GROUPS = [
  {
    color: '#003e2f',
    bg: 'bg-tertiary/10',
    border: 'border-tertiary',
    icon: 'eco',
    labelKey: 'overview.envAnalytics',
    questionKey: 'overview.envAnalyticsQ',
    items: [
      { q: 'Q3', titleKey: 'overview.q3Title' },
      { q: 'Q4', titleKey: 'overview.q4Title' },
      { q: 'Q8', titleKey: 'overview.q8Title' },
    ],
    route: '/analytics/pm25',
  },
  {
    color: '#87512d',
    bg: 'bg-secondary/10',
    border: 'border-secondary',
    icon: 'warning',
    labelKey: 'overview.riskAssessment',
    questionKey: 'overview.riskAssessmentQ',
    items: [
      { q: 'Q5', titleKey: 'overview.q5Title' },
      { q: 'Q6', titleKey: 'overview.q6Title' },
    ],
    route: '/risk/hottest-days',
  },
  {
    color: '#6f070f',
    bg: 'bg-primary/10',
    border: 'border-primary',
    icon: 'hub',
    labelKey: 'overview.rootCauses',
    questionKey: 'overview.rootCausesQ',
    items: [
      { q: 'Q7', titleKey: 'overview.q7Title' },
      { q: 'Q9', titleKey: 'overview.q9Title' },
    ],
    route: '/causes/heat-pm25',
  },
  {
    color: '#1565C0',
    bg: 'bg-blue-500/10',
    border: 'border-blue-600',
    icon: 'verified',
    labelKey: 'overview.sensorValidation',
    questionKey: 'overview.sensorValidationQ',
    items: [
      { q: 'Q1', titleKey: 'overview.q1Title' },
      { q: 'Q2', titleKey: 'overview.q2Title' },
    ],
    route: '/sensors/pm25',
  },
]

export default function ProjectOverview() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-12">
      {/* Hero / Summary Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center bg-secondary-container/30 px-3 py-1 rounded-full border border-secondary-container/50">
            <span className="text-[10px] uppercase font-bold tracking-widest text-secondary">
              {t('overview.badge')}
            </span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-[family-name:var(--font-family-headline)] text-primary leading-tight font-bold">
            {t('overview.title')}
          </h1>
          <p className="text-lg lg:text-xl text-on-surface-variant font-medium leading-relaxed max-w-2xl">
            {t('overview.description')}
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <div className="flex items-center gap-3 bg-surface-container-low p-4 rounded-xl shadow-sm border-l-4 border-primary">
              <span className="material-symbols-outlined text-primary text-3xl">history_edu</span>
              <div>
                <p className="text-xs uppercase font-bold tracking-widest text-on-surface-variant">{t('overview.heritageSiteCount')}</p>
                <p className="text-xl font-[family-name:var(--font-family-headline)] font-bold">{t('overview.protectedZones')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-surface-container-low p-4 rounded-xl shadow-sm border-l-4 border-tertiary">
              <span className="material-symbols-outlined text-tertiary text-3xl">verified_user</span>
              <div>
                <p className="text-xs uppercase font-bold tracking-widest text-on-surface-variant">{t('overview.dataFidelity')}</p>
                <p className="text-xl font-[family-name:var(--font-family-headline)] font-bold">{t('overview.highPrecision')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4 h-full">
          <div className="col-span-2 bg-surface-container-highest p-6 rounded-2xl relative overflow-hidden group border border-outline-variant/10">
            <p className="text-xs uppercase font-bold tracking-widest text-primary mb-2">{t('overview.primaryPollutant')}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-[family-name:var(--font-family-headline)] font-bold text-primary">9.2</span>
              <span className="text-xl font-[family-name:var(--font-family-headline)] text-primary-container">µg/m³</span>
            </div>
            <p className="text-sm font-bold text-on-surface mt-2">{t('overview.avgPm25')}</p>
            <div className="mt-4 h-1 w-full bg-outline-variant/30 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[35%]" />
            </div>
          </div>
          <div className="bg-secondary-container/20 p-6 rounded-2xl border border-secondary-container/50">
            <p className="text-[10px] uppercase font-bold tracking-widest text-secondary mb-1">{t('overview.maxTemp')}</p>
            <p className="text-3xl font-[family-name:var(--font-family-headline)] font-bold text-secondary">34.2°C</p>
            <span className="material-symbols-outlined text-secondary text-2xl mt-4">device_thermostat</span>
          </div>
          <div className="bg-tertiary-container text-tertiary-fixed p-6 rounded-2xl">
            <p className="text-[10px] uppercase font-bold tracking-widest text-tertiary-fixed-dim mb-1">{t('overview.fleetStatus')}</p>
            <p className="text-3xl font-[family-name:var(--font-family-headline)] font-bold">12 / 12</p>
            <div className="flex items-center gap-1 mt-4">
              <div className="w-2 h-2 rounded-full bg-tertiary-fixed shadow-[0_0_8px_rgba(158,243,214,0.6)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{t('overview.sensorsOnline')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-end px-2">
          <div className="space-y-1">
            <h3 className="text-3xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface">
              {t('overview.mapTitle')}
            </h3>
            <p className="text-on-surface-variant font-medium">
              {t('overview.mapSubtitle')}
            </p>
          </div>
        </div>
        <OverviewMap />
      </section>

      {/* ── Policy Narrative / Project Scope ─────────────────── */}
      <section className="space-y-8 pt-12 border-t border-outline-variant/20">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <p className="text-[10px] uppercase font-bold tracking-[0.25em] text-secondary">{t('overview.researchFramework')}</p>
          <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface">
            {t('overview.policyNarrative')}
          </h3>
          <p className="text-on-surface-variant font-medium leading-relaxed">
            {t('overview.policyDesc')}
          </p>
        </div>

        {/* Flow arrow + cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {NARRATIVE_GROUPS.map((g, idx) => (
            <button
              key={g.labelKey}
              onClick={() => navigate(g.route)}
              className={`group relative text-left ${g.bg} rounded-2xl p-6 border-l-4 ${g.border} hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer`}
            >
              {/* Step number */}
              <div
                className="absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md"
                style={{ background: g.color }}
              >
                {idx + 1}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-2xl" style={{ color: g.color }}>{g.icon}</span>
                <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: g.color }}>
                  {t(g.labelKey)}
                </span>
              </div>

              <p className="font-[family-name:var(--font-family-headline)] text-lg font-bold text-on-surface mb-4 leading-snug">
                "{t(g.questionKey)}"
              </p>

              <div className="space-y-2">
                {g.items.map(item => (
                  <div key={item.q} className="flex items-start gap-2">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white shrink-0 mt-0.5"
                      style={{ background: g.color }}
                    >
                      {item.q}
                    </span>
                    <span className="text-xs font-medium text-on-surface-variant leading-tight">{t(item.titleKey)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: g.color }}>
                {t('overview.explore')} <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </button>
          ))}
        </div>

        {/* Connecting narrative line */}
        <div className="hidden xl:flex items-center justify-center gap-2 text-on-surface-variant/40 -mt-2">
          <span className="text-xs font-bold tracking-widest uppercase">{t('overview.foundation')}</span>
          <div className="h-px w-16 bg-outline-variant/30" />
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
          <div className="h-px w-16 bg-outline-variant/30" />
          <span className="text-xs font-bold tracking-widest uppercase">{t('overview.diagnosis')}</span>
          <div className="h-px w-16 bg-outline-variant/30" />
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
          <div className="h-px w-16 bg-outline-variant/30" />
          <span className="text-xs font-bold tracking-widest uppercase">{t('overview.explanation')}</span>
          <div className="h-px w-16 bg-outline-variant/30" />
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
          <div className="h-px w-16 bg-outline-variant/30" />
          <span className="text-xs font-bold tracking-widest uppercase">{t('overview.trust')}</span>
        </div>
      </section>

      {/* Mission Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-12 border-t border-outline-variant/20">
        <div className="space-y-6">
          <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface">
            {t('overview.missionTitle')}
          </h3>
          <div className="bg-surface-container-low p-8 rounded-3xl space-y-4">
            <p className="text-on-surface-variant font-medium leading-relaxed">
              {t('overview.missionDesc')}
            </p>
            <ul className="space-y-4 pt-4">
              {(['overview.advocacy1', 'overview.advocacy2', 'overview.advocacy3'] as const).map((key) => (
                <li key={key} className="flex gap-4 items-start">
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                  <span className="text-sm font-bold uppercase tracking-wide text-on-surface">{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="relative h-full flex items-center">
          <div className="w-full">
            <div className="bg-surface-container-lowest p-1.5 rounded-2xl shadow-lg rotate-[-1deg] hover:rotate-0 transition-transform">
              <img
                alt="Chinatown Gate — Boston Paifang"
                className="w-full h-72 object-cover rounded-xl"
                src={IMG_GATE}
              />
              <p className="text-[10px] text-center text-on-surface-variant/60 italic pt-2 pb-1">
                {t('overview.gateCaption')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-20 p-12 bg-surface-container-low text-center space-y-6 rounded-2xl">
        <div className="flex justify-center items-center gap-4">
          <img alt="Tufts University Logo" className="h-12 opacity-60 grayscale" src={IMG_FOOTER} />
          <div className="h-8 w-px bg-outline-variant" />
          <span className="font-[family-name:var(--font-family-headline)] font-bold text-stone-500">
            {t('overview.chinatownHeros')}
          </span>
        </div>
        <p className="text-xs uppercase font-bold tracking-[0.2em] text-on-surface-variant">
          {t('overview.footerCopyright')}
        </p>
      </footer>
    </div>
  )
}
