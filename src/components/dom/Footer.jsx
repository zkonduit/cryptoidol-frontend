import { useAccount } from 'wagmi'
import dynamic from 'next/dynamic'

function Footer() {
  const { chain, isConnected } = useAccount()

  return (
    <footer className="w-full pt-3 pb-2 pr-2 pl-2 bg-white border-t border-gray-200 shadow md:flex md:items-center md:justify-between">
      <ul className="flex flex-wrap items-center m-1 text-lg font-medium text-gray-800 sm:mt-0">
        <li>
          <a href="/" className="mr-4 hover:underline text-md hover:text-yellow-500 md:mr-6">Sing to Mint</a>
        </li>
        {
          isConnected && chain?.id === 11155111 &&
          <li>
            <a target="_blank" href="https://testnets.opensea.io/collection/cryptoidol-1" className="mr-4 hover:underline text-md hover:text-yellow-500 md:mr-6">Collection</a>
          </li>
        }
        {/* <li>
          <a href="/bounty" className="mr-4 hover:underline text-md hover:text-yellow-500 md:mr-6">Bounty</a>
        </li> */}
        <li>
          <a href="https://github.com/zkonduit/ezkl" target="_blank" rel="noopener noreferrer" className="mr-4 hover:underline text-md hover:text-yellow-500 md:mr-6">Github</a>
        </li>
      </ul>
    </footer>
  );
}

// disable ssr for the Footer
export default dynamic(() => Promise.resolve(Footer), {
  ssr: false
})