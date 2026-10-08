---
name: ph-update
description: Panoramic Harness paketini (@jiemurat/pan-harness) yangilaydi, harness'ni yangi standart versiyasiga migration qiladi va oxirida to'liq ph-doctor o'tkazadi. Pan-harness'ni yangilash so'ralganda ishlatiladi.
license: MIT
metadata:
  version: "1.1.0"
  package: "@jiemurat/pan-harness"
---

# ph-update

Panoramic Harness (qisqasi pan-harness) — loyihaning agentlar uchun bilim va qoidalar tizimi. Uni har qanday agent va model o'qiy oladi: hammasi oddiy Markdown, biror vositaga xos fayl yoki xotiraga tayanilmaydi. Har sessiyadagi agent yangi va oldingi suhbatni eslamaydi, shuning uchun loyihani davom ettirishga kerak hamma narsa repo'da yoziladi.

Pan-harness `@jiemurat/pan-harness` npm paketidagi to'rt skill bilan ishlaydi:

| Skill | When | Result |
|---|---|---|
| `ph-init` | Loyihada pan-harness yo'q: papka bo'sh yoki loyiha bor (boshqa shakldagi `AGENTS.md`, `CLAUDE.md` yoki `CONTEXT.md` bo'lishi mumkin) | Profile, standart structure, egasi bilan kelishilgan qoidalar, check'dan o'tgan harness |
| `ph-doctor` | Pan-harness bor. Muntazam (masalan, oyda bir) yoki egasi so'raganda | Moslik jadvali, mechanical fix'lar, yangi standart versiyasiga migration, structural takliflar |
| `ph-update` | Paketning yangi versiyasi chiqqan | Skill'lar yangilangan, harness yangi versiyaga migration qilingan, to'liq `ph-doctor` o'tkazilgan |
| `ph-grilling` | Katta ishni rejalashtirish suhbati | Raund-raund savollar, kelishilgan qarorlar |

Skill'lar loyihaga `npx @jiemurat/pan-harness@latest init` bilan o'rnatiladi va git'ga kirmaydi: ular asbob, loyiha bilimi esa harness'da. Egasi skill'ni agentida chaqiradi: Claude Code, Antigravity, Cursor, GitHub Copilot, Gemini CLI va OpenCode'da `/ph-init`, Codex'da `$ph-init`. Agent maqsadli loyihaning ildizida ishlaydi. Atama noaniq bo'lsa, `references/structure.md` → "Glossary" ni o'qi.

## Core rules

Skill bilan ishlaganda bu qoidalar maqsadli loyihaning qoidalaridan oldin ham amal qiladi:

1. **Faktni o'zing top, qarorni egasi qiladi.** Repo, hujjat va live system'dan topiladigan narsani o'zing top; egasidan faqat qaror va repo'da yo'q bilimni so'ra (P20).
2. **Faqat repo'da yo'q bilimni yoz** (P13): egasining qarorlari, uslubi, xavfli joylar, tekshirilgan faktlar. README, kod, config, `--help`, papka structure'i va buyruqlarga havola ber: nusxa eskiradi va xarajatni oshiradi.
3. **Har da'voni tekshir.** Hujjat, README va eski hisobotdagi fakt tekshirilmaguncha `unverified` hisoblanadi. Hisobotda `verified` va `unverified` ni ajratib yoz.
4. **Sir qiymatini hech qachon o'qima va ekranga chiqarma.** `.env`, `secrets.*`, kalit va token fayllaridan faqat fayl va o'zgaruvchi nomini yoz. Shaxsiy ma'lumot va maxfiy hujjat o'rniga ham harness'ga yo'l, ID va neytral tavsif yoziladi.
5. **Katta o'zgarish reja bilan.** Structure, qoida yoki ma'noni o'zgartiradigan ishni avval reja bilan ber va egasining aniq tasdig'igacha faqat o'qi. Reja maqsad, natija va kriteriyalardan boshlanadi, yakuniy rejada istisnolar, byudjet va (bir sessiyaga sig'masa) bosqichlar bo'ladi. Tasdiqdan keyin ish state'i `pan-harness/handoff.md` da yuritiladi, ish oxirida har kriteriya dalil bilan tekshiriladi (P21, P24). Qoidada belgilangan mechanical fix darhol qilinadi (`references/doctor.md`).
6. **Variantni tamoyilga asosla.** Structure bo'yicha variant berishdan oldin `references/principles.md` ni o'qi va har variant qaysi tamoyilga tayanishini ayt. Internetdagi yangi amaliyotni loyihaning qoidasi yoki egasining so'rovi bo'yicha o'rgan.
7. **Hajmni o'lcha.** `wc -c` bilan sana; start set limit'i `references/structure.md` → "Size limits" da.
8. **Kichik model ham tushunadigan qilib yoz.** Harness matnini `references/structure.md` → "Writing" (P26) bo'yicha yoz: buyruq shakli, positive form, completion criterion, bitta atama.
9. **Egasining uslubini so'ra.** Til, atamalar, murojaat, ruxsat va commit tartibi (S11, standart javob — agent o'zi commit qiladi) `references/style-questions.md` bo'yicha so'raladi va loyihaning harness'iga yoziladi.
10. **Egasining tahrirlari ustun.** Egasi o'zgartirgan matnni saqla va ishingni uning ustiga qur. Unda yangi ko'rsatma ko'rinsa, loyihaning `feedback.md` iga yoz.
11. **Irreversible action faqat ruxsat bilan.** Fayl o'chirish va tarixni qayta yozish faqat egasining aniq ko'rsatmasi bilan. Push'ni egasi qiladi: agent uni faqat egasi aniq so'raganda bajaradi va bu haqda o'zi so'ramaydi. Commit loyihaning R4 qoidasi bo'yicha qilinadi, `ph-init` da esa S11 javobiga ko'ra. Hook xato bersa, sababini tuzat: `--no-verify` uchun egasi shu commit uchun alohida ruxsat bergan bo'lishi kerak.
12. **Git doim bor.** Pan-harness git'da ishlaydi: tarix, checkpoint'lar va egasining hamda agentning o'zgarishlarini ajratish shunga tayanadi. Git yo'q bo'lsa, `ph-init` uni o'rnatadi va sozlaydi (`references/structure.md` → "Git"). Har ish oxirida agent `.gitignore` ni nazorat qiladi.
13. **Skill fayllari faqat o'qiladi:** skill'ni uning muallifi takomillashtiradi. Skill'da nuqson topilsa, `references/doctor.md` → "6. Fix" dagi skill limitation tartibini bajar.

## Steps

Paketni yangilash va harness migration'i bitta ish: oxirida har safar to'liq `ph-doctor` o'tkaziladi. Migration qoidalari `references/doctor.md` → "3. Migration" va "6. Fix" da, versiyalar qadamlari yangi o'rnatilgan `references/changelog.md` da. Har qadam "Tugadi" sharti bajarilgach keyingisiga o't:

1. **Versiyalar.** Uchta versiyani solishtir:
   - o'rnatilgan skill'lar: `.agents/skills/.pan-harness.json` yoki `.claude/skills/.pan-harness.json` → `version` (CLI'siz o'rnatilgan bo'lsa, shu skill'ning `SKILL.md` → `metadata.version`);
   - npm'dagi oxirgisi: `npm view @jiemurat/pan-harness version` (internet yo'q bo'lsa, egasiga ayt va 3-qadamdan davom et);
   - harness standarti: `PAN-HARNESS.md` → `Standard:`; unknown standard (`references/structure.md` → "Glossary") ham shu yerda aniqlanadi.

   Uchalasi bir xil bo'lsa, 5-qadamga o't. Tugadi: uchala versiya ma'lum.
2. **Paketni yangilash.** `npx @jiemurat/pan-harness@latest update` ni ishga tushir. CLI 3 kodi bilan to'xtasa, skill fayllari qo'lda o'zgartirilgan: ro'yxatni egasiga ko'rsat, u rozi bo'lsa, `--yes` bilan qayta ishga tushir. CLI chiqargan o'zgarishlar ro'yxatini (`CHANGELOG.md`) hisobotga ol. Skill'lar CLI'siz o'rnatilgan bo'lsa (plugin yoki `npx skills`), ularni o'sha yo'l bilan yangila. Tugadi: skill'lar yangi versiyada (`.pan-harness.json` → `version`).
3. **Migration.** Yangi o'rnatilgan skill papkasidan `node <skill>/scripts/migrate.mjs --root .` ni ishga tushir: u `references/changelog.md` dagi `mechanical` qadamlarni bajaradi, skriptlarni almashtiradi va `Standard:` qatorini yangilaydi. U `by hand` deb chiqargan har bandni o'sha changelog qadami bo'yicha qo'lda bajar; `structural` qadamlarni egasining tasdig'i bilan (reja va kriteriyalar bilan). Skript unknown standard deb to'xtasa (3 kodi), `references/doctor.md` → "3. Migration" dagi tartibni bajar. Tugadi: `migrate.mjs` ning birinchi ishga tushirishidagi har `by hand` bandi bajarilgan yoki hisobotda, qolgan structural qadamlar egasining tasdig'ini kutmoqda.
4. **Check.** `node pan-harness/scripts/pan-harness-check.mjs` ni (loyihada `--live` yozilgan bo'lsa, u bilan) va profile'da `secrets` bo'lsa `node pan-harness/scripts/secret-check.mjs` ni ishga tushir. Tugadi: 0 xato, `secrets` bo'lsa `RESULT: clean`.
5. **To'liq `ph-doctor`.** `references/doctor.md` bo'yicha to'liq `ph-doctor` o'tkaz: moslik jadvali, mechanical fix'lar darhol, structural takliflar reja bilan. Tugadi: moslik jadvali tayyor.
6. **Commit va hisobot.** Loyihaning R4 qoidasi bo'yicha commit qil va hisobot ber: versiyalar (eski → yangi), bajarilgan qadamlar, egasining tasdig'ini kutayotgan structural qadamlar, `ph-doctor` moslik jadvali. Tugadi: hisobot egasida, R4 bo'yicha commit qilingan.

Yangilangan skill'larni agent sessiya boshida o'qiydi: keyingi ishni yangi sessiyada boshla.

## Files and when to read them

| File | Contents | When to read |
|---|---|---|
| `references/structure.md` | Pan-harness standarti: glossary, profile, fayllar, jurnallar, hajm limit'lari, yozish qoidalari (P26) | Har skill'ning boshida |
| `references/audit.md` | Moslik ro'yxati (A1…): har talab, uning smell'i, tekshirish usuli va tuzatish turi | `ph-doctor` ning 4-qadamida va `ph-init` oxirida |
| `references/changelog.md` | Standart versiyalari va har versiyaning migration qadamlari | `ph-doctor` va `ph-update` da, loyiha versiyasi skill'nikidan farq qilsa |
| `references/principles.md` | Tamoyillar (P1…) va ularning manbalari | Structure yoki qoida haqidagi qarordan oldin |
| `references/style-questions.md` | Egasining ish uslubi haqidagi savollar (S1…), variantlar va tavsiyalar | `ph-init` suhbatida |
| `references/init.md` | `ph-init` qadamlari va checklist | `ph-init` da; `ph-doctor` da migration qarori va migration table kerak bo'lganda |
| `references/doctor.md` | `ph-doctor` qadamlari, migration, mechanical va structural fix boundary'si, skill limitation | `ph-doctor` va `ph-update` da |
| `references/testing.md` | Sinov tartiblari: doimiy savollar to'plami, "o'rtasidan davom ettirish" sinovi, mustaqil tekshiruvchi va skeptik rejimi, soddalashtirish tajribasi, A51 | Sinovni egasiga taklif qilishdan oldin (`ph-init` va `ph-doctor` oxirida, structural o'zgarishdan keyin) |
| `templates/` | Standart qismning shablonlari (`*.tmpl`), git hook ham (`githooks/pre-commit.tmpl`) | Fayl yaratishda va `ph-doctor` da shablon bilan solishtirishda |
| `scripts/pan-harness-check.mjs` | Structure, profile, bo'lim, maydon, ID, tag, yo'l, hajm va atama check'i; `--since` bilan yangi qatorlar ro'yxati (`REVIEW`, `ph-doctor` ning 2-qadamida); `ph-init` nusxasini loyihaga qo'yadi | Har harness yozuvidan keyin |
| `scripts/secret-check.mjs` | Sirga o'xshash qatorlarni qidirish (qiymat chiqarilmaydi). Standart yo'llar: `AGENTS.md`, `PAN-HARNESS.md`, `CLAUDE.md`, `pan-harness/` | Commit oldidan, profile'da `secrets` bo'lsa |
| `scripts/scaffold.mjs` | Standart qismni va hook'ni `templates/` dan, skriptlarni `scripts/` dan loyihaga copy qiladi, mavjud faylga tegmaydi | `ph-init` ning 5-qadamida |
| `scripts/migrate.mjs` | `changelog.md` dagi `mechanical` qadamlarni bajaradi, skriptlarni almashtiradi, `Standard:` ni yangilaydi | `ph-update` va `ph-doctor` da, loyiha versiyasi eski bo'lsa |

Skriptlarni o'qish o'rniga ishga tushir: `node <skill>/scripts/pan-harness-check.mjs --root <loyiha>`.

## Fresh-agent test

Sinovni har safar egasidan so'ra: qaysi sinov, qaysi model va token estimate'i. Qaysi sinovni qachon taklif qilish: `references/testing.md` → "When to test"; egasining doimiy javobi loyihaning `playbooks/pan-harness.md` → `Fresh-agent test` da.

## Report

Egasining tilida, qisqa:
- reja bilan qilingan ishda har kriteriya: ✅ (dalil bilan), ❌ yoki ⏳ (qachon tekshiriladi);
- reja bilan qilingan ishda o'zgargan komponentlar xaritasi: har biri uchun nima o'zgardi, kimga ta'sir qiladi, kutilgan xarajat va sifat, qanday o'chiriladi yoki qaytariladi;
- nima qilindi va nima topildi (raqamlar bilan);
- `ph-doctor` da moslik jadvali: bo'lim bo'yicha `ok`, `fail`, `not checked`;
- `verified` va `unverified` alohida;
- skill limitation'lar (bo'lsa);
- egasining qarori kerak bo'lgan savollar (raqamlangan, variant va tavsiya bilan);
- o'zgargan fayllar ro'yxati, keyingi qadam.
