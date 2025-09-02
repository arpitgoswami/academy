import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // Get the search query from URL parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    // Google Custom Search API endpoint
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID;
    const GOOGLE_CSE_URL = `https://www.googleapis.com/customsearch/v1`;

    const response = await fetch(
      `${GOOGLE_CSE_URL}?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(
        query
      )}&searchType=image&num=8`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch images from Google Custom Search API");
    }

    const data = await response.json();

    // Transform the response to match the expected format
    const results =
      data.items?.map((item) => ({
        id: item.link,
        urls: {
          regular: item.link,
        },
        alt_description: item.title,
        source: {
          name: item.displayLink,
          favicon: `https://www.google.com/s2/favicons?domain=${item.displayLink}`,
          url: item.image.contextLink,
        },
      })) || [];

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error fetching images:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}
