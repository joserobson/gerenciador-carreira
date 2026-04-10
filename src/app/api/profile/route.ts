import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const profile = await prisma.userProfile.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      profile,
      projects
    });
  } catch (error: any) {
    console.error("API Error in get-profile:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
