'use client'

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import addresses from '../../data/addresses.json'
import cryptoIdolABI from '../../data/CryptoIdol.json'
import { useContractReads } from "wagmi"
import dynamic from 'next/dynamic'

function Card({ score, cycle }) {
  let rating;
  if (score >= 0 && score < 2) {
    rating = "D"
  }
  else if (score >= 2 && score < 4) {
    rating = "C"
  }
  else if (score >= 4 && score < 6) {
    rating = "B"
  }
  else if (score >= 6 && score < 7) {
    rating = "A"
  }
  else if (score >= 7 && score < 8) {
    rating = "S"
  }
  else {
    rating = "X"
  }

  return (
    <div className="m-1 max-w-sm rounded-lg border border-gray-400 bg-white p-5 shadow">
      <h5 className="mb-3 text-4xl font-bold tracking-tight text-gray-500">Rank {rating}</h5>
      <p className="mb-3 font-normal text-gray-700">Score: {score.toString()}</p>
      <p className="mb-1 mt-5 font-normal text-gray-700">Season {cycle.toString()}</p>
      {/* <a href="#" class="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
          Read more
          <svg class="w-3.5 h-3.5 ml-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
          </svg>
      </a> */}
    </div>
  )
}

function Page() {
  const searchParams = useSearchParams()
  const address = searchParams.get('address')
  const [updatedData, setUpdatedData] = useState([]);

  const cryptoIdolContract = {
    address: addresses.polygon,
    abi: cryptoIdolABI
  }

  // loop through 10 elements in the array
  const end = 10
  const start = 1
  const { data, isError, isLoading } = useContractReads({contracts: [...Array(end - start + 1).keys()].map(x => {
    return {
      ...cryptoIdolContract,
      functionName: "contestants",
      args: [address, x + start]
    }
  })})

  useEffect(() => {
    if (!isError && !isLoading && data) {
      let tempData = []
      for (let i = 0; i < data.length; i++) {
        if (data[i].result[1] == 0) {
          break;
        }
        tempData.push(data[i])
      }
      setUpdatedData(tempData)
    }
  }, [data, isError, isLoading])

  return (
    <>
      <div className='mx-auto flex w-full flex-col flex-wrap items-center md:flex-row  lg:w-4/5'>
        <div className='flex w-full flex-col items-start justify-center p-6 text-center'>
          <h1 className='mb-6 text-2xl leading-normal md:text-5xl'>Historical Singing Scores</h1>
          <div className='flex w-full flex-row flex-wrap'>
            {
              !data && isLoading &&
              <h3 className='mb-5 text-lg leading-normal md:text-xl'>Loading...</h3>
            }
            {
              !data && isError &&
              <h3 className='mb-5 text-lg leading-normal md:text-xl'>Oupsie Wupsie something messed up!</h3>
            }
            {
              updatedData && data && !isLoading && !isError &&
              updatedData.map((datum, idx) => {
                return (
                  <Card key={idx} score={datum.result[0]} cycle={datum.result[1]} />
                )
              })
            }
          </div>
        </div>

      </div>
    </>
  )
}

// disable ssr for the score page
export default dynamic(() => Promise.resolve(Page), {
  ssr: false
})