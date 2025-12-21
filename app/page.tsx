"use client";

import { useState, useEffect, useRef } from "react";
import {
  Shield,
  Send,
  X,
  Activity,
  Sparkles,
  Phone,
  MapPin,
  Clock,
} from "lucide-react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

export default function Home() {
  const [view, setView] = useState<"sos" | "chat">("sos");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<
    { id: number; x: number; y: number }[]
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (view === "chat" && messages.length === 0) {
      sendMessage("", true);
    }
  }, [view]);

  const sendMessage = async (message: string, isInitial = false) => {
    setIsLoading(true);
    const newMessages = isInitial
      ? []
      : [
          ...messages,
          { role: "user" as const, content: message, timestamp: new Date() },
        ];
    setMessages(newMessages);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await response.json();
      const aiMessage = data.choices[0].message.content;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant" as const,
          content: aiMessage,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant" as const,
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput("");
    }
  };

  const addRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const newRipple = { id: Date.now(), x, y };
    setRipples((prev) => [...prev, newRipple]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 1000);
  };

  const recordSOS = async (e: React.MouseEvent<HTMLButtonElement>) => {
    addRipple(e);
    setIsPressed(true);

    try {
      await fetch("/api/sos", { method: "POST" });
      setTimeout(() => {
        setIsPressed(false);
        setView("chat");
      }, 600);
    } catch (err) {
      console.error("Failed to record SOS", err);
      setIsPressed(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/sos");
      if (!res.ok) throw new Error("Failed to load stats");
      const data = await res.json();
      setStats(data);
      setShowStats(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (view === "sos") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-rose-50 overflow-hidden relative">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-20 w-72 h-72 bg-rose-200/30 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-20 right-20 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-rose-100/20 to-orange-100/20 rounded-full blur-3xl" />
        </div>

        {/* Main SOS Button */}
        <div className="text-center z-10">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">
              Emergency SOS
            </h2>
            <p className="text-slate-500 max-w-xs mx-auto">
              Press and hold the button to send an emergency alert
            </p>
          </div>

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
                style={{ animationDuration: "2. 5s", animationDelay: "0.5s" }}
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
                bg-gradient-to-br from-rose-500 via-red-500 to-orange-500
                before:absolute before:inset-0 before:bg-gradient-to-t before:from-black/20 before:to-transparent before:rounded-full`}
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
                  className="absolute bg-white/30 rounded-full animate-ripple"
                  style={{
                    left: ripple.x,
                    top: ripple.y,
                    width: "20px",
                    height: "20px",
                  }}
                />
              ))}

              {/* Inner glow */}
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-white/20 to-transparent" />

              {/* Button text */}
              <span className="relative z-10 drop-shadow-lg tracking-wider">
                SOS
              </span>

              {/* Shine effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent rotate-45" />
            </button>
          </div>
        </div>

        {/* Stats button */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-100">
          <Link
            href="/stats"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
          >
            <Activity className="w-5 h-5 group-hover:animate-pulse" />
            <span className="font-medium">View Stats</span>
          </Link>
        </div>

        {/* Stats Modal */}
        {showStats && stats && (
          <div
            className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-50 animate-fadeIn"
            onClick={() => setShowStats(false)}
          >
            <div
              className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-96 shadow-2xl border border-white/50 animate-slideUp"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Statistics
                  </h2>
                </div>
                <button
                  onClick={() => setShowStats(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

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
            </div>
          </div>
        )}

        {/* Custom styles */}
        <style jsx>{`
          @keyframes ripple {
            to {
              transform: scale(20);
              opacity: 0;
            }
          }
          . animate-ripple {
            animation: ripple 1s ease-out forwards;
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          . animate-fadeIn {
            animation: fadeIn 0.2s ease-out forwards;
          }
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          .animate-slideUp {
            animation: slideUp 0.3s ease-out forwards;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Chat Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-slate-100">
        <div className="flex items-center justify-between p-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2.5 bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl shadow-lg shadow-rose-500/20">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Sentinel AI
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h1>
              <p className="text-xs text-emerald-600 font-medium">
                Online • Ready to help
              </p>
            </div>
          </div>
          <button
            onClick={() => setView("sos")}
            className="p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            } animate-slideIn`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div
              className={`flex items-end gap-2 max-w-[85%] ${
                msg.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-md">
                  <Shield className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-slate-800 to-slate-700 text-white rounded-br-md"
                    : "bg-white border border-slate-100 text-slate-700 rounded-bl-md"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
                {msg.timestamp && (
                  <p
                    className={`text-xs mt-1.5 ${
                      msg.role === "user" ? "text-slate-400" : "text-slate-400"
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-slideIn">
            <div className="flex items-end gap-2">
              <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-md">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-slate-100 px-5 py-4 rounded-2xl rounded-bl-md shadow-sm">
                <div className="flex gap-1. 5">
                  <div className="w-2. 5 h-2.5 bg-gradient-to-r from-rose-400 to-orange-400 rounded-full animate-bounce" />
                  <div
                    className="w-2.5 h-2.5 bg-gradient-to-r from-rose-400 to-orange-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.15s" }}
                  />
                  <div
                    className="w-2.5 h-2.5 bg-gradient-to-r from-rose-400 to-orange-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.3s" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 backdrop-blur-xl bg-white/80 border-t border-slate-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-3 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your message..."
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus: ring-2 focus:ring-rose-500/20 focus:border-rose-300 transition-all duration-200 text-slate-700 placeholder: text-slate-400"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-3.5 bg-gradient-to-br from-rose-500 to-orange-500 text-white rounded-2xl shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center text-xs text-slate-400 mt-3">
            Sentinel AI is here to help during emergencies
          </p>
        </div>
      </div>

      {/* Custom styles */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
