import { useAccount } from 'wagmi'
import dynamic from 'next/dynamic'

function Footer() {
  const { address, isConnected } = useAccount()

  return (
    <footer className="fixed bottom-0 left-0 z-20 w-full pl-3 pr-3 pt-1.5 pb-1.5 bg-white border-t border-gray-200 shadow md:flex md:items-center md:justify-between md:p-3">
      <ul className="flex flex-wrap items-center mt-1 text-lg font-medium text-gray-800 sm:mt-0">
        <li>
          <a href="/" className="mr-4 hover:underline text-md hover:text-yellow-500 md:mr-6">Compete</a>
        </li>
        {
          isConnected &&
          <li>
            <a href={`/scores?address=${address}`} className="mr-4 hover:underline text-md hover:text-yellow-500 md:mr-6">Scores</a>
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