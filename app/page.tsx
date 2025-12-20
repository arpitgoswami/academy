"use client";

import { useState, useEffect } from "react";
import { Shield, Send, X, AlertCircle } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [view, setView] = useState<"sos" | "chat">("sos");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (view === "chat" && messages.length === 0) {
      sendMessage("", true);
    }
  }, [view]);

  const sendMessage = async (message: string, isInitial = false) => {
    setIsLoading(true);
    const newMessages = isInitial
      ? []
      : [...messages, { role: "user" as const, content: message }];
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
        { role: "assistant" as const, content: aiMessage },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant" as const,
          content: "Sorry, I encountered an error. Please try again.",
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

  if (view === "sos") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-800 mb-8">
            Stay Focused.
          </h1>
          <button
            onClick={() => setView("chat")}
            className="relative w-64 h-64 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white text-4xl font-bold shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 to-red-600 animate-ping opacity-75"></div>
            SOS
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="flex items-center justify-between p-4 border-b border-zinc-200">
        <div className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-zinc-600" />
          <h1 className="text-lg font-semibold text-zinc-800">AI Guardian</h1>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
        <button
          onClick={() => setView("sos")}
          className="text-zinc-600 hover:text-zinc-800"
        >
          <X className="w-6 h-6" />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.role === "user"
                  ? "bg-zinc-800 text-white"
                  : "bg-white border border-zinc-200 text-zinc-800"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-zinc-200 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-zinc-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500"
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
