"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/shared/logo";

interface BrandTransitionProps {
  onComplete?: () => void;
}

export function BrandTransition({ onComplete }: BrandTransitionProps) {
  const shouldReduceMotion = useReducedMotion();
  const [stage, setStage] = useState<"hidden" | "center" | "transitioning" | "done">("hidden");
  const logoRef = useRef<HTMLDivElement>(null);
  const [logoCoords, setLogoCoords] = useState({ x: 0, y: 0, scale: 1 });

  useEffect(() => {
    // Check if we should skip animation
    const flag = sessionStorage.getItem("just_logged_in");
    if (flag !== "true") {
      setStage("done");
      if (onComplete) onComplete();
      return;
    }

    // Set stage to center (intro)
    setStage("center");

    // Reduced motion shortcut
    if (shouldReduceMotion) {
      const timer = setTimeout(() => {
        setStage("done");
        sessionStorage.removeItem("just_logged_in");
        if (onComplete) onComplete();
      }, 350);
      return () => clearTimeout(timer);
    }

    // Phase 1: Show in center for 400ms, then transition to sidebar
    const transitionTimer = setTimeout(() => {
      // Find the target sidebar/navbar logo
      // Desktop uses #sidebar-logo, Mobile header uses #mobile-logo
      const targetLogo = document.getElementById("sidebar-logo") || document.getElementById("mobile-logo");
      
      if (targetLogo) {
        const targetRect = targetLogo.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Center of viewport
        const centerX = viewportWidth / 2;
        const centerY = viewportHeight / 2;
        
        // Center of target element
        const destX = targetRect.left + targetRect.width / 2;
        const destY = targetRect.top + targetRect.height / 2;
        
        // We calculate delta from center
        const deltaX = destX - centerX;
        const deltaY = destY - centerY;
        
        // Approximate scale difference. A 32px logo is target size.
        // The central logo has size 48px.
        const destScale = targetRect.width / 48;

        setLogoCoords({ x: deltaX, y: deltaY, scale: destScale });
      } else {
        // Fallback top-left target
        setLogoCoords({ x: -window.innerWidth / 2.5, y: -window.innerHeight / 2.5, scale: 0.6 });
      }

      setStage("transitioning");
    }, 550);

    // Phase 2: Complete the animation after 800ms total
    const doneTimer = setTimeout(() => {
      setStage("done");
      sessionStorage.removeItem("just_logged_in");
      if (onComplete) onComplete();
    }, 850);

    return () => {
      clearTimeout(transitionTimer);
      clearTimeout(doneTimer);
    };
  }, [shouldReduceMotion, onComplete]);

  return (
    <AnimatePresence>
      {stage !== "done" && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#F8F9FA] dark:bg-slate-900 pointer-events-none select-none"
        >
          <motion.div
            ref={logoRef}
            initial={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.90 }
            }
            animate={
              stage === "center"
                ? { opacity: 1, scale: 1, x: 0, y: 0 }
                : stage === "transitioning"
                ? {
                    x: logoCoords.x,
                    y: logoCoords.y,
                    scale: logoCoords.scale,
                    opacity: 0,
                    transition: { duration: 0.35, ease: [0.25, 1, 0.5, 1] }
                  }
                : {}
            }
            transition={
              stage === "center"
                ? { duration: 0.2, ease: "easeOut" }
                : {}
            }
            className="flex items-center justify-center transform-gpu"
          >
            {/* Show only logo icon without text in the shared transition to match target */}
            <Logo size={48} showText={false} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
