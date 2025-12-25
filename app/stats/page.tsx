"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, TrendingUp, Activity } from "lucide-react";

interface Stats {
  total: number;
  pressesToday: number;
  lastPress: string | null;
  perDay?: Record<string, number>;
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/sos");
        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-white text-black font-sans font-light">
      {/* Header */}
      <header className="border-b border-black sticky top-0 bg-white z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle strokeWidth={1} className="w-5 h-5" />
            <h1 className="text-sm tracking-[0.2em] uppercase">Statistics</h1>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 text-xs uppercase tracking-widest hover:bg-black hover:text-white px-3 py-1 transition-colors border border-transparent hover:border-black"
          >
            <ArrowLeft strokeWidth={1} className="w-3 h-3" />
            <span>Back</span>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {loading && (
          <div className="flex justify-center py-20">
            <div className="text-xs tracking-widest animate-pulse uppercase">
              Loading Data...
            </div>
          </div>
        )}

        {!loading && stats && (
          <div className="space-y-12">
            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Alerts */}
              <div className="border border-black p-6 flex flex-col justify-between h-32 hover:bg-black hover:text-white transition-colors duration-300 group">
                <div className="flex font-semibold justify-between items-start">
                  <span className="text-[10px] uppercase tracking-widest opacity-60">
                    Total Alerts
                  </span>
                  <TrendingUp
                    strokeWidth={1}
                    className="w-4 h-4 opacity-60 group-hover:text-white"
                  />
                </div>
                <p className="text-5xl font-thin">{stats.total}</p>
              </div>

              {/* Today */}
              <div className="border border-black p-6 flex flex-col justify-between h-32 hover:bg-black hover:text-white transition-colors duration-300 group">
                <div className="flex font-semibold justify-between items-start">
                  <span className="text-[10px] uppercase tracking-widest opacity-60">
                    Today
                  </span>
                  <Activity
                    strokeWidth={1}
                    className="w-4 h-4 opacity-60 group-hover:text-white"
                  />
                </div>
                <p className="text-5xl font-thin">{stats.pressesToday}</p>
              </div>

              {/* Last Alert */}
              <div className="border border-black p-6 flex flex-col justify-between h-32 hover:bg-black hover:text-white transition-colors duration-300 group">
                <div className="flex font-semibold justify-between items-start">
                  <span className="text-[10px] uppercase tracking-widest opacity-60">
                    Last Alert
                  </span>
                  <AlertCircle
                    strokeWidth={1}
                    className="w-4 h-4 opacity-60 group-hover:text-white"
                  />
                </div>
                <p className="text-lg font-light leading-tight mt-auto">
                  {stats.lastPress
                    ? new Date(stats.lastPress).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "N/A"}
                </p>
              </div>
            </div>

            {/* Daily Breakdown */}
            {stats.perDay && Object.keys(stats.perDay).length > 0 && (
              <div className="space-y-8">
                <h3 className="text-xs font-medium uppercase tracking-[0.2em] border-b border-black pb-4">
                  Activity Log
                </h3>
                <div className="space-y-4">
                  {Object.entries(stats.perDay)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([day, count]) => (
                      <div key={day} className="flex items-center gap-4 group">
                        <span className="text-xs font-light w-24 text-gray-500 group-hover:text-black transition-colors">
                          {day}
                        </span>
                        <div className="flex-1 h-px bg-gray-200 group-hover:bg-black transition-colors relative">
                          {/* Minimalist Bar */}
                          <div
                            style={{ width: `${Math.min(count * 5, 100)}%` }}
                            className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-black"
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && !stats && (
          <div className="border border-black p-8 text-center space-y-4">
            <AlertCircle strokeWidth={1} className="w-8 h-8 mx-auto" />
            <p className="text-sm font-light uppercase tracking-widest">
              Unable to load statistics
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
