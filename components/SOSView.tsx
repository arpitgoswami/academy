"use client";

import Link from "next/link";
import { AlertCircle, BarChart3 } from "lucide-react";

interface SOSViewProps {
  isPressed: boolean;
  setIsPressed: (pressed: boolean) => void;
  ripples: { id: number; x: number; y: number }[];
  recordSOS: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function SOSView({ isPressed, setIsPressed, recordSOS }: SOSViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse-delayed"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center space-y-8 max-w-2xl w-full">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
              Sentinel
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Your AI-powered emergency guardian</p>
        </div>

        {/* Main SOS Button */}
        <div className="relative">
          <button
            onClick={recordSOS}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
            className={`
              relative w-64 h-64 rounded-full 
              bg-gradient-to-br from-red-500 to-pink-600
              text-white font-bold text-4xl
              shadow-2xl
              transform transition-all duration-200
              hover:scale-105 hover:shadow-3xl
              active:scale-95
              focus:outline-none focus:ring-4 focus:ring-red-300
              ${isPressed ? 'scale-95' : ''}
            `}
          >
            <span className="relative z-10">SOS</span>
            
            {/* Animated ring */}
            <span className="absolute inset-0 rounded-full bg-red-500 opacity-50 animate-ping"></span>
            
            {/* Glow effect */}
            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-red-400 to-pink-500 blur-xl opacity-50"></span>
          </button>
          
          <p className="text-center mt-6 text-gray-600 font-medium">
            Press for emergency assistance
          </p>
        </div>

        {/* Navigation */}
        <Link 
          href="/stats"
          className="
            flex items-center space-x-2
            px-6 py-3 rounded-full
            bg-white text-gray-700
            border-2 border-gray-200
            hover:border-red-300 hover:bg-red-50
            transition-all duration-200
            shadow-md hover:shadow-lg
            font-medium
          "
        >
          <BarChart3 className="w-5 h-5" />
          <span>View Statistics</span>
        </Link>
      </div>
    </div>
  );
}
