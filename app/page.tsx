"use client";

import { useState, useEffect, useRef } from "react";
import SOSView from "@/components/SOSView";
import ChatView from "@/components/ChatView";

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

export default function Home() {
  const [view, setView] = useState<"sos" | "chat">("sos");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const sendMessage = async (message: string, isInitial = false) => {
    setIsLoading(true);

    let newMessages: Message[] = [];

    if (isInitial) {
      newMessages = [];
    } else {
      const userMsg: Message = {
        role: "user",
        content: message,
        timestamp: new Date(),
      };
      newMessages = [...messages, userMsg];
      setMessages(newMessages);
    }

    try {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", timestamp: new Date() },
      ]);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let streamedContent = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          streamedContent += chunk;

          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: streamedContent,
            };
            return updated;
          });
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
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

  const recordSOS = async () => {
    setIsPressed(true);
    try {
      await fetch("/api/sos", { method: "POST" });
      setView("chat");
    } catch (err) {
      console.error("Failed to record SOS", err);
    } finally {
      setIsPressed(false);
    }
  };

  // Shared container style for the "Productivity App" look
  const containerClasses =
    "min-h-screen bg-white text-black font-sans font-light antialiased selection:bg-black selection:text-white flex flex-col";

  if (view === "sos") {
    return (
      <main className={containerClasses}>
        <SOSView
          isPressed={isPressed}
          setIsPressed={setIsPressed}
          recordSOS={recordSOS}
          // Ripples removed to maintain strict minimalism
        />
      </main>
    );
  }

  return (
    <main className={containerClasses}>
      <ChatView
        messages={messages}
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        isLoading={isLoading}
        messagesEndRef={messagesEndRef}
        onClose={() => setView("sos")}
      />
    </main>
  );
}
