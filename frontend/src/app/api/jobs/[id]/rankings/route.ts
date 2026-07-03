import { NextResponse } from "next/server";

const AMD_BACKEND_URL = process.env.AMD_BACKEND_URL || "http://localhost:8000";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const res = await fetch(`${AMD_BACKEND_URL}/api/jobs/${id}/rankings`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Backend error: ${res.statusText}`);
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`Error in GET /api/jobs/[id]/rankings:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
