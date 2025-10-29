import React from "react";
import nabuLogo from "/nabu-logo.svg";

const NabuToastIcon: React.FC = () => {
  return (
    <img
      src={nabuLogo}
      alt="Nabu"
      style={{
        width: "20px",
        height: "20px",
        filter: "brightness(0) invert(1)",
      }}
    />
  );
};

export default NabuToastIcon;
