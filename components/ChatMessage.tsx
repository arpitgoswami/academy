"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import { User, Bot } from "lucide-react";

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
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex items-start space-x-3 max-w-[85%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${isUser 
            ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
            : 'bg-gradient-to-br from-cyan-500 to-blue-600'}
          shadow-md
        `}>
          {isUser ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <Bot className="w-4 h-4 text-white" />
          )}
        </div>

        {/* Message Bubble */}
        <div className="flex flex-col">
          <div
            className={`
              rounded-2xl px-4 py-3 shadow-sm
              ${isUser
                ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-tr-sm'
                : 'bg-white text-gray-900 border border-gray-200 rounded-tl-sm'}
            `}
          >
            <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''}`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                  code: ({ children, className }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className={`${isUser ? 'bg-white/20' : 'bg-gray-100'} px-1 rounded`}>
                        {children}
                      </code>
                    ) : (
                      <code className={className}>{children}</code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>

          {/* Timestamp */}
          {message.timestamp && (
            <span className={`text-xs text-gray-500 mt-1 px-2 ${isUser ? 'text-right' : 'text-left'}`}>
              {message.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
