"use client";
import React, { useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const FloatingNav = ({
  navItems,
  className,
}: {
  navItems: {
    name: string;
    link: string;
    icon?: JSX.Element;
  }[];
  className?: string;
}) => {
  const { scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle first render and hydration
  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      if (window.scrollY > window.innerHeight * 0.2) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };
    
    // Add a fallback scroll listener
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useMotionValueEvent(scrollYProgress, "change", (current) => {
    // Safe check for current value and ensure component is mounted
    if (typeof current === "number" && mounted) {
      let direction = current! - scrollYProgress.getPrevious()!;

      if (scrollYProgress.get() < 0.05) {
        setVisible(false);
      } else {
        if (direction < 0) {
          setVisible(true);
        } else {
          setVisible(false);
        }
      }
    }
  });

  if (!mounted) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{
          opacity: 1,
          y: -100,
        }}
        animate={{
          y: visible ? 0 : -100,
          opacity: visible ? 1 : 0,
        }}
        transition={{
          duration: 0.2,
        }}
        className={cn(
          "flex max-w-fit fixed top-10 inset-x-0 mx-auto border border-white/10 rounded-full bg-gray-900/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] z-[5000] pr-2 pl-8 py-2 items-center justify-center space-x-4",
          className
        )}
      >
        {navItems.map((navItem, idx) => (
          <Link
            key={`nav-item-${idx}`}
            href={navItem.link}
            className={cn(
              "relative text-white/80 items-center flex space-x-1 hover:text-white transition-colors"
            )}
          >
            <span className="block sm:hidden">{navItem.icon}</span>
            <span className="hidden sm:block text-sm">{navItem.name}</span>
          </Link>
        ))}
        <motion.button 
          className="border text-sm font-medium relative border-blue-500/20 text-white px-4 py-2 rounded-full bg-blue-600/20 hover:bg-blue-600/40 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>Get Started</span>
          <span className="absolute inset-x-0 w-1/2 mx-auto -bottom-px bg-gradient-to-r from-transparent via-blue-500 to-transparent h-px" />
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
};
