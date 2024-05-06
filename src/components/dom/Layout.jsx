'use client'

import { useRef } from 'react'
import dynamic from 'next/dynamic'
import NavBar from './NavBar'
import Footer from './Footer'

import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { WagmiProvider, http } from 'wagmi';
import { base, sepolia } from 'wagmi/chains';


const projectId = '4343b461c70fd4bcef677ee051994b48';

const config = getDefaultConfig({
  appName: 'CryptoIdol',
  projectId: projectId,
  chains: [base, sepolia],
  transports: {
    [base.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true
})

const queryClient = new QueryClient();

const Scene = dynamic(() => import('@/components/canvas/Scene'), { ssr: false })

const Layout = ({ children }) => {
  const ref = useRef()

  return (
    <div ref={ref}>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <div
              className="flex flex-col h-screen overflow-auto"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <div className="flex-none">
                <NavBar />
              </div>
              <div className="grow">
                <div>
                  <Scene
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none',
                    }}
                    eventSource={ref}
                    eventPrefix='client'
                  />
                  {children}
                </div>
              </div>
              <Footer />
            </div>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </div>
  )
}

export { Layout }
