const IMG_HEAT_MAP = 'https://lh3.googleusercontent.com/aida-public/AB6AXuASQCMmZL6UyfeJdUhw3yegrlGMDfwk8pt8MpTzJqsT9bXm75CaP0lpUDHtj9R7WkNaJmz8MQCVDm2rUWhztc2vXFiuwgS9JV42RTTnRniGlUN6saGosW_LgZ8sBUx_J94dAGJQZSbt3bx3QRZnp-vXshkVnQ5FeEE9m2XxwkhdY-UzomHjkxQuPq6m1yE4WLD_6TP6_0JzTpVeBdqnvpQ2j9kB6tVJzYerRM2dq7rLLp0_W6lwGL06-Y5O9PfG3KIUf2YVzZajnJKL'
const IMG_STREET = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBX8f6MmcV4mDVn3MMHs91_1oKFKXKZBdm1M-Vf9kt1sBoEr7QEJ5IYFvQbvp7uDKGdE_UbQxeEmK7vDhPhBqwp6ZW4AUTCvjellSLfiGfxB-TPCeXVFJ-l1Qw8LvirFP0WYk9yO_UFCma7jPR_tK_w6z9Wouy1m38AzVXgRzryZZ1aQqvQicPjr5RK5XKiQEhPFoog_auJcNYxY13iRzBlRMr33LVQVpy1lR7l_sDEgV2k80EN904xvlsntmKhu_m7owMYpUuIiz6W'
const IMG_FOOTER = 'https://lh3.googleusercontent.com/aida-public/AB6AXuD7LHU8iZqr_KgqZUEatWw9XECzzbNjjUSHAJNu165FrwovYkQEymCb54-CZpd9r3Vh_aVfYlLdIIQ84B41Guta9sbYykQhuR0LGgFHd2PZMzMttC12Bzd3y3uceSEV-uQw8S6AV0mhTRhkEewEcIqseIME7gRFKqcPlQQ-b073ymJrxDyThoVbzKTljB2iYqhO5ex4sfhRvlls9HizmAVGFKot_yAcAOSFNlkc--oMS9Hx6J57vpOqhdTh71_-MAC2VQ8A3Ke5oKAY'

export default function CommunityImpact() {
  return (
    <section className="p-6 md:p-12 max-w-7xl mx-auto">
      {/* Hero Narrative */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-16">
        <div className="lg:col-span-8">
          <div className="flex items-center gap-2 text-primary font-bold mb-4">
            <span className="h-px w-8 bg-primary" />
            <span className="uppercase tracking-[0.2em] text-[10px] font-bold">Field Research Report</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-[family-name:var(--font-family-headline)] text-on-surface leading-tight tracking-tight mb-6">
            Thermal Justice <br />in <span className="italic text-primary">Chinatown</span>
          </h1>
          <p className="text-xl text-on-surface-variant max-w-2xl leading-relaxed">
            Chinatown HEROS (Health, Environmental Research, &amp; Outreach Strategy) investigates how
            urban design and social vulnerability intersect to create hazardous heat conditions in
            Boston's historic core.
          </p>
        </div>
        <div className="lg:col-span-4 flex justify-end">
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-1">Collaboration</p>
            <p className="text-sm font-[family-name:var(--font-family-headline)] italic text-on-surface">
              Tufts University x ACDC Boston
            </p>
            <p className="text-[10px] text-stone-400 mt-2">Data Refresh: Aug 2023</p>
          </div>
        </div>
      </div>

      {/* Bento Data Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
        {/* Heat Map */}
        <div className="lg:col-span-2 bg-surface-container-low rounded-xl overflow-hidden shadow-sm relative min-h-[500px]">
          <div className="absolute top-6 left-6 z-10 glass-card p-4 rounded-lg shadow-lg border border-white/20">
            <h3 className="font-[family-name:var(--font-family-headline)] text-lg text-primary leading-tight">
              Relative Heat Intensity
            </h3>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">
              Surface Temperature Overlay
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="h-3 w-24 bg-gradient-to-r from-yellow-200 via-orange-500 to-red-900 rounded-full" />
              <span className="text-[10px] font-bold">104°F</span>
            </div>
          </div>
          <div className="w-full h-full bg-stone-200">
            <img
              alt="Thermal map of Boston Chinatown"
              className="w-full h-full object-cover grayscale-[0.2] contrast-[1.1]"
              src={IMG_HEAT_MAP}
            />
          </div>
          <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2">
            <button className="w-10 h-10 bg-surface-container-highest rounded-full shadow-md flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">layers</span>
            </button>
            <button className="w-10 h-10 bg-surface-container-highest rounded-full shadow-md flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
        </div>

        {/* Vulnerability Indicators */}
        <div className="flex flex-col gap-6">
          <div className="bg-surface-container p-8 rounded-xl relative overflow-hidden lattice-bg">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <span className="material-symbols-outlined text-secondary text-3xl">elderly</span>
                <span className="text-[10px] font-bold bg-secondary-container px-2 py-1 rounded">
                  Vulnerability: High
                </span>
              </div>
              <h4 className="font-[family-name:var(--font-family-headline)] text-2xl text-on-surface leading-tight">
                Aging Population
              </h4>
              <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                28% of residents are over 65, significantly higher than the city average, increasing risk
                during heat waves.
              </p>
            </div>
          </div>
          <div className="bg-tertiary-container p-8 rounded-xl text-on-tertiary relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <span className="material-symbols-outlined text-tertiary-fixed text-3xl">translate</span>
            </div>
            <h4 className="font-[family-name:var(--font-family-headline)] text-2xl leading-tight">
              Linguistic Isolation
            </h4>
            <p className="text-sm text-tertiary-fixed-dim mt-2 leading-relaxed opacity-90">
              42% of households speak limited English, complicating the dissemination of emergency cooling
              resources.
            </p>
            <div className="mt-6 flex gap-1">
              <div className="h-1 flex-1 bg-tertiary-fixed/30 rounded-full overflow-hidden">
                <div className="h-full bg-tertiary-fixed w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Narrative Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
        <div className="lg:col-span-5 relative">
          <div className="aspect-[4/5] bg-stone-100 rounded-xl overflow-hidden shadow-xl">
            <img
              alt="Chinatown street during hot day"
              className="w-full h-full object-cover"
              src={IMG_STREET}
            />
          </div>
          <div className="absolute -bottom-6 -right-6 glass-card p-6 rounded-lg max-w-[240px] shadow-2xl border border-white/40">
            <p className="font-[family-name:var(--font-family-headline)] italic text-primary text-lg">
              "The bricks hold the heat long after the sun goes down."
            </p>
            <p className="text-[10px] uppercase font-bold mt-2 text-stone-500">— Resident Interview, 2023</p>
          </div>
        </div>
        <div className="lg:col-span-7 py-8">
          <h2 className="text-4xl font-[family-name:var(--font-family-headline)] text-on-surface mb-8">
            The Cumulative Impact of the Urban Heat Island
          </h2>
          <div className="space-y-6 text-on-surface-variant leading-relaxed text-lg">
            <p>
              In the dense urban fabric of Boston's Chinatown, the convergence of concrete surfaces, lack
              of tree canopy, and proximity to major highway arteries creates a "micro-climate" that can
              be 10–15°F hotter than surrounding coastal neighborhoods.
            </p>
            <p>
              For a population that faces high rates of respiratory illness and cardiovascular disease,
              these temperature spikes are not just uncomfortable—they are life-threatening. Our research
              indicates that linguistic barriers often prevent residents from accessing "Cooling Centers"
              provided by the city.
            </p>
            <div className="pt-4 flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-3xl font-[family-name:var(--font-family-headline)] text-primary">12.4%</span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Asthma Rate</span>
              </div>
              <div className="w-px h-12 bg-stone-200" />
              <div className="flex flex-col">
                <span className="text-3xl font-[family-name:var(--font-family-headline)] text-primary">4.2°C</span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Nighttime Excess</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resources Section */}
      <div className="bg-surface-container-low rounded-2xl p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <span className="material-symbols-outlined text-[160px]">eco</span>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-tertiary font-bold mb-6">
            <span className="material-symbols-outlined">verified</span>
            <span className="uppercase tracking-widest text-[11px] font-bold">Community Action Hub</span>
          </div>
          <h2 className="text-4xl font-[family-name:var(--font-family-headline)] text-on-surface mb-10">
            Resources &amp; Resiliency
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Cooling Center Map',
                desc: 'View real-time availability of air-conditioned public spaces in Chinatown and nearby areas.',
                link: 'Access Map',
                color: 'primary',
              },
              {
                title: 'Utility Assistance',
                desc: 'Grants and subsidies available for elderly residents to help manage electricity costs during peak heat.',
                link: 'Learn More',
                color: 'secondary',
              },
              {
                title: 'Air Quality Sensors',
                desc: 'Volunteer to host a HEROS environmental sensor at your residence to help our research.',
                link: 'Join Project',
                color: 'tertiary',
              },
            ].map((item) => (
              <div key={item.title} className={`bg-surface-container-lowest p-6 rounded-lg shadow-sm border-l-4 border-${item.color}`}>
                <h5 className="font-[family-name:var(--font-family-headline)] text-xl mb-3">{item.title}</h5>
                <p className="text-sm text-on-surface-variant mb-4">{item.desc}</p>
                <a className={`inline-flex items-center gap-2 text-${item.color} font-bold text-xs uppercase tracking-widest group`} href="#">
                  {item.link}
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 py-12 border-t border-stone-200 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-4">
          <img alt="Tufts University Logo" className="h-16 w-16 opacity-30 grayscale" src={IMG_FOOTER} />
          <div>
            <p className="font-[family-name:var(--font-family-headline)] text-lg text-stone-500 italic">Tufts University</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400">
              Environmental Research Collaboration
            </p>
          </div>
        </div>
        <div className="flex gap-8 text-[11px] uppercase font-bold tracking-widest text-stone-400">
          <a className="hover:text-primary" href="#">Data Ethics</a>
          <a className="hover:text-primary" href="#">Privacy Policy</a>
          <a className="hover:text-primary" href="#">Contact Team</a>
        </div>
      </footer>
    </section>
  )
}
