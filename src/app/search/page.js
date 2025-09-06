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
  X,
  Sparkles,
  Globe,
  Calendar,
  Link2,
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

// Skeleton Components
const ImageSkeleton = ({ index }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.1 }}
    className="w-64 aspect-square rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-gray-100 to-gray-200"
  >
    <motion.div
      className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-50"
      animate={{ x: ["-100%", "100%"] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  </motion.div>
);

const SourceSkeleton = ({ index }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="p-6 rounded-xl border border-gray-100 bg-white"
  >
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
      <div className="flex-1 space-y-3">
        <div className="h-5 bg-gray-200 rounded-lg w-3/4 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
        <div className="flex gap-4">
          <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
        </div>
      </div>
    </div>
  </motion.div>
);

const AnswerSkeleton = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="p-8 bg-white rounded-3xl shadow-xl border border-gray-100"
  >
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl animate-pulse" />
      <div className="h-6 bg-gray-200 rounded-lg w-32 animate-pulse" />
    </div>
    <div className="space-y-4">
      {[100, 85, 95, 70].map((width, i) => (
        <motion.div
          key={i}
          className="h-4 bg-gray-200 rounded-full animate-pulse"
          style={{ width: `${width}%` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
        />
      ))}
    </div>
  </motion.div>
);

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [showSkeletons, setShowSkeletons] = useState(false);
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
    setShowSkeletons(false);

    try {
      // Create abort controller for fetch request
      abortControllerRef.current = new AbortController();

      // Fetch images
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

      // Wait for loading screen
      await new Promise((resolve) => setTimeout(resolve, 3000));
      setShowLoadingScreen(false);
      setShowSkeletons(true);

      // Start streaming search results
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
              setStreamedAnswer((prev) => prev + (data.data || ""));
              break;
            case "done":
              setIsStreaming(false);
              setShowSkeletons(false);
              cleanup();
              break;
            case "error":
              throw new Error(data.message || "Streaming error");
          }
        } catch (e) {
          console.error("Error parsing SSE data:", e);
          setError("Error processing response");
          setIsStreaming(false);
          setShowSkeletons(false);
          cleanup();
        }
      };

      eventSourceRef.current.onerror = (event) => {
        console.error("SSE connection error:", event);
        setError("Connection error. Please try again.");
        setIsStreaming(false);
        setShowSkeletons(false);
        cleanup();
      };
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Search error:", err);
        setError("Failed to get response. Please try again.");
      }
      setShowSkeletons(false);
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
    setShowSkeletons(false);
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

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <AnimatePresence mode="wait">
          {!isSearchOpen ? (
            // Landing Page
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="flex-1 flex flex-col items-center justify-center p-6"
            >
              {/* Logo Section */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
                className="text-center mb-12"
              >
                <motion.div
                  animate={{
                    rotate: [0, 2, -2, 0],
                    scale: [1, 1.02, 1],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative mb-8"
                >
                  <div className="w-56 h-56 mx-auto flex items-center justify-center relative">
                    <Image
                      src="/logo.svg"
                      alt="Easy Notes Logo"
                      width={224}
                      height={224}
                      priority
                      className="w-full h-auto drop-shadow-lg"
                    />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                    />
                  </div>
                </motion.div>

                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-7xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4"
                >
                  Easy Notes
                </motion.h1>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="text-2xl text-gray-600 font-light"
                >
                  Ask anything, discover everything
                </motion.p>
              </motion.div>

              {/* Search Button */}
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.7,
                }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleOpenSearch}
                className="group relative w-full max-w-lg h-18 bg-white/80 backdrop-blur-sm rounded-3xl flex items-center justify-between px-8 py-6 shadow-2xl hover:shadow-3xl transition-all duration-300 border border-white/50"
              >
                <span className="text-gray-500 text-lg">
                  Start your search...
                </span>
                <motion.div
                  className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white"
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.3 }}
                >
                  <Plus className="w-5 h-5" />
                </motion.div>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-3xl opacity-0 group-hover:opacity-100"
                  transition={{ duration: 0.3 }}
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
                <form onSubmit={handleSearch} className="flex gap-4">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ask me anything..."
                      className="w-full p-6 rounded-3xl border border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg bg-white/80 backdrop-blur-sm text-gray-900 placeholder-gray-500 text-lg"
                      autoFocus
                    />
                    <Search className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !query.trim()}
                    className="px-8 py-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-3xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? (
                      <Loader className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        Search
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
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

                {/* Skeletons */}
                {showSkeletons && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-8"
                  >
                    {/* Image Skeletons */}
                    <div className="overflow-x-auto pb-4">
                      <div className="flex space-x-6 min-w-max">
                        {[0, 1, 2, 3].map((i) => (
                          <ImageSkeleton key={i} index={i} />
                        ))}
                      </div>
                    </div>

                    {/* Answer Skeleton */}
                    <AnswerSkeleton />

                    {/* Sources Skeleton */}
                    <div className="space-y-4">
                      {[0, 1, 2].map((i) => (
                        <SourceSkeleton key={i} index={i} />
                      ))}
                    </div>
                  </motion.div>
                )}

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
                          <div className="flex space-x-6 min-w-max">
                            {images.map((image, idx) => (
                              <motion.div
                                key={image.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="relative group"
                              >
                                <div className="w-64 aspect-square rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
                                  <img
                                    src={image.urls.regular}
                                    alt={
                                      image.alt_description || "Search result"
                                    }
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                                <a
                                  href={image.source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm text-gray-800 p-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2"
                                >
                                  <img
                                    src={image.source.favicon}
                                    alt={image.source.name}
                                    className="w-5 h-5 rounded"
                                  />
                                  <span className="text-sm font-medium truncate">
                                    {image.source.name}
                                  </span>
                                  <ExternalLink className="w-4 h-4 ml-auto flex-shrink-0" />
                                </a>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* Answer */}
                      {streamedAnswer && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100"
                        >
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                              <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800">
                              Answer
                            </h3>
                            {isStreaming && (
                              <motion.div
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="w-2 h-2 bg-blue-500 rounded-full ml-2"
                              />
                            )}
                          </div>
                          <div className="prose prose-lg max-w-none">
                            {streamedAnswer.split("\n").map((line, i) => (
                              <p
                                key={i}
                                className="mb-4 text-gray-700 leading-relaxed"
                              >
                                {line}
                              </p>
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
                            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
                              <Globe className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800">
                              Sources
                            </h3>
                            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                              {sources.length} results
                            </span>
                          </div>

                          <div className="grid gap-4">
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
                                  className="group p-6 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 flex items-start gap-4"
                                >
                                  <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md bg-gray-50 flex items-center justify-center flex-shrink-0">
                                    <img
                                      src={favicon}
                                      alt={domain}
                                      className="w-8 h-8 object-contain"
                                    />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                        {source.title || "Untitled Source"}
                                      </h4>
                                      <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                                    </div>

                                    {source.description && (
                                      <p className="text-gray-600 mb-3 line-clamp-2">
                                        {source.description}
                                      </p>
                                    )}

                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                      <span className="flex items-center gap-1">
                                        <Globe className="w-4 h-4" />
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

              {/* Close Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={handleCloseSearch}
                className="fixed top-6 right-6 w-12 h-12 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group border border-gray-200"
              >
                <X className="w-6 h-6 text-gray-600 group-hover:text-red-500 transition-colors" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
