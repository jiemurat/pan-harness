# Conformance audit

Loyiha harness'i standart (`structure.md`) va tamoyillarga (`principles.md`) mosmi, shu ro'yxat bo'yicha tekshiriladi (check). `ph-doctor` uni bandma-band o'tadi, `ph-init` oxirida harness'ni u bilan o'zi tekshiradi.

Ustunlar:
- `Requirement` — standart nimani talab qiladi. Qavsdagi profile sharti mos kelmasa, qator `n/a` bo'ladi.
- `Smell` — talab buzilganda ko'rinadigan nuqson belgisi. Ulardan oltitasi tadqiqotdan olingan (configuration smells, `principles.md` [8]): Lint Leakage, Context Bloat, Skill Leakage, Conflicting Instructions, Init Fossilization, Blind References.
- `How to check` — `script` (`pan-harness-check.mjs` ning `ERROR` yoki `WARN` qatori), `manual` (agent o'zi tekshiradi) yoki `test` (fresh-agent test).
- `Fix` — `mechanical` (darhol) yoki `structural` (reja va egasining tasdig'i bilan), `doctor.md` → "6. Fix".

Har qator natijasi `ok`, `fail` (nima topilgani va fayl:qator), `not checked` (sababi) yoki `n/a` bo'ladi.

## Contents
- Root files: A1–A9
- Profile: A10–A12
- Standard part: A13–A19
- Project part: A20–A22
- Journals: A23–A30
- History and archive: A31–A34
- Size: A35
- Extensions and settings: A36–A37
- Version: A38
- Writing: A39–A43
- Principles: A44–A50
- Continuity and checks: A51–A58

## Root files

| ID | Requirement | Smell | How to check | Fix |
|---|---|---|---|---|
| A1 | `AGENTS.md` va `PAN-HARNESS.md` ildizda bor | Missing file | script | structural: shablondan, egasining javoblari bilan |
| A2 | `AGENTS.md` da `## Project`, `## Boundaries`, `## Session start`, `## Workflow`, `## Working style`, `## Rules` bo'limlari shu tartibda | Missing section | script | bo'lim yo'q yoki tartibi boshqa bo'lsa structural |
| A3 | `## Boundaries` da `**Never:**`, `**Ask first:**`, `**Always:**` qatorlari, har biri qoidalarga `(R…)` havolasi bilan; zarar keltirishi mumkin bo'lgan har qoida (uzilish, ma'lumot yo'qolishi, sir, tashqi ta'sir, qaytarib bo'lmaydigan amal) blokda (P7) | Buried constraint | script (qatorlar), manual (havolalar; har qoida uchun "buzilsa, zarar bormi?") | mechanical (nom), structural (mazmun va qamrov) |
| A4 | `AGENTS.md` taxminan 100–150 qator, har qator "olib tashlasam, agent xato qiladimi?" testidan o'tadi (P1, P2) | Context Bloat | manual, script (start set hajmi) | structural |
| A5 | Kam ishlatiladigan soha bilimi doim yuklanadigan faylda emas, soha playbook'ida turadi (P9) | Skill Leakage | manual: SNR jadvali — 5 ta odatiy ish turi (tarixdagi ishlar va tag'lardan) × har qoida: kerak yoki kerak emas; ko'p ish turida kerak bo'lmagan va `Boundaries` ga kirmaydigan qoida nomzod | structural: ro'yxatni egasiga ko'rsatib, raqami bilan playbook'ga ko'chirish (move) |
| A6 | Linter, formatter yoki test allaqachon tekshiradigan qoida yozilmagan (`code=yes`) | Lint Leakage | manual: loyihaning linter va CI sozlamasi bilan solishtir | structural: olib tashla, kerak bo'lsa "`make lint` ishlat" deb havola qoldir |
| A7 | `PAN-HARNESS.md` da `## Profile`, `## Map`, `## Journals`, `## End of task`, `## Growth limits`, `## Project checks` bo'limlari va oxirida `Standard:` qatori bor | Missing section | script | bo'lim yo'q bo'lsa structural |
| A8 | `CLAUDE.md`, `.claude/CLAUDE.md` va `CLAUDE.local.md` (bo'lsa) `@AGENTS.md` ni import qiladi va loyiha bilimini saqlamaydi (P17) | Tool lock-in | script (import), manual (mazmun) | mechanical (import); structural: mazmunni harness'ga ko'chirish (move) |
| A9 | Ildizdan boshqa `AGENTS.md` lar bo'lsa, `AGENTS.md` dagi qoida ular agent uchun ko'rsatma emasligini aytadi | — | manual: `find . -name AGENTS.md -not -path ./AGENTS.md` | structural |

## Profile

| ID | Requirement | Smell | How to check | Fix |
|---|---|---|---|---|
| A10 | `## Profile` da to'liq `Profile:` qatori bor: `live-system`, `code`, `sensitive-data`, ruxsat etilgan qiymatlar bilan | Missing profile | script | structural: profile'ni egasi tasdiqlaydi |
| A11 | Profile haqiqatga mos: live system, kod, maxfiy ma'lumot turi | Stale profile | manual | structural |
| A12 | Qoida va bo'limlar profile'ga mos: `live-system=no` bo'lsa restart qoidasi va `Downtime:` yo'q, `sensitive-data` dagi har tur uchun qoida bor: `pii` va `confidential` bo'lsa, mazmun harness'ga ko'chirilmaydi (copy) | Profile mismatch | manual | structural: qoida o'chirilmaydi, raqami bilan playbook'ga ko'chadi (move) |

## Standard part

| ID | Requirement | Smell | How to check | Fix |
|---|---|---|---|---|
| A13 | Standart fayllarning hammasi bor (`handoff.md` ham; `secret-check.mjs` faqat `secrets` bo'lsa majburiy). Mos narsa yo'q bo'lsa, fayl bitta qator bilan turadi | Missing standard file | script | mechanical: shablondan bitta qatorli fayl |
| A14 | Standart qismda standartda yo'q fayl yoki papka yo'q: loyihaga xos narsa `project/` da | Standard boundary violation | script | structural: `project/` ga ko'chirish (move), hamma havolani yangilash |
| A15 | `scripts/` dagi skriptlar skill'dagisi bilan bir xil | Edited standard script | manual: `diff` | mechanical: skill'dagisi bilan almashtirish |
| A16 | `state.md` da faqat hozirgi holat (state); `Last updated:` sanasi oxirgi tarix yozuvidan eski emas | Stale fact | script (sana), status check (faktlar) | mechanical: tekshirilgan holatdan yangilash |
| A17 | `plan.md` da bajarilgan ish qolmagan, `Scheduled` da sanasi o'tgan qator yo'q; sanali ish qatorlari (`| YYYY-MM-DD`) faqat `plan.md` da | Duplication, Stale plan | script | mechanical |
| A18 | `runbook.md` da `Topic tags` qatori bor va jurnallardagi har tag shu ro'yxatda | Unknown tag | script | mechanical: tag'ni ro'yxatga qo'shish yoki tuzatish |
| A19 | `playbooks/pan-harness.md` skill'larni o'rnatish buyrug'i va `ph-doctor` ga havola beradi, loyiha qadamlari, `## Test questions` (doimiy savollar to'plami va oxirgi natija) va `## Fresh-agent test` bo'limlari bor | — | manual | mechanical |

## Project part

| ID | Requirement | Smell | How to check | Fix |
|---|---|---|---|---|
| A20 | `project/` dagi har fayl va papka, har loyiha playbook'i `PAN-HARNESS.md` → `Map` da "nima bor (kalit so'zlar), qachon o'qiladi" bilan turadi; standart fayllar ham xaritada | Unmapped file, Keyword-less map entry | script (bor-yo'qligi), manual (kalit so'zlar) | mechanical |
| A21 | Hujjatdagi har yo'l mavjud faylga, har `` `fayl.md` → "bo'lim" `` havolasi mavjud sarlavha yoki qalin yorliqqa olib boradi; har havolada qachon o'qilishi aytilgan | Broken path, Broken section link, Blind References | script (yo'llar, bo'lim havolalari), manual ("qachon o'qiladi") | mechanical |
| A22 | Fayl va papka nomlari inglizcha, kichik harf va defis bilan (ildizdagi uchta fayldan tashqari) | Naming | manual | structural: nom o'zgarsa, hamma havola yangilanadi (`doctor.md` → "6. Fix") |

## Journals

| ID | Requirement | Smell | How to check | Fix |
|---|---|---|---|---|
| A23 | F, L, D raqamlari arxivi bilan 1 dan ketma-ket; R raqamlari bitta ketma-ketlik; har `← F/L/D` manbasi mavjud | Unsourced rule | script | mechanical (havola), structural (manbasiz qoida uchun egasidan so'rab F yozish) |
| A24 | Har D'da (`check.json` → `fields_from` dan boshlab) `Why:` va `Where:`, iloji bo'lsa `Rejected:` bor; `Where:` dagi joy haqiqatda shunday (P6) | Stale fact | script (maydonlar), manual (joy) | mechanical (yo'l), structural (qaror haqiqatga mos emas) |
| A25 | Har F'da `Quote:`, `Context:`, `Result:` bor; doimiy ko'rsatma `AGENTS.md` dagi qoidaga aylangan | — | script (maydonlar), manual | structural: qoida qo'shish |
| A26 | Har L'da `Rule:` va `Check:` bor; ikki marta takrorlangan saboq qoida yoki playbook qadamiga aylangan (P16) | Unpromoted lesson | script (maydonlar), manual: `lessons.md` ni tag bo'yicha o'qi | structural |
| A27 | `decisions.md` da faqat amaldagi qarorlar; superseded va bajarilgan bir martalik qarorlar `Archived …` belgisi bilan arxivda | Journal growth | manual | mechanical |
| A28 | Jurnal yozuvlari append-only: eski yozuvda faqat yo'l, havola va maydon nomlari o'zgargan | — | manual: `git log -p` | structural: o'zgartirilgan mazmunni egasiga ko'rsat |
| A29 | Maydon nomlari, belgilar va sarlavhalar inglizcha (`structure.md` → "Layout") | Non-standard labels | script (bo'lim va maydon nomlari), manual | mechanical |
| A30 | Provisional qarorlar (`provisional: owner to confirm`) `plan.md` → `Awaiting owner decision` da | — | manual | mechanical |

## History and archive

| ID | Requirement | Smell | How to check | Fix |
|---|---|---|---|---|
| A31 | Har tarix fayli faqat o'z oyining yozuvlari, sana tartibida; har yozuvda `What and why:`, `Checks:`, `Files:` bor (`live-system=yes` bo'lsa `Downtime:` ham) | — | script | mechanical |
| A32 | Oxirgisidan boshqa yozuvlarda `(commit: pending)` qolmagan | — | script | mechanical: raqamni `git log` dan ol |
| A33 | `history/` va `archive/` dan tashqari hujjatlar 40 KB dan kichik; `feedback.md` va `lessons.md` o'sganda qoidaga aylangan eski yozuvlar arxivda | Journal growth | script | mechanical |
| A34 | Ko'chirilgan (migrated) eski agent fayllarining asl nusxasi `archive/` da; `ph-init` dagi ko'chirish (migration) qarori birinchi `ph-doctor` da arxivga o'tgan | — | manual | mechanical |

## Size

| ID | Requirement | Smell | How to check | Fix |
|---|---|---|---|---|
| A35 | Start set chegaradan (limit) oshmagan (`project/check.json` yoki standart 24 KB) | Start set over limit | script | structural, agar qisqartirish ma'noga tegsa: P2 testi, soha qoidasini playbook'ga, tugagan ishni `plan.md` dan olib tashlash |

## Extensions and settings

| ID | Requirement | Smell | How to check | Fix |
|---|---|---|---|---|
| A36 | Extension nomlari `check-*` (`.mjs`, `.js`, `.py`) va `secret-check-*`; ular ishlaydi va to'g'ri natija beradi | Faulty check script | script, manual: natijani qo'lda tekshir | mechanical (nom); loyiha skriptidagi xato structural; skill skriptidagi xato skill limitation (`doctor.md` → "6. Fix") |
| A37 | `project/check.json` (bo'lsa) to'g'ri JSON, sozlamalari haqiqatga mos | — | script | mechanical |

## Version

| ID | Requirement | Smell | How to check | Fix |
|---|---|---|---|---|
| A38 | `Standard:` qatori bor va versiyasi skill versiyasiga teng: `changelog.md` qadamlari bajarilgan, noma'lum standartdagi harness shablonlar bilan solishtirib ko'chirilgan (`doctor.md` → "3. Migration") | Old or unknown standard | script | `changelog.md` dagi har qadamning turi bo'yicha; noma'lum standartda `doctor.md` → "6. Fix" tartibi |

## Writing

| ID | Requirement | Smell | How to check | Fix |
|---|---|---|---|---|
| A39 | Ko'rsatmalar buyruq shaklida, bajaruvchi va shart aniq, qisqartma yo'q (`structure.md` → "Writing") | Ambiguous text | test ("nima noaniq?" savoli), manual | mechanical (ma'no o'zgarmasa), aks holda structural |
| A40 | Hujjatdagi buyruqlar portativ | Non-portable command | manual, sinov | mechanical |
| A41 | Qoidalarda vaqtga bog'liq gap yo'q ("keyingi hafta", "hozircha"); vaqtinchalik qoida (workaround) `Remove when: …` sharti bilan, shart `plan.md` → `Later and watch` da kuzatiladi | Time-bound statement, Expired workaround | manual: sana, "hozircha" va `Remove when` ni grep bilan qidir, shart bajarilganmi | mechanical: sana `plan.md` ga; shart bajarilgan bo'lsa structural: qoidani olib tashlash |
| A42 | Harness faqat bitta agent vositasiga tayanmaydi (slash buyruq, vositaning o'z sozlamasi) | Tool lock-in | manual | structural |
| A43 | Atamalar va noaniq so'zlar S27 dagi tanlovga mos | — | manual | mechanical |

## Principles

| ID | Requirement | Smell | How to check | Fix |
|---|---|---|---|---|
| A44 | Har fakt bitta joyda: bir fakt ikki joyda yoki ikki xil qiymat bilan yozilmagan, qoidalar bir-biriga va qarorlarga zid emas (P4) | Duplication, Conflicting Instructions | manual: grep, bir mavzudagi qoidalarni yonma-yon o'qi, D bilan solishtir | structural: bitta joy qoldir, ziddiyatni egasiga ko'rsat |
| A45 | Joriy holat va tarix alohida: joriy fayllarda o'tgan ish tafsiloti yo'q (P5) | — | manual | mechanical: tafsilot tarixda bo'lsa, joriy fayldan olib tashla |
| A46 | Repo'da bor ma'lumot ko'chirilmagan (copy): kod va papka tuzilishi (structure), README mazmuni, buyruqlar ro'yxati (P13) | Context Bloat | manual: README va manifestlar bilan solishtir | structural |
| A47 | Eskirgan ko'rsatma yo'q: eski buyruq, yo'q fayl, eskirgan versiya (P15) | Init Fossilization, Stale fact | script (yo'llar), manual (live system va hujjat bilan) | mechanical (tekshirilgan fakt), structural (qoida) |
| A48 | Ikkinchi marta qilingan ish turi uchun playbook bor (P8) | — | manual: tarixni tag bo'yicha ko'r | structural |
| A49 | Harness fresh-agent test'dan o'tadi (`testing.md`): doimiy savollar to'plamiga to'g'ri javob, "nima noaniq?" savolida jiddiy bo'shliq yo'q (P18) | Ambiguous text | test (egasining roziligi bilan) | har topilma turiga qarab |
| A50 | Large task rejasi maqsad, natija va kriteriyalardan boshlanadi: `AGENTS.md` → `Planning` va `Execution` da bu qoida bor; oxirgi large task'larning tarix yozuvida `Checks:` kriteriyalar natijasidan (✅, ❌, ⏳) boshlanadi, ⏳ kriteriyalar `plan.md` → `Later and watch` da (P21) | Unverified done | script (oxirgi tarix yozuvida dalilsiz ✅ va `plan.md` da jufti yo'q ⏳), manual: oxirgi 3 ta large task'ning tarix yozuvi va `plan.md` | qoida yo'q bo'lsa structural; natija yozilmagan bo'lsa, hisobotda ayt |

## Continuity and checks

| ID | Requirement | Smell | How to check | Fix |
|---|---|---|---|---|
| A51 | Start set 5 ta asosiy savolga javob beradi yoki bitta havola bilan javobga olib boradi: loyiha nima; qanday tuzilgan; natija qanday yaratiladi yoki ishga tushiriladi; qanday tekshiriladi; hozirgi holat (P22) | Blank map | manual (tokensiz): har savol uchun javob joyi (fayl → bo'lim) | structural: bo'shliqni tegishli faylga yoki xaritaga yozish |
| A52 | `handoff.md` faol ish bo'lmasa `**Status:** none`; faol ishda hamma bo'lim bor, har qadamda holat, bittadan ortiq `active` yo'q, `done` dalil bilan (P24) | Lost thread | script | mechanical |
| A53 | Har project playbook'i `## Done` bilan tugaydi: tekshiruv darajalari tartib bilan va butun oqimning xavfsiz shakli (`structure.md` → "Project part") | Unverified done | manual | structural |
| A54 | Zarari katta va mexanik tekshirsa bo'ladigan qoida tekshiruv (skript, test, git hook) bilan majburlangan, xabari nima, nega va qanday tuzatishni aytadi (P23) | Paper rule | manual: har `Boundaries` qoidasi uchun "skript yoki hook tekshira oladimi?", nomzodlar ro'yxati | structural |
| A55 | 10 KB dan katta, kerak bo'lganda o'qiladigan hujjat `## Contents` bilan boshlanadi | Hidden section | script | mechanical |
| A56 | `check.json` → `co_change` loyihaning asosiy fayl papkalarini ularni tasvirlaydigan hujjatlarga bog'laydi; tugallanmagan ish belgilari bo'ladigan loyihada `markers` sozlangan (P23) | Stale doc | manual (sozlama), script (ogohlantirish) | structural: xarita egasi bilan kelishiladi |
| A57 | Murakkab ish oqimi (bir necha qadam, tekshiruvchi va qaytish yo'li) domain faylida jadval bilan: qadam, tekshiruvchi, xato bo'lsa qayerga, holat qayerda; `live-system=yes` da jim zaxira yo'l kuzatiladi | Hidden fallback | manual | structural |
| A58 | Loyiha git'da (`structure.md` → "Git"): `.githooks/pre-commit` bor va `core.hooksPath` unga ulangan, `.gitignore` bor, `never_track` ogohlantirishlari yo'q; `AGENTS.md` → R4 va `End of task` dagi commit bandi S11 javobiga mos | No git setup | script (repo, `never_track`), manual (hook, R4) | mechanical: hook va `.gitignore`; structural: git o'rnatish, R4 |
