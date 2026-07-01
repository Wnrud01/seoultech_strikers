// api/ocr.js
// 브라우저 → (이 함수) → 네이버 CLOVA OCR → 결과 텍스트 반환
// 목적: CLOVA API 키를 브라우저에 노출하지 않고 서버에서 중계 (CORS/보안 해결)
//
// [배포 전 준비]
// Vercel 프로젝트 Settings → Environment Variables 에 아래 2개를 등록:
//   CLOVA_OCR_URL     : CLOVA OCR에서 발급받은 APIGW Invoke URL
//   CLOVA_OCR_SECRET  : CLOVA OCR Secret Key
// (네이버 클라우드 플랫폼 > CLOVA OCR > Domain 생성 후 발급)

export const config = {
  api: {
    bodyParser: { sizeLimit: "10mb" }, // 영수증 이미지(base64) 수용
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST만 허용됩니다." });
  }

  const OCR_URL = process.env.CLOVA_OCR_URL;
  const OCR_SECRET = process.env.CLOVA_OCR_SECRET;

  if (!OCR_URL || !OCR_SECRET) {
    return res.status(500).json({
      error: "환경변수 CLOVA_OCR_URL / CLOVA_OCR_SECRET 가 설정되지 않았습니다.",
    });
  }

  try {
    // 프런트에서 { imageBase64: "data:image/jpeg;base64,..." } 형태로 전송
    const { imageBase64, format = "jpg" } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 가 없습니다." });
    }

    // data URL 접두사 제거 (순수 base64만 CLOVA에 전달)
    const pureBase64 = imageBase64.includes(",")
      ? imageBase64.split(",")[1]
      : imageBase64;

    const clovaBody = {
      version: "V2",
      requestId: "localmon-" + Date.now(),
      timestamp: Date.now(),
      images: [{ format, name: "receipt", data: pureBase64 }],
    };

    const clovaRes = await fetch(OCR_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-OCR-SECRET": OCR_SECRET,
      },
      body: JSON.stringify(clovaBody),
    });

    if (!clovaRes.ok) {
      const text = await clovaRes.text();
      return res.status(502).json({ error: "CLOVA 호출 실패", detail: text });
    }

    const data = await clovaRes.json();

    // 인식된 모든 텍스트를 한 줄로 합쳐서 반환 (프런트에서 특산물 키워드 매칭)
    const fields = data?.images?.[0]?.fields || [];
    const fullText = fields.map((f) => f.inferText).join(" ");

    return res.status(200).json({
      fullText,             // 예: "나주배 3개 15000 ... 합계 15000"
      fields,               // 상세(원하면 프런트에서 활용)
      raw: data,            // 디버깅용 (배포 시 제거해도 됨)
    });
  } catch (err) {
    return res.status(500).json({ error: "서버 오류", detail: String(err) });
  }
}
