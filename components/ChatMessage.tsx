"use client";

import { Shield } from "lucide-react";
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

export default function ChatMessage({ message, index }: ChatMessageProps) {
  return (
    <div
      className={`flex ${
        message.role === "user" ? "justify-end" : "justify-start"
      } animate-slideIn`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div
        className={`flex items-end gap-2 max-w-[85%] ${
          message.role === "user" ? "flex-row-reverse" : ""
        }`}
      >
        {message.role === "assistant" && (
          <div className="shrink-0 w-8 h-8 rounded-xl bg-linear-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-md">
            <Shield className="w-4 h-4 text-white" />
          </div>
        )}
        <div
          className={`px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
            message.role === "user"
              ? "bg-linear-to-br from-slate-800 to-slate-700 text-white rounded-br-md"
              : "bg-white border border-slate-100 text-slate-700 rounded-bl-md"
          }`}
        >
          <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-headings:mt-3 prose-headings:mb-2 prose-p:my-2 prose-blockquote:my-2 prose-blockquote:border-l-rose-500 prose-blockquote:bg-slate-50 prose-blockquote:py-1 prose-table:my-2 prose-th:bg-slate-100 prose-th:p-2 prose-td:p-2 prose-strong:text-slate-900 prose-strong:font-bold">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
          {message.timestamp && (
            <p
              className={`text-xs mt-1.5 ${
                message.role === "user" ? "text-slate-400" : "text-slate-400"
              }`}
            >
              {message.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
