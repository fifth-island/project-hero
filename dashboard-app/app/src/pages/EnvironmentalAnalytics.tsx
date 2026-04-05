const IMG_MAP = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBhRPefImRR6lSAcT06djhTUIffqA9QtRh5dCvcOaPzsfYu0mtmU3QR1_ulEr-1FTSnd7JCsQqWwlf9f9d6WwlZgLYZ-gEvvLdkrxBDGviP_gKyWTwrgiceq4w68GCioL1IB-1fcxXQd_GQTnJ-dIezCjgKrikxAkEiOJFzoVyHu_d4PbLKoybdX_MtOgPjiYCmusArG8GtAmpA8fTNV3Aj8V6d-oxsukeEp-9LPz2LnscFEZ47ftFu3skFkQgcrYSMRuFO_Ohfblec'

const barHeights = [40, 55, 48, 62, 80, 52, 70, 35, 50, 75, 45, 75, 40, 60, 42, 68, 58, 85, 62, 48, 38, 44]
const barColors = [
  'bg-tertiary/20','bg-tertiary/30','bg-tertiary/25','bg-tertiary/40','bg-tertiary/60',
  'bg-tertiary/45','bg-tertiary/50','bg-primary/20','bg-primary/30','bg-primary/40',
  'bg-tertiary/35','bg-tertiary/55','bg-tertiary/30','bg-tertiary/40','bg-tertiary/25',
  'bg-tertiary/50','bg-tertiary/45','bg-tertiary/60','bg-tertiary/40','bg-tertiary/35',
  'bg-tertiary/25','bg-tertiary/30',
]

export default function EnvironmentalAnalytics() {
  return (
    <section className="p-8 space-y-8">
      <div className="grid grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* PM2.5 Chart */}
          <div className="bg-surface-container-lowest rounded-xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 lattice-pattern" />
            <div className="flex justify-between items-end mb-8 relative">
              <div>
                <h2 className="font-[family-name:var(--font-family-headline)] text-3xl font-bold text-primary leading-tight">
                  Particulate Matter Exposure
                </h2>
                <p className="text-secondary font-medium tracking-tight mt-1">PM2.5 Concentration (μg/m³)</p>
              </div>
              <div className="flex items-center gap-6 bg-surface-container-low px-4 py-2 rounded-full">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-outline-variant text-tertiary focus:ring-tertiary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Purple Air (Comm.)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">MassDEP (Reg.)</span>
                </label>
              </div>
            </div>
            <div className="h-64 flex items-end gap-1 relative border-b border-outline-variant/20">
              {barHeights.map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 ${barColors[i]} rounded-t-sm hover:opacity-80 transition-all`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between pt-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              <span>July 19</span><span>Aug 01</span><span>Aug 15</span><span>Aug 23</span>
            </div>
          </div>

          {/* Kestrel Temperature */}
          <div className="bg-surface-container rounded-xl p-8 relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-[family-name:var(--font-family-headline)] text-2xl font-bold text-on-surface">
                  Microclimate: Kestrel Temperature
                </h3>
                <p className="text-on-surface-variant text-sm mt-1">Detailed Heat Flux in Ambient Surface Environment</p>
              </div>
              <div className="data-seal rounded-full px-4 py-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-base">verified</span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">Research Verified</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-6">
              <div className="col-span-3 bg-surface-container-lowest p-6 rounded-lg shadow-sm border border-outline-variant/10">
                <div className="h-40 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 500 100">
                    <path d="M0,80 Q50,70 100,50 T200,30 T300,60 T400,20 T500,40" fill="none" stroke="#902223" strokeWidth="3" />
                    <path d="M0,90 Q50,85 100,75 T200,65 T300,85 T400,55 T500,70" fill="none" stroke="#87512d" strokeDasharray="4 2" strokeWidth="2" />
                  </svg>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-primary-container rounded-lg text-on-primary-container">
                  <p className="text-[10px] uppercase font-bold tracking-widest opacity-80">Max Temp</p>
                  <p className="text-2xl font-[family-name:var(--font-family-headline)] font-bold">94.2°F</p>
                </div>
                <div className="p-4 bg-secondary-container rounded-lg text-on-secondary-container">
                  <p className="text-[10px] uppercase font-bold tracking-widest opacity-80">Humidity Avg</p>
                  <p className="text-2xl font-[family-name:var(--font-family-headline)] font-bold">68%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* Spatial Analysis */}
          <div className="bg-surface-container-low rounded-xl p-8 border border-outline-variant/20">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary">location_on</span>
              <h3 className="font-[family-name:var(--font-family-headline)] text-xl font-bold">Spatial Analysis</h3>
            </div>
            <div className="rounded-lg overflow-hidden h-64 bg-stone-200 relative">
              <img alt="Chinatown Boston Map" className="w-full h-full object-cover" src={IMG_MAP} />
              <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
              <div className="absolute top-1/4 left-1/3 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg" />
              <div className="absolute top-1/2 left-2/3 w-4 h-4 bg-tertiary rounded-full border-2 border-white shadow-lg" />
              <div className="absolute bottom-4 left-4 right-4 bg-surface/90 backdrop-blur-md p-3 rounded-lg text-xs font-bold text-on-surface shadow-sm">
                <div className="flex justify-between items-center">
                  <span>Phillips Square Zone</span>
                  <span className="text-primary">+12% Heat Index</span>
                </div>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {[
                ['Tree Canopy', '8.4% (Low)'],
                ['Albedo Ratio', '0.14'],
                ['Avg Surface Temp', '102°F'],
              ].map(([label, value], i, arr) => (
                <div key={label} className={`flex items-center justify-between py-2 ${i < arr.length - 1 ? 'border-b border-outline-variant/10' : ''}`}>
                  <span className="text-xs uppercase font-bold tracking-widest text-stone-500">{label}</span>
                  <span className="text-xs font-[family-name:var(--font-family-headline)] font-bold">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Research Insight */}
          <div className="bg-primary p-8 rounded-xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 lattice-pattern opacity-20" />
            <h4 className="font-[family-name:var(--font-family-headline)] text-xl font-bold mb-4">Research Insight</h4>
            <p className="text-sm leading-relaxed opacity-90 font-light italic">
              "The correlation between high PM2.5 readings at Phillips Square and evening traffic peaks
              suggests a significant contribution from transit corridor idling during the summer thermal
              inversion period."
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-sm">history_edu</span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest">Lead Researcher</p>
                <p className="text-xs font-[family-name:var(--font-family-headline)] italic">
                  Tufts University Environmental Lab
                </p>
              </div>
            </div>
          </div>

          {/* Active Sensor Fleet */}
          <div className="bg-surface-container-highest/30 rounded-xl p-8 border border-primary/10">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-6">Active Sensor Fleet</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-white/50 p-3 rounded-lg">
                <span className="material-symbols-outlined text-tertiary">sensors</span>
                <div>
                  <p className="text-xs font-bold">Purple Air PA-II</p>
                  <p className="text-[10px] uppercase font-bold opacity-60">Status: Operational</p>
                </div>
                <span className="ml-auto w-2 h-2 rounded-full bg-tertiary" />
              </div>
              <div className="flex items-center gap-4 bg-white/50 p-3 rounded-lg">
                <span className="material-symbols-outlined text-tertiary">device_thermostat</span>
                <div>
                  <p className="text-xs font-bold">Kestrel 5400</p>
                  <p className="text-[10px] uppercase font-bold opacity-60">Status: Calibration</p>
                </div>
                <span className="ml-auto w-2 h-2 rounded-full bg-secondary" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Legend */}
      <div className="fixed bottom-8 left-8 flex flex-col gap-2 z-50">
        <div className="bg-white/40 backdrop-blur-xl border border-white/50 p-4 rounded-xl shadow-xl">
          <div className="flex items-center gap-4">
            {[
              ['bg-tertiary', 'Low Risk'],
              ['bg-secondary', 'Moderate'],
              ['bg-primary', 'Alert'],
            ].map(([color, label]) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-3 h-3 ${color} rounded-sm`} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
