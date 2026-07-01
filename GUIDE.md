# 로컬몬 · 전남 — 프로토타입 v2 (탭 기반)

예선용 프로토타입입니다. **탐험 / 도감 / 포인트 / 내정보** 4개 탭 구조이고,
기획서의 랭크(5단계)·먹이 등급·업적 시스템을 화면에 반영했습니다.
**영수증 OCR만 실제(네이버 CLOVA) 작동**, 나머지는 목업입니다.

---

## 폴더 구조
```
localmon-v2/
├─ api/ocr.js               ← CLOVA OCR 중계 (키 보호)
├─ public/
│  ├─ index.html            ← 앱 전체 (수정은 대부분 여기)
│  └─ characters/           ← 캐릭터 이미지 (기획서에서 추출·배경제거 완료)
│     ├─ baedori.png 배돌이 / gatsuni.png 갓순이 / nakjiwang.png 낙지왕
│     ├─ nokcha.png 녹차선인 / juksuni.png 죽순이 / jindo.png 진도댕이
│     ├─ yuja.png 유자봉 / mascot.png 마스코트
├─ package.json / vercel.json
```

---

## ⭐ 수정하는 법 (제일 중요)

`public/index.html`을 열면 상단에 **DATA 구역**이 있습니다.
`⬇⬇⬇ 여기(DATA)만 고치면 ⬇⬇⬇` ~ `⬆⬆⬆ 여기까지가 DATA ⬆⬆⬆` 사이만 고치면
지도·도감·포인트 화면이 자동으로 바뀝니다. 아래 로직은 안 건드려도 됩니다.

- **시장/캐릭터 추가·수정** → `MARKETS` 배열
  - `x, y`: 지도 위 마커 위치(%). `rare:true`면 보라색 희귀 마커
  - `specialties`: 영수증에서 인식할 품목. `type`은 special(특산물·+100XP) / local(지역·+30XP)
  - `char`: 그 시장의 캐릭터 (이미지 파일명·등급)
- **먹이 경험치 수정** → `FEED`
- **랭크 단계·보상 수정** → `RANKS`
- **업적 수정** → `ACHIEVEMENTS`

예) 특산물 하나 추가:
```js
{ key:["재첩","섬진강재첩"], name:"섬진강 재첩", emoji:"🐚", type:"special" },
```
`key`는 영수증에 찍힐 법한 표기들(띄어쓰기 무시하고 매칭).

---

## 로컬에서 보기
```bash
cd localmon-v2/public
python3 -m http.server 8000     # http://localhost:8000
```
> ⚠️ 캐릭터 이미지는 절대경로(/characters/…)라서, 파일을 브라우저로 직접 여는 것보다
> 위처럼 간단한 서버로 열어야 이미지가 보입니다. (Vercel 배포 시엔 정상)

---

## 배포 (GitHub Desktop + Vercel 권장)
1. 이 폴더를 GitHub에 올리기 (GitHub Desktop: Add → Commit → Publish)
2. vercel.com → Continue with GitHub → Add New Project → 저장소 Import → Deploy
3. 배포 주소(`*.vercel.app`)를 폰으로 열면 시연 가능

## CLOVA OCR 키 (영수증 실제 인식)
1. ncloud.com → CLOVA OCR → Domain 생성(General/Korean)
2. **APIGW Invoke URL** 과 **Secret Key** 복사
3. Vercel → 프로젝트 → Settings → Environment Variables 에 등록
   - `CLOVA_OCR_URL`  = Invoke URL
   - `CLOVA_OCR_SECRET` = Secret Key
4. Deployments → Redeploy (키는 재배포해야 적용)

> 키가 없어도 데모는 '데모 모드'로 자동 진행되어 흐름은 끊기지 않습니다(발표 안전장치).

---

## 발표 시연 동선
탐험 탭 → 나주 남평장 마커 탭(체크인 +50P) → 영수증으로 먹이 주기
→ 나주 배 영수증 업로드(CLOVA 인식) → 특산물 전용 먹이 +100XP
→ 배돌이 성장 → 도감 탭에서 배돌이 등록 확인 → 포인트 탭에서 랭크·업적 보여주기

> "한 사람의 여정"으로 이으면 심사위원이 서비스를 몸으로 이해합니다.
