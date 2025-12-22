"use client";

import Link from "next/link";

interface SOSViewProps {
  isPressed: boolean;
  setIsPressed: (pressed: boolean) => void;
  ripples: { id: number; x: number; y: number }[];
  recordSOS: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function SOSView({ setIsPressed, recordSOS }: SOSViewProps) {
  return (
    <div>
      <h1>Emergency App</h1>

      {/* Main SOS Button */}
      <button
        onClick={recordSOS}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
      >
        SOS
      </button>

      <br />
      <br />

      {/* Navigation */}
      <Link href="/stats">View Stats</Link>
    </div>
  );
}
