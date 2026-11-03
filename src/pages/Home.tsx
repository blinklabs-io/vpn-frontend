import HeroSection from "../components/HeroSection";
import WhatIsNabuSection from "../components/WhatIsNabuSection";

const Home = () => {
  return (
    <div className="flex flex-col relative min-h-screen overflow-hidden pt-16">
      {/* Hero Section */}
      <HeroSection />

      {/* What is Nabu Section */}
      <WhatIsNabuSection />
    </div>
  );
};

export default Home;
