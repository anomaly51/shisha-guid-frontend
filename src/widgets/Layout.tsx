import { Outlet } from 'react-router-dom'
import styled from 'styled-components'
import 'twin.macro'
import { Header } from './Header'
import { TopNav } from './TopNav'

const Main = styled.main`
  animation: fadeIn 0.3s ease-out;
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
`

export const Layout = () => (
  <div tw="min-h-screen w-full flex flex-col" style={{ overflowX: 'clip' }}>
    <Header />
    <TopNav />
    <div tw="flex-1 w-full min-w-0">
      <div tw="w-full max-w-[1040px] mx-auto px-4 py-7 min-w-0 sm:px-5 sm:py-8">
        <Main>
          <Outlet />
        </Main>
      </div>
    </div>
  </div>
)
