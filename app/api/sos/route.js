import fs from "fs";
import path from "path";

export async function POST() {
  try {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const filePath = path.join(dataDir, "sos.csv");
    const now = new Date();
    const timestamp = now.toISOString();
    const date = timestamp.slice(0, 10); // YYYY-MM-DD

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, "timestamp,date\n", "utf8");
    }

    fs.appendFileSync(filePath, `${timestamp},${date}\n`, "utf8");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error writing SOS CSV:", err);
    return new Response(JSON.stringify({ error: "Failed to record SOS" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "sos.csv");
    if (!fs.existsSync(filePath)) {
      return new Response(
        JSON.stringify({
          total: 0,
          pressesToday: 0,
          lastPress: null,
          perDay: {},
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let content = fs.readFileSync(filePath, "utf8");

    // Remove BOM if present and normalize line endings
    content = content.replace(/^\uFEFF/, "");
    const rawLines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    // If header present, remove it
    if (rawLines.length && /^timestamp\s*,\s*date/i.test(rawLines[0])) {
      rawLines.shift();
    }

    const perDay = {};
    let lastPress = null;

    for (const line of rawLines) {
      const parts = line.split(",");
      const timestamp = parts[0] ? parts[0].trim() : null;
      const date = parts[1]
        ? parts[1].trim()
        : timestamp
        ? timestamp.slice(0, 10)
        : null;
      if (!timestamp) continue;
      lastPress = timestamp;
      perDay[date] = (perDay[date] || 0) + 1;
    }

    const total = Object.values(perDay).reduce((a, b) => a + b, 0);
    const today = new Date().toISOString().slice(0, 10);
    const pressesToday = perDay[today] || 0;

    return new Response(
      JSON.stringify({ total, pressesToday, lastPress, perDay }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error reading SOS CSV:", err);
    return new Response(JSON.stringify({ error: "Failed to read stats" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
