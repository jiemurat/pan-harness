---
name: ph-init
description: Loyihaga harness quradi: AGENTS.md, PAN-HARNESS.md va pan-harness/ (Panoramic Harness). Harness yo'q loyihada ishlatiladi: bo'sh papka, kod yoki hujjat loyihasi, boshqa shakldagi AGENTS.md, CLAUDE.md yoki .cursor/rules bor loyiha.
license: MIT
metadata:
  version: "{{version}}"
  package: "@jiemurat/pan-harness"
---

# ph-init

<!-- include: skill-parts/intro.md -->

<!-- include: skill-parts/core-rules.md -->

## Steps

Batafsil qadamlar va checklist: `references/init.md`. Har qadam "Tugadi" sharti bajarilgach keyingisiga o't:

0. **Vaziyat.** Harness bor bo'lsa, `ph-doctor` yoki (`Standard:` dagi versiya skill'nikidan farq qilsa yoki harness unknown standard'da bo'lsa) `ph-update` ni taklif qil va shu yerda to'xta. Papka bo'sh bo'lsa, birinchi raundda (3-qadam) loyiha nima bo'lishini ham so'ra va javobdan keyin `README.md`, `.gitignore` va git bilan minimal structure yarat. Tugadi: uch vaziyatdan biri aniqlangan; harness bor bo'lsa, taklif egasida.
1. **Preparation.** Git'ni tayyorla (`references/init.md` → "1. Preparation"): o'rnatish, `git init -b main`, `.gitignore`, dastlabki commit. Mavjud agent fayllarini, sir fayllarini (faqat nomlar) va Node versiyasini aniqla. Tugadi: `git status` ishlaydi, `.gitignore` va dastlabki commit bor, agent va sir fayllari ro'yxatlangan, Node bor-yo'qligi ma'lum.
2. **Facts.** README va manifestlarni o'rgan (ro'yxati `references/init.md` → "2. Facts"): til, stack, ishga tushirish, deploy, live system, maxfiy ma'lumot, mavjud hujjatlar. Tugadi: har fakt `verified` yoki `unverified` belgisi bilan yozilgan, profile loyihasi tuzilgan.
3. **Interview.** Birinchi raundning Q1 savoli — maqsad, egasi oxirida nimaga ega bo'lishi va kriteriyalar (P21); shu raundda profile va commit tartibini (S11) ham so'ra. Keyin `references/style-questions.md` dagi savollarni va repo'da yo'q loyiha bilimini so'ra. S11 javobi a bo'lsa va commit qilinmagan o'zgarish bo'lsa, `Pre-init state` commit'ini qil, b bo'lsa, egasidan so'ra (`references/init.md` → "1. Preparation"). Tugadi: har savolga javob yoki egasi qabul qilgan tavsiya bor, provisional tanlovlar `style-questions.md` boshidagi tartib bilan yozilgan, `git status` da egasining commit qilinmagan o'zgarishi yo'q yoki egasi uni o'zi commit qilishini aytgan; bo'sh papkada `README.md` va `.gitignore` bor.
4. **Plan va tasdiq.** Egasiga reja ber: kriteriyalarning oxirgi ro'yxati, yaratiladigan va move qilinadigan fayllar, migration table. Tugadi: egasi rejani tasdiqlagan.
5. **Create.** `node <skill>/scripts/scaffold.mjs --root .` ni ishga tushir (profile'da `secrets` bo'lsa `--secrets` bilan): u standart qismni, skriptlarni va hook'ni shablondan copy qiladi. Keyin har yaratilgan faylda `{{…}}` joylarini to'ldir, `[profile: …]` belgilarini qo'lla va boshidagi shablon izohini o'chir; shablon matni o'z holicha qoladi. Loyihaga xos bilimni `pan-harness/project/` ga yoz. `CLAUDE.md` bo'lsa, unda faqat `@AGENTS.md` importi qoladi. Tugadi: `pan-harness-check.mjs` `{{…}}`, `[profile: …]` va shablon izohi haqida xato bermaydi, `project/` fayllari bor, migration table'ning har qatori yangi joyini ko'rsatadi.
6. **Check.** `node pan-harness/scripts/pan-harness-check.mjs` ni va profile'da `secrets` bo'lsa `node pan-harness/scripts/secret-check.mjs` ni ishga tushir, keyin harness'ni `references/audit.md` bo'yicha tekshir (A51 token sarflamaydi). Check xato bersa, avval yaratgan faylingni shablon bilan solishtir. Fresh-agent test haqida egasidan so'ra (`references/testing.md`). Tugadi: 0 xato, `secrets` bo'lsa `RESULT: clean`, audit'ning har `fail` qatori tuzatilgan yoki hisobotda, egasining test bo'yicha javobi yozilgan.
7. **Report.** Egasiga hisobot ber: har kriteriya natijasi, nima yaratildi, qaysi qarorlar yozildi, nima `unverified`, commit raqamlari (S11 a bo'lsa, `ph-init` ishini agent commit qiladi) va `git show` da nima ko'rinadi. Tugadi: hisobot egasida, har kriteriya natijasi dalil bilan.

<!-- include: skill-parts/files.md -->

<!-- include: skill-parts/fresh-agent-test.md -->

<!-- include: skill-parts/report.md -->
