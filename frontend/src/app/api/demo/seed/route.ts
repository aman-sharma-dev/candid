import { NextResponse } from "next/server";

const AMD_BACKEND_URL = process.env.AMD_BACKEND_URL || "http://localhost:8000";

export async function POST() {
  try {
    const res = await fetch(`${AMD_BACKEND_URL}/api/demo/seed`, {
      method: "POST",
    });
    if (!res.ok) {
      throw new Error(`Backend error: ${res.statusText}`);
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in POST /api/demo/seed proxy:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
