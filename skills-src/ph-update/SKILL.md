---
name: ph-update
description: Panoramic Harness paketini (@jiemurat/pan-harness) yangilaydi, harness'ni yangi standart versiyasiga migration qiladi va oxirida to'liq ph-doctor o'tkazadi. Pan-harness'ni yangilash so'ralganda ishlatiladi.
license: MIT
metadata:
  version: "{{version}}"
  package: "@jiemurat/pan-harness"
---

# ph-update

<!-- include: skill-parts/intro.md -->

<!-- include: skill-parts/core-rules.md -->

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

<!-- include: skill-parts/files.md -->

<!-- include: skill-parts/fresh-agent-test.md -->

<!-- include: skill-parts/report.md -->
