import { useState, useEffect, useRef, type ReactNode } from "react";
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
  enabled?: boolean;
  children: (showTooltips: boolean) => ReactNode;
}

const TooltipGuide = ({
  steps,
  storageKey,
  enabled = true,
  onComplete,
  children,
}: TooltipGuideProps) => {
  const [showTooltips, setShowTooltips] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [visibleAnchorId, setVisibleAnchorId] = useState<string | null>(null);
  const syntheticIdRef = useRef<{ element: Element; id: string } | null>(null);
  const effectiveShowTooltips = enabled && showTooltips;

  useEffect(() => {
    if (!enabled) return;
    const hasVisited = localStorage.getItem(storageKey);
    if (!hasVisited) {
      setTimeout(() => {
        setShowTooltips(true);
      }, 500);
      localStorage.setItem(storageKey, "true");
    }
  }, [enabled, storageKey]);

  const handleNextStep = () => {
    setVisibleAnchorId(null); // prevent stale anchor flash
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setShowTooltips(false);
      onComplete?.();
    }
  };

  const handleSkip = () => {
    setVisibleAnchorId(null);
    setShowTooltips(false);
    onComplete?.();
  };

  // Find the first visible anchor element for the current step.
  // Multiple elements may have the same data-tooltip-id (e.g. mobile + desktop cards),
  // but only the visible one (non-zero dimensions) should be used as the anchor.
  useEffect(() => {
    if (!enabled || !showTooltips || typeof document === "undefined") {
      setVisibleAnchorId(null);
      return;
    }

    let frameId: number | null = null;

    frameId = window.requestAnimationFrame(() => {
      const step = steps[currentStep];
      if (!step) return;
      const elements = document.querySelectorAll(`[data-tooltip-id="${step.id}"]`);
      let found = false;
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const anchorId = el.id || `__tooltip-anchor-${step.id}`;
          if (!el.id) {
            el.id = anchorId;
            syntheticIdRef.current = { element: el, id: anchorId };
          }
          setVisibleAnchorId(anchorId);
          found = true;
          break;
        }
      }
      if (!found) {
        setVisibleAnchorId(null);
        console.warn(
          `TooltipGuide: No visible element found for tooltip step id "${step.id}". Ensure the rendered element includes data-tooltip-id="${step.id}".`,
        );
      }
    });

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      // Remove synthetic IDs we assigned to avoid stale DOM mutations
      // after React remounts or the effect re-runs.
      if (syntheticIdRef.current) {
        const { element, id } = syntheticIdRef.current;
        if (element.id === id) {
          element.removeAttribute("id");
        }
        syntheticIdRef.current = null;
      }
    };
  }, [enabled, showTooltips, steps, currentStep]);

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
      {children(effectiveShowTooltips)}
      {enabled &&
        effectiveShowTooltips &&
        steps.map((step, index) => {
          const isCurrentStep = currentStep === index;
          return (
            <Tooltip
              key={step.id}
              place={step.placement || "top"}
              anchorSelect={isCurrentStep && visibleAnchorId ? `#${CSS.escape(visibleAnchorId)}` : undefined}
              isOpen={isCurrentStep && !!visibleAnchorId}
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
