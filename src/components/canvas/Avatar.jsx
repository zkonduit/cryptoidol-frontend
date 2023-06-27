import React, { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRMLoaderPlugin } from '@pixiv/three-vrm';

// import { Object3D } from 'three'
// import { useControls } from 'leva'

const loader = new GLTFLoader();
// loader.register((parser) => {
//   return new VRMLoaderPlugin(parser);
// });

export default function Avatar (props) {
//   const { leftShoulder, rightShoulder } = useControls({
//     leftShoulder: { value: 0, min: -1, max: 1 },
//     rightShoulder: { value: 0, min: -1, max: 1 }
//   })
  const gltf = useGLTF('/3D/Ailis.vrm', loader);

//   useFrame(({ clock }, delta) => {
//     if (avatar.current) {
//       avatar.current.update(delta)
//     }
//     if (bonesStore.neck) {
//       const t = clock.getElapsedTime()
//       bonesStore.neck.rotation.y = (Math.PI / 4) * Math.sin(t * Math.PI)
//     }
//     if (bonesStore.LeftShoulder) {
//       bonesStore.LeftShoulder.position.y = leftShoulder
//       bonesStore.LeftShoulder.rotation.z = leftShoulder * Math.PI
//     }
//     if (bonesStore.RightShoulder) {
//       bonesStore.RightShoulder.rotation.z = rightShoulder * Math.PI
//     }
//   })
  return <primitive object={gltf.scene} {...props} />
}