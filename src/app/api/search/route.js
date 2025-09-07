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

// Optimized scraping function with better error handling and faster timeouts
async function scrapeWithTimeout(url, timeout = 3000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        Connection: "keep-alive",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // More efficient content extraction
    const title =
      $("title").first().text().trim() || $("h1").first().text().trim();
    const metaDescription =
      $('meta[name="description"]').attr("content")?.trim() ||
      $('meta[property="og:description"]').attr("content")?.trim() ||
      "";

    // Get main content more efficiently
    const mainContent = $("main, article, .content, #content").first();
    let content = "";

    if (mainContent.length) {
      content = mainContent.find("p").slice(0, 3).text();
    } else {
      content = $("p").slice(0, 3).text();
    }

    content = content.replace(/\s+/g, " ").trim();

    // Get headers for context
    const headers = $("h1, h2, h3")
      .slice(0, 2)
      .map((i, el) => $(el).text().trim())
      .get()
      .join(" ");

    const summary = [metaDescription, headers, content]
      .filter(Boolean)
      .join(" ")
      .slice(0, 800); // Reduced from 1000 for faster processing

    return {
      link: url,
      title: title || "Untitled",
      content: summary,
      description: metaDescription,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return { link: url, title: "", error: err.message, content: "" };
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "chatgpt";

  // Create a ReadableStream for immediate streaming
  const stream = new ReadableStream({
    async start(controller) {
      // Helper function to send SSE message
      const sendMessage = (type, data) => {
        try {
          controller.enqueue(`data: ${JSON.stringify({ type, data })}\n\n`);
        } catch (e) {
          console.error("Stream error:", e);
        }
      };

      try {
        // Step 1: Fetch search results quickly
        const searchApiUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(
          query
        )}`;

        const searchResponse = await fetch(searchApiUrl);
        const searchData = await searchResponse.json();

        if (!searchData.items || !Array.isArray(searchData.items)) {
          throw new Error("No search results found.");
        }

        const items = searchData.items.slice(0, 4); // Reduced from 5 for speed

        // Send sources immediately (even before scraping)
        const basicSources = items.map((item) => ({
          link: item.link,
          title: item.title || "Untitled",
          description: item.snippet || "",
        }));

        sendMessage("sources", basicSources);

        // Step 2: Start Gemini request early while scraping in parallel
        const contextPromise = Promise.allSettled(
          items.map((item) => scrapeWithTimeout(item.link, 2500)) // Faster timeout
        );

        // Step 3: Prepare initial context from search snippets for faster response
        const initialContext = items
          .map((item) => `Source: ${item.title}\n${item.snippet || ""}`)
          .join("\n\n");

        const geminiPrompt = `
You are a highly knowledgeable and reliable AI assistant.

Answer the following question in a detailed, factually accurate way. Your answer should be between 200-800 words and written clearly. Use the information provided below, but supplement with your knowledge if needed.

### Question:
${query}

### Context from Search Results:
${initialContext}

### Instructions:
- Write a clear, structured answer
- Be objective and factual
- No markdown language, no things like that
- If you can't find the answer in the context, use your own knowledge
- Use simple text with emoji bullet points
- The format should start with a main heading on the first line, followed by subheadings. Under each subheading, include 2–3 bullet points. Each bullet should begin with an emoji, then bold text, followed by a colon and the description.
- Include a heading at the top as the very first line
- Keep points concise (1-2 lines each)
- No URLs in the response
- No hallucination
- Use actual line breaks between sections for proper formatting
- Each section should be separated by a blank line

### Response Format Requirements:
1. Start with a main heading as the very first line
2. Add a blank line after the heading
3. Add subheadings followed by bullet points
4. Separate each section with blank lines
5. Use emojis at the start of each bullet point

Example format:
# Main Topic Heading

## Subheading 1

🔹 **Key Point**: Description here
🔹 **Another Point**: Description here

## Subheading 2

🔸 **Important Info**: Details here
🔸 **Additional Detail**: More information
        `.trim();

        // Start Gemini request
        const geminiPromise = fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: geminiPrompt }] }],
              generationConfig: {
                maxOutputTokens: 1000, // Limit for faster response
                temperature: 0.3, // Lower for more focused answers
              },
            }),
          }
        );

        // Wait for both scraping and Gemini response
        const [contextResults, geminiResponse] = await Promise.allSettled([
          contextPromise,
          geminiPromise,
        ]);

        // Process Gemini response
        let answer = "Could not generate an answer.";
        if (geminiResponse.status === "fulfilled") {
          try {
            const geminiData = await geminiResponse.value.json();
            const rawAnswer =
              geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

            if (rawAnswer) {
              // Ensure proper formatting with line breaks
              answer = rawAnswer
                .replace(/\\n/g, "\n") // Convert \n strings to actual line breaks
                .replace(/\n{3,}/g, "\n\n") // Limit consecutive line breaks to 2
                .trim();

              // Ensure the first line is a heading if it's not already
              if (!answer.startsWith("#") && !answer.includes("\n#")) {
                const lines = answer.split("\n");
                if (lines.length > 0) {
                  lines[0] = `# ${lines[0].replace(/^#+\s*/, "")}`;
                  answer = lines.join("\n");
                }
              }
            }
          } catch (e) {
            console.error("Gemini parsing error:", e);
          }
        }

        // Update sources with scraped content if available
        if (contextResults.status === "fulfilled") {
          const scrapedResults = contextResults.value;
          const validScrapes = scrapedResults
            .filter((r) => r.status === "fulfilled" && r.value.content)
            .map((r) => r.value);

          if (validScrapes.length > 0) {
            const enhancedSources = basicSources.map((source) => {
              const scraped = validScrapes.find((s) => s.link === source.link);
              return scraped
                ? {
                    ...source,
                    description: scraped.description || source.description,
                  }
                : source;
            });

            // Send updated sources
            sendMessage("sources", enhancedSources);

            // If we have better context, potentially improve the answer
            const enhancedContext = validScrapes
              .map((res) => `Source: ${res.title}\n${res.content}`)
              .join("\n\n");

            if (enhancedContext.length > initialContext.length * 1.5) {
              // Only re-query Gemini if we have significantly better context
              try {
                const enhancedPrompt = geminiPrompt.replace(
                  initialContext,
                  enhancedContext
                );
                const enhancedResponse = await fetch(
                  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      contents: [
                        { role: "user", parts: [{ text: enhancedPrompt }] },
                      ],
                      generationConfig: {
                        maxOutputTokens: 1000,
                        temperature: 0.3,
                      },
                    }),
                  }
                );

                const enhancedData = await enhancedResponse.json();
                const enhancedRawAnswer =
                  enhancedData.candidates?.[0]?.content?.parts?.[0]?.text;

                if (
                  enhancedRawAnswer &&
                  enhancedRawAnswer.length > answer.length
                ) {
                  // Apply same formatting to enhanced answer
                  answer = enhancedRawAnswer
                    .replace(/\\n/g, "\n")
                    .replace(/\n{3,}/g, "\n\n")
                    .trim();

                  if (!answer.startsWith("#") && !answer.includes("\n#")) {
                    const lines = answer.split("\n");
                    if (lines.length > 0) {
                      lines[0] = `# ${lines[0].replace(/^#+\s*/, "")}`;
                      answer = lines.join("\n");
                    }
                  }
                }
              } catch (e) {
                console.error("Enhanced response error:", e);
              }
            }
          }
        }

        // Step 4: Stream the answer preserving line breaks
        const lines = answer.split("\n");

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.trim()) {
            sendMessage("chunk", line);
          }

          // Send line break as separate chunk to preserve formatting
          if (i < lines.length - 1) {
            sendMessage("chunk", "\n");
          }

          // Smaller delay for faster streaming
          await new Promise((resolve) => setTimeout(resolve, 25));
        }

        // Send completion
        sendMessage("done", { question: query });
        controller.close();
      } catch (error) {
        console.error("API Error:", error);
        sendMessage("error", {
          message: error.message || "An unexpected error occurred.",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "X-Accel-Buffering": "no", // Disable nginx buffering for faster streaming
    },
  });
}
