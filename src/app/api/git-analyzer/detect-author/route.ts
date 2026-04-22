import { NextResponse } from "next/server";
import { detectAuthor } from "@/lib/git";

export async function POST(req: Request) {
  try {
    const { repoPath } = await req.json();
    if (!repoPath) return NextResponse.json({ error: "repoPath obrigatório" }, { status: 400 });

    const author = await detectAuthor(repoPath);
    if (!author) return NextResponse.json({ error: "Autor não encontrado neste repositório." }, { status: 404 });

    return NextResponse.json(author);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
