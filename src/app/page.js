"use client";

import React, { useState, useEffect } from "react";
import useLocalStorage from './localstorage';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);

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

  // Don't render until settings are loaded from localStorage
  if (!settingsReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-900">
        <p className="text-white text-2xl">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen ${contrastStyles.bgClass} p-8 font-sans ${contrastStyles.textClass}`}>
      <main className={`w-full max-w-2xl ${contrastMode === "high" ? "bg-white text-black" : contrastStyles.bgClass} rounded-3xl p-10 shadow-2xl border-4 ${contrastStyles.borderClass}`}>
        {/* Settings button */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`absolute top-4 right-4 p-3 rounded-full ${contrastStyles.accentClass} font-bold text-lg`}
          aria-label="Toggle accessibility settings"
        >
          ⚙️ Accessibility
        </button>

        {/* Accessibility Settings Panel */}
        {showSettings && (
          <div className={`mb-8 p-6 rounded-xl border-4 ${contrastStyles.borderClass} ${contrastMode === "high" ? "bg-yellow-100 text-black" : "bg-zinc-700"}`}>
            <h3 className="text-2xl font-bold mb-4">Accessibility Settings</h3>
            
            {/* Contrast Mode */}
            <div className="mb-6">
              <label className="block font-bold mb-2">Contrast Mode:</label>
              <div className="space-y-2">
                {["normal", "high", "dark"].map((mode) => (
                  <label key={mode} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="contrast"
                      value={mode}
                      checked={contrastMode === mode}
                      onChange={(e) => setContrastMode(e.target.value)}
                      className="w-4 h-4 mr-3"
                    />
                    <span className="capitalize text-lg">{mode} Contrast</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Text Size */}
            <div className="mb-6">
              <label className="block font-bold mb-2">Text Size:</label>
              <div className="space-y-2">
                {["small", "normal", "large"].map((size) => (
                  <label key={size} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="textsize"
                      value={size}
                      checked={textSize === size}
                      onChange={(e) => setTextSize(e.target.value)}
                      className="w-4 h-4 mr-3"
                    />
                    <span className="capitalize text-lg">{size === "small" ? "Small" : size === "large" ? "Large" : "Normal"} Text</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className={`w-full py-3 rounded-xl font-bold text-lg ${contrastStyles.accentClass}`}
            >
              Close Settings
            </button>
          </div>
        )}

        <header className="text-center mb-10">
          <h1 className={`font-bold tracking-tight mb-2 ${textSize === "large" ? "text-5xl" : textSize === "small" ? "text-3xl" : "text-4xl"}`}>NewsLens Summary Assistant</h1>
          <p className={`${textSize === "large" ? "text-xl" : textSize === "small" ? "text-base" : "text-lg"}`}>Voice news assistant designed for people with visual impairments</p>
        </header>

        {/* API Key input removed - now loaded from .env file */}

        {/* Search/Prompt Input Bar */}
        <div className="mb-8">
          <label className="block font-bold mb-3 uppercase">
            Search for News:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && fetchAndSummarize()}
              placeholder='Ask for news: e.g., "tech news", "BBC news", "latest sports", or leave blank for top global headlines'
              className={`flex-1 rounded-xl py-3 px-4 font-bold text-lg focus:outline-none focus:ring-2 transition-all border-2 ${
                contrastMode === "high"
                  ? "bg-white text-black border-black focus:ring-yellow-400"
                  : "bg-zinc-900 text-emerald-50 border-zinc-700 focus:ring-emerald-500"
              }`}
              aria-label="Search for news articles"
            />
          </div>
          <p className={`text-sm mt-2 ${contrastMode === "high" ? "text-black" : "text-zinc-400"}`}>
            Examples: "technology news", "BBC", "latest sports from ESPN", "weather news", or just press Enter for top global headlines
          </p>
        </div>

        {/* Source selection */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {["BBC", "CNN", "DW"].map((name) => (
            <button
              key={name}
              onClick={() => {
                setSearchQuery(name);
                speak("Searching for " + name + " news");
              }}
              className={`py-4 rounded-xl text-xl font-bold transition-all border-2 ${
                searchQuery === name 
                ? contrastMode === "high" ? "bg-yellow-300 text-black border-black" : "bg-blue-600 ring-4 ring-blue-400 border-blue-400" 
                : contrastMode === "high" ? "bg-white border-black text-black hover:bg-gray-200" : "bg-zinc-700 hover:bg-zinc-600 border-zinc-600"
              }`}
              aria-label={`Quick search for ${name} news`}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Core action button */}
        <button
          onClick={fetchAndSummarize}
          disabled={loading}
          className={`w-full py-10 rounded-2xl font-black shadow-lg transform transition-active active:scale-95 border-4 ${textSize === "large" ? "text-4xl" : textSize === "small" ? "text-2xl" : "text-3xl"} ${
            loading ? "bg-zinc-600 cursor-not-allowed border-zinc-500" : contrastMode === "high" ? "bg-yellow-300 text-black border-black hover:bg-yellow-400" : `${contrastStyles.accentClass} border-emerald-400`
          }`}
          aria-label="Start fetching and reading news summary"
        >
          {loading ? "Summarizing..." : "Click to summarize and read aloud"}
        </button>

        {/* Result display area (high contrast) */}
        <section className={`mt-12 p-6 rounded-xl border-l-8 min-h-[150px] border-4 ${contrastMode === "high" ? "bg-white text-black border-black border-l-yellow-400" : "bg-black border-emerald-500"}`}>
          <h2 className={`text-sm uppercase font-bold mb-2 ${textSize === "large" ? "text-lg" : "text-sm"} ${contrastMode === "high" ? "text-black" : "text-zinc-500"}`}>Current Output</h2>
          <p className={`leading-relaxed ${contrastMode === "high" ? "text-black" : "text-emerald-50"} ${textSize === "large" ? "text-3xl" : textSize === "small" ? "text-lg" : "text-2xl"}`}>{summary || "Click the button above to start..."}</p>
        </section>

        <footer className={`mt-8 text-center text-sm ${textSize === "large" ? "text-lg" : "text-sm"} ${contrastMode === "high" ? "text-black" : "text-zinc-500"}`}>
          Tip: This assistant will automatically read news summaries aloud for you.
        </footer>
      </main>
    </div>
  );
}
