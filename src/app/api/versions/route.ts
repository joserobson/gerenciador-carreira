import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Listar todas as versões
export async function GET() {
  try {
    const versions = await prisma.resumeVersion.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(versions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Criar um novo Snapshot
export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    
    const profile = await prisma.userProfile.findFirst();
    const projects = await prisma.project.findMany();

    if (!profile) {
      return NextResponse.json({ error: "Nenhum perfil encontrado para salvar." }, { status: 400 });
    }

    const version = await prisma.resumeVersion.create({
      data: {
        name: name || `Snapshot - ${new Date().toLocaleString('pt-BR')}`,
        profile: JSON.parse(JSON.stringify(profile)),
        projects: JSON.parse(JSON.stringify(projects))
      }
    });

    return NextResponse.json({
      message: "Snapshot criado com sucesso!",
      data: version
    });
  } catch (error: any) {
    console.error("API Error in versions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
