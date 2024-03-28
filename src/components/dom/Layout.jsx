'use client'

import { useRef } from 'react'
import dynamic from 'next/dynamic'
import NavBar from './NavBar'
import Footer from './Footer'

import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultWallets,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import {
  mainnet,
  polygon,
  polygonMumbai,
} from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';

const { chains, publicClient } = configureChains(
  [polygon, polygonMumbai],
  [publicProvider()]
);


const projectId = '4702df26ee1e615caf9d676f6787b243';

const { connectors } = getDefaultWallets({
  appName: 'CryptoIdol',
  projectId,
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

const Scene = dynamic(() => import('@/components/canvas/Scene'), { ssr: false })

const Layout = ({ children }) => {
  const ref = useRef()

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        width: ' 100%',
        height: '100%',
        overflow: 'auto',
        touchAction: 'auto',
      }}
    >
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider chains={chains}>

          <NavBar />
          {children}
          <Footer />
          <Scene
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              pointerEvents: 'none',
            }}
            eventSource={ref}
            eventPrefix='client'
          />
        </RainbowKitProvider>
      </WagmiConfig>
    </div>
  )
}

export { Layout }
