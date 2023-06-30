import React, { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import * as THREE from "three";
import { mixamoVRMRigMap } from './MixamoVRRigMap';
import { loadMixamoAnimation } from './LoadMixamoAnimation';


const loader = new GLTFLoader();
loader.register((parser) => {
  return new VRMLoaderPlugin(parser);
});


const PREFIX = '/3D/animations/'

export default function Avatar ({
  avatarState = 'start',
  ...props
}) {
  const [vrm, setVrm] = useState(null)
  const [gltf, setGltf] = useState(null)
  const [animationUrl, setAnimationUrl] = useState('')
  const [mixer, setMixer] = useState(null)
  const [lookAtTarget, setLookAtTarget] = useState(null);

  // animation states
  const [blink, setBlink] = useState(false)
  const [happy, setHappy] = useState(false)

  // useEffect(() => {
  // const setFromEvent = (e) => {
  //   console.log(e.clientX, e.clientY);
  //   lookAtTarget.position.x = 0.9 * (e.clientX - 0.5 * window.innerWidth) / window.innerHeight;
  //   lookAtTarget.position.y = - 10.0 * (e.clientY - 0.5 * window.innerHeight) / window.innerHeight;
  //   // setLookAtTarget(newLookAtTarget);
  // }

  // console.log(lookAtTarget);

  // window.addEventListener("mousemove", setFromEvent);
  // useEffect(() => {
  //   if (lookAtTarget) {
  //     const updateMousePosition = e => {
  //       // setMousePosition({ x: ev.clientX, y: ev.clientY });
  //       lookAtTarget.position.x = 0.9 * (e.clientX - 0.5 * window.innerWidth) / window.innerHeight;
  //       lookAtTarget.position.y = - 10.0 * (e.clientY - 0.5 * window.innerHeight) / window.innerHeight;
  //     };
  //     window.addEventListener('mousemove', updateMousePosition);
  //     return () => {
  //       window.removeEventListener('mousemove', updateMousePosition);
  //     };
  //   }
  // }, []);

  useEffect(() => {
    // load 3d model
    loader.load(

      '/3D/Ailis.vrm',

      ( gltf ) => {

        setGltf(gltf)
        const vrm = gltf.userData.vrm
        gltf.cameras

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

        console.log(vrm)
        // setLookAtTarget(new THREE.Object3D);
        // vrm.lookAt.target = lookAtTarget
        setVrm(vrm)
      },

      ( progress ) => console.log( 'Loading model...', 100.0 * ( progress.loaded / progress.total ), '%' ),

      ( error ) => console.error( error )
    )
  }, []);


  // animation handler
  useEffect(() => {
    if (vrm && mixer && animationUrl) {
      mixer.stopAllAction()
      loadMixamoAnimation(animationUrl, vrm)
      .then(clip => {
        mixer.clipAction(clip).play();
        mixer.timeScale = 1.0;
      }).catch(err => {
        console.log(err)
      })
    }
  }, [vrm, mixer, animationUrl])

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

  // handle periodic events
  useFrame(({ clock }, delta) => {
    if (vrm && mixer) {

      // blink every ~5 seconds
      if (Math.round(clock.elapsedTime % 5) == 0) {
        setBlink(true)
      }

      if (Math.round(clock.elapsedTime % 13) == 0) {
        setHappy(true)
      }

      // animation sequence start
      if (avatarState == 'start') {
        setAnimationUrl(PREFIX + 'Button Pushing.fbx')
      }

      if (avatarState == 'inprogress') {
        setAnimationUrl(PREFIX + 'Chicken Dance.fbx')
      }

      if (avatarState == 'end') {
        setAnimationUrl(PREFIX + 'Thinking.fbx')
      }

      if (avatarState == 'processing') {
        setAnimationUrl(PREFIX + 'Gangnam Style.fbx')
      }

      if (avatarState == 'result') {
        setAnimationUrl(PREFIX + 'Thankful.fbx')
      }


      // handle blink
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

      // handle happy
      if (happy && !blink) {
        // tweak expressions
        const s = Math.sin(Math.PI * clock.elapsedTime )
        vrm.expressionManager.setValue('relaxed', 0.5 + 0.5 * s );

        // don't blink when happy is done
        if (0.5 + 0.5 * s <= 0.01) {
          setHappy(false)
        }
      }

      // update deltas
      mixer.update(delta)
      vrm.update(delta)
    }
  })

  if (gltf)
    return <primitive object={gltf.scene} {...props} />
}