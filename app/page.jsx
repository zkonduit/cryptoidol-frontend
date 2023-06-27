'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const Logo = dynamic(() => import('@/components/canvas/Examples').then((mod) => mod.Logo), { ssr: false })
const Dog = dynamic(() => import('@/components/canvas/Examples').then((mod) => mod.Dog), { ssr: false })
const Duck = dynamic(() => import('@/components/canvas/Examples').then((mod) => mod.Duck), { ssr: false })
const Avatar = dynamic(() => import('@/components/canvas/Avatar'), { ssr: false})

const View = dynamic(() => import('@/components/canvas/View').then((mod) => mod.View), {
  ssr: false,
  loading: () => (
    <div className='flex h-96 w-full flex-col items-center justify-center'>
      <svg className='-ml-1 mr-3 h-5 w-5 animate-spin text-black' fill='none' viewBox='0 0 24 24'>
        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
        <path
          className='opacity-75'
          fill='currentColor'
          d='M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
        />
      </svg>
    </div>
  ),
})
const Common = dynamic(() => import('@/components/canvas/View').then((mod) => mod.Common), { ssr: false })

export default function Page() {
  return (
    <>
      <div className='flex justify-center items-center max-h-screen'>
        <div className='w-full text-center md:w-3/5 lg:w-4/5 mx-auto flex flex-col flex-wrap items-center md:flex-row'>
          <View orbit className='flex h-96 w-full flex-col items-center justify-center'>
            <Suspense fallback={null}>
              <Avatar scale={3.5} position={[0, -4.1, 0]} rotation={[0.3, -Math.PI, 0]} />
              {/* <Logo route='/blob' scale={0.6} position={[0, 0, 0]} /> */}
              <Common color="yellow"/>
            </Suspense>
          </View>
        </div>
      </div>

      <div className='flex justify-center items-center max-h-screen'>
        <div className='flex w-full flex-col items-start justify-center p-12 text-center md:w-2/5 md:text-left'>
          <h1 className='my-4 text-3xl leading-tight text-center'>So you think you can be the next <strong> Crypto Idol</strong>?</h1>
          {/* <p className='mb-8 text-2xl leading-tight text-center'>Let Ailis Judge Your Voice!</p> */}
        </div>
      </div>

    </>
  )
}
