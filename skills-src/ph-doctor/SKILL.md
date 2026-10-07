---
name: ph-doctor
description: Panoramic Harness (pan-harness) bor loyihada uni standart va tamoyillar bo'yicha bandma-band tekshiradi, mechanical xatolarni darhol tuzatadi, structural tuzatishlarni reja bilan taklif qiladi va kerak bo'lsa yangi standart versiyasiga ko'chiradi. Foydalanuvchi /ph-doctor (Codex'da $ph-doctor) deb yozganda, oylik parvarishda yoki harness, AGENTS.md yoki agent qoidalarini tekshirish so'ralganda ishlatiladi.
license: MIT
metadata:
  version: "{{version}}"
  package: "@jiemurat/pan-harness"
---

# ph-doctor

<!-- include: skill-parts/intro.md -->

<!-- include: skill-parts/core-rules.md -->

## Steps

Batafsil qadamlar: `references/doctor.md`. Asosiy maqsad — loyiha harness'ining standart va tamoyillarga mosligi. Qisqacha:

1. **Preparation.** Loyihaning start set'ini o'qi (`AGENTS.md`, `PAN-HARNESS.md`, `state.md`, `plan.md`), `git status`, versiyalarni solishtir.
2. **Scripts.** `node pan-harness/scripts/pan-harness-check.mjs` (loyiha extension'lari bilan), `node pan-harness/scripts/secret-check.mjs` (profile'da `secrets` bo'lsa), loyihaning status check'lari (`PAN-HARNESS.md` → `Project checks`).
3. **Migration.** Loyiha versiyasi skill'nikidan eski bo'lsa, `references/changelog.md` dagi qadamlar ketma-ket bajariladi. `Standard:` qatori yo'q yoki versiya changelog'da bo'lmasa, harness `structure.md` va `templates/` bilan solishtirib ko'chiriladi (`references/doctor.md` → "3. Migration").
4. **Conformance audit.** `references/audit.md` bandma-band o'tiladi, natija moslik jadvaliga yoziladi.
5. **Facts.** Joriy fayllar va qarorlarning `Where:` maydoni haqiqat bilan solishtiriladi.
6. **Fix.** Mechanical fix darhol, structural fix reja (maqsad, natija, kriteriyalar) va tasdiq bilan. Skill'dagi nuqson loyiha ichida aylanib o'tiladi.
7. **Re-check va test.** Tekshiruvlar (checks) qayta ishga tushiriladi, fresh-agent test egasidan so'raladi (`references/testing.md`).
8. **History entry va hisobot.** Structural fix bo'lsa, har kriteriya natijasi bilan.

<!-- include: skill-parts/files.md -->

<!-- include: skill-parts/fresh-agent-test.md -->

<!-- include: skill-parts/report.md -->
