"use client";

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
    <div>
      {/* Chat Header */}
      <header>
        <div>
          <h1>Sentinel AI</h1>
          <p>Online • Ready to help</p>
        </div>
        <button onClick={onClose}>Close</button>
      </header>

      <hr />

      {/* Messages */}
      <div>
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} index={index} />
        ))}

        {isLoading && <div>Loading...</div>}
        <div ref={messagesEndRef} />
      </div>

      <hr />

      {/* Input Area */}
      <footer>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type your message..."
        />
        <button onClick={handleSend} disabled={!input.trim() || isLoading}>
          Send
        </button>
      </footer>
    </div>
  );
}
