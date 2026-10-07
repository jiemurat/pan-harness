# ph-init: pan-harness yaratish

Loyihada pan-harness yo'q: papka bo'sh yoki loyiha bor. Boshqa shakldagi agent fayllari (`AGENTS.md`, `CLAUDE.md`, `CONTEXT.md`, `.cursor/rules`, `GEMINI.md`, `.github/copilot-instructions.md`) bo'lishi mumkin: ulardagi bilim yo'qotilmasdan ko'chiriladi (migrate).

Shu checklist'ni javobingga ko'chirib (copy), belgilab bor:

```
ph-init:
- [ ] 0. Holat: harness bor, bo'sh papka yoki mavjud loyiha
- [ ] 1. Preparation: git (o'rnatish, `git init`, `.gitignore`, dastlabki commit), agent fayllari, sir fayllari (faqat nomlar), Node
- [ ] 2. Facts: stack, ishga tushirish, live system, hujjatlar, profile loyihasi
- [ ] 3. Interview: maqsad, natija va kriteriyalar, profile, ish uslubi (style-questions.md), loyiha bilimi
- [ ] 4. Plan: kriteriyalar, fayllar va migration table, egasining tasdig'i
- [ ] 5. Create: standart qism, project/, jurnallar, ko'chirish (migration), hook
- [ ] 6. Check: pan-harness-check, secret-check, hajm, audit.md, fresh-agent test (so'rab)
- [ ] 7. Report va commit (S11 = a)
```

## Contents

- 0. Holatni aniqlash
- 1. Preparation
- 2. Facts
- 3. Interview
- 4. Plan
- 5. Create
- 6. Check
- 7. Report
- Common cases

## 0. Holatni aniqlash

Papkada nima borligini ko'r (`ls -A`, `git status`):
- **Harness bor** (`PAN-HARNESS.md` yoki `pan-harness/`): `ph-init` qilinmaydi. `PAN-HARNESS.md` → `Standard:` dagi versiya skill'nikiga teng bo'lsa, egasiga `ph-doctor` ni (harness'ni tekshirish va tuzatish) taklif qil. Versiya farq qilsa yoki `Standard:` qatori bo'lmasa, `ph-update` ni taklif qil: u harness'ni ko'chiradi va oxirida `ph-doctor` ni ham o'tkazadi.
- **Bo'sh papka** (faqat `.git`, `.gitignore` va agent papkalari: `.agents/`, `.claude/`, `.gemini/`, `.opencode/` bor): birinchi savollar raundida, Q1 bilan birga, loyiha nima bo'lishini so'ra: kod (til, nima qiladi) yoki hujjat (qanday hujjatlar, kim uchun), nomi va egasi. Git'ni o'rnatish va `git init` (1-qadam) javobni kutmaydi. Javobdan keyin minimal tuzilma yarat: `README.md` (maqsad 2–3 gapda), loyiha turiga mos `.gitignore` va dastlabki commit (1-qadam), keyin `ph-init` ning qolgan qadamlari. Faktlar egasining javobidan olinadi; repo'da bor narsa yo'q, shuning uchun `Facts` qisqa bo'ladi.
- **Mavjud loyiha** (kod yoki hujjat): 1-qadamdan boshla.

## 1. Preparation

1. Loyiha ildizini aniqla. Skill'lar loyihaga `npx @jiemurat/pan-harness@latest init` bilan o'rnatiladi va `.gitignore` da turadi (ular asbob, loyiha bilimi emas). Bu buyruq `playbooks/pan-harness.md` ga yoziladi.
2. **Git.** Pan-harness git'da ishlaydi (`structure.md` → "Git"). Bu qadamlarni `ph-init` ni boshlash buyrug'i bilan bajar, alohida so'rama:
   - `git --version`. Git o'rnatilmagan bo'lsa, o'rnat: macOS — `xcode-select --install`, Windows — `winget install --id Git.Git -e`, Linux — paket menejeri (`sudo apt install git`, `sudo dnf install git`). `sudo` yoki parol kerak bo'lsa, agentda egasiga ko'rinadigan terminal bo'lsa, buyruqni o'sha yerda ishga tushir, parolni egasi kiritadi, keyin `git --version` bilan tekshirib davom et. Bunday terminal bo'lmasa, buyruqni egasiga ber va kut.
   - Papka git repo bo'lmasa (`git rev-parse --is-inside-work-tree` xato beradi), `git init -b main` qil.
   - Identity: avval `git config user.name` va `git config user.email` ni ko'r (global va lokal sozlama birga chiqadi). Ikkalasi bor bo'lsa, hech narsa sozlama: commit'lar shu nom bilan qilinadi. Bo'sh bo'lsa, birinchi savollar raundida so'ra (S29) va repo'ning lokal sozlamasiga yoz, javobgacha commit qilinmaydi. Ism yoki email'ni o'zing to'qima (masalan, "Agent", `agent@local`): commit muallifi egasi.
   - `.gitignore`: bo'lmasa yarat, bo'lsa to'ldir (`structure.md` → "Git"). Faqat shu loyihada bor yoki ishda paydo bo'ladigan narsani yoz:
     - sir: 4-qadamda topilgan sir fayllarining aniq nomi, `.env` va `.env.*` (`!.env.example` bilan), `*.pem`, `*.key`. 4-qadamdagi qidiruv naqshlari (`*secret*`, `*token*`, `credentials*`) faqat topish uchun: ular `.gitignore` ga yozilmaydi, chunki oddiy fayllarni ham yashiradi;
     - loyihaning build yoki eksport papkasi (README, skript yoki manifestda qayerga yozilishi aytilgan bo'ladi), loyiha tilining keshi va bog'liqliklari, log;
     - OS va muharrir fayllari, hujjat loyihasida ofis qulf fayllari (`~$*`, `.~lock.*#`).

     Loyihada yo'q til yoki vositaning tayyor shablonini (Python, Node) qo'shma. Umumiy papka nomlari (`lib/`, `parts/`, `var/`, `build/`) faqat ular shu loyihada build natijasi bo'lsa yoziladi: aks holda loyiha mazmunini yashiradi. Yozgach, `git status --short --ignored` ni ko'r: ignore qilinganlar orasida loyiha mazmuni bo'lmasin.
   - Repo'da hali commit bo'lmasa, dastlabki commit qil. Avval commit'ga tushadigan fayllarni skill'dagi skript bilan tekshir: `git ls-files -z --others --exclude-standard | xargs -0 node <skill>/scripts/secret-check.mjs --root .`. Sir topilsa, fayl `.gitignore` ga tushadi yoki egasidan so'raladi. Keyin `git add -A` va `git commit -m "Initial commit"`. Bu commit'da faqat egasining fayllari bo'ladi, harness hali yo'q.
   - Repo'da commit qilinmagan o'zgarish bor bo'lsa, u egasining ishi. S11 birinchi raundda so'raladi. Javob (a) bo'lsa, harness yozilishidan oldin uni alohida commit qil (`Pre-init state`), o'zgargan fayllarni o'sha buyruq bilan tekshirib (`git ls-files -z --modified --others --exclude-standard`). (b) bo'lsa, egasidan so'ra.
   - Push qilinmaydi va bu haqda so'ralmaydi.
3. Mavjud agent fayllarini top: ildiz va ichki papkalardagi `AGENTS.md`, `CLAUDE.md`, `CLAUDE.local.md`, `.claude/`, `GEMINI.md`, `.cursor/`, `.github/copilot-instructions.md`, `CONTEXT.md`, `docs/`. Ichki papkadagi `AGENTS.md` loyihaning o'z agentlari uchun yozilgan bo'lishi mumkin: uni o'zgartirma, faqat xaritaga va qoidaga yoz.
4. Sir fayllari ro'yxatini ularni ochmasdan tuz: `.env*` (`.env.example` dan tashqari), `*secret*`, `*.pem`, `*.key`, `credentials*`, `*token*`. Faqat nom va qaysi biri git'da ekanini yoz. Git'dagi sir fayli bo'lsa, egasiga darhol ayt.
5. Skanerlashdan chiqariladigan papkalar: `.git`, `node_modules`, `venv`, `.venv`, `__pycache__`, `dist`, `build`, `volumes`, ma'lumotlar papkalari.
6. `node --version` ni tekshir (18 yoki yangi). Node bo'lmasa, 6-qadamdagi skript tekshiruvlarini (checks) `audit.md` bo'yicha qo'lda bajar va hisobotda "skript ishlamadi" deb yoz.

## 2. Facts

Repo'ni cheklangan hajmda o'rgan: README va manifestlar (`package.json`, `pyproject.toml`, `requirements.txt`, `Dockerfile`, `docker-compose*.yml`, `Makefile`, CI fayllari). Hujjat loyihasida asosiy papkalar va fayl turlarini (pdf, docx, xlsx, md) sana. Aniqlanadi:
- til va stack, ishga tushirish, test va deploy buyruqlari (qayerda yozilgani);
- mavjud tekshiruvlar (checks) va ular qanday ishga tushadi: testlar, linter, CI, hujjat linterlari (markdownlint, Vale, havola tekshiruvchi), loyihaning to'liq tekshiruv buyrug'i bormi;
- loyihaning o'zgarmas shartlari (invariant), repo'da yozilgani: kodda arxitektura qatlamlari va bog'liqlik qoidalari, hujjatda atamalar, tuzilma, iqtibos shakli;
- live system bormi (compose, systemd, cron, server), u qayerda ishlaydi;
- tashqi xizmatlar va sir nomlari (env o'zgaruvchilar nomi, qiymatsiz);
- shaxsiy ma'lumot yoki maxfiy hujjatlar bor-yo'qligi: uni fayl nomlari va papka tuzilishidan (structure) aniqla, mazmunni ochma;
- mavjud hujjatlar va ularning holati (state).

Faktlardan profile loyihasini tuz (`structure.md` → "Profile"): `live-system`, `code`, `sensitive-data`. Faktlarni o'zingga qayd qil, har birini `verified` yoki `unverified` deb belgila. Repo'da bor narsani harness'ga ko'chirma (copy), unga havola ber (P13).

## 3. Interview

`style-questions.md` dagi raundlar bo'yicha ishla. Birinchi raundning Q1 savoli — maqsad, natija va kriteriyalar loyihasi (P21): maqsad va egasi oxirida nimaga ega bo'lishi 2–3 gapda, oddiy tilda; 1–5 ta kriteriya, har biri egasi ko'radigan natija (nima kuzatiladi, chegara, qanday va qachon tekshiriladi). Misol: "yangi agent harness'dan loyihaning 4–6 ta odatiy savoliga to'g'ri javob beradi". Shu raundda profile loyihasini va faktlarni tasdiqlat (S28), commit tartibini (S11, standart javob "ha") va kerak bo'lsa identity'ni (S29) so'ra, repo'dan topilmagan loyiha bilimini so'ra: o'zgarmas shartlar va ularning qaysi biri tekshiruv bilan majburlangani (P23) ham shunga kiradi. Profile'ga tegishli bo'lmagan savollarni berma. Har raundda javob berish mumkin bo'lgan barcha savollarni ta'siri bo'yicha tartibda ber, past ta'sirli va tavsiyasi aniq savollarni bitta "tavsiya bo'yicha qabul qilinsinmi?" ro'yxatiga jamla (P21). Format:

```
❓ **Q1** - **<sarlavha>**: <savol, variantlar a/b/c>

➡️ <tavsiya va sababi>
```

Savollar egasiga Q1, Q2 … bilan raqamlanadi, raqamlar ish oxirigacha davom etadi. `style-questions.md` dagi S-raqamlar savollar bankining ID'si, ular savol raqami emas.

Egasi javob o'rniga topshiriq bersa (masalan, "o'zing hal qil" yoki "internetdan o'rgan"), uni bajar va savolni yangi variantlar bilan qayta ber. Javobsiz savol bilan oldinga o'tma. Egasi javob bermagan savolda tavsiya bo'yicha olingan tanlov qayerga yozilishi `style-questions.md` boshida yozilgan.

## 4. Plan

Qisqa reja ber:
- kriteriyalarning oxirgi ro'yxati: egasining tasdig'i ularni ham qamraydi;
- yaratiladigan fayllar (standart qism va `project/`) va profile;
- migration table: mavjud har fayl yoki bo'lim qayerga tushadi (qoida → `AGENTS.md`, fakt → `system-map.md` yoki `state.md`, yo'riqnoma → `project/playbooks/`, qaror → `decisions.md`). Hech narsa indamay tashlab yuborilmaydi: asl fayllar asl holida `archive/` ga ham saqlanadi;
- `CLAUDE.md` bilan nima bo'lishi;
- nima qilinmaydi (istisnolar), byudjet va egasining qo'li qayerda kerakligi, tekshiruv (verification) va orqaga qaytish yo'li.

Egasining tasdig'igacha (approval) faqat o'qi.

## 5. Create

1. `scripts/pan-harness-check.mjs` ni skill'dan `pan-harness/scripts/` ga nusxala, o'zgartirma. Profile'da `secrets` bo'lsa, `scripts/secret-check.mjs` ni ham nusxala.
2. `templates/` dagi shablonlardan standart qismni yarat. `{{…}}` joylarini to'ldir. `[profile: …]` belgilarini `structure.md` → "Profile" dagi qoida bo'yicha qo'lla. Kerak bo'lmagan izoh qatorlarini olib tashla. Bo'sh qolgan majburiy fayl bitta qator bilan qoladi.
3. Jurnallarni boshla:
   - `feedback.md`: egasining suhbatdagi muhim gaplari (F1…, iloji bo'lsa aynan) va ular qaysi qoidaga aylangani;
   - `decisions.md`: tuzilma (structure) tanlovlari (D1…). Masalan: pan-harness standarti, versiyasi va profile (D1, unga R5 va R16 havola beradi), hajm chegarasi (limit), parvarish tartibi, ko'chirilgan (migrated) fayllar. Ko'chirish (migration) haqidagi D birinchi `ph-doctor` gacha `decisions.md` da qoladi, keyin bajarilgan bir martalik ish sifatida arxivga o'tadi;
   - `lessons.md`: faqat sarlavha va shakl (yoki egasi aytgan o'tgan xatolar);
   - `handoff.md`: `**Status:** none` (`ph-init` o'zi large task bo'lsa va bir sessiyaga sig'masa — `active` va uning holati);
   - `history/<joriy oy>.md`: birinchi yozuv, `ph-init` ishi. Migration table (eski fayl bo'limi → yangi joyi) shu yozuvga yoziladi, ko'chirish (migration) qarorining `Where:` maydoni unga ishora qiladi.
4. `AGENTS.md` qoidalari F va D ga havola beradi (`← F2, D1`). Har qoida egasining javobidan yoki tekshirilgan faktdan chiqadi, o'ylab topilmaydi.
5. Loyihaga xos bilimni `project/` ga yoz: domain fayllari, loyiha playbook'lari, skriptlari. Har biri `PAN-HARNESS.md` → `Map` da "nima bor, qachon o'qiladi" va kalit so'zlar bilan turadi (`structure.md` → "Writing").
6. Ko'chirish (migration): mavjud agent fayllarining asl nusxasini `archive/<name>-<date>.md` ga, mazmunini jadval bo'yicha joyiga ko'chir (move). Ko'chirilayotgan (migrated) har da'voni kod va konfiguratsiya bilan solishtir: eski fayllarda eskirgan yoki noto'g'ri gaplar bo'ladi, ularni tuzatib ko'chir (move) va hisobotda ayt. Ildizdagi eski `AGENTS.md` yangisi bilan almashadi. `CLAUDE.md` bo'lsa, unda faqat `@AGENTS.md` qoladi.
7. Loyihada boshqa maqsadli `AGENTS.md` lar bo'lsa, `AGENTS.md` ga qoida qo'sh: ular agent uchun ko'rsatma emas, faqat tahrir obyekti.
8. Hook: `templates/githooks/pre-commit.tmpl` ni `.githooks/pre-commit` qilib nusxala, uni bajariladigan (executable) qil va `git config core.hooksPath .githooks` bilan ula. Loyihada boshqa hook bo'lsa (masalan, `.git/hooks/pre-commit` yoki pre-commit framework), uni yo'qotma: egasidan so'rab, ikkalasini bitta hook'da birlashtir.
9. `PAN-HARNESS.md` → `Project checks` ga loyihaning to'liq tekshiruv buyrug'ini yoz (topilgan bo'lsa). `project/check.json` → `co_change` ga asosiy fayl papkalari va ularni tasvirlaydigan hujjatlar xaritasini egasi bilan kelishib yoz; tugallanmagan ish belgilari bo'ladigan loyihada `markers` ham (`structure.md` → "Extensions and settings").
10. Live system bo'lsa va egasi rozi bo'lsa (S25), faqat o'qiydigan status script'ni `project/scripts/` ga yoz (`sudo`, tarmoq va sir fayllarisiz) va uni `PAN-HARNESS.md` → `Project checks` ga qo'sh. `project/scripts/check-*.mjs --live` extension'i esa faqat harness'dagi faktlarni live system bilan solishtirish uchun.
11. Profile'da `pii` yoki `confidential` bo'lsa, egasiga `project/scripts/secret-check-pii.mjs` extension'ini yozishni taklif qil. Naqshlarni (masalan, pasport yoki telefon formati) egasi bilan kelish. Asosiy himoya baribir qoida: mazmun harness'ga ko'chirilmaydi (copy).
12. Matnni `structure.md` → "Writing" bo'yicha yoz: buyruq shakli, bajaruvchi aniq, portativ buyruqlar.

## 6. Check

1. `node pan-harness/scripts/pan-harness-check.mjs` ni ishga tushir: 0 xato bo'lishi kerak, `never_track` ogohlantirishi bo'lmasligi kerak. Qolgan ogohlantirishlarni hisobotda ayt.
2. Profile'da `secrets` bo'lsa, `node pan-harness/scripts/secret-check.mjs` ni ishga tushir: `RESULT: clean` bo'lishi kerak.
3. Start set hajmini `wc -c` bilan o'lcha.
4. Harness'ni `audit.md` bo'yicha bandma-band tekshir va topilganini tuzat. A51 (start set 5 ta asosiy savolga javob beradimi) token sarflamaydi, uni albatta bajar.
5. Fresh-agent test o'tkazish yoki o'tkazmaslikni egasidan so'ra (`testing.md`). O'tkazilsa, topilgan bo'shliqlarni tuzat va natijani `playbooks/pan-harness.md` → `## Test questions` ga yoz.

## 7. Report

- Har kriteriya: ✅ (dalil bilan), ❌ yoki ⏳ (qachon tekshiriladi, `plan.md` → `Later and watch`).
- Yaratilgan va ko'chirilgan (migrated) fayllar, `git diff --stat`, commit raqamlari (dastlabki, `Pre-init state`, `ph-init`).
- Profile va yozilgan F, D, R'lar soni, eng muhimlari.
- `unverified` deb belgilangan faktlar: egasi tasdiqlashi kerak.
- Egasining qarorini kutayotgan savollar.
- Keyingi qadamlar: `ph-doctor` eslatmasini sozlash.

S11 javobi (a) bo'lsa, hisobotdan oldin `ph-init` ishini commit qil (`End of task` dagi commit bandi). (b) bo'lsa, fayllar ro'yxatini ber, commit'ni egasi qiladi. Push qilinmaydi.

## Common cases

| Case | What to do |
|---|---|
| Git o'rnatilmagan yoki repo yo'q | 1-qadamdagi git qadamlari: o'rnatish (`sudo` egasiga ko'rinadigan terminalda), `git init -b main`, `.gitignore`, dastlabki commit |
| Identity yo'q (`user.name`, `user.email`: global ham, lokal ham bo'sh) | Birinchi raundda so'ra (S29), lokal sozlamaga yoz. Bor bo'lsa, tegilmaydi. Agent ism yoki email to'qimaydi |
| 50 MB dan katta fayllar | Egasidan so'ra: `.gitignore` ga tushadimi yoki git'da qoladimi (`check.json` → `large_file_mb`, `track_ok`) |
| `CLAUDE.md` yo'q | Yaratilmaydi: Claude Code (v2.1.277+) `AGENTS.md` ni o'zi o'qiydi. Faqat egasi Claude Code'da `CLAUDE.md` ga tayanadigan sozlamani ishlatsa, `@AGENTS.md` importi bilan yaratiladi |
| `CLAUDE.md` bor, `AGENTS.md` yo'q | Mazmuni pan-harness'ga ko'chadi (move), asli `archive/` ga, `CLAUDE.md` da faqat `@AGENTS.md` qoladi |
| `AGENTS.md` bor, lekin u ilovaning o'z agentlari uchun | Ildizda bo'lmasa, unga tegilmaydi. Ildizda bo'lsa, egasidan so'ra |
| Juda kichik loyiha | Standart qism baribir to'liq, fayllar qisqa. Hajm chegarasi (limit) 20 KB bo'lishi mumkin (S18) |
| Hujjat loyihasi (kod yo'q) | Profile'da `code=no`: `runbook.md` ga hujjat formatlari va ularni o'qish vositalari yoziladi, kod qoidalari tushiriladi. To'liq tekshiruv — lint, havolalar, yig'ish yoki eksport; `co_change` hujjat papkalarini reja yoki atamalar fayliga bog'laydi; `markers` qoralama belgilarini (`TODO`, `TK`, "[manba kerak]") qidiradi. `.gitignore` ga ofis qulf fayllari (`~$*`, `.~lock.*#`) va eksport natijalari qo'shiladi |
| Monorepo | Bitta pan-harness ildizda turadi. Paketlarga xos bilim `project/` da, paket nomi bilan |
| Sir fayli git'da | Ishni to'xtatma, lekin egasiga darhol ayt: sir tarixda qoladi, uni almashtirish kerak. Faylni `.gitignore` ga qo'sh va `git rm --cached` qil (fayl diskda qoladi). Tarixni egasining ruxsatisiz qayta yozma. Qiymatni o'qima |
