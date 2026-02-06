"use client";

import React, { useState, useEffect } from "react";
import useLocalStorage from './localstorage';
import { fetchAPIKey, fetchAndSummarizeNews } from '@/lib/apiHelpers';
import { getContrastStyles, getTextSizeClasses, getBgStyles } from '@/lib/styleHelpers';
import { speak } from '@/lib/audioHelpers';
import { ANIMATIONS_STYLES } from '@/lib/constants';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [articles, setArticles] = useState([]);

  const { storedValue: savedSummaries, addItem } = useLocalStorage('news-summaries', []);
  const { storedValue: storedStories, setValue: setStoredStories } = useLocalStorage('news-stories', []);
  const { storedValue: contrastMode, setValue: setContrastMode, isLoaded: contrastLoaded } = useLocalStorage('contrastMode', "normal");
  const { storedValue: textSize, setValue: setTextSize, isLoaded: textSizeLoaded } = useLocalStorage('textSize', "normal");
  const [settingsReady, setSettingsReady] = useState(false);

  // Wait for both settings to load before rendering
  useEffect(() => {
    if (contrastLoaded && textSizeLoaded) {
      setSettingsReady(true);
    }
  }, [contrastLoaded, textSizeLoaded]);

  // Extract story titles from the API result (first few words of each story)
  const extractStoryTitles = (resultText) => {
    const stories = [];
    const lines = resultText.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      // Extract the first 50 characters as a unique identifier
      const title = line.trim().substring(0, 50);
      if (title.length > 0) {
        stories.push(title);
      }
    }
    return stories;
  };

  // Add stories to localStorage with size management (max 50 stories)
  const addStoriesToStorage = (newStories) => {
    const MAX_STORIES = 50;
    const currentStories = Array.isArray(storedStories) ? storedStories : [];
    
    const storiesWithTimestamp = newStories.map(story => ({
      title: story,
      timestamp: new Date().getTime()
    }));
    
    let combined = [...currentStories, ...storiesWithTimestamp];
    
    // If we exceed the limit, remove oldest stories first
    if (combined.length > MAX_STORIES) {
      combined = combined
        .sort((a, b) => b.timestamp - a.timestamp) // Sort newest first
        .slice(0, MAX_STORIES); // Keep only newest MAX_STORIES
    }
    
    setStoredStories(combined);
  };

  // Get previous story titles for deduplication
  const getPreviousStoryTitles = () => {
    const currentStories = Array.isArray(storedStories) ? storedStories : [];
    return currentStories.map(story => story.title || story);
  };

  // Load API key from environment on component mount
  useEffect(() => {
    const loadApiKey = async () => {
      const key = await fetchAPIKey();
      if (key) {
        setApiKey(key);
      }
    };
    loadApiKey();
  }, []);

  // Call backend API to fetch and summarize news
  const handleFetchAndSummarize = async () => {
    setLoading(true);
    const displayQuery = searchQuery.trim() || "top and most popular global headlines from major news sources";
    setSummary(`Fetching news about: ${displayQuery}. Please wait.`);
    speak(`Fetching news about: ${displayQuery}. Please wait.`);

    try {
      const previousStories = getPreviousStoryTitles();
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          query: searchQuery, 
          apiKey,
          previousStories: previousStories
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const result = data.result;
      setSummary(result);
      
      // Extract and store story titles for deduplication
      const newStories = extractStoryTitles(result);
      addStoriesToStorage(newStories);
      
      // Store summary in history
      addItem({
        query: searchQuery || 'global headlines',
        result: result,
        timestamp: new Date().toISOString()
      });
      
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

  const contrastStyles = getContrastStyles(contrastMode);
  const bgStyles = getBgStyles(contrastMode);
  const textSizeClasses = getTextSizeClasses(textSize);

  // Don't render until settings are loaded from localStorage
  if (!settingsReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-900">
        <p className="text-white text-2xl">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgStyles.bg} transition-colors duration-300`}>
      <style>{ANIMATIONS_STYLES}</style>
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
            <h3 className={`${textSizeClasses.heading2} font-bold mb-8`}>Accessibility Settings</h3>
            
            {/* Contrast Mode */}
            <div className="mb-8">
              <label className={`block font-bold mb-4 ${textSizeClasses.label}`}>Contrast Mode:</label>
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
                    <span className={`capitalize ${textSizeClasses.bodyMedium} font-semibold group-hover:underline`}>{mode === "normal" ? "Light" : mode} Contrast</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Text Size */}
            <div className="mb-8">
              <label className={`block font-bold mb-4 ${textSizeClasses.label}`}>Text Size:</label>
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
                    <span className={`${textSizeClasses.bodyMedium} font-semibold group-hover:underline`}>
                      {size === "small" ? "📱 Small" : size === "large" ? "🔍 Large" : "⚪ Normal"} Text
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className={`w-full py-4 rounded-xl font-bold ${textSizeClasses.button} transition-all duration-200 border-2 ${
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
          <h1 className={`animate-fade-up ${textSizeClasses.logo} font-black ${bgStyles.text} mb-4 text-center tracking-tight`}>
            News<span className={bgStyles.accent}>Lens</span>
          </h1>
          
          <p className={`animate-fade-up-delay-1 ${textSizeClasses.subtitle} ${bgStyles.text} text-center mb-12 max-w-2xl font-light opacity-80`}>
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
              <span className={`${textSize === "large" ? "text-3xl" : textSize === "small" ? "text-lg" : "text-2xl"}`}>🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    setHasSearched(true);
                    handleFetchAndSummarize();
                  }
                }}
                placeholder="Search for any news topic... tech, sports, politics, weather..."
                className={`flex-1 bg-transparent outline-none font-medium ${
                  contrastMode === "high"
                    ? "text-black placeholder-gray-600"
                    : contrastMode === "dark"
                    ? "text-slate-100 placeholder-slate-400"
                    : "text-gray-900 placeholder-gray-500"
                } ${textSizeClasses.bodyMedium}`}
                aria-label="Search for news articles"
              />
            </div>
            <p className={`text-center mt-6 ${textSizeClasses.hint} ${bgStyles.text} opacity-60`}>
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
                className={`${textSizeClasses.heading} font-black ${bgStyles.accent} cursor-pointer hover:opacity-80 transition-opacity`}
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
                <span className={`${textSize === "large" ? "text-2xl" : textSize === "small" ? "text-base" : "text-xl"}`}>🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleFetchAndSummarize();
                    }
                  }}
                  placeholder="Refine search..."
                  className={`flex-1 bg-transparent outline-none font-medium ${
                    contrastMode === "high"
                      ? "text-black placeholder-gray-600"
                      : contrastMode === "dark"
                      ? "text-slate-100 placeholder-slate-400"
                      : "text-gray-900 placeholder-gray-500"
                  } ${textSizeClasses.bodySmall}`}
                />
              </div>
            </div>
          </div>

          {/* Results Content */}
          <div className="max-w-7xl mx-auto p-6">
            {/* Search Summary */}
            <div className="mb-8">
              <h2 className={`${textSizeClasses.heading} font-bold ${bgStyles.text} mb-2`}>
                Results for: <span className={bgStyles.accent}>"{searchQuery || 'Global News'}"</span>
              </h2>
              {loading && (
                <p className={`${textSizeClasses.bodyMedium} ${bgStyles.text} opacity-60`}>
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
                <h3 className={`font-bold ${textSizeClasses.heading2} mb-4 flex items-center gap-2`}>
                  📰 AI Summary
                </h3>
                <p className={`leading-relaxed whitespace-pre-wrap ${textSizeClasses.bodyLarge}`}>
                  {summary}
                </p>
                <button
                  onClick={() => speak(summary)}
                  className={`mt-6 px-6 py-3 rounded-lg font-bold ${textSizeClasses.button} transition-all duration-200 border-2 ${
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
                onClick={handleFetchAndSummarize}
                disabled={loading}
                className={`w-full py-6 rounded-2xl font-black ${textSizeClasses.heading} shadow-lg transform transition-all duration-200 active:scale-95 border-4 ${
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
      <footer className={`text-center py-8 ${bgStyles.text} opacity-60 ${textSizeClasses.footer} border-t-2 ${
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
