import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const API_KEY = "AIzaSyBOKIsFoCHiQDeJc2BDzQd8Eu9HK3lVMAE";

export async function POST(request) {
  try {
    const { prompt, user } = await request.json();

    if (!prompt || !user) {
      return NextResponse.json(
        { error: "Prompt and user are required" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    return NextResponse.json(
      { response },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error generating AI response:", error);
    return NextResponse.json(
      { error: "Error generating response" },
      { status: 500 }
    );
  }
}
