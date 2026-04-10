import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { id, ...data } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "O ID do projeto é obrigatório." }, { status: 400 });
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        company: data.company ?? undefined,
        startDate: data.startDate ?? undefined,
        endDate: data.endDate ?? undefined,
        jobTitle: data.jobTitle ?? undefined,
        description: data.description ?? undefined,
        role: data.role ?? undefined,
        technologies: data.technologies ?? undefined,
        challenges: data.challenges ?? undefined,
        solutions: data.solutions ?? undefined
      }
    });

    return NextResponse.json({ message: "Projeto atualizado com sucesso!", data: project });
  } catch (error: any) {
    console.error("API Error in project update:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
