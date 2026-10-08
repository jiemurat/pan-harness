---
name: ph-doctor
description: Panoramic Harness bor loyihada harness'ni standart bo'yicha tekshiradi va tuzatadi: moslik jadvali, mechanical fix, structural taklif, migration. Harness, AGENTS.md yoki agent qoidalarini tekshirish so'ralganda va oylik parvarishda ishlatiladi.
license: MIT
metadata:
  version: "{{version}}"
  package: "@jiemurat/pan-harness"
---

# ph-doctor

<!-- include: skill-parts/intro.md -->

<!-- include: skill-parts/core-rules.md -->

## Steps

Batafsil qadamlar: `references/doctor.md`. Maqsad — loyiha harness'ining standart va tamoyillarga mosligi. Har qadam "Tugadi" sharti bajarilgach keyingisiga o't:

1. **Preparation.** Loyihaning start set'ini o'qi (`AGENTS.md`, `PAN-HARNESS.md`, `state.md`, `plan.md`), `git status` ni ko'r, versiyalarni solishtir, `playbooks/pan-harness.md` dagi loyiha qadamlarini va `node --version` ni aniqla. Tugadi: start set o'qilgan, versiyalar solishtirilgan, playbook qadamlari va Node versiyasi ma'lum.
2. **Scripts.** `node pan-harness/scripts/pan-harness-check.mjs --since <commit>` ni (yangi matnning boshlang'ich commit'i bilan: `references/audit.md` → "Writing"; loyiha skripti eski versiyada bo'lsa, `--since` ni skill'dagi skriptga ber: `references/doctor.md` → "2. Scripts"), profile'da `secrets` bo'lsa `node pan-harness/scripts/secret-check.mjs` ni va loyihaning status check'larini (`PAN-HARNESS.md` → `Project checks`) ishga tushir. Tugadi: har skript va status check natijasi raqam bilan yozilgan.
3. **Migration.** Loyiha versiyasi skill'nikidan eski bo'lsa, `node <skill>/scripts/migrate.mjs --root .` ni ishga tushir va u `by hand` deb chiqargan har bandni `references/changelog.md` bo'yicha bajar; harness unknown standard'da bo'lsa, `references/doctor.md` → "3. Migration" dagi tartibni bajar. Tugadi: birinchi ishga tushirishdagi har `by hand` bandi bajarilgan yoki `plan.md` da, `Standard:` qatori skill versiyasiga teng.
4. **Conformance audit.** `references/audit.md` ning har bandini tekshir, P26 bandlarini 2-qadamdagi `REVIEW` ro'yxati bo'yicha. Tugadi: har band moslik jadvalida `ok`, `fail`, `not checked` yoki `n/a` bilan, `REVIEW` dagi har belgilangan qator jadvalda sababi bilan `ok` yoki `fail`.
5. **Facts.** `references/doctor.md` → "5. Facts" dagi faktlar va qarorlarni haqiqat bilan solishtir. Tugadi: `state.md`, `system-map.md` va `project/` dagi har fakt `verified` yoki `unverified`, tanlangan har D `ok`, `fail` yoki sababi bilan `not checked`, `plan.md`, `Remove when` va `handoff.md` bandlari ko'rilgan.
6. **Fix.** Mechanical fix'ni darhol, structural fix'ni reja (maqsad, natija, kriteriyalar) va tasdiq bilan qil. Tugadi: har `fail` qatori tuzatilgan, `plan.md` → `Awaiting owner decision` da taklif sifatida turibdi yoki skill limitation sifatida hisobotda.
7. **Re-check va test.** Check'larni qayta ishga tushir va fresh-agent test haqida egasidan so'ra (`references/testing.md`). Tugadi: 0 xato, `secrets` bo'lsa `RESULT: clean`, egasining test bo'yicha javobi yozilgan.
8. **History entry va hisobot.** Joriy oy tarix fayliga yozuv qo'sh va hisobot ber, structural fix bo'lsa har kriteriya natijasi bilan. Tugadi: tarix yozuvi bor, structural fix uchun D va egasining yangi gapi uchun F yozilgan, hisobot egasida.

<!-- include: skill-parts/files.md -->

<!-- include: skill-parts/fresh-agent-test.md -->

<!-- include: skill-parts/report.md -->
