import { NextResponse } from "next/server";

export async function POST(request) {
  const { query, apiKey: clientApiKey, previousStories = [], language } = await request.json();
  const apiKey = '7a12d1d7f81c4792aefc00d2f6033f78.colo5oAdAXtydx0t'; // clientApiKey || process.env.ZHIPU_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "API Key not provided. Please check .env configuration." }, { status: 400 });
  }

  // Default to global headlines if no query provided
  const searchQuery = query && query.trim() ? query.trim() : "Most popular and relevant news from the following news outlets: CNN, BBC, Le Monde, DW, Times of India, The Japan Times, China Daily";

  // Build exclusion list for system prompt
  const exclusionNote = previousStories.length > 0 
    ? `\n\nIMPORTANT: Do NOT include these previously shown stories: ${previousStories.join("; ")}. Provide fresh, new stories instead.`
    : "";

  const languageTag = language || 'en-US';

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
            content: "You are a news summarization assistant specifically designed to serve people with visual impairments. Based on the search query provided by the user, search and list the top 3 most current, popular, and relevant news summaries related to that query, and provide an 150-250 words summary with a brief headline for each news summary item. Reply in the language the user provides input in; if no language was detected, fall back to British English. Start summarizing directly without any introduction. If no specific query is provided, provide the most relevant headlines from the following news sources: CNN, BBC, Le Monde, DW, Times of India, The Japan Times, China Daily. Provide the name of the news outlets you retrieved the news from." + exclusionNote
          },
          {
            role: "user",
            content: `Find and summarize the top 3 news about: ${searchQuery}`
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
