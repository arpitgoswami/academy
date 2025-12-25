"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Calendar, TrendingUp, Activity } from "lucide-react";

interface Stats {
  total: number;
  pressesToday: number;
  lastPress: string | null;
  perDay?: Record<string, number>;
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Constants for progress bar visualization
  const PROGRESS_BAR_MULTIPLIER = 20;
  const PROGRESS_BAR_MAX_WIDTH = 200;

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">SOS Statistics</h1>
          </div>
          <Link
            href="/"
            className="
              flex items-center space-x-2
              px-4 py-2 rounded-lg
              bg-gray-100 hover:bg-gray-200
              text-gray-700 font-medium
              transition-colors duration-200
            "
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600">Loading statistics...</p>
            </div>
          </div>
        )}

        {!loading && stats && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Alerts Card */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Total Alerts</h3>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>

              {/* Today's Alerts Card */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Today</h3>
                <p className="text-3xl font-bold text-gray-900">{stats.pressesToday}</p>
              </div>

              {/* Last Alert Card */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200 md:col-span-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Activity className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">Last Alert</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {stats.lastPress
                    ? new Date(stats.lastPress).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : "N/A"}
                </p>
              </div>
            </div>

            {/* Daily Breakdown */}
            {stats.perDay && Object.keys(stats.perDay).length > 0 && (
              <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <span>Daily Breakdown</span>
                </h3>
                <div className="space-y-3">
                  {Object.entries(stats.perDay)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([day, count]) => {
                      const progressWidth = Math.min(
                        Number(count) * PROGRESS_BAR_MULTIPLIER,
                        PROGRESS_BAR_MAX_WIDTH
                      );
                      return (
                        <div
                          key={day}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                        >
                          <span className="font-medium text-gray-700">{day}</span>
                          <div className="flex items-center space-x-3">
                            <div 
                              className="h-2 bg-gradient-to-r from-red-400 to-pink-500 rounded-full"
                              style={{ width: `${progressWidth}px` }}
                            ></div>
                            <span className="font-bold text-gray-900 min-w-[2rem] text-right">
                              {String(count)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && !stats && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-700 font-medium">Failed to load statistics.</p>
            <p className="text-red-600 text-sm mt-2">Please try refreshing the page.</p>
          </div>
        )}
      </div>
    </div>
  );
}
