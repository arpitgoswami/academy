"use client";

import ChatMessage from "./ChatMessage";
import { X, Send, Loader2 } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex flex-col">
      {/* Chat Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                AI
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Sentinel AI</h1>
              <p className="text-sm text-green-600 flex items-center space-x-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>Online • Ready to help</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 text-gray-600 hover:text-gray-900"
            aria-label="Close chat"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} index={index} />
          ))}

          {isLoading && (
            <div className="flex items-center justify-center space-x-2 text-gray-500 py-4">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Sentinel is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <footer className="bg-white border-t border-gray-200 shadow-lg sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Type your message..."
                className="
                  w-full px-4 py-3 pr-12
                  rounded-2xl border-2 border-gray-200
                  focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200
                  transition-all duration-200
                  text-gray-900 placeholder-gray-400
                "
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`
                p-3 rounded-2xl
                transition-all duration-200
                ${
                  input.trim() && !isLoading
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:scale-105 active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
