'use client'

import { useState, useRef } from "react";
import { RecordButton } from '@/components/dom/RecordButton'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'


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
  const [state, setState] = useState("start")
  const [recording, setRecording] = useState(false);
  const [stream, setStream] = useState(null)
  const [audioChunks, setAudioChunks] = useState([])
  const [audio, setAudio] = useState(null);
  const playback = useRef(null);
  const { openConnectModal } = useConnectModal()
  const { address, isConnected } = useAccount()
  const mediaRecorder = useRef(null);


  const startRecord = () => {
    if(!isConnected) {
      openConnectModal()
    } else {
      if ("MediaRecorder" in window) {
        navigator.mediaDevices.getUserMedia({
            audio: true,
        }).then(streamData => {
          setStream(streamData)
          setState("inprogress")
          const media = new MediaRecorder(streamData, { type: "audio/wave" })
          setRecording(true)
          mediaRecorder.current = media
          mediaRecorder.current.start()
          let localAudioChunks = [];
          mediaRecorder.current.ondataavailable = (event) => {
            if (typeof event.data === "undefined") return
            if (event.data.size === 0) return
            localAudioChunks.push(event.data)
          };
          setAudioChunks(localAudioChunks)

        }).catch(err => {
          alert(err.message)
          setState("start")
          return
        });
      } else {
          alert("The MediaRecorder API is not supported in your browser.")
      }
    }
  }

  const stopRecord = () => {
    setRecording(false);
    //stops the recording instance
    stream.getTracks().forEach(track => track.stop())
    mediaRecorder.current.stop()
    mediaRecorder.current.onstop = () => {
      //creates a blob file from the audiochunks data
       const audioBlob = new Blob(audioChunks, { type: "audio/wav" })
      //creates a playable URL from the blob file.
       const audioUrl = URL.createObjectURL(audioBlob)
       setAudio(audioUrl)
       setAudioChunks([])
    };

  }

  const startPlayback = () => {
    playback.current = new Audio(audio)
    // playback.current.repeat = false;
    // playback.current.onEnded = () => {
    //   console.log("end");
    //   setState("end")
    //   playback.current.currentTime = 0
    // }
    playback.current.play()
    setState("inprogress")
  }

  const stopPlayback = () => {
    playback.current.pause()
  }


  return (
    <>
      <div className='flex justify-center items-center max-h-screen'>
        <div className='w-full text-center mx-auto flex flex-col flex-wrap items-center md:flex-row'>
          <View orbit className='flex h-[32rem] md:h-[36rem] w-full flex-col items-center justify-center'>
            <Suspense fallback={null}>
              <Avatar scale={3.5} position={[0, -4.1, 0]} rotation={[0.3, -Math.PI, 0]} />
              <Common />
            </Suspense>
          </View>
        </div>
      </div>

      <div className='flex justify-center items-center'>
        <div className='flex w-full flex-col items-start justify-center items-center p-4 text-center'>
          {
            state === "start" &&
            <h1 className='my-2 text-xl md:text-2xl lg:text-3xl leading-tight text-center'>Think you can be the next <strong> Crypto Idol</strong> ?</h1>
          }
          {
            state === "inprogress" && recording &&
            <>
            <h1 className='my-2 text-xl md:text-2xl lg:text-3xl leading-tight text-center'>Please Sing! Press Stop when you're done ❤️</h1>
            </>
          }
          {
            state === "end" &&
            <>
            <h1 className='my-2 text-xl md:text-2xl lg:text-3xl leading-tight text-center'>Submit to see how well you've done 🤔️</h1>
            </>
          }
          {
            state === "inprogress" && !recording &&
            <>
            <h1 className='my-2 text-xl md:text-2xl lg:text-3xl leading-tight text-center'>Here's what you've sung ❤️</h1>
            </>
          }
          <div className='my-4 flex justify-center items-center text-center'>
            <RecordButton
              recordState={state}
              onClick={(e) => {
                e.preventDefault()
                if (state === "start") {
                  startRecord()
                }
                else if (state === "inprogress") {
                  setState("end")
                  if (recording) {
                    stopRecord()
                  } else {
                    stopPlayback()
                  }
                }
                else if (state === "end") {
                  startPlayback()
                }
              }}
            />
          </div>
        </div>
      </div>
    </>
  )
}
