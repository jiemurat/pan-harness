# ph-init: pan-harness yaratish

Loyihada pan-harness yo'q: papka bo'sh yoki loyiha bor. Boshqa shakldagi agent fayllari (`AGENTS.md`, `CLAUDE.md`, `CONTEXT.md`, `.cursor/rules`, `GEMINI.md`, `.github/copilot-instructions.md`) bo'lishi mumkin: ulardagi bilim to'liq migration qilinadi.

Shu checklist'ni javobingga copy qilib, belgilab bor:

```
ph-init:
- [ ] 0. Vaziyat: harness bor, bo'sh papka yoki mavjud loyiha
- [ ] 1. Preparation: git (o'rnatish, `git init`, `.gitignore`, dastlabki commit), agent fayllari, sir fayllari (faqat nomlar), Node
- [ ] 2. Facts: stack, ishga tushirish, live system, hujjatlar, profile loyihasi
- [ ] 3. Interview: maqsad (S1), "tayyor" degani nima (S30), chegaralar (S31), git identity bo'sh bo'lsa; qolgani standart tanlov
- [ ] 4. Plan: qisqa reja (kriteriyalar, harness'dan tashqari o'zgarish, standart tanlovlar), egasining tasdig'i
- [ ] 5. Create: standart qism, project/, jurnallar, migration, hook
- [ ] 6. Check: pan-harness-check, secret-check, hajm, audit.md, fresh-agent test (so'rab)
- [ ] 7. Report va commit (S11 = a)
```

## Contents

- 0. Vaziyatni aniqlash
- 1. Preparation
- 2. Facts
- 3. Interview
- 4. Plan
- 5. Create
- 6. Check
- 7. Report
- Common cases

## 0. Vaziyatni aniqlash

Papkada nima borligini ko'r (`ls -A`, `git status`):
- **Harness bor** (`PAN-HARNESS.md` yoki `pan-harness/`): `ph-init` shu yerda tugaydi. `PAN-HARNESS.md` → `Standard:` dagi versiya skill'nikiga teng bo'lsa, egasiga `ph-doctor` ni (harness'ni tekshirish va tuzatish) taklif qil. Versiya farq qilsa yoki harness unknown standard'da bo'lsa, `ph-update` ni taklif qil: u harness'ni migration qiladi va oxirida `ph-doctor` ni ham o'tkazadi.
- **Bo'sh papka** (faqat `.git`, `.gitignore` va agent papkalari: `.agents/`, `.claude/`, `.gemini/`, `.opencode/` bor): birinchi savollar raundida, Q1 bilan birga, loyiha nima bo'lishini so'ra: kod (til, nima qiladi) yoki hujjat (qanday hujjatlar, kim uchun) va nomi (egasining ismi so'ralmaydi). Git'ni o'rnatish va `git init` (1-qadam) javobni kutmaydi. Javobdan keyin minimal structure yarat: `README.md` (maqsad 2–3 gapda, suhbat tilida), loyiha turiga mos `.gitignore` va dastlabki commit (1-qadam), keyin `ph-init` ning qolgan qadamlari. Faktlar egasining javobidan olinadi; repo'da bor narsa yo'q, shuning uchun `Facts` qisqa bo'ladi.
- **Mavjud loyiha** (kod yoki hujjat): 1-qadamdan boshla.

Tugadi: uch vaziyatdan biri aniqlangan; harness bor bo'lsa, taklif egasida.

## 1. Preparation

1. Loyiha ildizini aniqla. Skill'lar loyihaga `npx @jiemurat/pan-harness@latest init` bilan o'rnatiladi va `.gitignore` da turadi (ular asbob, loyiha bilimi emas). Bu buyruq `playbooks/pan-harness.md` ga yoziladi.
2. **Git.** Pan-harness git'da ishlaydi (`structure.md` → "Git"). Bu qadamlar `ph-init` buyrug'ining bir qismi, ularni darhol bajar:
   - `git --version`. Git o'rnatilmagan bo'lsa, o'rnat: macOS — `xcode-select --install`, Windows — `winget install --id Git.Git -e`, Linux — paket menejeri (`sudo apt install git`, `sudo dnf install git`). `sudo` yoki parol kerak bo'lsa, agentda egasiga ko'rinadigan terminal bo'lsa, buyruqni o'sha yerda ishga tushir, parolni egasi kiritadi, keyin `git --version` bilan tekshirib davom et. Bunday terminal bo'lmasa, buyruqni egasiga ber va kut.
   - Papka git repo bo'lmasa (`git rev-parse --is-inside-work-tree` xato beradi), `git init -b main` qil.
   - Identity: avval `git config user.name` va `git config user.email` ni ko'r (global va lokal sozlama birga chiqadi). Ikkalasi bor bo'lsa, commit'lar shu nom bilan qilinadi, sozlama o'z holicha qoladi. Bo'sh bo'lsa, birinchi savollar raundida so'ra (S29), javobni repo'ning lokal sozlamasiga yoz va commit'ni javobdan keyin qil. Ism va email'ni faqat egasining javobidan ol: commit muallifi egasi.
   - `.gitignore`: bo'lmasa yarat, bo'lsa to'ldir (`structure.md` → "Git"). Faqat shu loyihada bor yoki ishda paydo bo'ladigan narsani yoz:
     - sir: 4-qadamda topilgan sir fayllarining aniq nomi, `.env` va `.env.*` (`!.env.example` bilan), `*.pem`, `*.key`. 4-qadamdagi qidiruv naqshlari (`*secret*`, `*token*`, `credentials*`) faqat topish uchun: `.gitignore` ga topilgan aniq nomlar yoziladi, chunki keng naqsh oddiy fayllarni ham yashiradi;
     - loyihaning build yoki eksport papkasi (README, skript yoki manifestda qayerga yozilishi aytilgan bo'ladi), loyiha tilining keshi va bog'liqliklari, log;
     - OS va muharrir fayllari, hujjat loyihasida ofis qulf fayllari (`~$*`, `.~lock.*#`).

     Umumiy papka nomlari (`lib/`, `parts/`, `var/`, `build/`) faqat ular shu loyihada build natijasi bo'lsa yoziladi: aks holda loyiha mazmunini yashiradi. Yozgach, `git status --short --ignored` ni ko'r: ignore qilinganlarning har biri yuqoridagi turlardan biri bo'lishi kerak: sir, kesh va bog'liqliklar, log, build, OS, muharrir va qulf fayllari.
   - Repo'da hali commit bo'lmasa, dastlabki commit qil. Avval commit'ga tushadigan fayllarni skill'dagi skript bilan tekshir: `git ls-files -z --others --exclude-standard | xargs -0 node <skill>/scripts/secret-check.mjs --root .`. Sir topilsa, fayl `.gitignore` ga tushadi yoki egasidan so'raladi. Keyin `git add -A` va `git commit -m "Initial commit"`. Bu commit'da faqat egasining fayllari bo'ladi, harness hali yo'q.
   - Repo'da commit qilinmagan o'zgarish bor bo'lsa, u egasining ishi. O'zing kiritgan `.gitignore` o'zgarishi egasining commit qilinmagan o'zgarishi emas: u `Pre-init state` ga kirmaydi, harness bilan birga commit qilinadi. Commit tartibi (S11) standart tanlov: reja uni ko'rsatadi, savol berilmaydi. Reja tasdig'idan keyin, harness yozilishidan oldin (5-qadam, 1-band): (a) bo'lsa, uni alohida commit qil (`Pre-init state`), o'zgargan fayllarni o'sha buyruq bilan tekshirib (`git ls-files -z --modified --others --exclude-standard`). (b) bo'lsa, egasidan so'ra.
3. Mavjud agent fayllarini top: ildiz va ichki papkalardagi `AGENTS.md`, `CLAUDE.md`, `CLAUDE.local.md`, `.claude/`, `GEMINI.md`, `.cursor/`, `.github/copilot-instructions.md`, `CONTEXT.md`, `docs/`. Ichki papkadagi `AGENTS.md` loyihaning o'z agentlari uchun yozilgan bo'lishi mumkin: uni o'z holicha qoldir, faqat xaritaga va qoidaga yoz.
4. Sir fayllari ro'yxatini faqat nomlar bo'yicha tuz: `.env*` (`.env.example` dan tashqari), `*secret*`, `*.pem`, `*.key`, `credentials*`, `*token*`. Faqat nom va qaysi biri git'da ekanini yoz. Git'dagi sir fayli bo'lsa, egasiga darhol ayt.
5. Skanerlashda bu papkalarni o'tkazib yubor: `.git`, `node_modules`, `venv`, `.venv`, `__pycache__`, `dist`, `build`, `volumes`, ma'lumotlar papkalari.
6. `node --version` ni tekshir (18 yoki yangi). Node bo'lmasa, `structure.md` → "Profile" dagi tartib bilan ishla.

Tugadi: `git status` ishlaydi, `.gitignore` va dastlabki commit bor, agent va sir fayllari ro'yxatlangan, Node bor-yo'qligi ma'lum.

## 2. Facts

Repo'dan shularni o'rgan: README va manifestlar (`package.json`, `pyproject.toml`, `requirements.txt`, `Dockerfile`, `docker-compose*.yml`, `Makefile`, CI fayllari). Hujjat loyihasida ildizdagi va birinchi darajadagi papkalarni va fayl turlarini (pdf, docx, xlsx, md) sana. Quyidagilarni aniqla:
- til va stack, ishga tushirish, test va deploy buyruqlari (qayerda yozilgani);
- mavjud check'lar va ular qanday ishga tushadi: testlar, linter, CI, hujjat linterlari (markdownlint, Vale, havola tekshiruvchi), loyihaning to'liq check buyrug'i bormi;
- loyihaning invariant'lari, repo'da yozilgani: kodda arxitektura qatlamlari va bog'liqlik qoidalari, hujjatda atamalar, structure, iqtibos shakli;
- live system bormi (compose, systemd, cron, server), u qayerda ishlaydi;
- tashqi xizmatlar va sir nomlari (env o'zgaruvchilar nomi, qiymatsiz);
- shaxsiy ma'lumot yoki maxfiy hujjatlar bor-yo'qligi: uni fayl nomlari va papka structure'idan aniqla, faqat nomlarga qara;
- mavjud hujjatlar va ularning state'i;
- kompyuterning vaqt zonasi: `date '+%Z %z'` (masalan, `+05 +0500` — UTC+5); u standart tanlov (S26) va rejada axborot sifatida aytiladi.

Faktlardan profile loyihasini tuz (`structure.md` → "Profile"): `live-system`, `code`, `sensitive-data`. Faktlarni o'zingga qayd qil, har birini `verified` yoki `unverified` deb belgila.

## 3. Interview

Egasidan faqat `style-questions.md` → `Asked` dagi savollar so'raladi: egasidan boshqa hech kim bila olmaydigan narsa. Uslub, ish tartibi va ehtiyot choralari savol emas, standart tanlov (`style-questions.md` → `Standard choices`): u rejada ko'rsatiladi, javob kutilmaydi. Egasining vaqti yagona ketma-ket resurs, shuning uchun kodsiz, serversiz, sirsiz loyihada savollar soni ko'pi bilan 5, odatda 3–4 (reja tasdig'i bu songa kirmaydi); ko'proq bo'lsa, sababi hisobotda aytiladi.

Savollarni `ph-grilling` formatida ber, ikki raundda:
1. 1-raund: Q1 — maqsad, natija va kriteriyalar loyihasi (S1). Q1 ni yozishdan oldin `templates/AGENTS.md.tmpl` → `Planning` ni o'qi: kriteriya shakli shu yerda (P21). Misol kriteriya: "yangi agent harness'dan loyihaning 4–6 ta odatiy savoliga to'g'ri javob beradi". Bo'sh papkada shu savolda loyiha nima bo'lishini so'ra, kriteriyalarni egasidan so'rama: maqsad javobidan keyin o'zing taklif qil va rejada tasdiqlat. Git'da identity bo'lmasa, uni ham shu raundda so'ra (S29).
2. 2-raund: 1-javobga moslab "tayyor" degani nima (S30) va chegaralar (S31). Mavjud loyihada (repo bor) loyiha turi repo'dan ma'lum, shuning uchun ikkala raund birlashadi: S1, S30 va S31 bitta xabarda.

Har ochiq savolda `Suggestion` ustunidagi taklifni Facts dan topilganlar bilan to'ldirib, o'z taklifingni yoz `➡️` qatorida, 1–2 gap sababi bilan: egasi "ha" desa qabul qilinadi. `Suggestion` ustunida "—" bo'lsa (git ismi; bo'sh papkada maqsad), taklif yozilmaydi: egasining javobisiz taklif qilib bo'lmaydi. Mavjud loyihada maqsadni README dan topib, taklif sifatida yoz. Variantli savol qolsa (masalan, 50 MB dan katta fayl), tavsiya alohida qatorda, sababi bilan beriladi. Bilmayman yoki "hali hal qilmaganman" javob hisoblanadi (savol javobsiz qolgan emas): u ochiq masala sifatida rejada ro'yxatlanadi va 5-qadamda `plan.md` → `Awaiting owner decision` ga yoziladi, ish to'xtamaydi. Savolning bir qismiga javob bo'lmasa, o'sha qism ochiq masala bo'ladi. Egasi javob o'rniga topshiriq bersa (masalan, "o'zing hal qil" yoki "internetdan o'rgan"), uni bajar va savolni yangi taklif bilan qayta ber.

Agent topadigan fakt (suhbat tili, kompyuterning vaqt zonasi, profile) savol ham, tasdiq savoli ham emas: u rejada axborot sifatida aytiladi, noto'g'ri bo'lsa egasi aytadi. Repo'dan topilmagan boshqa bilim ham yangi savol emas: u S1, S30 va S31 ga kiradi.

Savollar egasiga Q1, Q2 … bilan raqamlanadi, raqamlar ish oxirigacha davom etadi. `style-questions.md` dagi S-raqamlar jadval ID'si, ular savol raqami emas.

Tugadi: har so'ralgan savolga javob ("ha" ham) yoki ochiq masala sifatida yozilgan "bilmayman" bor; savollar soni sanalgan.

## 4. Plan

Qisqa reja ber: 15 qatordan oshmasin (3 000 belgigacha; migration table qator hisobiga kirmaydi, belgi hisobiga ham). U egasi qaror qiladigan narsadan iborat, chunki egasi harness fayllarini o'qimaydi (`Core rules` dagi egasiga tushunarli yozish qoidasi): harness fayl nomi, ichki belgi va faqat agent ishlatadigan tafsilot rejaga kirmaydi.
- maqsad va natija: egasi oxirida nimaga ega bo'lishi, 2–3 gap, oddiy til;
- kriteriyalarning oxirgi ro'yxati (1–5 ta): har biri egasi ko'radigan natija, ya'ni nima kuzatiladi, threshold, qanday va qachon tekshiriladi. Doimiy check'lar (fayl bor, skript 0 xato, hajm) kriteriya emas. Harness ichida qoida yoki ro'yxat borligi kriteriya emas (egasi harness fayllarini o'qimaydi): kriteriya yangi agent yoki egasi ko'radigan xatti-harakat. Egasining tasdig'i kriteriyalarni ham qamraydi;
- egasining loyihasida harness'dan tashqari nima o'zgaradi: git (init, commit oldidan tekshiruv, `.gitignore`), bo'sh papkada `README.md` va uning tili (suhbat tili, egasi aytsa boshqasi), egasining mavjud fayllari ko'chirilsa;
- migration table: mavjud har fayl yoki bo'lim qayerga tushadi (qoida → `AGENTS.md`, fakt → `system-map.md` yoki `state.md`, playbook → `project/playbooks/`, qaror → `decisions.md`; asl fayllar asl holida `archive/` ga ham saqlanadi). U faqat eski mazmun ko'chirilganda beriladi, `CLAUDE.md` bilan nima bo'lishi shu bilan birga;
- profile oddiy so'z bilan (kod bormi, doimiy ishlaydigan xizmat bormi, sir yoki shaxsiy ma'lumot bormi) va agent topgan faktlar (suhbat tili, vaqt zonasi) axborot sifatida;
- standart tanlovlar (`style-questions.md` → `Standard choices`) to'rt qatorda, har qatorda shu so'zlar bo'lsin: suhbat tili, vaqt zonasi va uslub; ish turlari, bittadan va hisobot; qaytmas amal, sir va push; commit tartibi va parvarish. Murojaat shaklini va texnik darajani yozma: aytilmasa qoidaga yozilmaydi. Javob kutilmaydi, egasi o'zgartirmoqchi bo'lsa aytadi;
- ochiq masalalar (egasi "bilmayman" degan narsalar, bo'lsa): ular ishni to'xtatmaydi, 5-qadamda `plan.md` ga yoziladi;
- egasining qo'li qayerda kerak (parol, `sudo`, kirish), xavf va orqaga qaytish yo'li.

Fayllar ro'yxati rejada emas: u hisobotda "o'zgargan fayllar" bo'ladi. Harness atamasini (start set, profile, playbook, handoff, migration table) rejada ishlatma: ma'nosini oddiy so'z bilan yoz (sessiya boshida o'qiladigan fayllar, loyiha turi, ko'chirish jadvali). Yuborishdan oldin rejani loyiha papkasidan tashqarida vaqtinchalik faylga yoz (`mktemp`), unda `wc -lm`, `Report` dagi ikki `grep` va `grep -niE 'start set|profile|playbook|handoff|migration' <fayl>` ni ishga tushir, so'ng faylni o'chir: u sening faylingdir, egasiniki emas. Egasining tasdig'igacha faqat o'qi. Tugadi: reja 15 qatordan va 3 000 belgidan oshmaydi, uchala `grep` natijasi toza (fayl nomi faqat egasining o'z fayllari, masalan, ko'chiriladigan eski fayllar), vaqtinchalik fayl o'chirilgan, egasi rejani tasdiqlagan.

## 5. Create

1. Commit tartibi (S11) a bo'lsa va egasining commit qilinmagan o'zgarishi bo'lsa, avval uni `Pre-init state` commit'iga ol (1-qadam, 2-band). Boshqa shakldagi agent fayllari bo'lsa (`AGENTS.md`, `CLAUDE.md`, `CONTEXT.md`), ildizdagi eski `AGENTS.md` ni `pan-harness/archive/AGENTS-<date>.md` ga move qil, qolganlarining asl nusxasini o'sha papkaga copy qil: skript mavjud faylga tegmaydi, mazmun 6-bandda joyiga o'tadi. Keyin `node <skill>/scripts/scaffold.mjs --root .` ni ishga tushir, profile'da `secrets` bo'lsa `--secrets` bilan. U har standart faylni, `pan-harness-check.mjs` (va `secret-check.mjs`) ni va `.githooks/pre-commit` ni shablondan copy qiladi, `Standard:` qatori va tarix oyini qo'yadi, git'ni hook'ga ulaydi; mavjud faylga tegmaydi va uni `kept` deb ko'rsatadi.
2. Har yaratilgan faylni to'ldir: shablon matni o'z holicha qoladi, `{{…}}` joylarini egasining javoblari va tekshirilgan faktlar bilan to'ldir (`{{egasi}}` ga egasi o'zi aytgan ism, aytmagan bo'lsa "egasi" so'zi yoziladi), `[profile: …]` belgilarini `structure.md` → "Profile" dagi qoida bo'yicha qo'lla, boshidagi shablon izohini o'chir. Bo'sh qolgan majburiy fayl bitta qator bilan qoladi. `kept` fayllarni shablon bilan qo'lda solishtir.
3. Jurnallarni boshla:
   - `feedback.md`: egasining javoblari va ish uslubi haqidagi har gapi (F1…, iloji bo'lsa aynan; "ha" bo'lsa, qabul qilingan taklif matni bilan) va u qaysi qoidaga aylangani;
   - `decisions.md`: structure tanlovlari (D1…). Masalan: pan-harness standarti, versiyasi va profile (D1, unga R5 va R16 havola beradi), standart tanlovlar (D2: ro'yxati va qiymati `style-questions.md` → `Standard choices` dan, reja tasdig'i bilan tasdiqlangan; uslub va ish tartibi qoidalari unga `← D2` bilan havola beradi), hajm limit'i, parvarish tartibi, migration qilingan fayllar. Migration haqidagi D birinchi `ph-doctor` gacha `decisions.md` da qoladi, keyin bajarilgan bir martalik ish sifatida arxivga o'tadi;
   - `lessons.md`: faqat sarlavha va shakl (yoki egasi aytgan o'tgan xatolar);
   - `handoff.md`: `**Status:** none` (`ph-init` o'zi large task bo'lsa va bir sessiyaga sig'masa — `active` va qadamlari);
   - `history/<joriy oy>.md`: birinchi yozuv, `ph-init` ishi. Migration table (eski fayl bo'limi → yangi joyi) shu yozuvga yoziladi, migration qarorining `Where:` maydoni unga ishora qiladi.
4. `AGENTS.md` qoidalari F va D ga havola beradi (`← F2, D1`). Har qoida egasining javobidan, standart tanlovlar qaroridan yoki tekshirilgan faktdan chiqadi, o'ylab topilmaydi.
5. Loyihaga xos bilimni `project/` ga yoz: domain fayllari, loyiha playbook'lari, skriptlari. Har biri `PAN-HARNESS.md` → `Map` da "nima bor, qachon o'qiladi" va kalit so'zlar bilan turadi (`structure.md` → "Writing").
6. Migration: `archive/` dagi asl nusxalar (1-band) mazmunini jadval bo'yicha joyiga move qil. Har da'voni kod va konfiguratsiya bilan solishtir: eski fayllarda eskirgan yoki noto'g'ri gaplar bo'ladi, ularni tuzatib move qil va hisobotda ayt. `CLAUDE.md` bo'lsa, unda faqat `@AGENTS.md` qoladi.
7. Loyihada boshqa maqsadli `AGENTS.md` lar bo'lsa, `AGENTS.md` ga qoida qo'sh: ular tahrir obyekti (shablondagi R17).
8. Hook: `scaffold.mjs` uni yaratib, git'ni unga ulaydi. Loyihada boshqa hook bo'lsa (`.git/hooks/pre-commit`, pre-commit framework yoki boshqa `core.hooksPath`), skript ulamaydi va buni aytadi: o'sha hook'ni saqla, egasidan so'rab ikkalasini bitta hook'da birlashtir, keyin `git config core.hooksPath .githooks`.
9. `PAN-HARNESS.md` → `Project checks` ga loyihaning to'liq check buyrug'ini yoz (topilgan bo'lsa). `project/check.json` → `co_change` da egasi bilan kelishib, har kod va hujjat papkasini (masalan, `src/`, `docs/`) uni tasvirlaydigan hujjatga bog'la; tugallanmagan ish belgilari bo'ladigan loyihada `markers` ham (`structure.md` → "Extensions and settings").
10. Live system bo'lsa va egasi rozi bo'lsa (S25), faqat o'qiydigan status script'ni `project/scripts/` ga yoz (`sudo`, tarmoq va sir fayllarisiz) va uni `PAN-HARNESS.md` → `Project checks` ga qo'sh. `project/scripts/check-*.mjs --live` extension'i esa faqat harness'dagi faktlarni live system bilan solishtirish uchun.
11. Profile'da `pii` yoki `confidential` bo'lsa, egasiga `project/scripts/secret-check-pii.mjs` extension'ini yozishni taklif qil. Naqshlarni (masalan, pasport yoki telefon formati) egasi bilan kelish. Asosiy himoya baribir qoida: harness'ga mazmun o'rniga yo'l, ID va neytral tavsif yoziladi.

Tugadi: har standart fayl shablondan yaratilgan va unda `{{…}}` qolmagan, hook va `project/` fayllari bor, migration table'ning har qatori yangi joyini ko'rsatadi.

## 6. Check

1. `node pan-harness/scripts/pan-harness-check.mjs` ni ishga tushir: 0 xato va 0 ta `never_track` ogohlantirishi bo'lishi kerak. Xato bo'lsa, avval yaratgan faylingni shablon bilan solishtir: ko'p xato shablondan chetga chiqilgan joyda bo'ladi. Qolgan ogohlantirishlarni hisobotda ayt.
2. Profile'da `secrets` bo'lsa, `node pan-harness/scripts/secret-check.mjs` ni ishga tushir: `RESULT: clean` bo'lishi kerak.
3. Start set hajmini `wc -c` bilan o'lcha.
4. Harness'ni `audit.md` bo'yicha bandma-band tekshir va topilganini tuzat. A51 (start set 5 ta asosiy savolga javob beradimi) token sarflamaydi, uni albatta bajar.
5. Fresh-agent test o'tkazish yoki o'tkazmaslikni egasidan so'ra (`testing.md`). O'tkazilsa, topilgan bo'shliqlarni tuzat va natijani `playbooks/pan-harness.md` → `## Test questions` ga yoz.

## 7. Report

- Har kriteriya: ✅ (dalil bilan), ❌ yoki ⏳ (qachon tekshiriladi, `plan.md` → `Later and watch`).
- Yaratilgan va migration qilingan fayllar, `git diff --stat`, commit raqamlari (dastlabki, `Pre-init state`, `ph-init`).
- Profile, yozilgan F, D, R'lar soni va har R ning bir qatorlik mazmuni.
- `unverified` deb belgilangan faktlar: egasi tasdiqlashi kerak.
- Egasining qarorini kutayotgan savollar.
- Keyingi qadam: `ph-doctor` eslatmasini sozlashni taklif qil (S19).

Commit tartibi (S11) a bo'lsa, hisobotdan oldin `ph-init` ishini commit qil (`End of task` dagi commit bandi). (b) bo'lsa, fayllar ro'yxatini ber, commit'ni egasi qiladi.

Tugadi: hisobot egasida, har kriteriya natijasi dalil bilan.

## Common cases

| Case | What to do |
|---|---|
| Git o'rnatilmagan yoki repo yo'q | 1-qadam, 2-band (Git) |
| Identity yo'q (`user.name`, `user.email`: global ham, lokal ham bo'sh) | 1-qadam, 2-band (Identity) |
| 50 MB dan katta fayllar | Egasidan so'ra: `.gitignore` ga tushadimi yoki git'da qoladimi (`check.json` → `large_file_mb`, `track_ok`) |
| `CLAUDE.md` yo'q | `structure.md` → "Root files" → `CLAUDE.md` |
| `CLAUDE.md` bor, `AGENTS.md` yo'q | Mazmuni pan-harness'ga move qilinadi, asli `archive/` ga, `CLAUDE.md` da faqat `@AGENTS.md` qoladi |
| `AGENTS.md` bor, lekin u ilovaning o'z agentlari uchun | Ildizda bo'lmasa, o'z holicha qoladi (5-qadam, 7-band). Ildizda bo'lsa, egasidan so'ra |
| Kichik loyiha (git'da ~50 dan kam fayl) | Standart qism baribir to'liq, fayllar qisqa. Hajm limit'i 20 KB bo'lishi mumkin (S18) |
| Hujjat loyihasi (kod yo'q) | Profile'da `code=no`: `runbook.md` ga hujjat formatlari va ularni o'qish vositalari yoziladi, kod qoidalari tushiriladi. To'liq check — lint, havolalar, yig'ish yoki eksport; `co_change` hujjat papkalarini reja yoki atamalar fayliga bog'laydi; `markers` qoralama belgilarini (`TODO`, `TK`, "[manba kerak]") qidiradi. `.gitignore` ga ofis qulf fayllari (`~$*`, `.~lock.*#`) va eksport natijalari qo'shiladi |
| Monorepo | Bitta pan-harness ildizda turadi. Paketlarga xos bilim `project/` da, paket nomi bilan |
| Sir fayli git'da | Ishni davom ettir va egasiga darhol ayt: sir tarixda qoladi, uni almashtirish kerak. Faylni `.gitignore` ga qo'sh va `git rm --cached` qil (fayl diskda qoladi). Tarix faqat egasining ruxsati bilan qayta yoziladi. Qiymatni hech qachon o'qima |
