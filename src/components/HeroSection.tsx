import heroBackdrop from '/hero-backdrop.png'
import heroCenter from '/hero-center-graphic.png'
import { useNavigate } from 'react-router'

interface HeroSectionProps {
  onGetStarted: () => void
}

const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-end min-h-[calc(100vh-4rem)] px-4 relative z-20 pointer-events-none">
      <img
        src={heroBackdrop}
        alt="Hero Backdrop"
        className="absolute top-0 sm:top-30 inset-0 w-full h-full object-cover sm:object-contain object-center sm:object-top z-10 pointer-events-none"
        loading="eager"
        fetchPriority="high"
      />
      <img
        src={heroCenter}
        alt="Hero Center"
        className="absolute top-1/4 sm:top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-36 sm:w-[16.375rem] sm:h-[11.9735rem] md:w-[27.4375rem] md:h-[20.0625rem] object-contain z-20 flex-shrink-0 pointer-events-none"
        loading="eager"
        sizes="(max-width: 640px) 192px, (max-width: 768px) 262px, 439px"
        fetchPriority="high"
      />
      <div className="flex flex-col items-center justify-center gap-4 sm:gap-6 px-4 py-2 z-20 max-w-6xl mx-auto pointer-events-auto">
        <h1 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center leading-tight">
          Private. Transparent. Yours.
        </h1>
        <p className="font-ibm-plex text-white text-base sm:text-lg md:text-xl text-center max-w-4xl leading-relaxed">
         <span className="font-ibm-plex">Take back control of your online privacy with Nabu</span>-<span className="font-ibm-plex">a fully transparent VPN powered by Cardano.</span>
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-6 sm:py-8">
          <button
            onClick={onGetStarted}
            className="flex py-3 sm:py-4 px-6 sm:px-10 justify-center items-center gap-2.5 rounded-full bg-gray-100 backdrop-blur-sm text-gray-900 font-medium text-sm sm:text-base hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Get Started
          </button>
          <button
            onClick={() => navigate('/privacy-policy')}
            className="flex py-3 sm:py-4 px-6 sm:px-10 justify-center items-center gap-2.5 rounded-full border border-white/20 backdrop-blur-sm text-white font-medium text-sm sm:text-base hover:bg-white/10 transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <button
            onClick={() => navigate('/how-it-works')}
            className="flex py-3 sm:py-4 px-6 sm:px-10 justify-center items-center gap-2.5 rounded-full border border-white/20 backdrop-blur-sm text-white font-medium text-sm sm:text-base hover:bg-white/10 transition-colors cursor-pointer"
          >
            How It Works
          </button>
          <button
            onClick={() => navigate('/docs-faqs')}
            className="flex py-3 sm:py-4 px-6 sm:px-10 justify-center items-center gap-2.5 rounded-full border border-white/20 backdrop-blur-sm text-white font-medium text-sm sm:text-base hover:bg-white/10 transition-colors cursor-pointer"
          >
            FAQs
          </button>
        </div>
      </div>
    </div>
  )
}

export default HeroSection
