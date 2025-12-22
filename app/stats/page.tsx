"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
    <div>
      <header>
        <h2>SOS Statistics</h2>
        <Link href="/">Back to Home</Link>
      </header>

      <hr />

      {loading && <div>Loading stats...</div>}

      {!loading && stats && (
        <div>
          <h3>Summary</h3>
          <ul>
            <li>
              <strong>Total Alerts:</strong> {stats.total}
            </li>
            <li>
              <strong>Today:</strong> {stats.pressesToday}
            </li>
            <li>
              <strong>Last Alert:</strong>{" "}
              {stats.lastPress
                ? new Date(stats.lastPress).toLocaleString()
                : "N/A"}
            </li>
          </ul>

          {stats.perDay && Object.keys(stats.perDay).length > 0 && (
            <div>
              <h3>Daily Breakdown</h3>
              <ul>
                {Object.entries(stats.perDay).map(([day, count]) => (
                  <li key={day}>
                    {day}: {String(count)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!loading && !stats && <div>Failed to load statistics.</div>}
    </div>
  );
}
