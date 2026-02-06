"use client";

import React, { useState, useEffect } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [contrastMode, setContrastMode] = useState("normal");
  const [textSize, setTextSize] = useState("normal");
  const [showSettings, setShowSettings] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [articles, setArticles] = useState([]);

  // Load API key from environment on component mount
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const response = await fetch("/api/get-api-key");
        const data = await response.json();
        if (data.apiKey) {
          setApiKey(data.apiKey);
        }
      } catch (error) {
        console.error("Failed to load API key:", error);
      }
    };
    loadApiKey();
  }, []);

  // Call backend API to fetch and summarize news
  const fetchAndSummarize = async () => {
    if (!apiKey) {
      const msg = "API Key not loaded. Please check your .env file configuration.";
      setSummary(msg);
      speak(msg);
      return;
    }

    setLoading(true);
    const displayQuery = searchQuery.trim() || "top and most popular global headlines from major news sources";
    setSummary(`Fetching news about: ${displayQuery}. Please wait.`);
    speak(`Fetching news about: ${displayQuery}. Please wait.`);

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchQuery, apiKey }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const result = data.result;
      setSummary(result);
      setHasSearched(true);
      setLoading(false);
      speak("Summary complete. " + result);
    } catch (error) {
      console.error("Error fetching summary:", error);
      const errorMsg = "Sorry, failed to fetch news due to API misconfiguration or network issues.";
      setSummary(errorMsg);
      speak(errorMsg);
      setLoading(false);
    }
  };

  // Text-to-speech function (using built-in browser API)
  const speak = (text) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      // Stop previous playback first
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  // Get contrast mode styles
  const getContrastStyles = () => {
    if (contrastMode === "high") {
      return {
        bgClass: "bg-black",
        textClass: "text-white",
        borderClass: "border-white",
        accentClass: "bg-yellow-300 text-black",
      };
    } else if (contrastMode === "dark") {
      return {
        bgClass: "bg-slate-950",
        textClass: "text-slate-100",
        borderClass: "border-slate-300",
        accentClass: "bg-blue-600",
      };
    }
    return {
      bgClass: "bg-zinc-900",
      textClass: "text-white",
      borderClass: "border-zinc-700",
      accentClass: "bg-emerald-500 hover:bg-emerald-400",
    };
  };

  // Get text size multiplier
  const getTextSizeClass = (baseSize) => {
    if (textSize === "large") {
      return `text-[${parseInt(baseSize.replace("text-", "").replace("xl", "4")) * 1.3}xl]`;
    } else if (textSize === "small") {
      return `text-[${parseInt(baseSize.replace("text-", "").replace("xl", "4")) * 0.8}xl]`;
    }
    return baseSize;
  };

  const contrastStyles = getContrastStyles();

  // Get background styles
  const getBgStyles = () => {
    if (contrastMode === "high") {
      return {
        bg: "bg-white",
        text: "text-black",
        accent: "text-yellow-500",
        secondaryBg: "bg-gray-100",
        card: "bg-white border-black",
        input: "bg-white text-black border-black focus:ring-yellow-400",
      };
    } else if (contrastMode === "dark") {
      return {
        bg: "bg-slate-950",
        text: "text-slate-100",
        accent: "text-blue-400",
        secondaryBg: "bg-slate-900",
        card: "bg-slate-900 border-slate-400",
        input: "bg-slate-900 text-slate-100 border-slate-400 focus:ring-blue-400",
      };
    }
    return {
      bg: "bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50",
      text: "text-gray-900",
      accent: "text-blue-600",
      secondaryBg: "bg-white",
      card: "bg-white border-gray-200 shadow-sm hover:shadow-md",
      input: "bg-white text-gray-900 border-gray-300 focus:ring-blue-500",
    };
  };

  const bgStyles = getBgStyles();

  return (
    <div className={`min-h-screen ${bgStyles.bg} transition-colors duration-300`}>
      <style>{`
        @keyframes fadeUpSlide {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-100vh);
          }
        }
        @keyframes slideDown {
          from {
            transform: translateY(-100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-up {
          animation: fadeUpSlide 0.8s ease-out;
        }
        .animate-fade-up-delay-1 {
          animation: fadeUpSlide 0.8s ease-out 0.2s both;
        }
        .animate-fade-up-delay-2 {
          animation: fadeUpSlide 0.8s ease-out 0.4s both;
        }
        .animate-slide-up-exit {
          animation: slideUp 0.5s ease-in forwards;
        }
        .animate-slide-down-enter {
          animation: slideDown 0.6s ease-out forwards;
        }
        .animate-fade-in-enter {
          animation: fadeIn 0.8s ease-out 0.3s forwards;
        }
      `}</style>
      {/* Settings button - top right corner */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className={`fixed top-6 right-6 z-50 p-3 rounded-full ${
          contrastMode === "high"
            ? "bg-black text-yellow-400 border-2 border-black"
            : contrastMode === "dark"
            ? "bg-slate-800 text-blue-400 border-2 border-slate-400"
            : "bg-blue-600 text-white shadow-lg hover:shadow-xl hover:bg-blue-700"
        } font-bold text-lg transition-all duration-200`}
        aria-label="Toggle accessibility settings"
      >
        ⚙️
      </button>

      {/* Accessibility Settings Panel */}
      {showSettings && (
        <div className={`fixed inset-0 z-40 ${
          contrastMode === "high"
            ? "bg-black bg-opacity-50"
            : contrastMode === "dark"
            ? "bg-black bg-opacity-70"
            : "bg-black bg-opacity-30"
        } flex items-center justify-center p-4 backdrop-blur-sm`}>
          <div className={`${bgStyles.secondaryBg} ${bgStyles.text} rounded-2xl p-8 max-w-md w-full border-4 ${
            contrastMode === "high" ? "border-black" : contrastMode === "dark" ? "border-slate-400" : "border-gray-200"
          }`}>
            <h3 className={`text-3xl font-bold mb-8`}>Accessibility Settings</h3>
            
            {/* Contrast Mode */}
            <div className="mb-8">
              <label className="block font-bold mb-4 text-xl">Contrast Mode:</label>
              <div className="space-y-3">
                {["normal", "high", "dark"].map((mode) => (
                  <label key={mode} className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name="contrast"
                      value={mode}
                      checked={contrastMode === mode}
                      onChange={(e) => setContrastMode(e.target.value)}
                      className="w-6 h-6 mr-4 cursor-pointer"
                    />
                    <span className="capitalize text-xl font-semibold group-hover:underline">{mode === "normal" ? "Light" : mode} Contrast</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Text Size */}
            <div className="mb-8">
              <label className="block font-bold mb-4 text-xl">Text Size:</label>
              <div className="space-y-3">
                {["small", "normal", "large"].map((size) => (
                  <label key={size} className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name="textsize"
                      value={size}
                      checked={textSize === size}
                      onChange={(e) => setTextSize(e.target.value)}
                      className="w-6 h-6 mr-4 cursor-pointer"
                    />
                    <span className="text-xl font-semibold group-hover:underline">
                      {size === "small" ? "📱 Small" : size === "large" ? "🔍 Large" : "⚪ Normal"} Text
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 border-2 ${
                contrastMode === "high"
                  ? "bg-black text-yellow-400 border-black hover:bg-gray-900"
                  : contrastMode === "dark"
                  ? "bg-slate-800 text-blue-400 border-slate-400 hover:bg-slate-700"
                  : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
              }`}
            >
              Close Settings
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!hasSearched ? (
        // Landing Page
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <h1 className={`animate-fade-up text-6xl md:text-7xl font-black ${bgStyles.text} mb-4 text-center tracking-tight`}>
            News<span className={bgStyles.accent}>Lens</span>
          </h1>
          
          <p className={`animate-fade-up-delay-1 text-2xl md:text-3xl ${bgStyles.text} text-center mb-12 max-w-2xl font-light opacity-80`}>
            Accessible News for Everyone
          </p>

          {/* Search Bar - Google style */}
          <div className="animate-fade-up-delay-2 w-full max-w-2xl">
            <div className={`flex gap-3 items-center ${bgStyles.secondaryBg} rounded-full px-6 py-4 border-2 ${bgStyles.input} transition-all duration-300 shadow-lg hover:shadow-xl ${
              contrastMode === "high"
                ? "border-black"
                : contrastMode === "dark"
                ? "border-slate-400"
                : "border-gray-300"
            }`}>
              <span className="text-2xl">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    setHasSearched(true);
                    fetchAndSummarize();
                  }
                }}
                placeholder="Search for any news topic... tech, sports, politics, weather..."
                className={`flex-1 bg-transparent outline-none font-medium ${
                  contrastMode === "high"
                    ? "text-black placeholder-gray-600"
                    : contrastMode === "dark"
                    ? "text-slate-100 placeholder-slate-400"
                    : "text-gray-900 placeholder-gray-500"
                } text-lg`}
                aria-label="Search for news articles"
              />
            </div>
            <p className={`text-center mt-6 text-lg ${bgStyles.text} opacity-60`}>
              Press Enter to search or try: <span className="font-semibold">"BBC", "Technology", "Sports"</span>
            </p>
          </div>
        </div>
      ) : (
        // Results Page
        <div className="w-full">
          {/* Header with Logo - Sticky at top */}
          <div className={`sticky top-0 z-30 ${bgStyles.secondaryBg} border-b-2 ${
            contrastMode === "high"
              ? "border-black"
              : contrastMode === "dark"
              ? "border-slate-400"
              : "border-gray-200"
          } p-4 shadow-sm animate-slide-down-enter`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              {/* Logo moved to top left */}
              <button
                onClick={() => {
                  setHasSearched(false);
                  setSummary("");
                  setSearchQuery("");
                }}
                className={`text-3xl md:text-4xl font-black ${bgStyles.accent} cursor-pointer hover:opacity-80 transition-opacity`}
              >
                News<span className={bgStyles.accent}>Lens</span>
              </button>

              {/* Search Bar - Compact */}
              <div className={`flex-1 mx-8 flex gap-2 items-center ${bgStyles.secondaryBg} rounded-full px-4 py-2 border-2 ${
                contrastMode === "high"
                  ? "bg-white border-black"
                  : contrastMode === "dark"
                  ? "bg-slate-900 border-slate-400"
                  : "bg-white border-gray-300"
              }`}>
                <span className="text-xl">🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      fetchAndSummarize();
                    }
                  }}
                  placeholder="Refine search..."
                  className={`flex-1 bg-transparent outline-none font-medium ${
                    contrastMode === "high"
                      ? "text-black placeholder-gray-600"
                      : contrastMode === "dark"
                      ? "text-slate-100 placeholder-slate-400"
                      : "text-gray-900 placeholder-gray-500"
                  } text-base`}
                />
              </div>
            </div>
          </div>

          {/* Results Content */}
          <div className="max-w-7xl mx-auto p-6">
            {/* Search Summary */}
            <div className="mb-8">
              <h2 className={`text-3xl font-bold ${bgStyles.text} mb-2`}>
                Results for: <span className={bgStyles.accent}>"{searchQuery || 'Global News'}"</span>
              </h2>
              {loading && (
                <p className={`text-lg ${bgStyles.text} opacity-60`}>
                  🔄 Fetching news... Please wait.
                </p>
              )}
            </div>

            {/* Summary Output */}
            {summary && (
              <div className={`mb-12 p-8 rounded-2xl border-4 ${
                contrastMode === "high"
                  ? "bg-yellow-50 border-black text-black"
                  : contrastMode === "dark"
                  ? "bg-slate-800 border-slate-400 text-slate-100"
                  : "bg-blue-50 border-blue-200 text-gray-900"
              } shadow-lg`}>
                <h3 className="font-bold text-2xl mb-4 flex items-center gap-2">
                  📰 AI Summary
                </h3>
                <p className={`leading-relaxed whitespace-pre-wrap ${
                  textSize === "large"
                    ? "text-2xl"
                    : textSize === "small"
                    ? "text-base"
                    : "text-lg"
                }`}>
                  {summary}
                </p>
                <button
                  onClick={() => speak(summary)}
                  className={`mt-6 px-6 py-3 rounded-lg font-bold text-lg transition-all duration-200 border-2 ${
                    contrastMode === "high"
                      ? "bg-black text-yellow-400 border-black hover:bg-gray-900"
                      : contrastMode === "dark"
                      ? "bg-slate-700 text-blue-400 border-slate-400 hover:bg-slate-600"
                      : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                  }`}
                  aria-label="Read summary aloud"
                >
                  🔊 Read Aloud
                </button>
              </div>
            )}

            {/* Action Button */}
            {!summary && !loading && (
              <button
                onClick={fetchAndSummarize}
                disabled={loading}
                className={`w-full py-6 rounded-2xl font-black text-2xl shadow-lg transform transition-all duration-200 active:scale-95 border-4 ${
                  contrastMode === "high"
                    ? "bg-black text-yellow-400 border-black hover:bg-gray-900"
                    : contrastMode === "dark"
                    ? "bg-slate-700 text-blue-400 border-slate-400 hover:bg-slate-600"
                    : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "🔄 Summarizing..." : "📖 Fetch & Summarize News"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={`text-center py-8 ${bgStyles.text} opacity-60 text-sm border-t-2 ${
        contrastMode === "high"
          ? "border-black"
          : contrastMode === "dark"
          ? "border-slate-400"
          : "border-gray-200"
      }`}>
        <p>NewsLens - Making news accessible to everyone 🎧</p>
      </footer>
    </div>
  );
}
