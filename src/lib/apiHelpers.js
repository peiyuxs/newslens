/**
 * API-related helper functions
 */

export const fetchAPIKey = async () => {
  try {
    const response = await fetch("/api/get-api-key");
    const data = await response.json();
    return data.apiKey || null;
  } catch (error) {
    console.error("Failed to load API key:", error);
    return null;
  }
};

export const fetchAndSummarizeNews = async (
  searchQuery,
  apiKey,
  onStartMessage,
  onSpeakStart,
  onSuccess,
  onError,
  speak
) => {
  if (!apiKey) {
    const msg = "API Key not loaded. Please check your .env file configuration.";
    onStartMessage(msg);
    onSpeakStart(msg);
    return;
  }

  const displayQuery = searchQuery.trim() || "top and most popular global headlines from major news sources";
  onStartMessage(`Fetching news about: ${displayQuery}. Please wait.`);
  onSpeakStart(`Fetching news about: ${displayQuery}. Please wait.`);

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
    onSuccess(result);
    speak("Summary complete. " + result);
  } catch (error) {
    console.error("Error fetching summary:", error);
    const errorMsg = "Sorry, failed to fetch news due to API misconfiguration or network issues.";
    onError(errorMsg);
    speak(errorMsg);
  }
};
