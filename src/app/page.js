"use client";

import React, { useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [source, setSource] = useState("BBC");
  const [apiKey, setApiKey] = useState("");

  // 调用后端 API 获取新闻并总结
  const fetchAndSummarize = async () => {
    if (!apiKey) {
      const msg = "请先输入您的 API Key 再进行测试。";
      setSummary(msg);
      speak(msg);
      return;
    }

    setLoading(true);
    setSummary("Give me the latest American sports article from "+ source+ ".");
    speak("正在获取 " + source + " 的热门新闻并为您总结。请稍候。");

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ source, apiKey }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const result = data.result;
      setSummary(result);
      setLoading(false);
      speak("总结完毕。" + result);
    } catch (error) {
      console.error("Error fetching summary:", error);
      const errorMsg = "抱歉，由于 API 未配置或网络问题，获取新闻失败。";
      setSummary(errorMsg);
      speak(errorMsg);
      setLoading(false);
    }
  };

  // 文字转语音函数 (使用浏览器自带 API)
  const speak = (text) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      // 先停止之前的播放
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-900 p-8 font-sans text-white">
      <main className="w-full max-w-2xl bg-zinc-800 rounded-3xl p-10 shadow-2xl border border-zinc-700">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-2">NewsLens 总结助手</h1>
          <p className="text-zinc-400 text-lg">专为视力障碍人士设计的语音新闻助手</p>
        </header>

        {/* API Key 输入框 */}
        <div className="mb-8">
          <label className="block text-zinc-500 text-sm font-bold mb-2 uppercase">
            设置 AI 密钥 (API Key)
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="粘贴您的智谱 AI API Key"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-3 px-4 text-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* 来源选择 */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {["BBC", "CNN", "DW"].map((name) => (
            <button
              key={name}
              onClick={() => {
                setSource(name);
                speak("已选择 " + name);
              }}
              className={`py-4 rounded-xl text-xl font-bold transition-all ${
                source === name 
                ? "bg-blue-600 ring-4 ring-blue-400" 
                : "bg-zinc-700 hover:bg-zinc-600"
              }`}
              aria-label={`选择新闻源 ${name}`}
            >
              {name}
            </button>
          ))}
        </div>

        {/* 核心操作按钮 */}
        <button
          onClick={fetchAndSummarize}
          disabled={loading}
          className={`w-full py-10 rounded-2xl text-3xl font-black shadow-lg transform transition-active active:scale-95 ${
            loading ? "bg-zinc-600 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-400"
          }`}
          aria-label="开始获取并阅读新闻总结"
        >
          {loading ? "正在总结..." : "点击开始总结并朗读"}
        </button>

        {/* 结果显示区域 (高对比度) */}
        <section className="mt-12 p-6 bg-black rounded-xl border-l-8 border-emerald-500 min-h-[150px]">
          <h2 className="text-zinc-500 text-sm uppercase font-bold mb-2">当前输出</h2>
          <p className="text-2xl leading-relaxed text-emerald-50">{summary || "请点击上方按钮开始..."}</p>
        </section>

        <footer className="mt-8 text-center text-zinc-500 text-sm">
          提示：本助手会自动使用语音为您朗读新闻摘要。
        </footer>
      </main>
    </div>
  );
}
