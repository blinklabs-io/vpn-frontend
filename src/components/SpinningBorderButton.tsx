import { useEffect, useRef } from "react";

type SpinningBorderButtonProps = {
  children: React.ReactNode;
  className?: string;
  spin?: boolean;
  onClick?: () => void;
  radius?: string;
  useBorder?: boolean;
};
const SpinningBorderButton = ({
  children,
  className = "",
  spin = true,
  radius = "12px",
  useBorder = true,
  onClick,
}: SpinningBorderButtonProps) => {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!spin) {
      ref.current?.style.setProperty("--gradient-angle", "0deg");
      return;
    }

    let angle = 0;
    let frame: number;

    const tick = () => {
      angle = (angle + 0.15) % 360;
      ref.current?.style.setProperty("--gradient-angle", `${angle}deg`);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [spin]);

  return (
    <button
      ref={ref}
      className={`${useBorder ? "border-gradient-button" : ""} ${className}`.trim()}
      type="button"
      style={{
        ["--button-radius" as string]: radius,
        borderRadius: radius,
        cursor: "pointer",
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default SpinningBorderButton;

