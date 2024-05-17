'use client'

import { useState, useRef, useEffect } from "react";
import { RecordButton } from '@/components/dom/RecordButton'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from 'wagmi'
import axios from 'axios'
import addresses from '../data/addresses.json'
import cryptoIdolABI from '../data/CryptoIdol.json'
import { keccak256, encodeAbiParameters, parseEther } from 'viem'
import Confetti from "react-confetti"
import { useWindowSize } from "react-use";
import Head from "./head";


// const Logo = dynamic(() => import('@/components/canvas/Examples').then((mod) => mod.Logo), { ssr: false })
// const Dog = dynamic(() => import('@/components/canvas/Examples').then((mod) => mod.Dog), { ssr: false })
// const Duck = dynamic(() => import('@/components/canvas/Examples').then((mod) => mod.Duck), { ssr: false })
const Avatar = dynamic(() => import('@/components/canvas/Avatar'), { ssr: false })

const View = dynamic(() => import('@/components/canvas/View').then((mod) => mod.View), {
  ssr: false,
  loading: () => (
    <div className='flex h-96 w-full flex-col items-center justify-center'>
      <svg className='-ml-1 mr-3 size-5 animate-spin text-black' fill='none' viewBox='0 0 24 24'>
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
  const [state, setState] = useState("minted")
  const [recording, setRecording] = useState(false)
  const [stream, setStream] = useState(null)
  const [audioChunks, setAudioChunks] = useState([])
  const [audioBlob, setAudioBlob] = useState(null)
  const [audio, setAudio] = useState(null)
  const [score, setScore] = useState(0)
  const [scoreHex, setScoreHex] = useState(null)
  const [proof, setProof] = useState(null)
  const [rating, setRating] = useState(null)
  const [resultMsg, setResultMsg] = useState(null)
  const [mimeType, setMimeType] = useState('audio/webm')
  const [polling, setPolling] = useState(false)
  const [commitTxId, setCommitTxId] = useState(null)
  const [committed, setCommitted] = useState(false)
  const [mintTxId, setMintTxId] = useState(null)
  const [tokenIdMinted, setTokenIdMinted] = useState("0x0000000000000000000000000000000000000000000000000000000000000000")
  const [commitConfig, setCommitConfig] = useState(null);
  const [mintConfig, setMintConfig] = useState(null);
  const { width, height } = useWindowSize()
  const [currentSentence, setCurrentSentence] = useState(0);


  const playback = useRef(null)
  const { openConnectModal } = useConnectModal()
  const { chain, isConnected } = useAccount()
  const mediaRecorder = useRef(null)

  const { writeContractAsync }  = useWriteContract()

  const commitTx = useWaitForTransactionReceipt({
    chainId: chain?.id,
    hash: commitTxId,
    enabled: Boolean(commitTxId) && !committed,
    refetchInterval: 2000,
    refetchIntervalInBackground: true
  })

  const mintTx = useWaitForTransactionReceipt({
    chainId: chain?.id,
    hash: mintTxId,
    enabled: Boolean(mintTxId) && committed,
    refetchInterval: 2000,
    refetchIntervalInBackground: true
  })

  const tokenMetadata = useReadContract({
    address: chain?.id === 11155111 ? addresses.sepolia : addresses.base,
    abi: cryptoIdolABI,
    functionName: 'tokenURI',
    args: [tokenIdMinted]
  })

  let imageData;
  if (tokenMetadata.data) {
    const data = tokenMetadata?.data
    const jsonData = data.split(",")[1]
    const decodedJson = atob(jsonData)
    const jsonObject = JSON.parse(decodedJson)
    imageData = jsonObject.image
  }

  useEffect(() => {
    setCommitConfig({
      address: chain?.id === 11155111 ? addresses.sepolia : addresses.base,
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
    });

    setMintConfig({
      address: chain?.id === 11155111 ? addresses.sepolia : addresses.base,
      abi: cryptoIdolABI,
      functionName: 'mint',
      value: parseEther("0.01"),
      args: [proof, [scoreHex]],
    });
  }, [chain, proof, scoreHex, score])


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

    if (recipeId) {
        setPolling(true);
        setState("processing")
        const intervalId = setInterval(async () => {
            try {
                console.log("Polling for results...")
                const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND}/recipe/${recipeId}/`);

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
        }, 15000); // Poll every 15 seconds, adjust as needed

        return () => clearInterval(intervalId)

    } else {
      if (proof && scoreHex) {
        setState("result")
        setScore(score)
        setScoreHex(scoreHex)
        setProof(proof)
        setResultDisplay(score)
      }
    }
  }, [
    polling,
    proof,
    score,
    scoreHex,
  ])

  useEffect(() => {
    const commitTxId = localStorage.getItem('commitTxId')
    const committed = localStorage.getItem('committed')

    if (!committed) {
      if (commitTxId) {
        setCommitTxId(commitTxId)

        if (commitTx.isSuccess) {
          localStorage.setItem('committed', "1")
          setCommitted(true)
          setState('mint')
        }
        if (commitTx.isLoading) {
          setState('committing')
        }
        if (commitTx.isError) {
          setState('commit')
        }

      }
    }
  }, [commitTx, commitTx.data || {}, commitTx.isSuccess, commitTx.isLoading, commitTx.isError, committed]);

  useEffect(() => {
    const mintTxId = localStorage.getItem('mintTxId');

    if (mintTxId) {
      setMintTxId(mintTxId);

      if (mintTx.isSuccess) {
        setState('minted');
        setTokenIdMinted(mintTx.data?.logs[0].topics[3])
      }
      if (mintTx.isLoading) {
        setState('minting');
      }
      if (mintTx.isError) {
        setState('mint');
      }
    }
  }, [mintTx, mintTx.data || {}, mintTx.isSuccess, mintTx.isLoading, mintTx.isError]);

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
      setRating("C");
      setResultMsg("You're off to a good start! To be honest with you, I'm actually rating tone of your voice. The more surprised you sound the better 😉");
    } else if (score === 1) {
      setRating("B");
      setResultMsg("Nice work! You're making progress. Keep up the effort and you'll reach new heights.");
    } else if (score === 2) {
      setRating("A");
      setResultMsg("Impressive! Your skills are shining through. Keep pushing yourself to unlock your full potential.");
    } else if (score === 3) {
      setRating("S");
      setResultMsg("Outstanding performance! Your dedication and hard work are evident. Keep aiming for excellence.");
    } else if (score === 4) {
      setRating("SS");
      setResultMsg("Incredible! You're mastering this challenge with flying colors. Your achievements are remarkable.");
    } else if (score >= 5) {
      setRating("SSS");
      setResultMsg("Perfection achieved! You've reached the pinnacle of success. Your skills are unparalleled.");
    } else {
      setRating("?");
      setResultMsg("Something went wrong! Could you please inform the devs?");
    }
  };

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
        let res = await axios.post(process.env.NEXT_PUBLIC_BACKEND + `/prove/`, formData, {
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
    localStorage.removeItem("committed")
    localStorage.removeItem("mintTxId")
  }

  const commitResult = async () => {
    if(!isConnected) {
      openConnectModal()
    }

    console.log("proof: ", proof)
    console.log("score: ", scoreHex)
    console.log("keccak: ", keccak256(encodeAbiParameters([{ type: 'bytes' }, { type: 'uint256[]' } ], [proof, [score]])))

    try {
      const commitWrite = await writeContractAsync(commitConfig)
      console.log("commitTxId: ", commitWrite)
      setCommitTxId(commitWrite)
      localStorage.setItem("commitTxId", commitWrite)
    }
    catch (err) {
      alert(err)
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

    try {
      const mintWrite = await writeContractAsync(mintConfig)
      console.log("mintTxId: ", mintWrite)
      setMintTxId(mintWrite)
      localStorage.setItem("mintTxId", mintWrite)
    }
    catch (err) {
      alert(err)
      console.log(err)
      return
    }
    setState("minting")
  }

  const sentences = [
    <span key={0}>Analyzing audio! Give us about a min 🕒</span>,
    <span key={1}>Computing a cryptographic proof that the voice-judging model has been run correctly on your voice.</span>,
    <span key={2}>
      When done, mint an NFT that immortalizes your skill by verifying the proof on-chain.
      <br />
      Learn more at
      &nbsp;
      <a href="https://ezkl.xyz/" target="_blank" className="text-yellow-500 hover:text-yellow-800 hover:underline">
        ezkl.xyz,
      </a>
      &nbsp;
      or join our
      &nbsp;
      <a href="https://discord.gg/cbNvpsThmd" target="_blank" className="text-yellow-500 hover:text-yellow-800 hover:underline">
        Discord
      </a>
      &nbsp;
      or
      &nbsp;
      <a href="https://t.me/+QRzaRvTPIthlYWMx" target="_blank" className="text-yellow-500 hover:text-yellow-800 hover:underline">
        Telegram,
      </a>
    </span>,
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSentence((prevSentence) => (prevSentence + 1) % sentences.length);
    }, 5000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <>
      <Head />
      <div className='flex max-h-screen items-center justify-center'>
        <div className='mx-auto flex w-full flex-col flex-wrap items-center text-center md:flex-row'>
          {
            state !== "minted" &&
            <View
              presentation
              className='flex h-[25rem] w-full flex-col items-center justify-center sm:h-128 md:h-[36rem]'
            >
              <Suspense fallback={null}>
                <Avatar position={[0, -1.3, 4.5]} rotation={[0, -Math.PI, 0]} avatarState={state} />
                <Common />
              </Suspense>
            </View>
          }
          {
            state === "minted" &&
            <>
            <Confetti
              width={width}
              height={height}
            />
            <div className='mx-auto flex w-full flex-col flex-wrap items-center text-center'>
              <div className="flex-col items-center justify-center rounded-lg mt-20 mb-20">
                <img className="rounded-lg w-80 h-80" src={imageData}/>
              </div>
            </div>
            </>
          }
        </div>
      </div>

      <div className='flex items-center justify-center'>
        <div className='flex w-full flex-col items-center justify-center p-2 text-center'>
          {
            state === "start" &&
            <h1 className='my-2 mx-4 text-center text-lg leading-tight md:text-2xl lg:text-3xl'>Think you can be the next <strong> Crypto Idol</strong> ?</h1>
          }
          {
            state === "inprogress" && recording &&
            <>
            <h1 className='my-2 mx-4 text-center text-lg leading-tight md:text-xl lg:text-2xl'>Sing now! Press Stop when you&#39;re done️</h1>
            </>
          }
          {
            state === "end" && !recording &&
            <>
            <h1 className='my-2 mx-4 text-center text-lg leading-tight md:text-xl lg:text-2xl'>Will the AI like you? Get judged 🤔️</h1>
            </>
          }
          {
            state === "inprogress" && !recording &&
            <>
            <h1 className='my-2 mx-4 text-center text-lg leading-tight md:text-xl lg:text-2xl'>Here&#39;s what you&#39;ve sung ❤️</h1>
            </>
          }
          {
            state === "processing" && !recording &&
            <>
            <h1 className="my-2 mx-4 text-center text-lg leading-tight md:text-xl lg:text-2xl">
              <span
                className={`transition-opacity ease-in-out duration-1000 ${
                  currentSentence === 0 ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {sentences[0]}
              </span>
              <br />
              <span
                className={`transition-opacity ease-in-out duration-1000 ${
                  currentSentence === 1 ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {sentences[1]}
              </span>
              <br />
              <span
                className={`transition-opacity ease-in-out duration-1000 ${
                  currentSentence === 2 ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {sentences[2]}
              </span>
            </h1>
            <button type="button" className="my-2 mr-2 rounded-lg bg-gradient-to-r from-red-400 via-red-500 to-red-600 px-5 py-4 text-center text-lg font-medium text-white hover:bg-gradient-to-br focus:outline-none focus:ring-4 focus:ring-red-300"
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
              <h1 className='my-1 text-center text-lg leading-tight md:text-xl lg:text-2xl'>️
                <strong>Score: {rating}.</strong> {resultMsg}
              </h1>
              { rating !== "?" &&
                <button type="button" className="my-2 ml-4 mr-2 rounded-lg bg-gradient-to-r from-green-400 via-green-500 to-green-600 px-5 py-4 text-center text-lg font-medium text-white hover:bg-gradient-to-br focus:outline-none focus:ring-4 focus:ring-green-300"
                  onClick={(e) => {
                    e.preventDefault()
                    commitResult()
                  }}
                >
                  COMMIT RESULTS
                </button>
              }
              <button type="button" className="my-2 mr-2 rounded-lg bg-gradient-to-r from-red-400 via-red-500 to-red-600 px-5 py-4 text-center text-lg font-medium text-white hover:bg-gradient-to-br focus:outline-none focus:ring-4 focus:ring-red-300"
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
              <h1 className='my-1 text-center text-lg leading-tight md:text-xl lg:text-2xl'>️
                Committing results onchain...
              </h1>
              <button type="button" className="my-2 mr-2 rounded-lg bg-gradient-to-r from-red-400 via-red-500 to-red-600 px-5 py-4 text-center text-lg font-medium text-white hover:bg-gradient-to-br focus:outline-none focus:ring-4 focus:ring-red-300"
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
              <h1 className='my-1 text-center text-lg leading-tight md:text-xl lg:text-2xl'>️
                Audio data has been committed onchain you may now mint and turn your voice into a CryptoIdol!
              </h1>
              <button type="button" className="my-2 ml-4 mr-2 rounded-lg bg-gradient-to-r from-green-400 via-green-500 to-green-600 px-5 py-4 text-center text-lg font-medium text-white hover:bg-gradient-to-br focus:outline-none focus:ring-4 focus:ring-green-300"
                onClick={(e) => {
                  e.preventDefault()
                  mint()
                }}
              >
                MINT (0.01 ETH)
              </button>
              <button type="button" className="my-2 mr-2 rounded-lg bg-gradient-to-r from-red-400 via-red-500 to-red-600 px-5 py-4 text-center text-lg font-medium text-white hover:bg-gradient-to-br focus:outline-none focus:ring-4 focus:ring-red-300"
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
              <h1 className='my-1 text-center text-lg leading-tight md:text-xl lg:text-2xl'>️
                Turning your voice into dynamic onchain art...
              </h1>
              <button type="button" className="my-2 mr-2 rounded-lg bg-gradient-to-r from-red-400 via-red-500 to-red-600 px-5 py-4 text-center text-lg font-medium text-white hover:bg-gradient-to-br focus:outline-none focus:ring-4 focus:ring-red-300"
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
              <h1 className='my-1 text-center text-lg leading-tight md:text-xl lg:text-2xl'>️
                Thanks for minting! The metadata of a CryptoIdol evolves with block time don&apos;t be surprised if it changes.
              </h1>
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
                    className="mx-1 mb-2 inline-block rounded px-6 py-4 text-xs font-medium uppercase leading-normal text-white shadow-md transition duration-150 ease-in-out hover:shadow-lg focus:shadow-lg focus:outline-none focus:ring-0 active:shadow-lg"
                    style={{backgroundColor: "#0077b5"}}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="size-4"
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
                    className="mx-1 mb-2 inline-block rounded px-6 py-4 text-xs font-medium uppercase leading-normal text-white shadow-md transition duration-150 ease-in-out hover:shadow-lg focus:shadow-lg focus:outline-none focus:ring-0 active:shadow-lg"
                    style={{backgroundColor: "#1da1f2"}}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="size-4"
                      fill="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </button>
              </a>
              </div>
              <button type="button" className="my-2 ml-4 mr-2 rounded-lg bg-gradient-to-r from-green-400 via-green-500 to-green-600 px-5 py-4 text-center text-lg font-medium text-white hover:bg-gradient-to-br focus:outline-none focus:ring-4 focus:ring-green-300"
                onClick={(e) => {
                  e.preventDefault()
                  restart()
                }}
              >
                RESTART
              </button>
            </>
          }

          <div className='mx-8 my-2 flex items-center justify-center text-center'>
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
                <button type="button" className="my-2 ml-4 mr-2 rounded-lg bg-gradient-to-r from-green-400 via-green-500 to-green-600 px-5 py-4 text-center text-lg font-medium text-white hover:bg-gradient-to-br focus:outline-none focus:ring-4 focus:ring-green-300"
                  onClick={(e) => {
                    e.preventDefault()
                    submitRecording()
                  }}
                >
                  SUBMIT
                </button>
                <button type="button" className="my-2 mr-2 rounded-lg bg-gradient-to-r from-red-400 via-red-500 to-red-600 px-5 py-4 text-center text-lg font-medium text-white hover:bg-gradient-to-br focus:outline-none focus:ring-4 focus:ring-red-300"
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
