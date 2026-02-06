"use client";

import React, { useState, useEffect } from "react";
import useLocalStorage from './localstorage';
import { fetchAPIKey, fetchAndSummarizeNews } from '@/lib/apiHelpers';
import { getContrastStyles, getTextSizeClasses, getBgStyles } from '@/lib/styleHelpers';
import { getButtonClasses, getCardClasses, getSettingsPanelClasses, getInputClasses, getBackdropClasses, parseNewsSummary } from '@/lib/componentHelpers';
import { speak } from '@/lib/audioHelpers';
import { ANIMATIONS_STYLES } from '@/lib/constants';
import { SpeechToSearch } from '@/utils/speechToSearch';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSearchTerm, setCurrentSearchTerm] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [articles, setArticles] = useState([]);
  const [showSummaryFade, setShowSummaryFade] = useState(false);
  const [newsCards, setNewsCards] = useState([]);
  const [speechToSearch, setSpeechToSearch] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isWaitingForCommand, setIsWaitingForCommand] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { storedValue: savedSummaries, addItem } = useLocalStorage('news-summaries', []);
  const { storedValue: savedNewsCards, setValue: setSavedNewsCards } = useLocalStorage('news-cards', []);
  const { storedValue: storedStories, setValue: setStoredStories } = useLocalStorage('news-stories', []);
  const { storedValue: contrastMode, setValue: setContrastMode, isLoaded: contrastLoaded } = useLocalStorage('contrastMode', "normal");
  const { storedValue: textSize, setValue: setTextSize, isLoaded: textSizeLoaded } = useLocalStorage('textSize', "normal");
  const { storedValue: voiceType, setValue: setVoiceType, isLoaded: voiceLoaded } = useLocalStorage('voiceType', "default");
  const [settingsReady, setSettingsReady] = useState(false);

  // Wait for all settings to load before rendering
  useEffect(() => {
    if (contrastLoaded && textSizeLoaded && voiceLoaded) {
      setSettingsReady(true);
    }
  }, [contrastLoaded, textSizeLoaded, voiceLoaded]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && settingsReady) {
      const speech = new SpeechToSearch(
        // Search callback
        async (transcript) => {
          console.log('User command received:', transcript);
          
          // Immediately display user's speech in search box
          setSearchQuery(transcript);
          
          // Extract keywords from user input using LLM
          try {
            // Get the current API key
            const currentApiKey = apiKey || process.env.NEXT_PUBLIC_ZHIPU_API_KEY;
            
            const response = await fetch("/api/extract-keywords", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ 
                userInput: transcript,
                apiKey: currentApiKey
              }),
            });
            
            const data = await response.json();
            
            if (data.error) {
              console.error('Keyword extraction error:', data.error);
              // Use speech to notify error
              if (speech) {
                speech.speak('Sorry, I could not process your request. Using your original words to search.');
              }
              setErrorMessage('Keyword extraction failed. Using original input.');
              setTimeout(() => setErrorMessage(''), 3000);
              // Keep using original transcript (already set)
            } else {
              console.log('Extracted keywords:', data.keywords);
              // Update search box with extracted keywords
              setSearchQuery(data.keywords);
            }
            
            setHasSearched(true);
            setShowResults(false);
            
            // Trigger search after short delay with extracted keywords
            setTimeout(() => {
              handleFetchAndSummarize(data.keywords || transcript);
              setTimeout(() => setShowResults(true), 550);
            }, 300);
          } catch (error) {
            console.error('Error extracting keywords:', error);
            // Use speech to notify error
            if (speech) {
              speech.speak('Network error occurred. Using your original words to search.');
            }
            setErrorMessage('Network error. Using original input.');
            setTimeout(() => setErrorMessage(''), 3000);
            // Keep using original transcript (already set)
            setHasSearched(true);
            setShowResults(false);
            setTimeout(() => {
              handleFetchAndSummarize(transcript);
              setTimeout(() => setShowResults(true), 550);
            }, 300);
          }
        },
        // Status callback
        (status) => {
          if (status.isWaitingForCommand !== undefined) {
            setIsWaitingForCommand(status.isWaitingForCommand);
          }
          if (status.recognizedText !== undefined) {
            setRecognizedText(status.recognizedText);
          }
        }
      );

      const initialized = speech.init();
      if (initialized) {
        speech.setLanguage('en-US'); // Default to English
        setSpeechToSearch(speech);
        // Automatically start listening when page loads
        speech.startListening();
        setIsListening(true);
      }

      return () => {
        if (speech) {
          speech.stopListening();
        }
      };
    }
  }, [settingsReady, apiKey]);

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
  const handleFetchAndSummarize = async (query) => {
    const searchTerm = query || searchQuery;
    
    // Stop voice recognition during search
    setIsSearching(true);
    setRecognizedText(''); // Clear recognized text display
    if (speechToSearch && isListening) {
      console.log('⏸️ Pausing voice recognition during search...');
      speechToSearch.stopListening();
      setIsListening(false);
    }
    
    setLoading(true);
    setShowSummaryFade(false);
    const displayQuery = searchTerm.trim() || "top and most popular global headlines from major news sources";
    setSummary(`Fetching news about: ${displayQuery}. Please wait.`);

    try {
      const previousStories = getPreviousStoryTitles();
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          query: searchTerm, 
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
      
      // Parse summary into individual news cards
      const parsedCards = parseNewsSummary(result);
      setNewsCards(parsedCards);
      
      // Store parsed cards in localStorage
      const MAX_CARD_HISTORY = 100;
      const existingCards = Array.isArray(savedNewsCards) ? savedNewsCards : [];
      const allCards = [...existingCards, ...parsedCards].slice(-MAX_CARD_HISTORY);
      setSavedNewsCards(allCards);
      
      // Extract and store story titles for deduplication
      const newStories = extractStoryTitles(result);
      addStoriesToStorage(newStories);
      
      // Store summary in history
      addItem({
        query: searchTerm || 'global headlines',
        result: result,
        timestamp: new Date().toISOString()
      });
      
      setLoading(false);
      // Trigger fade-in animation after a brief delay
      setTimeout(() => setShowSummaryFade(true), 100);
      
      // Resume voice recognition after search completes
      setTimeout(() => {
        setIsSearching(false);
        setRecognizedText(''); // Clear for fresh start
        if (speechToSearch) {
          console.log('▶️ Resuming voice recognition...');
          speechToSearch.resetErrorCount(); // Reset error counter on successful search
          speechToSearch.startListening();
          setIsListening(true);
        }
      }, 1000); // Wait 1 second before resuming
    } catch (error) {
      console.error("Error fetching summary:", error);
      const errorMsg = "Sorry, failed to fetch news due to API misconfiguration or network issues.";
      setSummary(errorMsg);
      
      // Use speech to notify error
      if (speechToSearch) {
        speechToSearch.speak('Sorry, I could not fetch the news. Please check your internet connection and try again.');
      }
      
      setErrorMessage('Failed to fetch news. Please try again.');
      setTimeout(() => setErrorMessage(''), 4000);
      
      setLoading(false);
      
      // Resume voice recognition even on error
      setTimeout(() => {
        setIsSearching(false);
        setRecognizedText(''); // Clear for fresh start
        if (speechToSearch) {
          console.log('▶️ Resuming voice recognition after error...');
          speechToSearch.startListening();
          setIsListening(true);
        }
      }, 2000); // Wait 2 seconds before resuming to allow error message to be read
    }
  };

  // Toggle voice listening
  const toggleVoiceListening = () => {
    if (!speechToSearch) return;
    
    if (isListening) {
      speechToSearch.stopListening();
      setIsListening(false);
      setIsWaitingForCommand(false);
    } else {
      speechToSearch.startListening();
      setIsListening(true);
    }
  };

  // ...existing code...

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
      
      {/* Debug: Show recognized text */}
      {recognizedText && !isSearching && (
        <div className="fixed top-20 right-6 z-50 max-w-xs p-4 bg-black/80 text-white rounded-lg shadow-xl">
          <div className="text-xs font-bold mb-2 text-green-400">🎤 Recognized:</div>
          <div className="text-sm break-words">{recognizedText}</div>
          <div className="text-xs mt-2 text-yellow-400">
            Test Mode: Just speak to trigger search
          </div>
        </div>
      )}
      
      {/* Voice listening status indicator */}
      {isListening && !recognizedText && !isSearching && (
        <div className="fixed top-20 right-6 z-50 max-w-xs p-4 bg-green-500/90 text-white rounded-lg shadow-xl">
          <div className="text-sm font-bold">🎤 Listening... (Test Mode)</div>
          <div className="text-xs mt-1">Just speak, no wake word needed</div>
        </div>
      )}
      
      {/* Searching status indicator */}
      {isSearching && (
        <div className="fixed top-20 right-6 z-50 max-w-xs p-4 bg-orange-500/90 text-white rounded-lg shadow-xl">
          <div className="text-sm font-bold">⏸️ Searching...</div>
          <div className="text-xs mt-1">Voice recognition paused</div>
        </div>
      )}
      
      {/* Error message indicator */}
      {errorMessage && (
        <div className="fixed top-20 right-6 z-50 max-w-xs p-4 bg-red-500/90 text-white rounded-lg shadow-xl animate-pulse">
          <div className="text-sm font-bold">⚠️ Error</div>
          <div className="text-xs mt-1">{errorMessage}</div>
        </div>
      )}
      
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
      <div
        className={`fixed inset-0 z-40 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-300`}
        style={getBackdropClasses(contrastMode, showSettings)}
        aria-hidden={!showSettings}
      >
        <div className={`${getSettingsPanelClasses(contrastMode)} ${bgStyles.text} ${
            showSettings ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}>
            <h3 className={`${textSizeClasses.heading2} font-bold mb-8`}>Accessibility Settings</h3>
            
            {/* ...existing settings code... */}
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

            {/* Voice Type */}
            <div className="mb-8">
              <label className={`block font-bold mb-4 ${textSizeClasses.label}`}>Voice Type:</label>
              <div className="space-y-3">
                {[{id: 'default', label: '🎤 Default'}, {id: 'male', label: '👨 Male'}, {id: 'female', label: '👩 Female'}, {id: 'neutral', label: '🤖 Neutral'}].map((voice) => (
                  <label key={voice.id} className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name="voice"
                      value={voice.id}
                      checked={voiceType === voice.id}
                      onChange={(e) => setVoiceType(e.target.value)}
                      className="w-6 h-6 mr-4 cursor-pointer"
                    />
                    <span className={`${textSizeClasses.bodyMedium} font-semibold group-hover:underline`}>
                      {voice.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className={`w-full py-4 rounded-xl ${getButtonClasses(contrastMode, textSizeClasses, 'primary')}`}
            >
              Close Settings
            </button>
          </div>
        </div>

      {/* Main Content */}
      <div className="relative min-h-screen">
        {/* Header (centered on landing, shrinks/moves to top-left on search) */}
        <div
          className={`fixed z-20 transition-all duration-600 ease-out ${!hasSearched ? 'w-screen' : ''} ${
            hasSearched
              ? 'left-4 top-4 right-32'
              : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-20'
          } ${
            hasSearched ? `${bgStyles.secondaryBg} rounded-xl px-4 py-3 shadow-md transition-all duration-300` : ''
          }`}
          style={{ transformOrigin: 'left top' }}
        >
          <div className={`flex ${hasSearched ? 'flex-row items-center gap-3' : 'flex-col items-center gap-4'}`}>
            <button
              onClick={() => {
                if (hasSearched) {
                  setShowResults(false);
                  setHasSearched(false);
                  setSummary("");
                  setSearchQuery("");
                }
              }}
              className={`${hasSearched ? 'flex-shrink-0' : textSizeClasses.logo} cursor-pointer transition-all duration-300 whitespace-nowrap`}
            >
              <img src="/NewsLens_Logo.svg" alt="NewsLens logo" className={`${hasSearched ? 'h-8 md:h-10' : 'h-14 md:h-16'} block`} />
            </button>

            {!hasSearched && (
              <p className={`${textSizeClasses.subtitle} ${bgStyles.text} text-center font-light opacity-80`}>
                Accessible News for Everyone
              </p>
            )}

            <div className={`flex gap-3 items-center rounded-full border-2 transition-all duration-300 shadow-lg ${hasSearched ? 'w-full' : 'w-full'} ${
                hasSearched ? 'bg-transparent px-3 py-2 border-transparent' : `${bgStyles.secondaryBg} px-6 py-4`
              } ${bgStyles.input} ${
                contrastMode === 'high' ? 'border-black' : contrastMode === 'dark' ? 'border-slate-400' : 'border-gray-300'
              } ${isWaitingForCommand ? 'ring-4 ring-green-400 ring-opacity-50' : ''}`}>
              <span className={`${textSize === 'large' ? 'text-3xl' : textSize === 'small' ? 'text-lg' : 'text-2xl'} flex-shrink-0`}>🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    setCurrentSearchTerm(searchQuery);
                    setHasSearched(true);
                    setShowResults(false);
                    handleFetchAndSummarize();
                    setTimeout(() => setShowResults(true), 550);
                  }
                }}
                placeholder={hasSearched ? 'Refine search...' : '🎤 Speak or type to search... (Test Mode)'}
                className={`flex-1 bg-transparent outline-none font-medium ${
                  contrastMode === 'high' ? 'text-black placeholder-gray-600' : contrastMode === 'dark' ? 'text-slate-100 placeholder-slate-400' : 'text-gray-900 placeholder-gray-500'
                } ${hasSearched ? textSizeClasses.bodySmall : textSizeClasses.bodyMedium}`}
                aria-label="Search for news articles"
              />
              {/* Voice Search Button */}
              <button
                onClick={toggleVoiceListening}
                disabled={isSearching}
                className={`flex-shrink-0 p-2 rounded-full transition-all duration-200 ${
                  isSearching
                    ? 'bg-gray-400 text-white cursor-not-allowed opacity-50'
                    : isWaitingForCommand
                    ? 'bg-yellow-500 text-white shadow-lg ring-4 ring-yellow-300 animate-pulse'
                    : isListening 
                    ? 'bg-green-500 text-white shadow-lg ring-2 ring-green-300' 
                    : contrastMode === 'high'
                    ? 'bg-yellow-400 text-black hover:bg-yellow-500'
                    : contrastMode === 'dark'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
                aria-label={isSearching ? 'Searching, voice recognition paused' : isListening ? '🎤 Voice recognition active - Just speak' : 'Start voice input'}
                title={isSearching ? 'Searching, voice recognition paused' : isListening ? 'Test Mode: Just speak to trigger search' : 'Click to toggle voice search'}
              >
                {isSearching ? '⏸️' : isWaitingForCommand ? '🗣️' : '🎤'}
              </button>
            </div>

            {!hasSearched && (
              <>
                <p className={`text-center ${textSizeClasses.hint} ${bgStyles.text} opacity-60 whitespace-nowrap`}>
                  Press Enter to search or try: <span className="font-semibold">"BBC", "Technology", "Sports"</span>
                </p>
                <p className={`text-center ${textSizeClasses.hint} ${bgStyles.text} opacity-60 max-w-xs`}>
                  <br />
                  NewsLens may make mistakes. Always double-check its sources.
                  <br />
                  🎤 Test Mode: Just speak to search, or type and press Enter
                </p>
              </>
            )}
          </div>
        </div>

        {/* ...rest of existing code... */}
        <div className={`${hasSearched ? 'pt-32 w-full' : ''}`}>
          {hasSearched && (showResults || loading || summary || newsCards.length > 0) && (
            <div className={`max-w-7xl mx-auto p-6 transform transition-all duration-500 ease-out ${
              showResults ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <div className="mb-8">
                <h2 className={`${textSizeClasses.heading} font-bold ${bgStyles.text} mb-2`}>
                  Results for: <span className={bgStyles.accent}>"{currentSearchTerm || 'Global News'}"</span>
                </h2>
                {loading && (
                  <p className={`${textSizeClasses.bodyMedium} ${bgStyles.text} opacity-60`}>
                    🔄 Fetching news... Please wait.
                  </p>
                )}
              </div>

              {summary && !loading && newsCards.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {newsCards.map((card, index) => (
                    <div
                      key={card.id}
                      className={`${getCardClasses(contrastMode)} transition-all duration-700 ease-out transform ${
                        showSummaryFade ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                      }`}
                      style={{
                        transitionDelay: showSummaryFade ? `${index * 100}ms` : '0ms'
                      }}
                    >
                      <h3 className={`font-bold ${textSizeClasses.heading2} mb-3 flex items-start gap-2`}>
                        <span className="flex-shrink-0 text-2xl">📰</span>
                        <span className="line-clamp-3">{card.headline}</span>
                      </h3>
                      <p className={`leading-relaxed ${textSizeClasses.bodyMedium} mb-4 line-clamp-6`}>
                        {card.content}
                      </p>
                      <button
                        onClick={() => speak(`${card.headline}. ${card.content}`)}
                        className={`w-full px-4 py-2 rounded-lg ${getButtonClasses(contrastMode, textSizeClasses, 'primary')}`}
                        aria-label={`Read ${card.headline} aloud`}
                      >
                        🔊 Read
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!summary && !loading && newsCards.length === 0 && (
                <button
                  onClick={() => {
                    setHasSearched(true);
                    setShowResults(false);
                    handleFetchAndSummarize();
                    setTimeout(() => setShowResults(true), 550);
                  }}
                  disabled={loading}
                  className={`w-full py-6 rounded-2xl font-black ${textSizeClasses.heading} shadow-lg transform transition-all duration-200 active:scale-95 border-4 ${getButtonClasses(contrastMode, textSizeClasses, 'primary')}`}
                >
                  {loading ? '🔄 Summarizing...' : '📖 Fetch & Summarize News'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className={`text-center py-8 ${bgStyles.text} opacity-60 ${textSizeClasses.footer} border-t-2 ${
        contrastMode === "high"
          ? "border-black"
          : contrastMode === "dark"
          ? "border-slate-400"
          : "border-gray-200"
      }`}>
        <p>NewsLens - Making news accessible to everyone 🎧
        </p>
      </footer>
    </div>
  );
}