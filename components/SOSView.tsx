import Link from "next/link";
import { BarChart3 } from "lucide-react";

interface SOSViewProps {
  isPressed: boolean;
  setIsPressed: (pressed: boolean) => void;
  recordSOS: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function SOSView({
  isPressed,
  setIsPressed,
  recordSOS,
}: SOSViewProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white relative overflow-hidden">
      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md space-y-16">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-thin tracking-[0.2em] uppercase text-black">
            Sentinel
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
            AI-Powered Emergency Guardian
          </p>
        </div>

        {/* Main SOS Button */}
        <div className="relative group">
          <button
            onClick={recordSOS}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
            className={`
              relative w-64 h-64 rounded-full 
              border border-black bg-white
              text-black font-thin text-5xl tracking-widest
              transition-all duration-500 ease-out
              hover:bg-black hover:text-white
              active:scale-95
              focus:outline-none
              flex items-center justify-center
              z-20
              ${isPressed ? "scale-95 bg-black text-white" : ""}
            `}
          >
            <span className={isPressed ? "animate-pulse" : ""}>SOS</span>
          </button>

          {/* Minimalist Ring Animation (Only visible on hover/active) */}
          <div className="absolute inset-0 -m-4 border border-black/10 rounded-full scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />
          <div className="absolute inset-0 -m-8 border border-black/5 rounded-full scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-1000 delay-75 pointer-events-none" />

          <p className="absolute -bottom-12 left-0 right-0 text-center text-[10px] uppercase tracking-widest text-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Click to activate
          </p>
        </div>

        {/* Navigation / Stats */}
        <Link
          href="/stats"
          className="
            group flex items-center space-x-3
            px-8 py-3 
            border border-black/20 hover:border-black
            bg-transparent hover:bg-black
            transition-all duration-300
          "
        >
          <BarChart3
            strokeWidth={1}
            className="w-4 h-4 text-black group-hover:text-white transition-colors"
          />
          <span className="text-xs uppercase tracking-widest text-black group-hover:text-white transition-colors">
            View Statistics
          </span>
        </Link>
      </div>
    </div>
  );
}
