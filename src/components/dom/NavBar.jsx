import { useState, useRef } from 'react'
import { mdiMenu } from '@mdi/js'
import { ConnectButton } from '@rainbow-me/rainbowkit'


export default function NavBar() {
  const [expand, setExpand] = useState(false)

  return (
    <nav className='gradient-background flex flex-wrap items-center jutify-between w-full py-2 md:py-0 px-2 text-lg navbar'>
      <div className='container-fluid w-full flex flex-wrap items-center justify-between px-1'>
        <div>
          <a href='#'>
            <img
              style={{
                paddingTop: '1rem',
                paddingLeft: '0.2rem',
                paddingRight: '0.5rem',
                paddingBottom: '1rem',
                width: '7.5rem',
                color: '#FC5130',
              }}
              src='/img/logo_text.png'
              alt='logo'
            />
          </a>
        </div>
        <div
          className='object-right'
          onClick={() => {
            setExpand(!expand)
          }}
        >
          <ConnectButton chainStatus="icon" showBalance={false} />
          {/* <svg className='h-6 w-6 cursor-pointer md:hidden block background fill-gray-800'>
            <path d={mdiMenu} />
          </svg> */}
        </div>
        {/* <div
          className={
            expand
              ? 'w-full md:flex md:items-center md:w-auto text-right'
              : 'hidden w-full md:flex md:items-center md:w-auto text-right'
          }
          id='menu'
        >
          <ul
            className='
              text-base text-gray-700
              pt-4
              md:flex
              md:justify-between
              md:pt-0'
          >
            <li>
              <a
                className='md:p-4 py-2 block hover:text-yellow-400 font-extrabold'
                href='https://github.com/zkonduit/ezkl'
                target='_blank'
                rel='noopener noreferrer'
              >
                GITHUB
              </a>
            </li>
          </ul>
        </div> */}
      </div>
    </nav>
  )
}