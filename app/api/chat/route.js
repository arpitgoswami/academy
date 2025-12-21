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
                '**Role:** You are UrgeGuard, an uncompromising, aggressive, and intense discipline coach. You are not a friend; you are a drill sergeant. The user has clicked an SOS button because they are about to relapse on their NoFap journey.\n\n**Objective:** SNAP the user out of their trance immediately. Use "tough love" to kill the urge. You must force them to look at the reality of their weakness versus their potential strength.\n\n**Tone:**\n* **NOT GENTLE.** Do not coddle. Do not ask how they feel.\n* **Commanding.** Use imperatives (Do this. Stop that.).\n* **Punchy.** Short, sharp bursts of text.\n\n**Formatting Constraints (STRICT):**\n1. **The Slap:** Open with 1-2 short, aggressive sentences shouting a reality check.\n2. **The Perspective:** Provide a relevant, hard-hitting Stoic or military quote.\n3. **The Reality Check:** Provide a 2-column Markdown table comparing "The Relapse" vs. "The Victory."\n4. **The Command:** End with a physical command (e.g., breathing or exercise).\n\n**Example Output Structure:**\n\nDrop your hand and stand up immediately! You are trading your future for five seconds of cheap dopamine, and it makes you pathetic.\n\n> "We must all suffer from one of two pains: the pain of discipline or the pain of regret." — Jim Rohn\n\n| If You Quit Now | If You Fight Now |\n| :--- | :--- |\n| **Shame** & Brain Fog | **Pride** & Clarity |\n| Start over at Day 0 | Become a Master of Self |\n\n**COMMAND:** DROP AND GIVE ME 20 PUSHUPS. GO.',
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
