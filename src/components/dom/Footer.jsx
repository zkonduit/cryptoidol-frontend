import dynamic from 'next/dynamic'

function Footer() {

  return (
    <footer className="fixed flex items-center justify-center bottom-0 left-0 right-0 w-full p-2 bg-gray-100 rounded-full shadow bg-opacity-50 border-t border-gray-200">
      <ul className="flex items-center justify-center m-1 text-lg font-medium text-gray-800 sm:mt-0">
        <li>
          <a href="/" className="m-2 hover:underline text-md hover:text-yellow-500 md:mr-6">Sing to Mint</a>
        </li>
        <li>
          <a target="_blank" href="https://opensea.io/collection/cryptoidolnft" className="m-4 hover:underline text-md hover:text-yellow-500 md:mr-6">Collection</a>
        </li>
        <li>
          <a href="https://github.com/zkonduit/ezkl" target="_blank" rel="noopener noreferrer" className="m-4 hover:underline text-md hover:text-yellow-500 md:mr-6">Github</a>
        </li>
      </ul>
    </footer>
  );
}

// disable ssr for the Footer
export default dynamic(() => Promise.resolve(Footer), {
  ssr: false
})