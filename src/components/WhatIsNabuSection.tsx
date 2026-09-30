import globeIcon from "/globe-icon.svg";
import privacyIcon from "/privacy-icon.svg";
import vpnIcon from "/vpn-icon.svg";

const cardData = [
  {
    icon: globeIcon,
    header: "Privacy focused",
    subheader: "Designed to help protect your online activity.",
  },
  {
    icon: privacyIcon,
    header: "Transparent technology",
    subheader: "Built with open and verifiable components.",
  },
  {
    icon: vpnIcon,
    header: "Powered by Cardano",
    subheader: "Blockchain technology supports the Nabu project.",
  },
];

const CardComponent = ({
  icon,
  header,
  subheader,
}: {
  icon: string;
  header: string;
  subheader: string;
}) => {
  return (
    <div className="flex p-4 flex-col justify-center items-start gap-2.5 w-full md:w-auto flex-1 rounded-2xl border border-gray-200 backdrop-blur-sm">
      <div className="flex justify-center items-center p-[1.368rem] rounded-full bg-white">
        <img src={icon} alt="icon" className="h-8 w-8" />
      </div>
      <div className="flex flex-col justify-center items-start gap-0.5">
        <p className="font-exo-2 text-white text-2xl font-bold text-start">
          {header}
        </p>
        <p className="font-light text-white text-base text-start">
          {subheader}
        </p>
      </div>
    </div>
  );
};

const WhatIsNabuSection = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 md:pt-16 z-20 text-white">
      <div className="flex flex-col items-center gap-8 sm:gap-12 w-full max-w-[80rem]">
        <div className="flex flex-col justify-center items-center gap-4 sm:gap-6 text-center">
          <img
            src={globeIcon}
            alt="globe"
            className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20"
          />
          <p className="font-exo-2 text-white text-xl sm:text-2xl md:text-3xl font-bold">
            What is Nabu?
          </p>
          <p className="font-ibm-plex text-white text-base sm:text-lg md:text-xl text-center leading-relaxed max-w-4xl px-4">
            Nabu is a privacy-focused VPN project powered by Cardano, built
            around transparent technology and online privacy.
          </p>
        </div>
        <div className="flex flex-col min-[1145px]:flex-row justify-center gap-4 sm:gap-6 text-center w-full">
          {cardData.map((card, index) => (
            <CardComponent
              key={index}
              icon={card.icon}
              header={card.header}
              subheader={card.subheader}
            />
          ))}
        </div>
        <div className="flex flex-col items-center justify-center gap-6 text-center py-[4rem]">
          <p className="font-exo-2 text-white ">
            Powered by Cardano. Transparent & secure.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WhatIsNabuSection;
