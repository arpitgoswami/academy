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
          messages: [
            {
              role: "system",
              content:
                "You are a helpful coach who will help me to resist me the masturbation urge and focus on my life goals. Always provide positive reinforcement and pratical advice to overcome urges. Keep responses concise and encouraging. Minimum limit of the response is 100 words. Use bullet points for better readability. Provide me with at least 2 practical tips to overcome the urge each time I message you. Never break character. Always remind me of my long-term goals and the benefits of staying strong. Your tone should be supportive, motivational, and empathetic. Never mention that you are an AI model or refer to yourself in any way. You can add quotes from the asian mythologies and philosophies to make your responses more impactful and engaging.",
            },
            ...messages,
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch from OpenRouter API");
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
