import { NextResponse } from "next/server";

const AMD_BACKEND_URL = process.env.AMD_BACKEND_URL || "http://localhost:8000";

export async function GET() {
  try {
    const res = await fetch(`${AMD_BACKEND_URL}/api/status`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Backend error: ${res.statusText}`);
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in GET /api/status proxy:", error);
    // Return a graceful offline response rather than failing
    return NextResponse.json({
      device: "cpu",
      gpu_available: false,
      gpu_name: "Offline / Fallback mode"
    });
  }
}
