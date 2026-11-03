import heroBackdrop from "/hero-backdrop.png";
import heroCenter from "/hero-center-graphic.png";

const HeroSection = () => {
  return (
    <div className="flex flex-col items-center justify-end min-h-[calc(100vh-4rem)] px-4 relative z-20 pointer-events-none">
      <img
        src={heroBackdrop}
        alt="Hero Backdrop"
        className="absolute inset-0 w-full h-full object-cover object-center z-10 pointer-events-none"
        loading="eager"
        fetchPriority="high"
      />
      <img
        src={heroCenter}
        alt="Hero Center"
        className="absolute top-1/4 sm:top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[clamp(11rem,45vw,27.5rem)] max-w-[90vw] h-auto aspect-[439/321] object-contain z-20 flex-shrink-0 pointer-events-none"
        loading="eager"
        sizes="(max-width: 640px) 70vw, (max-width: 1024px) 50vw, 30vw"
        fetchPriority="high"
      />
      <div className="flex flex-col items-center justify-center gap-4 sm:gap-6 px-4 py-2 z-20 max-w-6xl mx-auto pointer-events-auto">
        <h1 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center leading-tight">
          Private. Transparent. Yours.
        </h1>
        <p className="font-ibm-plex text-white text-base sm:text-lg md:text-xl text-center max-w-4xl leading-relaxed">
          Explore a transparent approach to online privacy with Nabu, a VPN
          project powered by Cardano.
        </p>
      </div>
    </div>
  );
};

export default HeroSection;
