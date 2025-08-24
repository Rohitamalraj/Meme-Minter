import { useEffect, useRef, useState } from 'react'

interface ScrambleTextProps {
  className?: string
}

export function ScrambleText({ className = '' }: ScrambleTextProps) {
  const [displayText, setDisplayText] = useState('MEME MINTER')
  const [showCursor, setShowCursor] = useState(true)
  const finalText = 'MEME MINTER'
  const scrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  const isRunning = useRef(false)
  const autoScrambleInterval = useRef<NodeJS.Timeout>()

  const scrambleEffect = () => {
    if (isRunning.current) return
    isRunning.current = true

    let currentIndex = 0
    const scrambleDuration = 100 // Time for each character scramble
    
    const scrambleChar = () => {
      if (currentIndex < finalText.length) {
        let scrambleCount = 0
        const maxScrambles = 6
        
        const scrambleInterval = setInterval(() => {
          if (scrambleCount < maxScrambles) {
            const randomChar = scrambleChars[Math.floor(Math.random() * scrambleChars.length)]
            const currentText = finalText.substring(0, currentIndex) + randomChar + finalText.substring(currentIndex + 1)
            setDisplayText(currentText)
            scrambleCount++
          } else {
            clearInterval(scrambleInterval)
            setDisplayText(finalText.substring(0, currentIndex + 1))
            currentIndex++
            setTimeout(scrambleChar, 80)
          }
        }, scrambleDuration / maxScrambles)
      } else {
        setDisplayText(finalText)
        isRunning.current = false
      }
    }

    // Start scrambling from first character
    scrambleChar()
  }

  useEffect(() => {
    // Initial animation after component mounts
    const initialTimer = setTimeout(() => {
      scrambleEffect()
    }, 1000)

    // Set up auto-scramble every 7 seconds
    autoScrambleInterval.current = setInterval(() => {
      scrambleEffect()
    }, 7000)

    // Cursor blinking
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 600)

    return () => {
      clearTimeout(initialTimer)
      if (autoScrambleInterval.current) {
        clearInterval(autoScrambleInterval.current)
      }
      clearInterval(cursorInterval)
    }
  }, [])

  const handleClick = () => {
    // Reset auto-scramble timer when manually clicked
    if (autoScrambleInterval.current) {
      clearInterval(autoScrambleInterval.current)
    }
    scrambleEffect()
    // Restart auto-scramble timer
    autoScrambleInterval.current = setInterval(() => {
      scrambleEffect()
    }, 7000)
  }

  return (
    <div 
      className={`cursor-pointer select-none ${className}`}
      onClick={handleClick}
      title="Click to replay animation"
      style={{ 
        width: '200px', // Slightly increased width for larger text
        minWidth: '200px'
      }}
    >
      <span 
        className="font-bold tracking-tight block whitespace-nowrap"
        style={{
          fontFamily: 'monospace', // Monospace font ensures consistent character width
          letterSpacing: '0.05em', // Tighter letter spacing
          lineHeight: '1.2'
        }}
      >
        {displayText}
        <span 
          className={`inline-block w-0.5 h-[1em] bg-current ml-1 ${showCursor ? 'opacity-100' : 'opacity-0'}`}
          style={{ 
            transition: 'opacity 0.1s',
            verticalAlign: 'baseline'
          }}
        />
      </span>
    </div>
  )
}
