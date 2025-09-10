import { useState, useEffect, type ReactNode } from 'react'
import { Tooltip } from 'react-tooltip'

export interface TooltipStep {
  id: string
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

interface TooltipGuideProps {
  steps: TooltipStep[]
  storageKey: string
  stepDuration?: number
  onComplete?: () => void
  children: (showTooltips: boolean) => ReactNode
}

const TooltipGuide = ({ 
  steps, 
  storageKey, 
  onComplete,
  children 
}: TooltipGuideProps) => {
  const [showTooltips, setShowTooltips] = useState<boolean>(false)
  const [currentStep, setCurrentStep] = useState<number>(0)

  useEffect(() => {
    const hasVisited = localStorage.getItem(storageKey)
    if (!hasVisited) {
      setTimeout(() => {
        setShowTooltips(true)
      }, 500)
      localStorage.setItem(storageKey, 'true')
    }
  }, [storageKey])

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      setShowTooltips(false)
      onComplete?.()
    }
  }

  const renderTooltipContent = (content: string) => {
    return (
      <div className="flex flex-col gap-3">
        <div className="text-base leading-relaxed">
          {content}
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleNextStep}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-md text-sm transition-all duration-200 font-medium cursor-pointer"
          >
            {currentStep < steps.length - 1 ? 'Next' : 'Got it!'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {children(showTooltips)}      
      {showTooltips && steps.map((step, index) => (
        <Tooltip
          key={step.id}
          id={step.id}
          place={step.placement || 'top'}
          isOpen={showTooltips && currentStep === index}
          clickable={true}
          style={{
            backgroundColor: '#9400FF',
            color: 'white',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '20px',
            maxWidth: '350px',
            zIndex: showTooltips && currentStep === index ? 10000 : 9999, 
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
          }}
        >
          {renderTooltipContent(step.content)}
        </Tooltip>
      ))}
    </>
  )
}

export default TooltipGuide 