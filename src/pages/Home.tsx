import { useNavigate } from "react-router";
import HeroSection from "../components/HeroSection";
import WhatIsNabuSection from "../components/WhatIsNabuSection";

const Home = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/account");
  };

  return (
    <div className="flex flex-col relative min-h-screen overflow-hidden bg-[#040617] pt-16">
      {/* Hero Section */}
      <HeroSection onGetStarted={handleGetStarted} />

      {/* What is Nabu Section */}
      <WhatIsNabuSection onGetStarted={handleGetStarted} />
    </div>
  );
};

export default Home;
