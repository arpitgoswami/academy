"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const steps = [
  "Searching the web...",
  "Collecting data...",
  "Preparing insights...",
];

export default function LoadingScreen() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, 900); // cycle steps, total ~3s
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 2.7, duration: 0.3 }}
      className="fixed inset-0 flex flex-col items-center justify-center z-50 
        bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 
        animate-[gradientMove_3s_ease_infinite] overflow-hidden"
    >
      {/* Loading Text */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="text-white text-2xl md:text-3xl font-semibold tracking-wide drop-shadow-lg"
        >
          {steps[step]}
        </motion.div>
      </AnimatePresence>

      {/* Water wave effect */}
      <div className="absolute bottom-0 w-full h-32 overflow-hidden leading-none">
        <div className="relative w-full h-full">
          <motion.div
            className="absolute bottom-0 w-[200%] h-full bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1440 320%22><path fill=%22%23ffffff22%22 d=%22M0,192L80,192C160,192,320,192,480,186.7C640,181,800,171,960,181.3C1120,192,1280,224,1360,240L1440,256L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z%22></path></svg>')] bg-repeat-x"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 3, ease: "linear", repeat: Infinity }}
          />
        </div>
      </div>

      {/* Inline styles for gradient animation */}
      <style jsx>{`
        @keyframes gradientMove {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-[gradientMove_3s_ease_infinite] {
          background-size: 300% 300%;
        }
      `}</style>
    </motion.div>
  );
}
