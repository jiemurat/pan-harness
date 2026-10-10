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
3. **Interview.** Faqat `references/style-questions.md` → `Asked` dagi savollarni so'ra, ikki raundda: 1-raund — Q1 maqsad, natija va kriteriyalar (P21), yaqin rejalar; git'da identity bo'lmasa, u ham. Q1 ni yozishdan oldin `templates/AGENTS.md.tmpl` → `Planning` ni o'qi. 2-raund — 1-javobga moslab "tayyor" degani nima va chegaralar. Mavjud loyihada (repo bor) hammasi bitta raundda. Har ochiq savolda o'z taklifingni yoz, "bilmayman" ochiq masala bo'ladi. Uslub, ish tartibi va ehtiyot choralari savol emas, standart tanlov (`Standard choices`): rejada ko'rinadi, javob kutilmaydi. Tugadi: har so'ralgan savolga javob bor, savollar soni sanalgan (kodsiz, serversiz, sirsiz loyihada ko'pi bilan 5); bo'sh papkada `README.md` va `.gitignore` bor.
4. **Plan va tasdiq.** Egasiga qisqa reja ber (`references/init.md` → "4. Plan"): maqsad va natija, kriteriyalarning oxirgi ro'yxati, harness'dan tashqari o'zgarish, migration table (faqat eski mazmun ko'chsa), standart tanlovlar guruhlab, egasining qo'li, xavf va orqaga qaytish yo'li. Fayllar ro'yxati rejada emas. Rejani loyiha papkasidan tashqarida vaqtinchalik faylga yoz (`mktemp`), unda `wc -lm`, `Report` dagi ikki `grep` va harness atamalari `grep` ini (`references/init.md` → "4. Plan") ishga tushir, so'ng faylni o'chir. Tugadi: reja 15 qatordan oshmaydi (3 000 belgigacha), uchala `grep` toza, vaqtinchalik fayl o'chirilgan, egasi rejani tasdiqlagan.
5. **Create.** Avval, commit tartibi (S11) a bo'lsa va egasining commit qilinmagan o'zgarishi bo'lsa, uni `Pre-init state` commit'iga ol (`references/init.md` → "1. Preparation"). Keyin `node <skill>/scripts/scaffold.mjs --root .` ni ishga tushir (profile'da `secrets` bo'lsa `--secrets` bilan): u standart qismni, skriptlarni va hook'ni shablondan copy qiladi. Keyin har yaratilgan faylda `{{…}}` joylarini to'ldir, `[profile: …]` belgilarini qo'lla va boshidagi shablon izohini o'chir; shablon matni o'z holicha qoladi. Loyihaga xos bilimni `pan-harness/project/` ga yoz. `CLAUDE.md` bo'lsa, unda faqat `@AGENTS.md` importi qoladi. Tugadi: `pan-harness-check.mjs` `{{…}}`, `[profile: …]` va shablon izohi haqida xato bermaydi, `project/` fayllari bor, migration table'ning har qatori yangi joyini ko'rsatadi, egasining commit qilinmagan o'zgarishi (bo'lsa) `Pre-init state` commit'ida; S11 b bo'lsa, egasi uni o'zi commit qilishini aytgan.
6. **Check.** `node pan-harness/scripts/pan-harness-check.mjs` ni va profile'da `secrets` bo'lsa `node pan-harness/scripts/secret-check.mjs` ni ishga tushir, keyin harness'ni `references/audit.md` bo'yicha tekshir (A51 token sarflamaydi). Check xato bersa, avval yaratgan faylingni shablon bilan solishtir. Fresh-agent test haqida egasidan so'ra (`references/testing.md`). Tugadi: 0 xato, `secrets` bo'lsa `RESULT: clean`, audit'ning har `fail` qatori tuzatilgan yoki hisobotda, egasining test bo'yicha javobi yozilgan.
7. **Report.** Egasiga hisobot ber: har kriteriya natijasi, nima yaratildi, qaysi qarorlar yozildi, nima `unverified`, commit raqamlari (S11 a bo'lsa, `ph-init` ishini agent commit qiladi) va `git show` da nima ko'rinadi. Tugadi: hisobot egasida, har kriteriya natijasi dalil bilan.

<!-- include: skill-parts/files.md -->

<!-- include: skill-parts/fresh-agent-test.md -->

<!-- include: skill-parts/report.md -->
