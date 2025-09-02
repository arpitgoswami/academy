"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";

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

// Image Skeleton Component
const ImageSkeleton = ({ index }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.1 }}
    className="aspect-square rounded-xl overflow-hidden shadow-md bg-gray-100"
  >
    <motion.div
      className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"
      animate={{ x: ["-100%", "100%"] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
        delay: index * 0.2,
      }}
    />
  </motion.div>
);

// Source Skeleton Component
const SourceSkeleton = ({ index }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 + index * 0.1 }}
    className="p-6 border-b border-gray-100 last:border-b-0"
  >
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-center gap-2">
          <motion.div
            className="h-5 bg-gray-200 rounded"
            initial={{ width: "60%" }}
            animate={{ width: ["60%", "80%", "60%"] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
        </div>
        <motion.div
          className="h-4 bg-gray-200 rounded"
          initial={{ width: "90%" }}
          animate={{ width: ["90%", "70%", "90%"] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3,
          }}
        />
        <motion.div
          className="h-4 bg-gray-200 rounded"
          initial={{ width: "75%" }}
          animate={{ width: ["75%", "85%", "75%"] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.6,
          }}
        />
        <div className="flex items-center gap-4">
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  </motion.div>
);

// Answer Skeleton Component
const AnswerSkeleton = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="p-8 bg-white rounded-2xl shadow-lg border border-gray-100"
  >
    <div className="flex items-center gap-3 mb-6">
      <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
      <div className="h-5 bg-gray-200 rounded w-24 animate-pulse" />
    </div>
    {[1, 2, 3, 4].map((i) => (
      <motion.div
        key={i}
        className="h-4 bg-gray-200 rounded-full mb-4"
        initial={{ width: "100%" }}
        animate={{ width: ["100%", "60%", "85%", "100%"] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: i * 0.2,
        }}
      />
    ))}
  </motion.div>
);

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    // Clear previous results when starting a new search
    setSearchResult(null);
    setImages([]);
    setError("");
    setIsLoading(true);

    try {
      // Fetch search results and images in parallel
      const [searchResponse, imagesResponse] = await Promise.all([
        fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }),
        fetch(`/api/images?query=${encodeURIComponent(query)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }),
      ]);

      if (!searchResponse.ok || !imagesResponse.ok) {
        throw new Error("Failed to fetch response");
      }

      const [searchData, imagesData] = await Promise.all([
        searchResponse.json(),
        imagesResponse.json(),
      ]);

      // Debug log
      console.log("Search Response:", searchData);
      console.log("Images Response:", imagesData);

      if (searchData) {
        setSearchResult(searchData);
      }
      if (imagesData?.results) {
        setImages(imagesData.results.slice(0, 4));
      }
    } catch (err) {
      setError("Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSearch = () => {
    setIsSearchOpen(true);
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    setQuery("");
    setSearchResult(null);
    setImages([]);
    setError("");
  };

  // Handle keyboard shortcuts
  const handleKeyPress = (e) => {
    if (e.key === "Escape") {
      handleCloseSearch();
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden poppins-regular">
      {/* Gradient Background */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-white via-blue-50 to-blue-100"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(240,249,255,1) 50%, rgba(219,234,254,1) 100%)",
        }}
      >
        {/* Subtle Overlay Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25px 25px, #60A5FA 2px, transparent 0)`,
              backgroundSize: "50px 50px",
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <AnimatePresence mode="wait">
          {!isSearchOpen ? (
            // Logo and Plus Button View
            <motion.div
              key="logo-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-1 flex flex-col items-center justify-center p-6"
            >
              {/* Logo */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-center mb-16"
              >
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="relative mb-8"
                >
                  <div className="w-48 h-48 mx-auto flex items-center justify-center">
                    <Image
                      src="/logo.svg"
                      alt="Logo"
                      width={209}
                      height={43}
                      priority
                      className="w-full h-auto"
                    />
                  </div>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-3xl blur-2xl opacity-20"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </motion.div>
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-6xl font-bold text-gray-900 mb-4"
                >
                  Easy Notes
                </motion.h1>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="text-xl text-gray-600 font-light"
                >
                  Ask anything, discover everything
                </motion.p>
              </motion.div>

              {/* Plus Button */}
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.8,
                }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleOpenSearch}
                className="group relative w-full max-w-md h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
              >
                <Plus className="w-8 h-8 text-gray-400 group-hover:text-indigo-600 group-hover:rotate-90 transition-all duration-300" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-2xl opacity-0 group-hover:opacity-5"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
            </motion.div>
          ) : (
            // Search Interface View
            <motion.div
              key="search-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-1 flex flex-col p-6 max-w-4xl mx-auto w-full"
            >
              {/* Search Form */}
              <motion.form
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                onSubmit={handleSearch}
                className="mb-8"
              >
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <motion.input
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      whileFocus={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ask me anything..."
                      className="w-full p-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm bg-white text-gray-900 placeholder-gray-500"
                      autoFocus
                    />
                  </div>
                  <motion.button
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading || !query.trim()}
                    className={`px-6 py-4 bg-indigo-600 text-white rounded-2xl font-semibold shadow-sm hover:bg-indigo-700 transition-all duration-200 ${
                      isLoading || !query.trim()
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {isLoading ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      "Search"
                    )}
                  </motion.button>
                </div>
              </motion.form>

              {/* Results Area */}
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl shadow-sm"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Loading State */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Image Skeletons */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
                    >
                      {[0, 1, 2, 3].map((index) => (
                        <ImageSkeleton key={index} index={index} />
                      ))}
                    </motion.div>

                    {/* Answer Skeleton */}
                    <AnswerSkeleton />

                    {/* Sources Skeleton */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
                    >
                      <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
                          <div className="h-5 bg-gray-200 rounded w-20 animate-pulse" />
                          <div className="h-5 bg-gray-200 rounded-full px-2 py-1 w-16 animate-pulse" />
                        </div>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {[0, 1, 2].map((index) => (
                          <SourceSkeleton key={index} index={index} />
                        ))}
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {/* Actual Results */}
                <AnimatePresence>
                  {!isLoading &&
                    (searchResult?.answer || images.length > 0) && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-6"
                      >
                        {/* Images Grid */}
                        {images.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
                          >
                            {images.map((image, idx) => (
                              <motion.div
                                key={image.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="aspect-square rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200"
                              >
                                <img
                                  src={image.urls.regular}
                                  alt={
                                    image.alt_description ||
                                    "Search result image"
                                  }
                                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-200"
                                />
                              </motion.div>
                            ))}
                          </motion.div>
                        )}

                        {/* Answer Section */}
                        {searchResult?.answer && (
                          <motion.div className="p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
                            <div className="prose max-w-none">
                              {searchResult.answer
                                .split("\n")
                                .map((line, i) => (
                                  <motion.p
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className={`mb-4 leading-relaxed ${
                                      i === 0
                                        ? "text-2xl font-bold text-blue-600"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    {line}
                                  </motion.p>
                                ))}
                            </div>
                          </motion.div>
                        )}

                        {searchResult?.sources &&
                          searchResult.sources.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.3 }}
                              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
                            >
                              <div className="p-6 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Globe className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <h4 className="text-lg font-semibold text-gray-900">
                                    Sources
                                  </h4>
                                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                    {searchResult.sources.length} results
                                  </span>
                                </div>
                              </div>

                              <div className="divide-y divide-gray-100">
                                {searchResult.sources.map((source, i) => (
                                  <motion.a
                                    key={i}
                                    href={source.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 + i * 0.1 }}
                                    className="group block p-6 hover:bg-gray-50 transition-all duration-200"
                                  >
                                    <div className="flex items-start gap-4">
                                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                                        <Link2 className="w-5 h-5 text-white" />
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                          <h5 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors duration-200 truncate">
                                            {source.title || "Untitled Source"}
                                          </h5>
                                          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 flex-shrink-0 transition-colors duration-200" />
                                        </div>

                                        {source.description && (
                                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                            {source.description}
                                          </p>
                                        )}

                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                          <span className="flex items-center gap-1">
                                            <Globe className="w-3 h-3" />
                                            {source.domain ||
                                              new URL(source.link).hostname}
                                          </span>
                                          {source.publishedDate && (
                                            <span className="flex items-center gap-1">
                                              <Calendar className="w-3 h-3" />
                                              {new Date(
                                                source.publishedDate
                                              ).toLocaleDateString()}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </motion.a>
                                ))}
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
