"use client";

import { Activity } from "lucide-react";
import Link from "next/link";

interface SOSViewProps {
  isPressed: boolean;
  setIsPressed: (pressed: boolean) => void;
  ripples: { id: number; x: number; y: number }[];
  recordSOS: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function SOSView({
  isPressed,
  setIsPressed,
  ripples,
  recordSOS,
}: SOSViewProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-slate-50 via-white to-rose-50 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-20 w-72 h-72 bg-rose-200/30 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 right-20 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-linear-to-r from-rose-100/20 to-orange-100/20 rounded-full blur-3xl" />
      </div>

      {/* Main SOS Button */}
      <div className="text-center z-10">
        <div className="relative">
          {/* Outer rings animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-80 h-80 rounded-full border-2 border-rose-200/50 animate-ping"
              style={{ animationDuration: "2s" }}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-72 h-72 rounded-full border-2 border-rose-300/30 animate-ping"
              style={{ animationDuration: "2.5s", animationDelay: "0.5s" }}
            />
          </div>

          {/* Main button */}
          <button
            onClick={recordSOS}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
            className={`relative w-56 h-56 rounded-full text-white text-4xl font-bold shadow-2xl 
                transition-all duration-300 ease-out overflow-hidden
                ${
                  isPressed
                    ? "scale-95 shadow-lg"
                    : "scale-100 hover:scale-105 hover:shadow-rose-500/25"
                }
                bg-linear-to-br from-rose-500 via-red-500 to-orange-500
                before:absolute before:inset-0 before:bg-linear-to-t before:from-black/20 before:to-transparent before:rounded-full`}
            style={{
              boxShadow: isPressed
                ? "0 10px 30px -10px rgba(244, 63, 94, 0.5)"
                : "0 25px 50px -12px rgba(244, 63, 94, 0.4), 0 0 0 1px rgba(255,255,255,0.1) inset",
            }}
            aria-label="Send SOS"
          >
            {/* Ripple effects */}
            {ripples.map((ripple) => (
              <span
                key={ripple.id}
                className="absolute bg-white/30 rounded-full animate-ripple pointer-events-none"
                style={{
                  left: `calc(50% + ${ripple.x}px)`,
                  top: `calc(50% + ${ripple.y}px)`,
                  width: "20px",
                  height: "20px",
                  transform: "translate(-50%, -50%)",
                }}
              />
            ))}

            {/* Inner glow */}
            <div className="absolute inset-4 rounded-full bg-linear-to-br from-white/20 to-transparent" />

            {/* Button text */}
            <span className="relative z-10 drop-shadow-lg tracking-wider">
              SOS
            </span>

            {/* Shine effect */}
            <div className="absolute inset-0 rounded-full bg-linear-to-tr from-transparent via-white/10 to-transparent rotate-45" />
          </button>
        </div>
      </div>

      {/* Stats button */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-100">
        <Link
          href="/stats"
          className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-slate-800 to-slate-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
        >
          <Activity className="w-5 h-5 group-hover:animate-pulse" />
          <span className="font-medium">View Stats</span>
        </Link>
      </div>

      {/* Custom styles */}
      <style jsx>{`
        @keyframes ripple {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.6;
          }
          100% {
            transform: translate(-50%, -50%) scale(15);
            opacity: 0;
          }
        }
        .animate-ripple {
          animation: ripple 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
