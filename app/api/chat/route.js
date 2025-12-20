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
          model: "meta-llama/llama-3.3-70b-instruct:free",
          messages: [
            {
              role: "system",
              content:
                "You are UrgeGuard, a stoic and supportive AI assistant. A user has just clicked an SOS button because they are fighting an urge to quit their positive habits (NoFap). Your goal is to distract them, motivate them, and help them breathe. Keep responses short (under 2 sentences), punchy, and empathetic. Do not lecture long paragraphs.",
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
