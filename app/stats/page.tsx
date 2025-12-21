"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Clock, X } from "lucide-react";

export default function StatsPage() {
  const [stats, setStats] = useState<any>(null);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-rose-50 p-8">
      <div className="w-full max-w-lg bg-white/95 rounded-3xl p-8 shadow-2xl border border-white/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">SOS Statistics</h2>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Back
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {loading && <div className="text-center py-8">Loading...</div>}

        {!loading && stats && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-rose-50 to-orange-50 rounded-2xl">
              <span className="text-slate-600">Total Alerts</span>
              <span className="text-2xl font-bold text-rose-600">
                {stats.total}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl">
              <span className="text-slate-600">Today</span>
              <span className="text-2xl font-bold text-blue-600">
                {stats.pressesToday}
              </span>
            </div>

            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-purple-500" />
                <span className="text-slate-600">Last Alert</span>
              </div>
              <span className="text-sm font-medium text-purple-600">
                {stats.lastPress
                  ? new Date(stats.lastPress).toLocaleString()
                  : "N/A"}
              </span>
            </div>

            {stats.perDay && Object.keys(stats.perDay).length > 0 && (
              <div className="p-4 bg-slate-50 rounded-2xl">
                <span className="text-sm font-medium text-slate-500 mb-3 block">
                  Daily Breakdown
                </span>
                <div className="space-y-2">
                  {Object.entries(stats.perDay).map(([day, count]) => (
                    <div
                      key={day}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-slate-600">{day}</span>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 bg-gradient-to-r from-rose-400 to-orange-400 rounded-full"
                          style={{
                            width: `${Math.min(Number(count) * 20, 100)}px`,
                          }}
                        />
                        <span className="text-sm font-medium text-slate-700">
                          {String(count)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && !stats && (
          <div className="text-center py-8 text-sm text-slate-500">
            Failed to load statistics.
          </div>
        )}
      </div>
    </div>
  );
}
