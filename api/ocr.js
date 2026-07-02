// api/ocr.js
// [Vercel 배포 준비]
// Vercel → Settings → Environment Variables 에 등록:
//   OPENAI_API_KEY : OpenAI API 키 (sk-...)

export const config = {
  api: {
    bodyParser: { sizeLimit: "10mb" },
  },
};

const OCR_PROMPT = `다음은 영수증 OCR 텍스트입니다. 아래 3가지 항목만 추출하여 JSON으로 반환하세요.

규칙:
- store_name: 가게 이름 (없으면 null)
- items: 구매 품목 목록. 각 항목은 { "name": 품목명, "price": 숫자(원 단위 정수) } 형태
- total_price: 최종 결제 금액 (숫자, 원 단위 정수. 없으면 null)
- 금액은 숫자만 추출 (콤마, '원' 제거)
- 품목명과 금액이 명확하지 않은 행은 제외
- 반드시 JSON만 출력. 설명 금지.

출력 형식:
{
  "store_name": "string | null",
  "items": [
    { "name": "string", "price": number }
  ],
  "total_price": number | null
}

영수증 텍스트:
{{OCR_TEXT}}`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST만 허용됩니다." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "환경변수 OPENAI_API_KEY 가 설정되지 않았습니다.",
    });
  }

  const { imageBase64, format = "jpg" } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: "imageBase64 가 없습니다." });
  }

  let dataUrl = imageBase64;
  if (!imageBase64.startsWith("data:")) {
    const mime = format === "png" ? "image/png" : "image/jpeg";
    dataUrl = `data:${mime};base64,${imageBase64}`;
  }

  try {
    const { OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey });

    // Step 1: Vision으로 이미지에서 텍스트 추출
    const visionRes = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "이 영수증 이미지에서 모든 텍스트를 그대로 추출해주세요. 줄바꿈을 유지하고 인식된 텍스트만 출력하세요.",
            },
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "high" },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const ocrText = visionRes.choices[0]?.message?.content?.trim() || "";

    // Step 2: 추출된 텍스트를 구조화된 JSON으로 파싱
    const parsePrompt = OCR_PROMPT.replace("{{OCR_TEXT}}", ocrText);

    const parseRes = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: parsePrompt }],
      max_tokens: 800,
      response_format: { type: "json_object" },
    });

    const rawJson = parseRes.choices[0]?.message?.content?.trim() || "{}";
    let parsed;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      parsed = { store_name: null, items: [], total_price: null };
    }

    // 기존 특산물 키워드 매칭용 fullText 생성 (하위 호환)
    const itemNames = (parsed.items || []).map((i) => i.name).join(" ");
    const fullText = [parsed.store_name || "", itemNames, ocrText]
      .filter(Boolean)
      .join(" ");

    return res.status(200).json({
      store_name: parsed.store_name ?? null,
      items: parsed.items ?? [],
      total_price: parsed.total_price ?? null,
      fullText,
      ocrText,
    });
  } catch (err) {
    console.error("[OCR Error]", err);
    return res.status(500).json({
      error: "OCR 처리 중 오류가 발생했습니다.",
      detail: String(err?.message || err),
    });
  }
}
