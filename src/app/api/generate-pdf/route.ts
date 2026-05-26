import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import puppeteer from "puppeteer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

  try {
    const {
      language = "pt",
      provider = "gemini",
      githubUrl = "",
      linkedinUrl = "",
      professionalSite = ""
    } = await req.json();

    const user = await prisma.userProfile.findFirst();
    if (!user) {
      return NextResponse.json(
        { error: "Nenhum Perfil de Usuário encontrado. Faça o upload do CV primeiro." },
        { status: 400 }
      );
    }

    const origin = new URL(req.url).origin;
    const cvUrl = new URL("/cv", origin);
    cvUrl.searchParams.set("lang", language);
    cvUrl.searchParams.set("provider", provider);
    cvUrl.searchParams.set("github", githubUrl || user.portfolio || "");
    cvUrl.searchParams.set("linkedin", linkedinUrl);
    cvUrl.searchParams.set("site", professionalSite || user.professionalSite || "");

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.goto(cvUrl.toString(), { waitUntil: "load", timeout: 120000 });

    if (language === "en") {
      await page.waitForFunction(
        () => !document.body.innerText.includes("Translating resume into English..."),
        { timeout: 180000 }
      ).catch(() => undefined);
    }

    await page.emulateMediaType("print");

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: false,
      margin: {
        top: "0mm",
        right: "0mm",
        bottom: "0mm",
        left: "0mm"
      }
    });

    const filename = `curriculo-${(user.name || "profissional").toLowerCase().replace(/[^a-z0-9]+/g, "-") || "profissional"}.pdf`;

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error: any) {
    console.error("API Error in generate-pdf:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  } finally {
    await browser?.close();
  }
}
