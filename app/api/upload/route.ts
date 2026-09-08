import { NextRequest, NextResponse } from "next/server";
import { uploadToR2 } from "@/lib/r2";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "sponsor";

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado no formulário." },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    const validMimes = [
      "image/png",
      "image/webp",
      "image/jpeg",
      "image/jpg",
      "image/svg+xml",
    ];
    if (!validMimes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Formato inválido. Envie uma imagem nos formatos PNG, WEBP, JPG ou SVG.",
        },
        { status: 400 }
      );
    }

    // Limite de 8MB para logos/imagens
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: "A imagem excede o tamanho máximo de 8MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const prefix = type === "logo" ? "logo" : "sponsor";
    const uploadResult = await uploadToR2(
      buffer,
      `${prefix}_${file.name}`,
      file.type
    );

    return NextResponse.json(
      {
        success: true,
        url: uploadResult.url,
        s3Key: uploadResult.s3Key,
        provider: uploadResult.provider,
        fileName: file.name,
        sizeBytes: file.size,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[UPLOAD_API_ERROR]", error);
    const message =
      error instanceof Error ? error.message : "Erro ao realizar upload de imagem.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
