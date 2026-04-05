const IMG_MAP = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmMDyJ3Vzy06lxUMKW-DltHsmt1kuRuJZf3SkWHyg2xlnlER2x3xbHZDyJi5i5Pp1Cxz8gyULgAg64HsTZyzf1LaIrdYLeWltRDybQWPttRz-IMtO2PwHfoqmchHUfBLUWUS-E8rVTzm0dAp9UkfUqleq1HaW9HaqgqVxGv0ROh-M0eYladEh7xqlzoQ3aIZxhhcbbIo80joAmv9wym1pVgsz7Boccxfh9aJcd9imva2J672tco6Q4Te_PTq393Q5lpc_5lrQxdM3K'
const IMG_SENSOR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCj56gTtIyoRmaE3rS0r0gmups66PN_SgfGLJLuuNj2CR-359GMsQIJfLoRp60QUFPdPYrWIc6WOdQXtXQPd4zlGk_uTOf_eIn_PXa4y3FpbJhX8dZ-BqEaqPyIGzkt6o3-KCzvHPvYe5hm323eA0i_uFJAbiJ8BWhUJgw89VWKIn78_rMIEWXF_SGoXNLLBgMQyrPouSrX4X71vYxOKuQ6-1I7CchPi84NQSOb7vMEdxPt_nhpvOoRAUXGpt5jTmpZMXHG0fi8og7-'
const IMG_TEAM = 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4ME928kxCXxVu2nVylrdY8ultaTB88VHG-EV_xCevqzZQrmkgWjytUebcEkJMA5oUqZK11gMvi8RGkjFjjQbsZyt3JZ_lGGWIiLGhKKw1HFAoShKsKiE5cnQ_pfvOXAGW6Y24jfarLvDi3jGE_dtxTq4LAjRVDRqdvtRxjhwpDG29gH_ckD9xN0k1XEVrwDJdxOF562XVUrHkucVzxWPQlwmgCP__FJwIaOJfq_-5yu_8QyjalqYMImweZ9hEa9XvYwKddn9LhwB6'
const IMG_FOOTER = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAAGxa0t4jL43JeB2mp6LyvlqtpPbynaPpnMwoxyrTx6hMCkDv9HFt-kSx5aNzvi6Lrfm87gvR0j6P3Le6MfA8pa8cHRweBR1phtz2cc7plVAjytbFuvjbXHsmAm0OhvvQmoGlNLGlkEZzk8yWqNui9ykspSlQtLLMI2UEg0huMgCUybonJvWoisSHw74KIpiTM_pvlGUvvngr1QahyLYMl9mOPF1tNiw_T5LWED58aKpcsFIhGbUu1fp-0PHytRKHFP6IwKLO3IJn9'

export default function ProjectOverview() {
  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-12">
      {/* Hero / Summary Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center bg-secondary-container/30 px-3 py-1 rounded-full border border-secondary-container/50">
            <span className="text-[10px] uppercase font-bold tracking-widest text-secondary">
              Scholarly Research Archive
            </span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-[family-name:var(--font-family-headline)] text-primary leading-tight font-bold">
            Safeguarding the Breath of Chinatown
          </h1>
          <p className="text-lg lg:text-xl text-on-surface-variant font-medium leading-relaxed max-w-2xl">
            The Heat &amp; Environmental Research in Open Spaces (HEROS) initiative is a collaborative
            manuscript of data, documenting the micro-climates of Boston's historic Chinatown. We
            transform raw environmental sensors into community-driven insights.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <div className="flex items-center gap-3 bg-surface-container-low p-4 rounded-xl shadow-sm border-l-4 border-primary">
              <span className="material-symbols-outlined text-primary text-3xl">history_edu</span>
              <div>
                <p className="text-xs uppercase font-bold tracking-widest text-on-surface-variant">Heritage Site Count</p>
                <p className="text-xl font-[family-name:var(--font-family-headline)] font-bold">12 Protected Zones</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-surface-container-low p-4 rounded-xl shadow-sm border-l-4 border-tertiary">
              <span className="material-symbols-outlined text-tertiary text-3xl">verified_user</span>
              <div>
                <p className="text-xs uppercase font-bold tracking-widest text-on-surface-variant">Data Fidelity</p>
                <p className="text-xl font-[family-name:var(--font-family-headline)] font-bold">High Precision Sensors</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4 h-full">
          <div className="col-span-2 bg-surface-container-highest p-6 rounded-2xl relative overflow-hidden group border border-outline-variant/10">
            <p className="text-xs uppercase font-bold tracking-widest text-primary mb-2">Primary Pollutant</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-[family-name:var(--font-family-headline)] font-bold text-primary">9.2</span>
              <span className="text-xl font-[family-name:var(--font-family-headline)] text-primary-container">µg/m³</span>
            </div>
            <p className="text-sm font-bold text-on-surface mt-2">Average PM2.5 Exposure</p>
            <div className="mt-4 h-1 w-full bg-outline-variant/30 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[35%]" />
            </div>
          </div>
          <div className="bg-secondary-container/20 p-6 rounded-2xl border border-secondary-container/50">
            <p className="text-[10px] uppercase font-bold tracking-widest text-secondary mb-1">Max Temp</p>
            <p className="text-3xl font-[family-name:var(--font-family-headline)] font-bold text-secondary">34.2°C</p>
            <span className="material-symbols-outlined text-secondary text-2xl mt-4">device_thermostat</span>
          </div>
          <div className="bg-tertiary-container text-tertiary-fixed p-6 rounded-2xl">
            <p className="text-[10px] uppercase font-bold tracking-widest text-tertiary-fixed-dim mb-1">Fleet Status</p>
            <p className="text-3xl font-[family-name:var(--font-family-headline)] font-bold">12 / 12</p>
            <div className="flex items-center gap-1 mt-4">
              <div className="w-2 h-2 rounded-full bg-tertiary-fixed shadow-[0_0_8px_rgba(158,243,214,0.6)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Sensors Online</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-end px-2">
          <div className="space-y-1">
            <h3 className="text-3xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface">
              Chinatown Open-Space Network
            </h3>
            <p className="text-on-surface-variant font-medium">
              Visualizing thermal stress and air quality across 12 strategic research sites.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="bg-surface-container p-2 rounded-lg hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant">layers</span>
            </button>
            <button className="bg-surface-container p-2 rounded-lg hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant">fullscreen</span>
            </button>
          </div>
        </div>
        <div className="relative w-full h-[600px] rounded-3xl overflow-hidden shadow-xl border-4 border-surface-container-low group">
          <img
            alt="Aerial Map of Boston Chinatown"
            className="w-full h-full object-cover grayscale opacity-40 brightness-110"
            src={IMG_MAP}
          />
          {/* Legend */}
          <div className="absolute bottom-6 left-6 p-6 glass-panel rounded-2xl border border-white/20 shadow-2xl max-w-xs space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-6 bg-primary rounded-full" />
              <h4 className="font-[family-name:var(--font-family-headline)] font-bold text-lg">Environmental Legend</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary shadow-sm" /> High Heat
                </span>
                <span className="text-on-surface-variant">&gt; 30°C</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-tertiary shadow-sm" /> Optimal Zone
                </span>
                <span className="text-on-surface-variant">&lt; 22°C</span>
              </div>
              <div className="pt-4 border-t border-outline-variant/30">
                <p className="text-[10px] text-on-surface-variant italic">
                  Data updated: 4 minutes ago via Tufts HEROS Mesh Network.
                </p>
              </div>
            </div>
          </div>
          {/* Map Markers */}
          <div className="absolute top-1/4 left-1/3 group cursor-pointer">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-12 h-12 bg-primary/20 rounded-full animate-ping" />
              <div className="relative w-4 h-4 bg-primary border-2 border-surface-container-lowest rounded-full shadow-lg" />
            </div>
          </div>
          <div className="absolute bottom-1/3 right-1/4 cursor-pointer">
            <div className="w-4 h-4 bg-tertiary border-2 border-surface-container-lowest rounded-full shadow-lg" />
          </div>
          <div className="absolute top-1/2 left-1/2 cursor-pointer">
            <div className="w-4 h-4 bg-secondary border-2 border-surface-container-lowest rounded-full shadow-lg" />
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-12 border-t border-outline-variant/20">
        <div className="space-y-6">
          <h3 className="text-4xl font-[family-name:var(--font-family-headline)] font-bold text-on-surface">
            Mission &amp; Scientific Rigor
          </h3>
          <div className="bg-surface-container-low p-8 rounded-3xl space-y-4">
            <p className="text-on-surface-variant font-medium leading-relaxed">
              Chinatown HEROS addresses the disproportionate environmental burden borne by residents of
              one of Boston's densest urban districts. By documenting thermal peaks and particulate
              distribution, we provide the empirical weight needed for structural urban cooling and
              policy shifts.
            </p>
            <ul className="space-y-4 pt-4">
              {['Hyper-Local Microclimate Mapping', 'Public Health Vulnerability Modeling', 'Urban Canopy Expansion Advocacy'].map((item) => (
                <li key={item} className="flex gap-4 items-start">
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                  <span className="text-sm font-bold uppercase tracking-wide text-on-surface">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="relative h-full flex items-center">
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="bg-surface-container-lowest p-1 rounded-2xl shadow-lg rotate-[-2deg] hover:rotate-0 transition-transform">
              <img alt="Environmental Sensor in Field" className="w-full h-48 object-cover rounded-xl" src={IMG_SENSOR} />
            </div>
            <div className="bg-surface-container-lowest p-1 rounded-2xl shadow-lg translate-y-8 rotate-[3deg] hover:rotate-0 transition-transform">
              <img alt="Research Team in Chinatown" className="w-full h-48 object-cover rounded-xl" src={IMG_TEAM} />
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
            Chinatown HEROS Project
          </span>
        </div>
        <p className="text-xs uppercase font-bold tracking-[0.2em] text-on-surface-variant">
          © 2024 Tufts University · Environmental Research Collaboration
        </p>
      </footer>
    </div>
  )
}
