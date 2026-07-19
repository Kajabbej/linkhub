"use client";

import React from "react";
import { motion, useReducedMotion, Variants } from "framer-motion";

interface DashboardAnimationProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function DashboardContainer({ children, className = "" }: DashboardAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function DashboardItem({ children, className = "", delay }: DashboardAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  const itemVariants: Variants = shouldReduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { duration: 0.3 },
        },
      }
    : {
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.4,
            ease: "easeOut",
            ...(delay !== undefined ? { delay } : {}),
          },
        },
      };

  return (
    <motion.div
      variants={itemVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
