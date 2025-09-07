import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Search, Database, Sparkles } from "lucide-react";

const steps = [
  { text: "Searching", icon: Search },
  { text: "Processing", icon: Database },
  { text: "Finalizing", icon: Sparkles },
];

export default function LoadingScreen() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const currentStep = steps[step];
  const IconComponent = currentStep.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 flex items-center justify-center bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100"
    >
      <div className="flex flex-col items-center space-y-8">
        {/* Icon Container */}
        <motion.div className="relative">
          <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <IconComponent className="w-7 h-7 text-purple-600" />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Subtle pulse ring */}
          <motion.div
            className="absolute inset-0 border border-gray-200 rounded-xl"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        </motion.div>

        {/* Loading Text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <h2 className="text-gray-900 text-xl font-medium">
              {currentStep.text}
            </h2>
            <p className="text-gray-500 text-sm mt-1">Please wait a moment</p>
          </motion.div>
        </AnimatePresence>

        {/* Progress Indicator */}
        <div className="flex space-x-2">
          {steps.map((_, index) => (
            <motion.div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === step ? "bg-purple-600" : "bg-white"
              }`}
              animate={
                index === step
                  ? {
                      scale: [1, 1.2, 1],
                    }
                  : {}
              }
              transition={{
                duration: 0.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-48 h-0.5 bg-white rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
