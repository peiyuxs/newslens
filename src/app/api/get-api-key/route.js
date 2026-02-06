import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.ZHIPU_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "API Key not configured in environment variables" },
      { status: 500 }
    );
  }

  return NextResponse.json({ apiKey });
}
