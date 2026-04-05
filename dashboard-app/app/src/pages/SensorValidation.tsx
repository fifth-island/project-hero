const IMG_SEAL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFDSw0u2SkZJsLag18MVCqhjuSgQi5Z1tL-X49TpIWOoVFPNHL3tLZ7XFV6m9Od1gDQL0FFEKyaXgja5Vl2wMKnrHlP0aQYEfaK94s6hLJM4xGcFlXayKw_GmTmxIjb2TjHtcss5nBNL3d7vMsETlgwBR54lz7mWoUgFkUUxeGl2M7FcnH1yl6E7Tk4GCqVzeFjiCyYNP6DLWnyOyjsgjXTB8GlTi5KexZT9BNGId5BR8uaQpv9trJNgP9frKh__MsH5wL-VQNQi82'

const sensors = [
  { node: 'NODE_042', name: 'Chinatown Gate', status: 'Active', drift: '+0.02%', health: 98, icon: 'check_circle', color: 'tertiary' },
  { node: 'NODE_089', name: 'Hudson St. Park', status: 'Active', drift: '-0.14%', health: 94, icon: 'check_circle', color: 'tertiary' },
  { node: 'NODE_012', name: 'Josiah Quincy School', status: 'Maintenance', drift: 'N/A', health: 100, icon: 'update', color: 'secondary' },
  { node: 'NODE_114', name: 'Boylston Station', status: 'Active', drift: '+0.08%', health: 97, icon: 'check_circle', color: 'tertiary' },
]

export default function SensorValidation() {
  return (
    <section className="p-8 max-w-7xl mx-auto space-y-12 relative z-10">
      {/* Lattice background */}
      <div className="lattice-bg absolute inset-0 pointer-events-none opacity-[0.04]" />

      {/* Calibration Summary */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-8 bg-surface-container-lowest p-8 rounded-lg shadow-sm border-l-4 border-primary relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-[8rem]">verified</span>
          </div>
          <h3 className="font-[family-name:var(--font-family-headline)] text-2xl font-bold mb-4 text-on-surface">
            Calibration Fidelity Ledger
          </h3>
          <p className="text-on-surface-variant leading-relaxed max-w-2xl mb-8">
            The HEROS sensor network utilizes a dual-tier validation protocol. Low-cost optical particle
            counters (PurpleAir PA-II) are co-located with regulatory-grade Federal Equivalent Method
            (FEM) monitors maintained by MassDEP. Our corrective algorithms account for ambient humidity
            and temperature bias, ensuring community-collected data meets rigorous academic standards.
          </p>
          <div className="grid grid-cols-3 gap-6">
            {[
              ['R² Correlation', '0.942', 'EXCELLENT MATCH'],
              ['RMSE (μg/m³)', '2.14', 'LOW ERROR MARGIN'],
              ['Last Calibration', '04/24', 'ACTIVE VALIDATION'],
            ].map(([label, value, sub]) => (
              <div key={label} className="p-4 bg-surface-container-low rounded-lg">
                <span className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">{label}</span>
                <span className="text-3xl font-[family-name:var(--font-family-headline)] font-bold text-primary">{value}</span>
                <span className="block text-[10px] text-tertiary font-bold mt-1">{sub}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Verified Seal */}
        <div className="md:col-span-4 bg-surface-container rounded-lg p-8 flex flex-col items-center justify-center text-center relative group">
          <div className="lattice-bg absolute inset-0 opacity-10" />
          <div className="w-32 h-32 border-4 border-primary rounded-full flex items-center justify-center p-4 relative z-10 mb-4">
            <div className="absolute inset-0 rounded-full data-seal-border opacity-20" />
            <span className="material-symbols-outlined text-primary text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              verified
            </span>
          </div>
          <span className="font-[family-name:var(--font-family-headline)] text-xl font-bold text-primary italic z-10">
            Tufts Verified
          </span>
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-2 z-10">
            Sensor Protocol v2.4
          </span>
        </div>
      </div>

      {/* Scatter Plot & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Scatter Plot */}
        <div className="bg-surface-container-lowest p-8 rounded-lg shadow-sm">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h4 className="font-[family-name:var(--font-family-headline)] text-xl font-bold text-on-surface">
                PM2.5 Correlation Matrix
              </h4>
              <p className="text-xs text-on-surface-variant uppercase tracking-widest">
                Low-Cost (PA-II) vs. Regulatory (MassDEP FEM)
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold rounded-full">RAW DATA</span>
              <span className="px-3 py-1 bg-primary-fixed text-on-primary-fixed text-[10px] font-bold rounded-full">CORRECTED</span>
            </div>
          </div>
          <div className="aspect-video bg-surface-container-low rounded relative overflow-hidden border border-outline-variant/10">
            <div className="absolute inset-0 flex flex-col justify-between p-4">
              <div className="flex-1 border-l-2 border-b-2 border-outline-variant/30 flex items-end relative">
                <div className="absolute w-[120%] h-1 bg-primary/40 -rotate-[35deg] origin-bottom-left bottom-0 left-0" />
                {[
                  [10, 15, 2], [20, 25, 2], [25, 35, 2], [35, 42, 3], [45, 50, 2],
                  [55, 65, 2], [68, 78, 4], [75, 88, 2], [85, 95, 2],
                ].map(([left, bottom, size], i) => (
                  <div
                    key={i}
                    className={`absolute rounded-full bg-primary/60 ${size === 4 ? 'animate-pulse bg-primary/40' : size === 3 ? 'bg-secondary/80' : ''}`}
                    style={{ width: `${size * 4}px`, height: `${size * 4}px`, left: `${left}%`, bottom: `${bottom}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="absolute bottom-2 right-4 text-[10px] text-on-surface-variant font-bold">MassDEP FEM (μg/m³) →</div>
          </div>
          <div className="mt-4 flex justify-between items-center text-xs">
            <span className="text-on-surface-variant italic">Linear regression shows strong positive correlation (m = 1.08)</span>
            <span className="font-bold text-primary">R² = 0.94</span>
          </div>
        </div>

        {/* Instrumentation Table */}
        <div className="bg-surface-container-lowest rounded-lg shadow-sm border border-outline-variant/10 overflow-hidden">
          <div className="p-8 border-b border-outline-variant/10">
            <h4 className="font-[family-name:var(--font-family-headline)] text-xl font-bold text-on-surface">
              Instrumentation Metadata
            </h4>
            <p className="text-xs text-on-surface-variant uppercase tracking-widest">
              Regulatory vs. Deployment Grade
            </p>
          </div>
          <table className="w-full text-left">
            <thead className="bg-surface-container-low text-[10px] uppercase tracking-widest font-bold text-secondary">
              <tr>
                <th className="px-8 py-4">Metric</th>
                <th className="px-8 py-4">Low-Cost PA-II</th>
                <th className="px-8 py-4">MassDEP FEM</th>
              </tr>
            </thead>
            <tbody className="text-xs text-on-surface divide-y divide-outline-variant/10">
              {[
                ['Detection Principle', 'Laser Particle Counter', 'Beta Attenuation'],
                ['Resolution', '0.3 μm', '0.1 μg/m³'],
                ['Sampling Interval', '120 Seconds', '60 Minutes'],
              ].map(([metric, low, fem]) => (
                <tr key={metric} className="hover:bg-surface-container/30 transition-colors">
                  <td className="px-8 py-5 font-bold">{metric}</td>
                  <td className="px-8 py-5">{low}</td>
                  <td className="px-8 py-5">{fem}</td>
                </tr>
              ))}
              <tr className="hover:bg-surface-container/30 transition-colors">
                <td className="px-8 py-5 font-bold">Reliability Score</td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1,2,3].map(i => <div key={i} className="w-3 h-3 bg-tertiary rounded-full" />)}
                      <div className="w-3 h-3 bg-tertiary/20 rounded-full" />
                    </div>
                    <span className="text-[9px]">GOOD</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1,2,3,4].map(i => <div key={i} className="w-3 h-3 bg-tertiary rounded-full" />)}
                    </div>
                    <span className="text-[9px]">IDEAL</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Asset Registry */}
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h4 className="font-[family-name:var(--font-family-headline)] text-2xl font-bold text-on-surface">
              Asset Registry &amp; Drift Analysis
            </h4>
            <p className="text-sm text-on-surface-variant">Real-time validation status for active Chinatown sensors.</p>
          </div>
          <button className="text-xs font-bold text-secondary underline hover:text-primary transition-colors flex items-center gap-1">
            VIEW FULL CALIBRATION LOG <span className="material-symbols-outlined text-sm">open_in_new</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sensors.map((s) => (
            <div key={s.node} className={`bg-surface-container-lowest p-5 rounded-lg border border-outline-variant/20 shadow-sm flex flex-col gap-3 group hover:border-${s.color}/40 transition-colors`}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-on-surface-variant px-2 py-0.5 bg-surface-container rounded uppercase tracking-tighter">
                  {s.node}
                </span>
                <span
                  className={`material-symbols-outlined text-${s.color} text-lg`}
                  style={s.icon === 'check_circle' ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {s.icon}
                </span>
              </div>
              <h5 className="font-[family-name:var(--font-family-headline)] font-bold text-on-surface">{s.name}</h5>
              <div className="flex justify-between text-[10px] uppercase text-on-surface-variant">
                <span>Status: {s.status}</span>
                <span>Drift: {s.drift}</span>
              </div>
              <div className="h-1.5 w-full bg-surface-container-low rounded-full overflow-hidden">
                <div className={`h-full bg-${s.color}`} style={{ width: `${s.health}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="pt-12 border-t border-outline-variant/20 flex flex-col md:flex-row justify-between items-start gap-8 opacity-70">
        <div className="flex items-center gap-4">
          <img className="w-12 h-12 mix-blend-multiply" alt="Tufts University" src={IMG_SEAL} />
          <div>
            <p className="text-xs font-bold text-primary uppercase tracking-widest">Tufts University</p>
            <p className="text-[10px] text-on-surface-variant">Department of Civil and Environmental Engineering</p>
          </div>
        </div>
        <div className="max-w-md text-right md:text-left">
          <p className="text-[10px] uppercase text-on-surface-variant tracking-widest leading-loose">
            HEROS (Health &amp; Environmental Research in Operational Systems) is a collaborative research
            initiative funded to investigate urban heat and air quality disparities in Chinatown, Boston.
            All sensor validation methodologies follow the EPA's Air Sensor Guidebook protocols.
          </p>
        </div>
      </footer>
    </section>
  )
}
