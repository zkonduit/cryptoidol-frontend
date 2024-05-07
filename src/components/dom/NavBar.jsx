import { useState, useRef } from 'react'
import { mdiMenu } from '@mdi/js'
import { ConnectButton } from '@rainbow-me/rainbowkit'


export default function NavBar() {
  const [expand, setExpand] = useState(false)

  return (
    <nav className='gradient-background flex flex-wrap items-center jutify-between w-full p-1 text-lg navbar'>
      <div className='container-fluid w-full flex flex-wrap items-center justify-between px-1'>
        <div>
          <a href='/'>
            <img
              style={{
                paddingTop: '1rem',
                paddingLeft: '0.5rem',
                paddingRight: '0.5rem',
                paddingBottom: '1rem',
                width: '6.5rem',
                color: '#FC5130',
              }}
              src='/img/logo_text.png'
              alt='logo'
            />
          </a>
        </div>
        <div className="hidden w-full ml-10 md:flex md:items-center md:w-auto text-right" id='menu'>
          <ul className="flex flex-wrap items-center m-1 text-lg font-medium text-gray-800 sm:mt-0">
            <li>
              <a href="/" className="mr-4 hover:underline text-md hover:text-yellow-500 md:mr-6">Sing to Mint</a>
            </li>
            <li>
              <a target="_blank" href="https://opensea.io/collection/cryptoidolnft" className="mr-4 hover:underline text-md hover:text-yellow-500 md:mr-6">Collection</a>
            </li>
            <li>
              <a href="https://github.com/zkonduit/ezkl" target="_blank" rel="noopener noreferrer" className="mr-4 hover:underline text-md hover:text-yellow-500 md:mr-6">Github</a>
            </li>
          </ul>
        </div>
        <ConnectButton chainStatus="icon" showBalance={false} />
      </div>
    </nav>
  )
}