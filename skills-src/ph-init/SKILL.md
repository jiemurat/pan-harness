---
name: ph-init
description: Loyihaga Panoramic Harness (pan-harness) yaratadi — istalgan AI agent (Claude Code, Codex, Gemini CLI, Antigravity, Cursor, GitHub Copilot va boshqalar) loyihani egasi kabi boshqarishi uchun oddiy matndagi qoidalar va bilim tizimi (AGENTS.md, PAN-HARNESS.md, pan-harness/). Bo'sh papkada ham, mavjud kod yoki hujjat loyihasida ham ishlaydi, boshqa shakldagi agent fayllarini (AGENTS.md, CLAUDE.md, .cursor/rules) bilim yo'qotmasdan ko'chiradi. Foydalanuvchi /ph-init (Codex'da $ph-init) deb yozganda yoki loyihaga harness, agent qoidalari yoki AGENTS.md qurishni so'raganda ishlatiladi.
license: MIT
metadata:
  version: "{{version}}"
  package: "@jiemurat/pan-harness"
---

# ph-init

<!-- include: skill-parts/intro.md -->

<!-- include: skill-parts/core-rules.md -->

## Steps

Batafsil qadamlar va checklist: `references/init.md`. Qisqacha:

0. **Holat.** Harness bor bo'lsa, `ph-init` qilinmaydi: `ph-doctor` yoki (`Standard:` dagi versiya skill'nikidan farq qilsa yoki qator yo'q bo'lsa) `ph-update` taklif qilinadi. Papka bo'sh bo'lsa, birinchi raundda loyiha nima bo'lishi so'raladi va `README.md`, `.gitignore` va git bilan minimal tuzilma yaratiladi. Mavjud loyihada 1-qadamdan boshlanadi.
1. **Preparation.** Git: o'rnatilmagan bo'lsa o'rnatish (`sudo` egasiga ko'rinadigan terminalda), `git init -b main`, `.gitignore`, dastlabki commit; commit qilinmagan o'zgarish bo'lsa, S11 javobidan keyin `Pre-init state` commit'i. Mavjud agent fayllari, sir fayllari ro'yxati (faqat nomlar), Node bor-yo'qligi.
2. **Facts.** Repo'ni cheklangan hajmda o'rgan: til, stack, ishga tushirish, deploy, live system, maxfiy ma'lumot, mavjud hujjatlar. Shulardan profile loyihasini tuz.
3. **Interview.** Birinchi raundning Q1 savoli — maqsad, egasi oxirida nimaga ega bo'lishi va kriteriyalar (P21), shu raundda profile va commit tartibi (S11) ham so'raladi. Keyin `references/style-questions.md` dagi savollar va repo'dan topilmagan loyiha bilimi so'raladi.
4. **Plan va tasdiq.** Kriteriyalarning oxirgi ro'yxati, qaysi fayllar yaratiladi yoki ko'chiriladi (move), migration table, nima qayerga tushadi.
5. **Create.** `templates/` dan standart qism (profile'ga mos bloklar bilan) va `.githooks/pre-commit`, loyihaga xos bilim `pan-harness/project/` ga. Bor bilim yo'qotilmasdan ko'chiriladi (migrate). `CLAUDE.md` bo'lsa, u `@AGENTS.md` ni import qiladi.
6. **Check.** `node pan-harness/scripts/pan-harness-check.mjs` va (profile'da `secrets` bo'lsa) `node pan-harness/scripts/secret-check.mjs`, keyin `references/audit.md` bo'yicha o'z-o'zini tekshirish (A51 tokensiz). Fresh-agent test o'tkazish egasidan so'raladi (`references/testing.md`).
7. **Report.** Har kriteriya natijasi, nima yaratildi, qaysi qarorlar yozildi, nima `unverified`, commit raqamlari (S11 a bo'lsa, `ph-init` ishini agent commit qiladi) va `git show` da nimani ko'rish kerak.

<!-- include: skill-parts/files.md -->

<!-- include: skill-parts/fresh-agent-test.md -->

<!-- include: skill-parts/report.md -->
