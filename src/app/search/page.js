"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import LoadingScreen from "@/components/Loading";
import {
  Search,
  Loader,
  ExternalLink,
  Plus,
  Sparkles,
  Calendar,
  ArrowRight,
} from "lucide-react";

// Custom debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Enhanced markdown-like text formatter
function formatAIResponse(text) {
  if (!text) return [];

  // Split text into paragraphs and process each
  const paragraphs = text.split("\n\n").filter((p) => p.trim());

  return paragraphs.map((paragraph, index) => {
    const trimmed = paragraph.trim();

    // Check for different types of content
    if (trimmed.startsWith("# ")) {
      return {
        type: "h1",
        content: trimmed.substring(2),
        key: `h1-${index}`,
      };
    } else if (trimmed.startsWith("## ")) {
      return {
        type: "h2",
        content: trimmed.substring(3),
        key: `h2-${index}`,
      };
    } else if (trimmed.startsWith("### ")) {
      return {
        type: "h3",
        content: trimmed.substring(4),
        key: `h3-${index}`,
      };
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      // Handle bullet lists
      const items = trimmed
        .split("\n")
        .filter((item) => item.trim().match(/^[-*]\s/));
      return {
        type: "ul",
        items: items.map((item) => item.replace(/^[-*]\s/, "")),
        key: `ul-${index}`,
      };
    } else if (/^\d+\.\s/.test(trimmed)) {
      // Handle numbered lists
      const items = trimmed
        .split("\n")
        .filter((item) => item.trim().match(/^\d+\.\s/));
      return {
        type: "ol",
        items: items.map((item) => item.replace(/^\d+\.\s/, "")),
        key: `ol-${index}`,
      };
    } else if (trimmed.startsWith("> ")) {
      return {
        type: "blockquote",
        content: trimmed.substring(2),
        key: `quote-${index}`,
      };
    } else if (trimmed.startsWith("```")) {
      const lines = trimmed.split("\n");
      const language = lines[0].substring(3);
      const code = lines.slice(1, -1).join("\n");
      return {
        type: "code",
        language,
        content: code,
        key: `code-${index}`,
      };
    } else {
      // Regular paragraph - process inline formatting
      const processedContent = processInlineFormatting(trimmed);
      return {
        type: "p",
        content: processedContent,
        key: `p-${index}`,
      };
    }
  });
}

// Process inline formatting (bold, italic, code, links)
function processInlineFormatting(text) {
  // Convert **bold** to <strong>
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Convert *italic* to <em>
  text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");

  // Convert `code` to <code>
  text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Convert [text](url) to links
  text = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>'
  );

  return text;
}

// Component to render formatted content
function FormattedContent({ content }) {
  switch (content.type) {
    case "h1":
      return (
        <h1
          key={content.key}
          className="text-3xl font-bold text-gray-900 mb-6 border-b-2 border-gray-200 pb-2"
        >
          {content.content}
        </h1>
      );
    case "h2":
      return (
        <h2
          key={content.key}
          className="text-2xl font-semibold text-gray-800 mb-4 mt-6"
        >
          {content.content}
        </h2>
      );
    case "h3":
      return (
        <h3
          key={content.key}
          className="text-xl font-medium text-gray-800 mb-3 mt-5"
        >
          {content.content}
        </h3>
      );
    case "ul":
      return (
        <ul
          key={content.key}
          className="list-disc list-inside space-y-2 mb-4 ml-4"
        >
          {content.items.map((item, i) => (
            <li key={i} className="text-gray-700 leading-relaxed">
              <span
                dangerouslySetInnerHTML={{
                  __html: processInlineFormatting(item),
                }}
              />
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol
          key={content.key}
          className="list-decimal list-inside space-y-2 mb-4 ml-4"
        >
          {content.items.map((item, i) => (
            <li key={i} className="text-gray-700 leading-relaxed">
              <span
                dangerouslySetInnerHTML={{
                  __html: processInlineFormatting(item),
                }}
              />
            </li>
          ))}
        </ol>
      );
    case "blockquote":
      return (
        <blockquote
          key={content.key}
          className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-blue-50 rounded-r-lg"
        >
          <p
            className="text-gray-700 italic"
            dangerouslySetInnerHTML={{
              __html: processInlineFormatting(content.content),
            }}
          />
        </blockquote>
      );
    case "code":
      return (
        <div key={content.key} className="mb-4">
          <div className="bg-gray-900 text-gray-100 rounded-lg overflow-hidden">
            <div className="bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300">
              {content.language || "code"}
            </div>
            <pre className="p-4 overflow-x-auto">
              <code>{content.content}</code>
            </pre>
          </div>
        </div>
      );
    case "p":
    default:
      return (
        <p
          key={content.key}
          className="mb-4 text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content.content }}
        />
      );
  }
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [error, setError] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [streamedAnswer, setStreamedAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const eventSourceRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Cleanup function
  const cleanup = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    // Cleanup previous requests
    cleanup();

    // Reset states
    setImages([]);
    setError("");
    setStreamedAnswer("");
    setSources([]);
    setIsLoading(true);
    setShowLoadingScreen(true);
    setIsStreaming(false);

    try {
      // Create abort controller for fetch request
      abortControllerRef.current = new AbortController();

      // Fetch images first
      const imagesResponse = await fetch(
        `/api/images?query=${encodeURIComponent(query)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal: abortControllerRef.current.signal,
        }
      );

      if (!imagesResponse.ok) throw new Error("Failed to fetch images");

      const imagesData = await imagesResponse.json();
      if (imagesData?.results) {
        setImages(imagesData.results.slice(0, 8));
      }

      // Start streaming search results immediately after images are loaded
      setIsStreaming(true);
      eventSourceRef.current = new EventSource(
        `/api/search?q=${encodeURIComponent(query)}`
      );

      eventSourceRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case "sources":
              setSources(data.data || []);
              break;
            case "chunk":
              // Hide loading screen when first chunk arrives
              setShowLoadingScreen(false);
              setStreamedAnswer((prev) => prev + (data.data || ""));
              break;
            case "done":
              setIsStreaming(false);
              cleanup();
              break;
            case "error":
              throw new Error(data.message || "Streaming error");
          }
        } catch (e) {
          console.error("Error parsing SSE data:", e);
          setError("Error processing response");
          setIsStreaming(false);
          setShowLoadingScreen(false);
          cleanup();
        }
      };

      eventSourceRef.current.onerror = (event) => {
        console.error("SSE connection error:", event);
        setError("Connection error. Please try again.");
        setIsStreaming(false);
        setShowLoadingScreen(false);
        cleanup();
      };
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Search error:", err);
        setError("Failed to get response. Please try again.");
      }
      setShowLoadingScreen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSearch = () => setIsSearchOpen(true);

  const handleCloseSearch = () => {
    cleanup();
    setIsSearchOpen(false);
    setQuery("");
    setImages([]);
    setError("");
    setStreamedAnswer("");
    setSources([]);
    setIsStreaming(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "Escape") handleCloseSearch();
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, []);

  const hasResults = streamedAnswer || images.length > 0 || sources.length > 0;
  const formattedContent = formatAIResponse(streamedAnswer);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(120,119,198,0.1),transparent_50%)]" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_49%,rgba(59,130,246,0.05)_50%,transparent_51%)] bg-[length:20px_20px]" />
        </div>
      </div>

      {/* Custom CSS for inline code styling */}
      <style jsx global>{`
        .inline-code {
          background-color: #f3f4f6;
          color: #374151;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas,
            "Liberation Mono", Menlo, monospace;
          font-size: 0.875em;
        }
      `}</style>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <AnimatePresence mode="wait">
          {!isSearchOpen ? (
            // Landing Page
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col items-center justify-center p-4"
            >
              {/* Minimal Logo Section */}
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center mb-8"
              >
                <motion.div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                  <Image
                    src="/logo.svg"
                    alt="Easy Notes Logo"
                    width={224}
                    height={224}
                    priority
                    className="w-full h-auto"
                  />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="text-3xl font-semibold text-gray-900 mb-2"
                >
                  Easy Notes
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="text-sm text-gray-500"
                >
                  Ask anything, discover everything
                </motion.p>
              </motion.div>

              {/* Blue Gradient Button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 20px 40px -10px rgba(59, 130, 246, 0.3)",
                }}
                whileTap={{ scale: 0.98 }}
                onClick={handleOpenSearch}
                className="relative w-full max-w-md h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-2xl flex items-center justify-center px-6 transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"
                  initial={false}
                />
                <motion.span
                  className="relative text-white font-medium text-sm"
                  animate={{
                    x: [0, 2, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  Start Searching
                </motion.span>
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  animate={{
                    background: [
                      "linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)",
                      "linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)",
                    ],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              </motion.button>
            </motion.div>
          ) : (
            // Search Interface
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="flex-1 flex flex-col p-6 max-w-6xl mx-auto w-full"
            >
              {/* Header with Search */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <form
                  onSubmit={handleSearch}
                  className="flex w-full max-w-xl mx-auto bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200/25 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ask me anything..."
                      required
                      className="w-full p-4 pl-6 text-base placeholder-gray-400 text-gray-900 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !query.trim()}
                    className="w-14 flex justify-center items-center bg-blue-500 hover:bg-blue-600 transition-colors duration-200"
                    aria-label="Search"
                  >
                    <Search className="w-5 h-5 text-white" />
                  </button>
                </form>
              </motion.div>

              {/* Results */}
              <div className="flex-1 space-y-8">
                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-3xl shadow-lg"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Loading Screen */}
                <AnimatePresence>
                  {showLoadingScreen && <LoadingScreen />}
                </AnimatePresence>

                {/* Actual Results */}
                <AnimatePresence>
                  {!showLoadingScreen && hasResults && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-8"
                    >
                      {/* Images */}
                      {images.length > 0 && (
                        <motion.div className="overflow-x-auto pb-4">
                          <div className="flex space-x-4 min-w-max">
                            {images.map((image, idx) => (
                              <motion.div
                                key={image.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="relative group"
                              >
                                <a href={image.source.url} target="_blank">
                                  <div className="w-40 aspect-[3/4] rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 group relative">
                                    <img
                                      src={image.urls.regular}
                                      alt={
                                        image.alt_description || "Search result"
                                      }
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                  </div>
                                </a>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* Enhanced Answer with Formatting */}
                      {streamedAnswer && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="prose prose-lg max-w-none">
                            {formattedContent.map((content, index) => (
                              <div key={content.key}>
                                {index === 0 && (
                                  <h1 className="text-3xl font-bold text-blue-600 mb-4">
                                    {content.text?.split(".")[0]}
                                  </h1>
                                )}
                                <FormattedContent
                                  content={{
                                    ...content,
                                    text:
                                      index === 0
                                        ? content.text
                                            ?.split(".")
                                            .slice(1)
                                            .join(".")
                                            .replace(/\./g, ".\n")
                                        : content.text?.replace(/\./g, ".\n"),
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* Sources */}
                      {sources.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center gap-3 mb-6">
                            <p className="text-gray-800">Sources</p>
                          </div>

                          <div className="grid gap-8">
                            {sources.map((source, i) => {
                              const domain =
                                source.domain || new URL(source.link).hostname;
                              const favicon = `https://www.google.com/s2/favicons?sz=32&domain=${domain}`;

                              return (
                                <motion.a
                                  key={i}
                                  href={source.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.1 }}
                                  className="group transition-all duration-300 flex items-start gap-4"
                                >
                                  <div className="w-8 h-8 rounded-md overflow-hidden shadow-md bg-gray-50 flex items-center justify-center flex-shrink-0">
                                    <img
                                      src={favicon}
                                      alt={domain}
                                      className="w-4 h-4 object-contain"
                                    />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <h4 className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                        {source.title || "Untitled Source"}
                                      </h4>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                      <span className="flex items-center gap-1">
                                        {domain}
                                      </span>
                                      {source.publishedDate && (
                                        <span className="flex items-center gap-1">
                                          <Calendar className="w-4 h-4" />
                                          {new Date(
                                            source.publishedDate
                                          ).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </motion.a>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
