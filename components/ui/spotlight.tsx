'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from "@/lib/utils"

interface SpotlightProps {
  className?: string
  fill?: string
}

export function Spotlight({ className, fill = 'white' }: SpotlightProps) {
  const divRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)
  const [size, setSize] = useState(0)

  const handleMouseMove = (e: MouseEvent) => {
    if (!divRef.current) return
    
    const div = divRef.current
    const rect = div.getBoundingClientRect()
    
    setPosition({ 
      x: e.clientX - rect.left, 
      y: e.clientY - rect.top 
    })
  }

  useEffect(() => {
    setSize(window.innerWidth >= 768 ? 400 : 200)
    setOpacity(0.15)
    
    window.addEventListener("mousemove", handleMouseMove)
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  return (
    <div
      ref={divRef}
      className={cn(
        "fixed inset-0 pointer-events-none z-0 transition-opacity duration-300",
        className
      )}
    >
      <svg className="absolute opacity-0" width="0" height="0">
        <filter id="blur-filter">
          <feGaussianBlur in="SourceGraphic" stdDeviation="30" />
        </filter>
      </svg>
      <div
        className="absolute top-0 left-0 w-full h-full bg-blend-multiply"
        style={{
          opacity: opacity,
          background: `radial-gradient(circle ${size}px at ${position.x}px ${position.y}px, ${fill}, transparent 65%)`,
          filter: "url(#blur-filter)",
          transform: "translateZ(0)",
        }}
      />
    </div>
  )
}
