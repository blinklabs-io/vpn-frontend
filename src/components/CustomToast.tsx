import React from "react";
import nabuLogo from "/nabu-logo.svg";

interface CustomToastProps {
  message: string;
  type: "success" | "error" | "info";
}

const CustomToast: React.FC<CustomToastProps> = ({ message, type }) => {
  const getBorderColor = () => {
    switch (type) {
      case "success":
        return "#10B981";
      case "error":
        return "#EF4444";
      case "info":
        return "#3B82F6";
      default:
        return "#3B82F6";
    }
  };

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1C246E 0%, #040617 100%)",
        color: "#ffffff",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        borderLeft: `4px solid ${getBorderColor()}`,
        borderRadius: "12px",
        padding: "16px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        backdropFilter: "blur(10px)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "14px",
        fontWeight: "500",
        minWidth: "300px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <img
          src={nabuLogo}
          alt="Nabu"
          style={{
            width: "24px",
            height: "24px",
            filter: "brightness(0) invert(1)", // Make logo white
          }}
        />
      </div>
      <span>{message}</span>
    </div>
  );
};

export default CustomToast;
