import { useState, useEffect, type ReactNode } from "react";
import { Tooltip } from "react-tooltip";
import "./ToolTipGuide.css";

export interface TooltipStep {
  id: string;
  content: string;
  placement?: "top" | "bottom" | "left" | "right";
}

interface TooltipGuideProps {
  steps: TooltipStep[];
  storageKey: string;
  stepDuration?: number;
  onComplete?: () => void;
  children: (showTooltips: boolean) => ReactNode;
}

const TooltipGuide = ({
  steps,
  storageKey,
  onComplete,
  children,
}: TooltipGuideProps) => {
  const [showTooltips, setShowTooltips] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);

  useEffect(() => {
    const hasVisited = localStorage.getItem(storageKey);
    if (!hasVisited) {
      setTimeout(() => {
        setShowTooltips(true);
      }, 500);
      localStorage.setItem(storageKey, "true");
    }
  }, [storageKey]);

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setShowTooltips(false);
      onComplete?.();
    }
  };

  const handleSkip = () => {
    setShowTooltips(false);
    onComplete?.();
  };

  const renderTooltipContent = (content: string) => {
    return (
      <div className="flex flex-col gap-3">
        <div className="text-base leading-relaxed">{content}</div>
        <div className="flex justify-between items-center">
          <button
            onClick={handleSkip}
            className="bg-transparent hover:bg-white/10 text-white/70 hover:text-white px-3 py-1.5 rounded-md text-sm transition-all duration-200 font-medium cursor-pointer border border-white/20"
          >
            Skip
          </button>
          <button
            onClick={handleNextStep}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-md text-sm transition-all duration-200 font-medium cursor-pointer"
          >
            {currentStep < steps.length - 1 ? "Next" : "Got it!"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {children(showTooltips)}
      {showTooltips &&
        steps.map((step, index) => {
          const isCurrentStep = currentStep === index;
          return (
            <Tooltip
              key={step.id}
              id={step.id}
              place={step.placement || "top"}
              anchorSelect={`[data-tooltip-id="${step.id}"]`}
              isOpen={isCurrentStep}
              clickable={true}
              className="force-opacity-1"
              style={{
                backgroundColor: "#9400FF",
                color: "white",
                borderRadius: "12px",
                padding: "16px",
                fontSize: "20px",
                maxWidth: "350px",
                zIndex: isCurrentStep ? 10000 : -1,
                boxShadow:
                  "0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                opacity: 1,
              }}
            >
              {renderTooltipContent(step.content)}
            </Tooltip>
          );
        })}
    </>
  );
};

export default TooltipGuide;
