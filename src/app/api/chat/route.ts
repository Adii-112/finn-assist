import { NextResponse } from "next/server";

export async function POST(req: Request) {

  // handles chat requests from frontend
// could probably refactor this later


  const { message } = await req.json();

  if (!message) {
    return NextResponse.json(
      { error: "Message required" },
      { status: 400 }
    );
  }

 
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not found" },
      { status: 500 }
    );
  }

  
  const aiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: `Reply briefly and friendly.\nUser message: ${message}`,
    }),
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    return NextResponse.json(
      { error: errorText },
      { status: 500 }
    );
  }

  const data = await aiResponse.json();

  
  const reply =
    data.output?.[0]?.content?.[0]?.text ||
    "Sorry, I could not respond.";

  return NextResponse.json({ reply });

}