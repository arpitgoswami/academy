
async function testKey() {
    const key = "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";
    console.log("Testing with new model: meta-llama/llama-3.3-70b-instruct:free");

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3.3-70b-instruct:free",
                messages: [{ role: "user", content: "Hello" }],
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("API Error:", response.status, errorText);
        } else {
            const data = await response.json();
            console.log("Success! Response from OpenRouter:");
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

testKey();
