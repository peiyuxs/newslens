import { NextResponse } from "next/server";

export async function POST(request) {
  const { source, apiKey: clientApiKey } = await request.json();
  const apiKey = clientApiKey || process.env.ZHIPU_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "尚未提供 API Key，请在页面上输入。" }, { status: 400 });
  }

  try {
    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "glm-4-flash", // 使用 flash 模型保证响应速度
        messages: [
          {
            role: "system",
            content: "你是一个新闻摘要助手，专门为视力障碍人士提供服务。请根据用户提供的媒体源（如CNN, BBC, DW），搜索并列举该媒体当前最热门的3条新闻内容，并为每条新闻提供一句话的简洁摘要。回复语言为英文。请直接开始总结，不要有开场白。"
          },
          {
            role: "user",
            content: `请总结来自 ${source} 的最热门新闻。`
          }
        ],
        // 如果 ZhipuAI 支持内置搜索，通常在 tools 中配置
        // 这里假设模型能通过内置能力获取信息，或者提供它所知道的最新信息
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
