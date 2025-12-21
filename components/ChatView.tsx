"use client";

import { Shield, Send, X, Sparkles } from "lucide-react";
import ChatMessage from "./ChatMessage";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

interface ChatViewProps {
  messages: Message[];
  input: string;
  setInput: (input: string) => void;
  handleSend: () => void;
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
}

export default function ChatView({
  messages,
  input,
  setInput,
  handleSend,
  isLoading,
  messagesEndRef,
  onClose,
}: ChatViewProps) {
  return (
    <div className="flex flex-col min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50">
      {/* Chat Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-slate-100">
        <div className="flex items-center justify-between p-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2.5 bg-linear-to-br from-rose-500 to-orange-500 rounded-2xl shadow-lg shadow-rose-500/20">
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
            onClick={onClose}
            className="p-2.5 hover:bg-slate-100 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full">
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} index={index} />
        ))}

        {isLoading && (
          <div className="flex justify-start animate-slideIn">
            <div className="flex items-end gap-2">
              <div className="shrink-0 w-8 h-8 rounded-xl bg-linear-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-md">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-slate-100 px-5 py-4 rounded-2xl rounded-bl-md shadow-sm">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 bg-linear-to-r from-rose-400 to-orange-400 rounded-full animate-bounce" />
                  <div
                    className="w-2.5 h-2.5 bg-linear-to-r from-rose-400 to-orange-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.15s" }}
                  />
                  <div
                    className="w-2.5 h-2.5 bg-linear-to-r from-rose-400 to-orange-400 rounded-full animate-bounce"
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
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-300 transition-all duration-200 text-slate-700 placeholder:text-slate-400"
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-3.5 bg-linear-to-br from-rose-500 to-orange-500 text-white rounded-2xl shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
