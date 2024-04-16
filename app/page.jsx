'use client'

import { useState, useRef, useEffect } from "react";
import { RecordButton } from '@/components/dom/RecordButton'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import {
  useAccount,
  useNetwork,
  usePrepareContractWrite,
  useContractWrite,
  useWaitForTransaction
} from 'wagmi'
import axios from 'axios'
import addresses from '../data/addresses.json'
import cryptoIdolABI from '../data/CryptoIdol.json'
import { keccak256, encodeAbiParameters, parseEther } from 'viem'


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
  //                                            replay
  //                                              ( )
  // start --click record--> inprogress --stop--> end --submit--> processing --receive callback (append proof, score, scoreHex, isCommitted = false) --> result --> committing --> mint --> minting --> minted (end)
  // |  ^-------------------restart----------------|                   ^
  // |___________________if recipe_id in localstorage__________________|
  //
  //
  const [state, setState] = useState("start")
  const [recording, setRecording] = useState(false)
  const [stream, setStream] = useState(null)
  const [audioChunks, setAudioChunks] = useState([])
  const [audioBlob, setAudioBlob] = useState(null)
  const [audio, setAudio] = useState(null)
  const [score, setScore] = useState(0)
  const [scoreHex, setScoreHex] = useState(null)
  const [proof, setProof] = useState(null)
  const [committed, setCommitted] = useState(false)
  const [rating, setRating] = useState(null)
  const [resultMsg, setResultMsg] = useState(null)
  const [mimeType, setMimeType] = useState('audio/webm')
  const [polling, setPolling] = useState(false)
  const [commitTxId, setCommitTxId] = useState(null)
  const [mintTxId, setMintTxId] = useState(null)


  const playback = useRef(null)
  const { openConnectModal } = useConnectModal()
  const { address, isConnected } = useAccount()
  const { chain } = useNetwork()
  const mediaRecorder = useRef(null)

  let commitConfig;
  let mintConfig;

  const commitTx = useWaitForTransaction({
    chainId: chain?.id,
    hash: commitTxId,
  })
  // console.log("commitTx: ", commitTx)

  const commitData = usePrepareContractWrite({
    address: chain?.id === 11155111 ? addresses.sepolia : null,
    abi: cryptoIdolABI,
    functionName: 'commitResult',
    args: [
      keccak256(
        encodeAbiParameters(
          [{ type: 'bytes' }, { type: 'uint256[]' }],
          [
            proof || "0x0000000000000000000000000000000000000000000000000000000000000000",
            score ? [scoreHex] : ["0x0000000000000000000000000000000000000000000000000000000000000000"]
          ]
        )
      )
    ],
    enabled: Boolean(proof) && Boolean(scoreHex) && !commitTx.data?.blockHash
  })

  commitConfig = commitData.config

  const commitPhase = useContractWrite(commitConfig)

  const mintData = usePrepareContractWrite({
    address: chain?.id === 11155111 ? addresses.sepolia : null,
    abi: cryptoIdolABI,
    functionName: 'mint',
    value: parseEther("0.01"),
    args: [proof, [scoreHex]],
    enabled: Boolean(proof) && Boolean(scoreHex) && Boolean(commitTxId) && Boolean(commitTx.data?.blockHash)
  })

  mintConfig = mintData.config


  const mintPhase = useContractWrite(mintConfig)
  const mintTx = useWaitForTransaction({
    chainId: chain?.id,
    hash: mintTxId
  })
  console.log("mintTx: ", mintTx)

  useEffect(() => {
    if (MediaRecorder.isTypeSupported('audio/webm')) {
      setMimeType('audio/webm')
    }
    if (MediaRecorder.isTypeSupported('audio/mp4')) {
      setMimeType('audio/mp4')
    }
  }, [mimeType])

  useEffect(() => {
    const recipeId = localStorage.getItem('recipe_id')
    const proof = localStorage.getItem("proof")
    const score = parseInt(localStorage.getItem("score"))
    const scoreHex = localStorage.getItem("scoreHex")
    const commitTxId = localStorage.getItem("commitTxId")
    const mintTxId = localStorage.getItem("mintTxId")

    if (recipeId) {
        setPolling(true);
        setState("processing")
        const intervalId = setInterval(async () => {
            try {
                console.log("Polling for results...")
                const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND}/recipe/${recipeId}`);

                if (res.data) {
                    // Assuming the endpoint returns a value that indicates it's time to stop polling
                    clearInterval(intervalId);
                    localStorage.removeItem('recipe_id')
                    setPolling(false);
                    setState("result")

                    // reset
                    playback.current = null
                    setAudio(null)

                    // Handle the response data
                    console.log('Received data: ', res.data)
                    setScoreHex(res.data.score_hex)
                    setScore(parseFloat(res.data.score))
                    setProof(res.data.proof)
                    setResultDisplay(parseFloat(res.data.score))

                    localStorage.setItem("proof", res.data.proof)
                    localStorage.setItem("score", res.data.score)
                    localStorage.setItem("scoreHex", res.data.score_hex)
                }
            } catch (error) {
              if (error.response?.status !== 400) {
                setPolling(false)
                setState("start")
                console.error('Error polling endpoint: ', error)
              } else {
                console.error('Error polling endpoint: ', error)
              }
            }
        }, 10000); // Poll every 10 seconds, adjust as needed

        return () => clearInterval(intervalId)

    } else {
      if (proof && scoreHex) {
        setState("result")
        setScore(score)
        setScoreHex(scoreHex)
        setProof(proof)
        setResultDisplay(score)
      }
      if (commitTxId) {
        setCommitTxId(commitTxId)

        if (commitTx.isSuccess) {
          setState("mint")
        }

        if (commitTx.isLoading) {
          setState("committing")
        }

        if (commitTx.isError) {
          setState("commit")
        }
      }
      if (mintTxId) {
        setMintTxId(mintTxId)

        if (mintTx.isSuccess) {
          setState("minted")
        }

        if (mintTx.isLoading) {
          setState("mint")
        }

        if (mintTx.isError) {
          setState("mint")
        }
      }
    }

  }, [polling, proof, score, scoreHex, commitTxId, commitTx.data, mintTxId, mintTx.data]);

  // handle commit Phase
  useEffect(() => {
    if (commitPhase.isError) {
      setState("result")
    }

    if (commitPhase.data) {
      setCommitTxId(commitPhase.data.hash)
      localStorage.setItem("commitTxId", commitPhase.data.hash)
    }

    if (commitPhase.isSuccess) {
      setState("mint")
    }

  }, [commitPhase.isSuccess, commitPhase.data, commitPhase.isError])

  useEffect(() => {
    if (mintPhase.isError) {
      setState("mint")
    }

    if (mintPhase.data) {
      setMintTxId(mintPhase.data.hash)
      localStorage.setItem("mintTxId", mintPhase.data.hash)
    }

    if (mintPhase.isSuccess) {
      setState("minted")
    }
  }, [mintPhase.isSuccess, mintPhase.data, mintPhase.isError])

  const startRecord = async () => {
    if ("MediaRecorder" in window) {
      navigator.mediaDevices.getUserMedia({
          audio: true,
      }).then(streamData => {
        setStream(streamData)
        setState("inprogress")

        const media = new MediaRecorder(streamData, { mimeType: mimeType })
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

  const stopRecord = () => {
    setRecording(false);
    //stops the recording instance
    stream.getTracks().forEach(track => track.stop())
    mediaRecorder.current.stop()
    mediaRecorder.current.onstop = () => {
      //creates a blob file from the audiochunks data
      const tempAudioBlob = new Blob(audioChunks, { type: mimeType, mimeType: mimeType})
      //creates a playable URL from the blob file.
      const audioUrl = URL.createObjectURL(tempAudioBlob)

      setAudio(audioUrl)
      setAudioBlob(tempAudioBlob)
      setAudioChunks([])
    };

  }

  const setResultDisplay = (score) => {
    if (score === 0) {
      setRating("E")
      setResultMsg("Yoko OnO :(")
    }
    else if (score === 1) {
      setRating("D")
      setResultMsg("Best voice in the world, just not the world I'm living in right now.")
    }
    else if (score === 2) {
      setRating("C")
      setResultMsg("What an average sounding voice :O")
    }
    else if (score === 3) {
      setRating("B")
      setResultMsg("You are a cut above the rest!")
    }
    else if (score === 4) {
      setRating("A")
      setResultMsg("You are so amazing!")
    }
    else if (score >= 5) {
      setRating("S")
      setResultMsg("Oh my, what a sexy voice! I'm simping for u")
    } else {
      setRating("?")
      setResultMsg("Something went wrong! Could you please inform the devs?")
    }
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
      if(!isConnected) {
        await openConnectModal()
        return
      }
      // download audio file
      // const link = document.createElement('a');
      // link.href = audio

      // link.download = 'audio.webm';  // the file name you want to save as
      // document.body.appendChild(link);
      // link.click();
      // document.body.removeChild(link);

      // convert blob to wav
      try {
        // submit form
        let formData = new FormData()
        if (mimeType === "audio/webm") {
          formData.append('audio', audioBlob, 'audio.webm')
        }

        if (mimeType === "audio/mp4") {
          formData.append('audio', audioBlob, 'audio.mp3')
        }

        setState("processing")
        let res = await axios.post(process.env.NEXT_PUBLIC_BACKEND + `/prove`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        console.log(res);

        localStorage.setItem("recipe_id", res.data.id);

        setState("processing")
        setPolling(true)

      }
      catch(err) {
        alert(err);
        setState("end")
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
    localStorage.removeItem("recipe_id")
    localStorage.removeItem("score")
    localStorage.removeItem("scoreHex")
    localStorage.removeItem("proof")
    localStorage.removeItem("commitTxId")
    localStorage.removeItem("mintTxId")
  }

  const commitResult = async () => {
    if(!isConnected) {
      openConnectModal()
    }

    console.log("proof: ", proof)
    console.log("score: ", scoreHex)
    console.log("keccak: ", keccak256(encodeAbiParameters([{ type: 'bytes' }, { type: 'uint256[]' } ], [proof, [score]])))
    console.log("commit data: ", commitPhase)

    try {
      const commitWrite = await commitPhase.writeAsync?.()
      console.log(commitWrite)
    }
    catch (err) {
      console.log(err)
      return
    }
    setState("committing")
  }

  const mint = async () => {
    if(!isConnected) {
      openConnectModal()
    }

    console.log("proof: ", proof)
    console.log("score: ", scoreHex)
    console.log("mint data: ", mintPhase)

    try {
      const mintWrite = await mintPhase.writeAsync?.()
      console.log(mintWrite)
    }
    catch (err) {
      console.log(err)
      return
    }
    setState("minting")
  }

  return (
    <>
      <div className='flex justify-center items-center max-h-screen'>
        <div className='w-full text-center mx-auto flex flex-col flex-wrap items-center md:flex-row'>
          <View
            presentation
            className='flex h-[25rem] sm:h-[32rem] md:h-[36rem] w-full flex-col items-center justify-center'
          >
            <Suspense fallback={null}>
              <Avatar position={[0, -1.3, 4.5]} rotation={[0, -Math.PI, 0]} avatarState={state} />
              <Common />
            </Suspense>
          </View>
        </div>
      </div>

      <div className='flex justify-center items-center'>
        <div className='flex w-full flex-col justify-center items-center p-2 text-center'>
          {
            state === "start" &&
            <h1 className='my-2 text-lg md:text-2xl lg:text-3xl leading-tight text-center'>Think you can be the next <strong> Crypto Idol</strong> ?</h1>
          }
          {
            state === "inprogress" && recording &&
            <>
            <h1 className='my-2 text-lg md:text-xl lg:text-2xl leading-tight text-center'>Sing now! Press Stop when you&#39;re done️</h1>
            </>
          }
          {
            state === "end" && !recording &&
            <>
            <h1 className='my-2 text-lg md:text-xl lg:text-2xl leading-tight text-center'>Will the AI like you? Get judged 🤔️</h1>
            </>
          }
          {
            state === "inprogress" && !recording &&
            <>
            <h1 className='my-2 text-lg md:text-xl lg:text-2xl leading-tight text-center'>Here&#39;s what you&#39;ve sung ❤️</h1>
            </>
          }
          {
            state === "processing" && !recording &&
            <>
            <h1 className='my-2 text-lg md:text-xl lg:text-2xl leading-tight text-center'>️Computing results and zkml proof 🤖... Please give me a min or more</h1>
            <button type="button" className="text-white bg-gradient-to-r from-red-400 via-red-500 to-red-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-lg px-5 py-4 text-center mr-2 mb-2 mt-2"
              onClick={(e) => {
                e.preventDefault()
                localStorage.removeItem("recipe_id")
                setPolling(false)
                setState("start")
              }}
            >
              CANCEL
            </button>
            </>
          }

          {
            state === "result" && !recording &&
            <>
              <h1 className='my-1 text-lg md:text-xl lg:text-2xl leading-tight text-center'>️
                <strong>Score: {rating}.</strong> {resultMsg}
              </h1>
              { !commitPhase.isSuccess && rating !== "?" &&
                <button type="button" className="text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-lg px-5 py-4 text-center ml-4 mr-2 mb-2 mt-2"
                  disabled={commitPhase.isLoading}
                  onClick={(e) => {
                    e.preventDefault()
                    commitResult()
                  }}
                >
                  COMMIT RESULTS
                </button>
              }
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
          {
            state === "committing" &&
            <>
              <h1 className='my-1 text-lg md:text-xl lg:text-2xl leading-tight text-center'>️
                Committing results onchain...
              </h1>
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
          { state === "mint" &&
            <>
              <h1 className='my-1 text-lg md:text-xl lg:text-2xl leading-tight text-center'>️
                Audio data has been committed onchain you may now mint!
              </h1>
              <button type="button" className="text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-lg px-5 py-4 text-center ml-4 mr-2 mb-2 mt-2"
                onClick={(e) => {
                  e.preventDefault()
                  mint()
                }}
              >
                MINT (0.01 ETH)
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
          {
            state === "minting" &&
            <>
              <h1 className='my-1 text-lg md:text-xl lg:text-2xl leading-tight text-center'>️
                Minting a CryptoIdol...
              </h1>
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
          { state === "minted" &&
            <>
              <h3 className="mb-1">
                Share On Socials
              </h3>
              <div>
                <a
                  href="https://www.linkedin.com/sharing/share-offsite/?url=https://cryptoidol.tech"
                  aria-label="Share on LinkedIn"
                  target="_blank" rel="noopener noreferrer"
                >
                  <button
                    type="button"
                    data-te-ripple-init
                    data-te-ripple-color="light"
                    className="mb-2 inline-block rounded ml-1 mr-1 px-6 py-4 text-xs font-medium uppercase leading-normal text-white shadow-md transition duration-150 ease-in-out hover:shadow-lg focus:shadow-lg focus:outline-none focus:ring-0 active:shadow-lg"
                    style={{backgroundColor: "#0077b5"}}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
                    </svg>
                  </button>
                </a>
                <a
                  href="https://twitter.com/intent/tweet?text=I%20have%20just%20minted%20a%20CryptoIdol.%20Have%20you?%20https://cryptoidol.tech"
                  aria-label="Share On Twitter"
                  target="_blank" rel="noopener noreferrer"
                >
                  <button
                    type="button"
                    data-te-ripple-init
                    data-te-ripple-color="light"
                    className="mb-2 inline-block rounded ml-1 mr-1 px-6 py-4 text-xs font-medium uppercase leading-normal text-white shadow-md transition duration-150 ease-in-out hover:shadow-lg focus:shadow-lg focus:outline-none focus:ring-0 active:shadow-lg"
                    style={{backgroundColor: "#1da1f2"}}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </button>
              </a>
              </div>
              <button type="button" className="text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-lg px-5 py-4 text-center ml-4 mr-2 mb-2 mt-2"
                onClick={(e) => {
                  e.preventDefault()
                  restart()
                }}
              >
                RESTART
              </button>
            </>
          }

          <div className='my-2 ml-8 mr-8 flex justify-center items-center text-center'>
            { state !== "processing" && state !== "result" &&
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
            }
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
