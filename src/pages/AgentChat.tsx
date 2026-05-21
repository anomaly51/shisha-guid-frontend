import 'twin.macro'
import { SetupAgentWidget } from '../widgets/SetupAgentWidget'

export const AgentChat = () => (
  <div tw="mx-auto flex w-full max-w-5xl flex-col gap-4">
    <div tw="flex flex-col gap-1">
      <p tw="text-[10px] font-black uppercase tracking-wide text-[rgb(var(--color-text-subtle))]">AI чат</p>
      <h1 tw="text-xl font-black text-[rgb(var(--color-text))]">Собрать забивку через AI</h1>
      <p tw="max-w-2xl text-[13px] font-semibold leading-5 text-[rgb(var(--color-text-muted))]">
        Напиши, какой вкус и сценарий хочешь получить. Ассистент соберет черновик, покажет недостающие поля и предложит варианты из каталога.
      </p>
    </div>
    <SetupAgentWidget />
  </div>
)
