import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    let profile = await prisma.userProfile.findFirst();

    if (profile) {
      profile = await prisma.userProfile.update({
        where: { id: profile.id },
        data: {
          name: data.name ?? undefined,
          email: data.email ?? undefined,
          title: data.title ?? undefined,
          summary: data.summary ?? undefined,
          skills: data.skills ?? undefined,
          portfolio: data.portfolio ?? undefined,
          professionalSite: data.professionalSite ?? undefined
        }
      });
    } else {
      profile = await prisma.userProfile.create({
        data: {
          name: data.name,
          email: data.email,
          title: data.title,
          summary: data.summary,
          skills: data.skills || [],
          portfolio: data.portfolio,
          professionalSite: data.professionalSite
        }
      });
    }

    return NextResponse.json({ message: "Perfil atualizado com sucesso!", data: profile });
  } catch (error: any) {
    console.error("API Error in profile update:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
