"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader, ExternalLink } from "lucide-react";

// Custom debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const debouncedQuery = useDebounce(query, 500);

  // Handle search when debounced query changes
  useEffect(() => {
    const searchQuery = async () => {
      if (!debouncedQuery.trim()) return;

      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(debouncedQuery)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch response");
        }

        const data = await response.json();
        setSearchResult(data);
      } catch (err) {
        setError("Failed to get response. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (debouncedQuery) {
      searchQuery();
    }
  }, [debouncedQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    // The search will be triggered automatically by the debounce effect
  };

  // Handle keyboard shortcuts
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSearch(e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6"
    >
      <div className="max-w-4xl mx-auto">
        <motion.h1
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8 text-center"
        >
          AI Search Assistant
        </motion.h1>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <motion.input
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300 }}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Enter your question... (Ctrl + Enter to search)"
                className="w-full p-4 pl-12 rounded-2xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg bg-white/80 backdrop-blur-sm"
                required
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className={`px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Searching...</span>
                </div>
              ) : (
                "Search"
              )}
            </motion.button>
          </div>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 mb-6 bg-red-50 border border-red-200 text-red-600 rounded-2xl shadow-md"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {searchResult?.answer && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <motion.div className="p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-100">
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6"
                >
                  Answer
                </motion.h2>
                <div className="prose max-w-none">
                  {searchResult.answer.split("\n").map((line, i) => (
                    <motion.p
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="mb-4 text-gray-700 leading-relaxed"
                    >
                      {line}
                    </motion.p>
                  ))}
                </div>
              </motion.div>

              {searchResult.sources && searchResult.sources.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="p-6 bg-gray-50/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100"
                >
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    Sources
                  </h3>
                  <div className="space-y-3">
                    {searchResult.sources.map((source, i) => (
                      <motion.a
                        key={i}
                        href={source.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="text-sm underline">
                          {source.title}
                        </span>
                      </motion.a>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading && !searchResult?.answer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4 p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-100"
          >
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="h-4 bg-blue-100 rounded-full"
                initial={{ width: "100%" }}
                animate={{ width: ["100%", "50%", "80%", "100%"] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
