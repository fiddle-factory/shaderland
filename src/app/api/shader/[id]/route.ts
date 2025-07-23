import { NextRequest, NextResponse } from "next/server";
import { getShaderById } from "../../../../lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const shader = await getShaderById(params.id);

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
