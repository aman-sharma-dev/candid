import { NextResponse } from "next/server";

const AMD_BACKEND_URL = process.env.AMD_BACKEND_URL || "http://localhost:8000";

export async function GET() {
  try {
    const res = await fetch(`${AMD_BACKEND_URL}/api/candidates`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Backend error: ${res.statusText}`);
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Error in GET /api/candidates:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Forward the form data to FastAPI
    const res = await fetch(`${AMD_BACKEND_URL}/api/candidates`, {
      method: "POST",
      body: formData, // Next.js fetch automatically handles multipart boundary for FormData body
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Backend error (${res.status}): ${errorText || res.statusText}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Error in POST /api/candidates:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
