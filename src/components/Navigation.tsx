import { Link } from 'react-router'
import nabuLogo from '/nabu-logo.svg'
import WalletConnection from './WalletConnection'

const Navigation = () => {

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 bg-[#00000033]">
      <div className="flex max-w-[80rem] justify-between items-center flex-1 self-stretch mx-auto p-4">
        <Link to="/">
          <img src={nabuLogo} alt="Nabu Logo" className="w-[10.75rem] h-[2.5rem]" />
        </Link>
        <WalletConnection />
      </div>
    </nav>
  )
}

export default Navigation