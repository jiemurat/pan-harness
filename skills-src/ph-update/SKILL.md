---
name: ph-update
description: Panoramic Harness (pan-harness) paketini (npm, @jiemurat/pan-harness) yangi versiyaga yangilaydi, loyiha harness'ini changelog bo'yicha yangi standartga ko'chiradi va oxirida to'liq ph-doctor tekshiruvini o'tkazadi. Foydalanuvchi /ph-update (Codex'da $ph-update) deb yozganda yoki pan-harness'ni yangilashni so'raganda ishlatiladi.
license: MIT
metadata:
  version: "{{version}}"
  package: "@jiemurat/pan-harness"
---

# ph-update

<!-- include: skill-parts/intro.md -->

<!-- include: skill-parts/core-rules.md -->

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

<!-- include: skill-parts/files.md -->

<!-- include: skill-parts/fresh-agent-test.md -->

<!-- include: skill-parts/report.md -->
