import bgUrl from '../../assets/gradient.jpg'

export function LoginHeroPanel() {
  return (
    <div className="relative h-full min-h-[32vh] w-full overflow-hidden bg-slate-900 md:min-h-0">
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        <img
          src={bgUrl}
          alt=""
          className="pointer-events-none absolute left-1/2 top-1/2 h-[max(100vmin,50vw)] w-[max(100vmin,50vw)] max-w-none -translate-x-1/2 -translate-y-1/2 rotate-90 select-none object-cover"
          draggable={false}
        />
      </div>
      <div className="relative z-[1] mx-auto flex h-full max-w-[22rem] flex-col justify-center px-6 py-7 text-center [text-shadow:0_1px_12px_rgb(0_0_0/0.45)] md:px-6 md:py-7">
        <p className="font-display m-0 text-[clamp(1.35rem,3.2vw,1.75rem)] font-semibold leading-tight tracking-[-0.03em] text-white">
          RPS brasileiro
        </p>
      </div>
    </div>
  )
}
