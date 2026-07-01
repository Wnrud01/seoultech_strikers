# 로컬몬 GO · 전남편 — 프로토타입 (README)

예선용 프로토타입입니다.
**전체 흐름(지도 → 도착 → 영수증 → 캐릭터 성장 → 포인트)은 하드코딩 목업**이고,
**영수증 OCR 한 곳만 네이버 CLOVA로 실제 작동**합니다. (기획서에서 강조한 "실구매 인증" 심장부)

---

## 1. 폴더 구조

```
localmon-proto/
├─ api/
│  └─ ocr.js            ← CLOVA OCR 중계 서버리스 함수 (키 보호)
├─ public/
│  ├─ index.html        ← 앱 화면 전체 (프런트)
│  └─ characters/       ← 여기에 배돌이.png 등 캐릭터 이미지
├─ package.json
├─ vercel.json
└─ README.md
```

---

## 2. 로컬에서 먼저 돌려보기

```bash
npm i -g vercel      # 최초 1회
cd localmon-proto
vercel dev           # http://localhost:3000
```

> OCR 키를 아직 안 넣었어도 화면 흐름은 다 돌아갑니다.
> (OCR 실패 시 자동으로 '데모 모드'로 넘어가도록 폴백 처리되어 있어, 발표 중 사고 방지)

---

## 3. CLOVA OCR 키 발급 (실제 인식용)

1. 네이버 클라우드 플랫폼(ncloud.com) 가입 → 콘솔
2. **CLOVA OCR** 상품 신청 → **Domain** 생성 (일반 OCR / General)
3. 생성된 도메인에서 두 값을 복사:
   - **APIGW Invoke URL** (예: `https://xxxx.apigw.ntruss.com/custom/v1/.../general`)
   - **Secret Key**

---

## 4. Vercel 배포 (발표용 URL 만들기)

```bash
cd localmon-proto
vercel               # 로그인 후 프로젝트 생성 (질문은 기본값 엔터)
```

배포 후 **환경변수 2개**를 등록 (Vercel 대시보드 → Settings → Environment Variables):

| 이름 | 값 |
|---|---|
| `CLOVA_OCR_URL` | 위에서 복사한 APIGW Invoke URL |
| `CLOVA_OCR_SECRET` | Secret Key |

등록 후 재배포:

```bash
vercel --prod
```

→ 나오는 `https://....vercel.app` 주소를 **폰으로 열면 발표 시연 가능**.

> ⚠️ API 키는 절대 코드나 GitHub에 직접 쓰지 마세요. 반드시 환경변수로.

---

## 5. 특산물 사전 늘리기 (팀 작업 포인트)

`public/index.html` 안의 `SPECIALTY` 배열에 시장별 특산물을 추가하면
OCR이 그 단어를 인식했을 때 '특산물 전용 먹이'로 처리합니다.

```js
{ key:["나주배","배"], name:"나주 배", emoji:"🍐", xp:200, pt:120, char:"배돌이" },
```

- `key`: 영수증에 찍힐 법한 표기들(띄어쓰기 무시하고 매칭)
- 8개 시장 특산물을 채우면 그게 곧 발표용 콘텐츠

---

## 6. 발표 시연 시나리오 (추천 동선)

1. 지도에서 **나주 남평장** 마커 탭 → 체크인 +50P
2. "로컬몬 만나러 가기" → 영수증 촬영 화면
3. **나주 배가 찍힌 실제/샘플 영수증** 업로드 → CLOVA가 "나주배" 인식
4. "특산물 전용 먹이 +200XP" 뜸 → 배돌이에게 먹이
5. 배돌이 **레벨업 애니메이션** + 포인트 적립 → 지역화폐 전환

> 한 사람의 여정으로 이어서 보여주면 심사위원이 서비스를 몸으로 이해합니다.

---

## 7. 데모 안전장치

- OCR 서버 연결이 안 되거나 키가 없어도, 자동으로 샘플 텍스트("나주배...")로
  넘어가 **데모가 끊기지 않습니다.** 발표 중 네트워크 사고 대비.
- 실제 인식을 보여주고 싶으면 키를 넣고, 안전하게만 가려면 그대로 둬도 흐름은 동일.
