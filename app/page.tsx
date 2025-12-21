"use client";

import { useState, useEffect, useRef } from "react";
import SOSView from "@/components/SOSView";
import ChatView from "@/components/ChatView";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  if (view === "sos") {
    return (
      <SOSView
        isPressed={isPressed}
        setIsPressed={setIsPressed}
        ripples={ripples}
        recordSOS={recordSOS}
      />
    );
  }

  return (
    <ChatView
      messages={messages}
      input={input}
      setInput={setInput}
      handleSend={handleSend}
      isLoading={isLoading}
      messagesEndRef={messagesEndRef}
      onClose={() => setView("sos")}
    />
  );
}
