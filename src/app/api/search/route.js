export const runtime = "nodejs";

import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "chatgpt";

  const searchApiUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(
    query
  )}`;

  try {
    const searchResponse = await fetch(searchApiUrl);
    const searchData = await searchResponse.json();

    if (!searchData.items || !Array.isArray(searchData.items)) {
      throw new Error("No search results found.");
    }

    const items = searchData.items.slice(0, 5);

    const scrapedPages = await Promise.allSettled(
      items.map(async (item) => {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);

          const response = await fetch(item.link, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0",
            },
            signal: controller.signal,
          });

          clearTimeout(timeout);

          const html = await response.text();
          const $ = cheerio.load(html);

          const title = $("title").text().trim();
          const metaDescription =
            $('meta[name="description"]').attr("content") || "";
          const pTags = $("p").slice(0, 3).text().replace(/\s+/g, " ").trim();
          const hTags = $("h2, h3")
            .slice(0, 3)
            .text()
            .replace(/\s+/g, " ")
            .trim();

          const summary = [metaDescription, hTags, pTags]
            .filter(Boolean)
            .join(" ")
            .slice(0, 1000);

          return { link: item.link, title, content: summary };
        } catch (err) {
          return { link: item.link, title: "", error: err.message };
        }
      })
    );

    const validScrapes = scrapedPages
      .filter((r) => r.status === "fulfilled" && r.value.content)
      .map((r) => r.value);

    if (validScrapes.length === 0) {
      return NextResponse.json(
        {
          question: query,
          answer: "Couldn't extract reliable content from search results.",
          sources: items.map((item) => ({
            link: item.link,
            title: item.title,
          })),
        },
        { headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const contextText = validScrapes
      .map((res) => `Source: ${res.title}\n${res.content}`)
      .join("\n\n");

    const geminiPrompt = `
    You are a highly knowledgeable and reliable AI assistant.
    
    Your task is to answer the following question in a detailed, factually accurate, and well-structured way. Your answer should be between **200 and 1000 words** and written clearly and concisely. Use the **information extracted from real-time web pages** below to inform your answer. If some information is missing or unclear, supplement it with your own accurate and up-to-date knowledge, but clearly prioritize and reference the context wherever possible.
    
    ### Question:
    ${query}
    
    ### Context from Web (multiple sources):
    ${contextText}
    
    ### Instructions:
    - Write a clear, logically structured answer with headings if appropriate.
    - Be objective, do not speculate.
    - Prioritize extracted data but fill in knowledge gaps with your own reliable data.
    - Avoid repetition. Do not list URLs in the answer.
    - Final answer must be helpful, professional, and exceed 200 words (but not more than 2000 words).
    

    ### Response Format:
    - Don't provide me any markdown language.
    - Provide just simple text and in the form of points.
    - At the top there must be a heading followed by the response.
    - Don't include any URLs in the response.
    - There must short points of a single or double line and they must start with a related emoji.
    - No hallucination
    `;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: geminiPrompt }] }],
        }),
      }
    );

    const geminiData = await geminiRes.json();

    const answer =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Gemini could not generate an answer.";

    return NextResponse.json(
      {
        question: query,
        answer,
        sources: validScrapes.map((s) => ({ link: s.link, title: s.title })),
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Unexpected error occurred." },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
