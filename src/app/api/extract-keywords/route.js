import { NextResponse } from "next/server";

export async function POST(request) {
  const { userInput, apiKey: clientApiKey } = await request.json();
  const apiKey = clientApiKey || process.env.ZHIPU_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "API Key not provided. Please check .env configuration." }, { status: 400 });
  }

  if (!userInput || !userInput.trim()) {
    return NextResponse.json({ error: "User input is required" }, { status: 400 });
  }

  try {
    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "glm-4-flash",
        messages: [
          {
            role: "system",
            content: "You are a keyword extraction assistant. Extract only the news-related keywords from the user's input. Focus on topics, categories, names, places, or subjects that would be useful for searching news. Return ONLY the keywords in a short phrase (2-5 words max), nothing else. If the input is not news-related or doesn't contain searchable keywords, return 'general news'."
          },
          {
            role: "user",
            content: `Extract news search keywords from: "${userInput}"`
          }
        ],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    const keywords = data.choices[0].message.content.trim();

    return NextResponse.json({ keywords });
  } catch (error) {
    console.error("Keyword Extraction Error:", error);
    return NextResponse.json({ error: "Failed to extract keywords" }, { status: 500 });
  }
}
