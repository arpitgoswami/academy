"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Search, Brain, Sparkles, Globe } from "lucide-react";

const steps = [
  { text: "Searching the web...", icon: Search },
  { text: "Collecting data...", icon: Globe },
  { text: "Preparing insights...", icon: Brain },
];

export default function LoadingScreen() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, 2000); // cycle steps every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const currentStep = steps[step];
  const IconComponent = currentStep.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 flex flex-col items-center justify-center z-50 
        bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 
        overflow-hidden"
      role="alert"
      aria-live="polite"
    >
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: Math.random() * 0.5 + 0.5,
            }}
            animate={{
              x:
                Math.random() *
                (typeof window !== "undefined" ? window.innerWidth : 1000),
              y:
                Math.random() *
                (typeof window !== "undefined" ? window.innerHeight : 1000),
              scale: [0.5, 1, 0.5],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center space-y-12">
        {/* Animated Icon */}
        <motion.div
          className="relative"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: 3, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl flex items-center justify-center shadow-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.5, ease: "backOut" }}
              >
                <IconComponent className="w-12 h-12 text-white" />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Pulsing Ring */}
          <motion.div
            className="absolute inset-0 border-4 border-blue-400/30 rounded-3xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
        </motion.div>

        {/* Loading Text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="text-center space-y-4"
          >
            <h2 className="text-white text-3xl md:text-4xl font-bold tracking-wide">
              {currentStep.text}
            </h2>
            <p className="text-blue-200 text-lg font-light">
              This may take a few moments
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progress Dots */}
        <div className="flex space-x-3">
          {steps.map((_, index) => (
            <motion.div
              key={index}
              className={`w-3 h-3 rounded-full ${
                index === step ? "bg-blue-400" : "bg-white/30"
              }`}
              animate={
                index === step
                  ? {
                      scale: [1, 1.2, 1],
                      opacity: [0.7, 1, 0.7],
                    }
                  : {}
              }
              transition={{ duration: 1, repeat: Infinity }}
            />
          ))}
        </div>

        {/* Animated Loading Bar */}
        <div className="w-80 h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
            animate={{
              x: ["-100%", "100%"],
              scaleX: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Sparkles Effect */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${20 + i * 10}%`,
                top: `${30 + i * 5}%`,
              }}
              animate={{
                y: [-20, -60, -20],
                opacity: [0, 1, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeInOut",
              }}
            >
              <Sparkles className="w-4 h-4 text-yellow-300/60" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Wave Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden">
        <motion.svg
          className="absolute bottom-0 w-full h-full"
          viewBox="0 0 1440 320"
          animate={{ x: [0, -100] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <path
            fill="rgba(59, 130, 246, 0.1)"
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,138.7C960,139,1056,117,1152,128C1248,139,1344,181,1392,202.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </motion.svg>
        <motion.svg
          className="absolute bottom-0 w-full h-full"
          viewBox="0 0 1440 320"
          animate={{ x: [-100, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        >
          <path
            fill="rgba(168, 85, 247, 0.1)"
            d="M0,192L48,197.3C96,203,192,213,288,197.3C384,181,480,139,576,133.3C672,128,768,160,864,181.3C960,203,1056,213,1152,213.3C1248,213,1344,203,1392,197.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </motion.svg>
      </div>
    </motion.div>
  );
}
