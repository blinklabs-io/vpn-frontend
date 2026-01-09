import { Link, useLocation } from "react-router";
import { useEffect, useState } from "react";
import nabuLogo from "/nabu-logo.svg";
import WalletConnection from "./WalletConnection";
import { useWalletStore } from "../stores/walletStore";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { reconnectWallet } = useWalletStore();

  useEffect(() => {
    reconnectWallet();
  }, [reconnectWallet]);

  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 768;
      if (isDesktop && isMenuOpen) setIsMenuOpen(false);
    };

    window.addEventListener("resize", handleResize);

    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    return () => setIsMenuOpen(false);
  }, [location.pathname]);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 bg-[#00000033]">
      <div className="relative flex max-w-[80rem] justify-between items-center flex-1 self-stretch mx-auto p-4">
        <Link to="/" onClick={closeMenu} aria-label="Go to home">
          <img
            src={nabuLogo}
            alt="Nabu Logo"
            className="w-[10.75rem] h-[2.5rem]"
          />
        </Link>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/account"
              className="font-ibm-plex text-white font-bold text-sm hover:text-gray-200 transition-colors"
            >
              VPN Access
            </Link>
            <Link
              to="/how-it-works"
              className="font-ibm-plex text-white font-normal text-sm hover:text-gray-200 transition-colors"
            >
              How It Works
            </Link>
            <Link
              to="/install"
              className="font-ibm-plex text-white font-normal text-sm hover:text-gray-200 transition-colors"
            >
              How to Install
            </Link>
            <Link
              to="/docs-faqs"
              className="font-ibm-plex text-white font-normal text-sm hover:text-gray-200 transition-colors"
            >
              FAQs
            </Link>
            <Link
              to="/privacy-policy"
              className="font-ibm-plex text-white font-normal text-sm hover:text-gray-200 transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
            <div className="hidden md:block">
              <WalletConnection />
            </div>
          <button
            onClick={toggleMenu}
            className="md:hidden flex items-center justify-center w-12 h-12 cursor-pointer"
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
          >
            <img src="/hamburger.svg" alt="Open menu" className="w-7 h-7" />
          </button>
        </div>
        {isMenuOpen && (
          <div className="md:hidden absolute right-4 top-[4.5rem] w-64 rounded-2xl bg-[#0c0f14e6] backdrop-blur-xl shadow-[0_24px_70px_-32px_rgba(0,0,0,0.8)] border border-white/10">
            <div className="flex flex-col gap-1 px-3 py-3">
              <Link
                to="/account"
                onClick={closeMenu}
                className="flex justify-between items-center rounded-xl px-3 py-2 font-ibm-plex text-white font-bold text-sm hover:bg-white/5 transition-colors"
              >
                VPN Access
              </Link>
              <Link
                to="/how-it-works"
                onClick={closeMenu}
                className="flex justify-between items-center rounded-2xl px-3 py-2 font-ibm-plex text-white font-normal text-sm hover:bg-white/5 transition-colors"
              >
                How It Works
              </Link>
              <Link
                to="/install"
                onClick={closeMenu}
                className="flex justify-between items-center rounded-2xl px-3 py-2 font-ibm-plex text-white font-normal text-sm hover:bg-white/5 transition-colors"
              >
                How to Install
              </Link>
              <Link
                to="/docs-faqs"
                onClick={closeMenu}
                className="flex justify-between items-center rounded-2xl px-3 py-2 font-ibm-plex text-white font-normal text-sm hover:bg-white/5 transition-colors"
              >
                FAQs
              </Link>
              <Link
                to="/privacy-policy"
                onClick={closeMenu}
                className="flex justify-between items-center rounded-2xl px-3 py-2 font-ibm-plex text-white font-normal text-sm hover:bg-white/5 transition-colors"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
