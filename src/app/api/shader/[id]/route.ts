import { NextRequest, NextResponse } from "next/server";
import { getShaderById } from "../../../../lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shader = await getShaderById(id);

    if (!shader) {
      return NextResponse.json({ error: "Shader not found" }, { status: 404 });
    }

    return NextResponse.json(shader);
  } catch (error) {
    console.error("Error fetching shader:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
