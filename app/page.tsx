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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView();
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

    // 1. Prepare the message history to send to API
    let newMessages: Message[] = [];

    if (isInitial) {
      // If it's the starting prompt, history is empty
      newMessages = [];
    } else {
      // Otherwise, add the user's new message to history
      const userMsg: Message = {
        role: "user",
        content: message,
        timestamp: new Date(),
      };
      newMessages = [...messages, userMsg];
      // Update UI immediately with user message
      setMessages(newMessages);
    }

    try {
      // 2. Add a blank placeholder for the Assistant's incoming response
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

      // 3. Set up the stream reader
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let streamedContent = "";

      // 4. Read the stream chunk by chunk
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          streamedContent += chunk;

          // Update the last message (the placeholder) with the new text
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
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
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

  const recordSOS = async (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsPressed(true);
    try {
      await fetch("/api/sos", { method: "POST" });
      setIsPressed(false);
      setView("chat");
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
        ripples={[]}
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
