import { NextResponse } from "next/server";

export async function POST(request) {
  const { query, apiKey: clientApiKey, previousStories = [] } = await request.json();
  const apiKey = '7a12d1d7f81c4792aefc00d2f6033f78.colo5oAdAXtydx0t'; // clientApiKey || process.env.ZHIPU_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "API Key not provided. Please check .env configuration." }, { status: 400 });
  }

  // Default to global headlines if no query provided
  const searchQuery = query && query.trim() ? query.trim() : "top and most popular global headlines from major news sources like CNN, BBC, Reuters, Associated Press, and other reliable sources";

  // Build exclusion list for system prompt
  const exclusionNote = previousStories.length > 0 
    ? `\n\nIMPORTANT: Do NOT include these previously shown stories: ${previousStories.join("; ")}. Provide fresh, new stories instead.`
    : "";

  try {
    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "glm-4-flash", // Using flash model to ensure response speed
        messages: [
          {
            role: "system",
            content: "You are a news summarization assistant specifically designed to serve people with visual impairments. Based on the search query provided by the user, search and list the top 3 current news items related to that query, and provide a concise one-sentence summary for each news item. Reply in English. Start summarizing directly without any introduction. If no specific query is provided, provide the top global headlines from the most reliable and major news sources." + exclusionNote
          },
          {
            role: "user",
            content: `Please find and summarize the top 3 news articles about: ${searchQuery}`
          }
        ],
      }),
    });

    const data = await response.json();
    const result = data.choices[0].message.content;

    return NextResponse.json({ result });
  } catch (error) {
    console.error("ZhipuAI Error:", error);
    return NextResponse.json({ error: "Failed to fetch from ZhipuAI" }, { status: 500 });
  }
}
