'use client'

import { forwardRef, Suspense, useImperativeHandle, useRef } from 'react'
import { OrbitControls, PresentationControls, PerspectiveCamera, View as ViewImpl } from '@react-three/drei'
import { Three } from '@/helpers/components/Three'

export const Common = ({ color }) => (
  <Suspense fallback={null}>
    {color && <color attach='background' args={[color]} />}
    <ambientLight intensity={0.2} />
    <pointLight position={[5, 5, 5]} intensity={0.4} />
    <pointLight position={[1, 2, 2]} intensity={0.2} />
    <pointLight position={[-5, -5, -5]} intensity={0.2} />
    <PerspectiveCamera makeDefault fov={40} position={[0, 0, 6]} />
  </Suspense>
)

const View = forwardRef(({ children, orbit, presentation, ...props }, ref) => {
  const localRef = useRef(null)
  useImperativeHandle(ref, () => localRef.current)

  return (
    <>
      <div ref={localRef} {...props} />
      <Three>
        <ViewImpl track={localRef}>
          {children}
          {orbit && <OrbitControls />}
          {presentation &&
            <PresentationControls enabled global snap
              // rotation={[0, -Math.PI / 2, 0]}
              // polar={[0, Math.PI / 2]}
              // azimuth={[-Math.PI / 2, Math.PI / 2]}
            />
          }
        </ViewImpl>
      </Three>
    </>
  )
})
View.displayName = 'View'

export { View }
