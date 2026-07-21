import { NotFound } from '../../src/pages/NotFound'
import { Card } from '../../src/shared/ui/Card'
import { Header } from '../../src/widgets/Header'
import { TopNav } from '../../src/widgets/TopNav'
import '../../src/shared/i18n'
import 'twin.macro'

export const Page = ({ is404 }: { is404?: boolean }) => (
  <div tw="flex min-h-screen w-full flex-col" style={{ overflowX: 'clip' }}>
    <Header />
    <TopNav />
    <main tw="mx-auto w-full max-w-[1180px] flex-1 px-4 py-7 sm:px-5 sm:py-8">
      {is404 ? (
        <NotFound />
      ) : (
        <Card>
          <div tw="flex min-h-[360px] flex-col items-center justify-center px-5 py-12 text-center">
            <h1 tw="text-2xl font-black text-[rgb(var(--color-text))]">Не удалось открыть страницу</h1>
            <p tw="mt-2 max-w-md text-sm text-[rgb(var(--color-text-muted))]">Попробуйте обновить страницу немного позже.</p>
          </div>
        </Card>
      )}
    </main>
  </div>
)
