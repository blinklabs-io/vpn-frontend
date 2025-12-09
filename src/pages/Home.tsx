import { useNavigate } from "react-router";
import HeroSection from "../components/HeroSection";
import WhatIsNabuSection from "../components/WhatIsNabuSection";

const Home = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/");
  };

  return (
    <div className="flex flex-col bg-[linear-gradient(180deg,#1C246E_0%,#040617_12.5%)] relative pt-16">
      {/* Hero Section */}
      <HeroSection onGetStarted={handleGetStarted} />

      {/* What is Nabu Section */}
      <WhatIsNabuSection onGetStarted={handleGetStarted} />
    </div>
  );
};

export default Home;
