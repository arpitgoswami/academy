export async function POST(request) {
  try {
    const { messages } = await request.json();

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "xiaomi/mimo-v2-flash:free",
          // 1. Enable streaming from the AI provider
          stream: true,
          messages: [
            {
              role: "system",
              content:
                "Act as a mindset coach helping me resist the urge to masturbate. Provide immediate motivation and actionable steps to shift my focus. Keep responses under 200 words, using short, punchy paragraphs.",
            },
            ...messages,
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch from OpenRouter API");
    }

    // 2. Create a new stream to transform the data
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode the chunk and add to buffer
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Split into lines
          const lines = buffer.split("\n");
          // Keep the last line in the buffer (it might be incomplete)
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            // OpenRouter sends lines starting with "data: "
            if (!trimmed || !trimmed.startsWith("data: ")) continue;

            const data = trimmed.slice(6); // Remove "data: "
            if (data === "[DONE]") continue; // Ignore the end signal

            try {
              const json = JSON.parse(data);
              const content = json.choices[0]?.delta?.content || "";
              if (content) {
                // Send just the text content to your client
                controller.enqueue(encoder.encode(content));
              }
            } catch (e) {
              // Ignore parse errors from partial lines
            }
          }
        }
        controller.close();
      },
    });

    // Return the custom stream
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
