import { Send, X } from "lucide-react";

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

// Minimalist Text Formatter Component
// Handles newlines, bold text (**text**), and bullet points (- item)
const FormattedText = ({ text }: { text: string }) => {
  if (!text) return null;

  return (
    <div className="space-y-1">
      {text.split("\n").map((line, i) => {
        // 1. Handle Empty Lines (Paragraph breaks)
        if (!line.trim()) return <div key={i} className="h-2" />;

        // 2. Handle Bullet Points
        if (line.trim().startsWith("- ")) {
          return (
            <div key={i} className="flex gap-3 pl-1">
              <span className="text-black/40 text-[10px] mt-1.5">•</span>
              <span className="flex-1">
                {parseBold(line.trim().substring(2))}
              </span>
            </div>
          );
        }

        // 3. Handle Regular Paragraphs
        return (
          <p key={i} className="min-h-[1.2em]">
            {parseBold(line)}
          </p>
        );
      })}
    </div>
  );
};

// Helper to parse **bold** text
const parseBold = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      // Using font-medium instead of bold to keep the "thin" aesthetic
      return (
        <strong key={index} className="font-medium text-black">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

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
    <div className="flex flex-col h-[100dvh] bg-white text-black font-sans font-light">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-black">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
          <span className="text-sm tracking-[0.2em] uppercase">
            Sentinel AI
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-black hover:text-white transition-colors duration-200 rounded-full"
          aria-label="Close chat"
        >
          <X strokeWidth={1} className="w-5 h-5" />
        </button>
      </header>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={index}
              className={`flex w-full ${
                isUser ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`
                  max-w-[85%] md:max-w-[70%] p-4 text-sm leading-relaxed
                  ${
                    isUser
                      ? "bg-black text-white"
                      : "bg-white text-black border border-black"
                  }
                `}
              >
                {/* Use the formatter for AI, simple text for User */}
                {isUser ? (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                ) : (
                  <FormattedText text={msg.content} />
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="text-xs tracking-widest animate-pulse ml-1 uppercase text-black/50">
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <footer className="p-6 border-t border-black bg-white">
        <div className="flex items-end gap-4 max-w-4xl mx-auto">
          <div className="flex-1 relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && handleSend()
              }
              placeholder="Type your message..."
              className="
                w-full py-3 bg-transparent
                border-b border-black/20 focus:border-black
                outline-none transition-colors duration-300
                text-sm font-light placeholder:text-gray-400
              "
              disabled={isLoading}
              autoFocus
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="
              p-3 border border-black 
              hover:bg-black hover:text-white
              disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black
              transition-all duration-200
            "
            aria-label="Send message"
          >
            <Send strokeWidth={1} className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
