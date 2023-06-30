import React, { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import * as THREE from "three";
import { mixamoVRMRigMap } from './MixamoVRRigMap';
import { loadMixamoAnimation } from './LoadMixamoAnimation';

// import { Object3D } from 'three'
// import { useControls } from 'leva'

const loader = new GLTFLoader();
loader.register((parser) => {
  return new VRMLoaderPlugin(parser);
});


export default function Avatar ({ url = "/3D/animations/Chicken Dance.fbx", ...props}) {
  // const { leftShoulder, rightShoulder } = useControls({
  //   leftShoulder: { value: 0, min: -1, max: 1 },
  //   rightShoulder: { value: 0, min: -1, max: 1 }
  // })
  // const gltf = useGLTF('/3D/Ailis.vrm', loader)
  const [vrm, setVrm] = useState(null)
  const [gltf, setGltf] = useState(null)
  const [blink, setBlink] = useState(false)
  const [animationUrl, setAnimationUrl] = useState("")
  const [mixer, setMixer] = useState(null)
  // const {} = useThree()
  // const [bonesStore, setBones] = useState({})

  useEffect(() => {
    setAnimationUrl(url)
    if (vrm) {
      loadMixamoAnimation(url, vrm).then(clip => {
        mixer.clipAction(clip).play();
        // mixer.timeScale = params.timeScale;
      })
    }
  }, [url, vrm])


  useEffect(() => {
    // load 3d model
    loader.load(

      '/3D/Ailis.vrm',

      ( gltf ) => {

        setGltf(gltf)
        const vrm = gltf.userData.vrm

        // create animation mixer
        let mixer = new THREE.AnimationMixer(gltf.scene)
        setMixer(mixer)

        // calling these functions greatly improves the performance
        VRMUtils.removeUnnecessaryVertices(gltf.scene)
        VRMUtils.removeUnnecessaryJoints(gltf.scene)

        // Disable frustum culling
        vrm.scene.traverse((obj) => {
          obj.frustumCulled = false
        })

        // scene.add( vrm.scene );
        // currentVrm = vrm;
        setVrm(vrm)
      },

      ( progress ) => console.log( 'Loading model...', 100.0 * ( progress.loaded / progress.total ), '%' ),

      ( error ) => console.error( error )
    )
  }, []);

  // track mouse move
  // useEffect(() => {
  //   const handleMouseMove = (event) => {
  //     setMousePos({ x: event.clientX, y: event.clientY });
  //   };

  //   window.addEventListener('mousemove', handleMouseMove);

  //   return () => {
  //     window.removeEventListener(
  //       'mousemove',
  //       handleMouseMove
  //     );
  //   };
  // }, []);

  // handle periodic blinking
  useFrame(({ clock }, delta) => {
    // blink is 6
    if ( vrm ) {
      // blink every ~5 seconds
      if (Math.round(clock.elapsedTime % 4) == 0) {
        setBlink(true)
      }

      if (blink) {
        // tweak expressions
        const s = Math.sin(2 * Math.PI * clock.elapsedTime )
        vrm.expressionManager.setValue('blink', 0.5 + 0.5 * s );
        vrm.update(delta);

        // don't blink when eyes are open
        if (0.5 + 0.5 * s <= 0.01) {
          setBlink(false)
        }
      }

      vrm.update(delta);
    }
  })

  // handle animations
  useFrame(({ clock }, delta) => {
    // blink is 6
    if (vrm) {
      if (mixer) {
        mixer.update(delta);
      }
    }
  })

  if (gltf)
    return <primitive object={gltf.scene} {...props} />
}