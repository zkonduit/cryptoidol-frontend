'use client'

import { useState, useRef } from "react";
import { RecordButton } from '@/components/dom/RecordButton'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import axios from 'axios'
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

// const Logo = dynamic(() => import('@/components/canvas/Examples').then((mod) => mod.Logo), { ssr: false })
// const Dog = dynamic(() => import('@/components/canvas/Examples').then((mod) => mod.Dog), { ssr: false })
// const Duck = dynamic(() => import('@/components/canvas/Examples').then((mod) => mod.Duck), { ssr: false })
const Avatar = dynamic(() => import('@/components/canvas/Avatar'), { ssr: false })

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
  const [recording, setRecording] = useState(false)
  const [stream, setStream] = useState(null)
  const [audioChunks, setAudioChunks] = useState([])
  const [audioBlob, setAudioBlob] = useState(null);
  const [audio, setAudio] = useState(null);
  const playback = useRef(null);
  const { openConnectModal } = useConnectModal()
  const { address, isConnected } = useAccount()
  const mediaRecorder = useRef(null)


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
          const media = new MediaRecorder(streamData, { mimeType: "audio/webm" })
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
      const tempAudioBlob = new Blob(audioChunks, { type: "audio/webm", mimeType: "audio/webm"})
      //creates a playable URL from the blob file.
      const audioUrl = URL.createObjectURL(tempAudioBlob)

      setAudio(audioUrl)
      setAudioBlob(tempAudioBlob)
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

  const submitRecording = async () => {
    if (audio) {
      // download audio file
      const link = document.createElement('a');
      link.href = audio
      link.download = 'audio.webm';  // the file name you want to save as
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // convert blob to wav
      try {
        // submit form
        let formData = new FormData()
        console.log(audioBlob)
        console.log(typeof audioBlob)
        formData.append('audio', audioBlob, 'audio.webm')

        res = await axios.post(process.env.NEXT_PUBLIC_BACKEND + `/prove`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        // reset
        playback.current = null
        setAudio(null)
        setState("start")
      }
      catch(err) {
        alert(err);
        return;
      }
    } else {
      alert("No Audio To Send!")
      return;
    }
  }

  const restart = () => {
    playback.current = null
    setAudio(null)
    setState("start")
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
            <h1 className='my-2 text-xl md:text-2xl lg:text-3xl leading-tight text-center'>Sing now! Press Stop when you're done️</h1>
            </>
          }
          {
            state === "end" &&
            <>
            <h1 className='my-2 text-xl md:text-2xl lg:text-3xl leading-tight text-center'>Will the AI like you? Get judged 🤔️</h1>
            </>
          }
          {
            state === "inprogress" && !recording &&
            <>
            <h1 className='my-2 text-xl md:text-2xl lg:text-3xl leading-tight text-center'>Here's what you've sung ❤️</h1>
            </>
          }
          <div className='my-2 ml-8 mr-8 flex justify-center items-center text-center'>
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
            { state === "end" &&
              <>
                <button type="button" className="text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-lg px-5 py-4 text-center ml-4 mr-2 mb-2 mt-2"
                  onClick={(e) => {
                    e.preventDefault()
                    submitRecording()
                  }}
                >
                  SUBMIT
                </button>
                <button type="button" className="text-white bg-gradient-to-r from-red-400 via-red-500 to-red-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-lg px-5 py-4 text-center mr-2 mb-2 mt-2"
                  onClick={(e) => {
                    e.preventDefault()
                    restart()
                  }}
                >
                  RESTART
                </button>
              </>
            }
          </div>
        </div>
      </div>
    </>
  )
}
