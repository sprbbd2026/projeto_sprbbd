import type { ReactNode } from 'react'
import { LoginHeroPanel } from './LoginHeroPanel'

type Props = {
  children: ReactNode
}

export function LoginMapShell({ children }: Props) {
  return (
    <div className="flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden bg-slate-100 md:flex-row">
      <div
        className="relative min-h-[32vh] min-w-0 w-full flex-[1_1_42%] md:h-full md:min-h-0 md:flex-[1_1_50%]"
        aria-hidden
      >
        <LoginHeroPanel />
      </div>
      <aside className="relative z-[1] flex min-h-0 min-w-0 flex-[1_1_58%] flex-col border-t border-slate-200/85 bg-white/88 backdrop-blur-sm md:flex-[1_1_50%] md:border-l md:border-t-0">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-contain px-[1.1rem] pb-3.5 pt-4 md:px-[1.35rem] md:pb-4 md:pt-5">
          {children}
        </div>
      </aside>
    </div>
  )
}
