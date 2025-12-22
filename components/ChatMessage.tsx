"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

interface ChatMessageProps {
  message: Message;
  index: number;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div>
      {/* Sender Label */}
      <strong>{message.role === "user" ? "You" : "Assistant"}:</strong>

      {/* Message Content */}
      <div>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {message.content}
        </ReactMarkdown>
      </div>

      {/* Timestamp */}
      {message.timestamp && (
        <small>
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </small>
      )}

      <br />
      <br />
    </div>
  );
}
