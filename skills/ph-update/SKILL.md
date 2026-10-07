---
name: ph-update
description: Panoramic Harness (pan-harness) paketini (npm, @jiemurat/pan-harness) yangi versiyaga yangilaydi, loyiha harness'ini changelog bo'yicha yangi standartga ko'chiradi va oxirida to'liq ph-doctor tekshiruvini o'tkazadi. Foydalanuvchi /ph-update (Codex'da $ph-update) deb yozganda yoki pan-harness'ni yangilashni so'raganda ishlatiladi.
license: MIT
metadata:
  version: "1.0.0"
  package: "@jiemurat/pan-harness"
---

# ph-update

Panoramic Harness (qisqasi pan-harness) — loyihaning agentlar uchun bilim va qoidalar tizimi. Uni har qanday agent va model o'qiy oladi: hammasi oddiy Markdown, biror vositaga xos fayl yoki xotiraga tayanilmaydi. Har sessiyadagi agent yangi va oldingi suhbatni eslamaydi, shuning uchun loyihani davom ettirishga kerak hamma narsa repo'da yoziladi.

Pan-harness `@jiemurat/pan-harness` npm paketidagi to'rt skill bilan ishlaydi:

| Skill | When | Result |
|---|---|---|
| `ph-init` | Loyihada pan-harness yo'q: papka bo'sh yoki loyiha bor (boshqa shakldagi `AGENTS.md`, `CLAUDE.md` yoki `CONTEXT.md` bo'lishi mumkin) | Profile, standart tuzilma (structure), egasi bilan kelishilgan qoidalar, tekshiruvdan (check) o'tgan harness |
| `ph-doctor` | Pan-harness bor. Muntazam (masalan, oyda bir) yoki egasi so'raganda | Moslik jadvali, mechanical fix'lar, yangi standart versiyasiga ko'chirish (migration), structural takliflar |
| `ph-update` | Paketning yangi versiyasi chiqqan | Skill'lar yangilangan, harness yangi versiyaga ko'chirilgan, to'liq `ph-doctor` o'tkazilgan |
| `ph-grilling` | Katta ishni rejalashtirish suhbati | Raund-raund savollar, kelishilgan qarorlar |

Skill'lar loyihaga `npx @jiemurat/pan-harness@latest init` bilan o'rnatiladi va git'ga kirmaydi: ular asbob, loyiha bilimi esa harness'da. Egasi skill'ni agentida chaqiradi: Claude Code, Antigravity, Cursor, GitHub Copilot, Gemini CLI va OpenCode'da `/ph-init`, Codex'da `$ph-init`. Agent maqsadli loyihaning ildizida ishlaydi. Atamalar `references/structure.md` → "Glossary" da.

## Core rules

Skill bilan ishlaganda bu qoidalar maqsadli loyihaning qoidalaridan oldin ham amal qiladi:

1. **Faktni o'zing top, qarorni egasi qiladi.** Repo, hujjat va live system'dan topish mumkin bo'lgan narsa so'ralmaydi. Egasidan faqat qaror va repo'da yo'q bilim so'raladi.
2. **Faqat topib bo'lmaydigan narsani yoz.** Repo'da bor ma'lumotni (README, kod va papka tuzilishi, buyruqlar ro'yxati) harness'ga ko'chirma (copy), unga havola ber. Takror ma'lumot agentni chalg'itadi va xarajatni oshiradi (`references/principles.md`, P13).
3. **Har da'voni tekshir.** Hujjat, README va eski hisobotdagi fakt tekshirilmaguncha `unverified` hisoblanadi. Hisobotda `verified` va `unverified` ni ajratib yoz.
4. **Sir qiymatini hech qachon o'qima va ekranga chiqarma.** `.env`, `secrets.*`, kalit va token fayllarini ochma: faqat fayl va o'zgaruvchi nomini yoz. Shaxsiy ma'lumot va maxfiy hujjatlarning mazmunini ham harness'ga ko'chirma (copy).
5. **Katta o'zgarish reja bilan.** Tuzilma, qoida yoki ma'noni o'zgartiradigan ishni avval reja bilan ber va egasining aniq tasdig'igacha (approval) faqat o'qi. Reja maqsad, natija va kriteriyalardan (acceptance criteria) boshlanadi, yakuniy rejada istisnolar, byudjet va (bir sessiyaga sig'masa) bosqichlar bo'ladi; tasdiqdan keyin ish holati `pan-harness/handoff.md` da yuritiladi, ish oxirida har kriteriya dalil bilan tekshiriladi (`references/principles.md`, P21, P24). Qoidada belgilangan mechanical fix darhol qilinadi (`references/doctor.md`).
6. **Variantni tamoyilga asosla.** Tuzilish bo'yicha variant berishdan oldin `references/principles.md` ni o'qi va har variant qaysi tamoyilga tayanishini ayt. Internetdagi yangi amaliyotni loyihaning qoidasi yoki egasining so'rovi bo'yicha o'rgan.
7. **Hajmni o'lcha, taxmin (estimate) qilma.** `wc -c` bilan sana. Start set chegarasi (limit) `references/structure.md` da.
8. **Kichik model ham tushunadigan qilib yoz.** Buyruq shakli, bajaruvchi aniq, bitta bandda bitta fikr (`references/structure.md` → "Writing").
9. **Egasining uslubini taxmin (assumption) qilma.** Til, atamalar, murojaat, ruxsat va commit tartibi (S11, standart javob — agent o'zi commit qiladi) `references/style-questions.md` bo'yicha so'raladi va loyihaning harness'iga yoziladi.
10. **Egasining tahrirlari ustun.** Egasi o'zgartirgan matnni qaytarma. Unda yangi ko'rsatma ko'rinsa, loyihaning `feedback.md` iga yoz.
11. **Irreversible action faqat ruxsat bilan.** Fayl o'chirish va tarixni qayta yozish egasi aniq aytmaguncha qilinmaydi. Push'ni egasi qiladi: agent push qilmaydi va bu haqda so'ramaydi. Commit loyihaning R4 qoidasi bo'yicha qilinadi, `ph-init` da esa S11 javobiga ko'ra.
12. **Git doim bor.** Pan-harness git'da ishlaydi: tarix, nazorat nuqtalari va egasining hamda agentning o'zgarishlarini ajratish shunga tayanadi. Git yo'q bo'lsa, `ph-init` uni o'rnatadi va sozlaydi (`references/structure.md` → "Git"). Har ish oxirida agent `.gitignore` ni nazorat qiladi.
13. **Skill fayllari faqat o'qiladi.** Skill fayllarini o'zgartirma va ularni o'zgartirishni egasiga taklif ham qilma: skill'ni faqat uning muallifi takomillashtiradi. Skill'da nuqson topilsa, `references/doctor.md` → "6. Fix" dagi skill limitation tartibi bo'yicha ish qil.

## Steps

Paketni yangilash va harness'ni yangi versiyaga ko'chirish bitta ish: oxirida har safar to'liq `ph-doctor` o'tkaziladi. Ko'chirish qoidalari `references/doctor.md` → "3. Migration" va "6. Fix" da, versiyalar qadamlari yangi o'rnatilgan `references/changelog.md` da.

1. **Versiyalar.** Uchta versiyani solishtir:
   - o'rnatilgan skill'lar: `.agents/skills/.pan-harness.json` yoki `.claude/skills/.pan-harness.json` → `version` (CLI'siz o'rnatilgan bo'lsa, shu skill'ning `SKILL.md` → `metadata.version`);
   - npm'dagi oxirgisi: `npm view @jiemurat/pan-harness version` (internet yo'q bo'lsa, egasiga ayt va 3-qadamdan davom et);
   - harness standarti: `PAN-HARNESS.md` → `Standard:`. Qator yo'q yoki versiya `references/changelog.md` da bo'lmasa, harness noma'lum standartda (versiya raqamining katta-kichikligiga qaralmaydi).

   Uchalasi bir xil bo'lsa, yangilash kerak emas: 5-qadamga o't.
2. **Paketni yangilash.** `npx @jiemurat/pan-harness@latest update`. CLI 3 kodi bilan to'xtasa, skill fayllari qo'lda o'zgartirilgan: ro'yxatni egasiga ko'rsat, u rozi bo'lsa, `--yes` bilan qayta ishga tushir. CLI o'zgarishlar ro'yxatini (`CHANGELOG.md`) chiqaradi: uni hisobotga ol. Skill'lar CLI'siz o'rnatilgan bo'lsa (plugin yoki `npx skills`), ularni o'sha yo'l bilan yangila.
3. **Harness'ni ko'chirish.** Yangi o'rnatilgan skill papkasidagi `references/changelog.md` ni o'qi, shu sessiyadagi eski matnni emas: unda yangi versiyaning qadamlari bor. `Standard:` dan keyingi har versiya qadamlarini eskisidan yangisiga qarab bajar: `mechanical` darhol, `structural` egasining tasdig'i bilan (reja va kriteriyalar bilan). Harness noma'lum standartda bo'lsa, changelog qadamlari o'rniga uni `structure.md` va `templates/` bilan solishtirib ko'chir (`references/doctor.md` → "3. Migration"). Skriptlar (`pan-harness/scripts/`) va hook yangi skill papkasidagilar bilan almashtiriladi.
4. **Tekshiruvlar.** `node pan-harness/scripts/pan-harness-check.mjs` (loyihada `--live` yozilgan bo'lsa, u bilan) va (profile'da `secrets` bo'lsa) `node pan-harness/scripts/secret-check.mjs`: 0 xato va `RESULT: clean`.
5. **To'liq `ph-doctor`.** `references/doctor.md` bo'yicha to'liq tekshiruv har `ph-update` oxirida o'tkaziladi: moslik jadvali, mechanical fix'lar darhol, structural takliflar reja bilan.
6. **Commit va hisobot.** Loyihaning R4 qoidasi bo'yicha commit. Hisobotda: versiyalar (eski → yangi), bajarilgan qadamlar, egasining tasdig'ini kutayotgan structural qadamlar, `ph-doctor` moslik jadvali.

Yangilangan skill'larni agent sessiya boshida o'qiydi: keyingi ishni yangi sessiyada boshla.

## Files and when to read them

| File | Contents | When to read |
|---|---|---|
| `references/structure.md` | Pan-harness standarti: glossary, profile, fayllar, jurnallar, hajm chegaralari (limits), yozish qoidalari | Har skill'ning boshida |
| `references/audit.md` | Moslik ro'yxati (A1…): har talab, uning smell'i, tekshirish usuli va tuzatish turi | `ph-doctor` ning 4-qadamida va `ph-init` oxirida |
| `references/changelog.md` | Standart versiyalari va har versiyaga ko'chirish (migration) qadamlari | `ph-doctor` va `ph-update` da, loyiha versiyasi skill'nikidan farq qilsa |
| `references/principles.md` | Tamoyillar (P1…) va ularning manbalari | Tuzilish yoki qoida haqidagi qarordan oldin |
| `references/style-questions.md` | Egasining ish uslubi haqidagi savollar (S1…), variantlar va tavsiyalar | `ph-init` suhbatida |
| `references/init.md` | `ph-init` qadamlari va checklist | `ph-init` da (`ph-doctor` da ham: ko'chirish (migration) qarori va migration table qoidasi shu yerda) |
| `references/doctor.md` | `ph-doctor` qadamlari, ko'chirish (migration), mechanical va structural fix chegarasi (boundary), skill limitation | `ph-doctor` va `ph-update` da |
| `references/testing.md` | Sinov tartiblari: doimiy savollar to'plami, "o'rtasidan davom ettirish" sinovi, mustaqil tekshiruvchi va skeptik rejimi, soddalashtirish tajribasi, A51 | Sinovni egasiga taklif qilishdan oldin (`ph-init` va `ph-doctor` oxirida, structural o'zgarishdan keyin) |
| `templates/` | Standart qismning shablonlari (`*.tmpl`), git hook ham (`githooks/pre-commit.tmpl`) | Fayl yaratishda va `ph-doctor` da shablon bilan solishtirishda |
| `scripts/pan-harness-check.mjs` | Tuzilma, profile, bo'lim, maydon, ID, tag, yo'l va hajm tekshiruvi (check) | Har yozishdan keyin. Loyihaga nusxasi qo'yiladi |
| `scripts/secret-check.mjs` | Sirga o'xshash qatorlarni qidirish (qiymat chiqarilmaydi). Standart yo'llar: `AGENTS.md`, `PAN-HARNESS.md`, `CLAUDE.md`, `pan-harness/` | Commit oldidan. Profile'da `secrets` bo'lsa, loyihaga nusxasi qo'yiladi |

Skriptlarni o'qima, ishga tushir: `node <skill>/scripts/pan-harness-check.mjs --root <loyiha>`.

## Fresh-agent test

Harness'ni faqat repo'ni ko'rgan yangi agent sinaydi: u yozgan agent ko'rmagan bo'shliqlarni topadi (P18, P25). Sinov token sarflaydi, shuning uchun har safar egasidan so'raladi: qaysi sinov, qaysi model, taxminan necha token. Egasining doimiy javobi bo'lsa (`playbooks/pan-harness.md` → `Fresh-agent test`), u tavsiyaga ta'sir qiladi. Tartiblar — doimiy savollar to'plami (oldin va keyin bir xil), "o'rtasidan davom ettirish", mustaqil tekshiruvchi, soddalashtirish tajribasi — `references/testing.md` da.

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
