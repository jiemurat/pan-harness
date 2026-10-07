# Panoramic Harness standard

## Contents
- Glossary
- Layout
- Profile
- Root files
- Standard part (`pan-harness/`)
- Project part (`pan-harness/project/`)
- Journals
- History and archive
- Git
- Size limits
- Extensions and settings
- Writing
- Version

## Glossary

Skill va harness matnida atamalar inglizcha yoziladi, gaplar esa egasining tilida. Quyidagi atamalar shu ma'noda ishlatiladi.

| Term | Ma'nosi |
|---|---|
| pan-harness | Panoramic Harness'ning qisqa nomi: loyihaning agentlar uchun bilim va qoidalar tizimi, `AGENTS.md`, `PAN-HARNESS.md` va `pan-harness/` |
| start set | Sessiya boshida o'qiladigan to'rt fayl: `AGENTS.md`, `PAN-HARNESS.md`, `state.md`, `plan.md` |
| always-loaded layer | Agent vositasi sessiya boshida o'zi yuklaydigan fayl (`AGENTS.md`) |
| progressive disclosure | Qolgan fayllar kerak bo'lganda o'qiladi: xarita qaysi faylni qachon o'qishni aytadi |
| standard part | `pan-harness/` dagi standart fayllar: har loyihada bir xil |
| project part | `pan-harness/project/`: faqat shu loyihaga xos narsa |
| profile | Loyihaning 3 belgisi (`live-system`, `code`, `sensitive-data`): standartning qaysi qismi kerakligini belgilaydi |
| live system | Doimiy ishlab turadigan narsa: server, bot, sayt, rejali ishlar (cron) |
| journal | Faqat qo'shib boriladigan yozuvlar (append-only): `decisions.md`, `feedback.md`, `lessons.md`, `history/` |
| superseded | O'rnini yangi qaror egallagan qaror. U arxivga o'tadi |
| extension | Loyihaning o'z tekshiruv (check) skripti: `project/scripts/check-*`, `project/scripts/secret-check-*` |
| status check | Live system holatini (state) faqat o'qib tekshirish. Status script shu ishni bajaradi |
| conformance | Loyiha harness'ining standart va tamoyillarga mosligi (`audit.md`) |
| smell | Harness'dagi nuqson belgisi (`audit.md` dagi `Smell` ustuni) |
| skill limitation | Skill'ning o'zidagi nuqson (masalan, standart skriptning soxta ogohlantirishi). Loyiha ichida aylanib o'tiladi va hisobotda aytiladi (`doctor.md` → "6. Fix") |
| mechanical fix | Qoidada belgilangan, ma'noni o'zgartirmaydigan tuzatish. Darhol qilinadi |
| structural fix | Qoida, tuzilma (structure) yoki ma'noni o'zgartiradigan tuzatish. Reja va egasining tasdig'i bilan qilinadi |
| migration | Harness'ni standartning yangi versiyasiga ko'chirish (`changelog.md`) |
| migration table | `ph-init` da mavjud agent fayllarining har bo'limi qayerga ko'chgani |
| fresh-agent test | Harness'ni faqat repo'ni ko'rgan yangi agent bilan sinash (`testing.md`) |
| handoff | Faol large task'ning holat fayli (`pan-harness/handoff.md`): qadamlar, o'zgargan fayllar, tekshiruvlar, qarorlar, keyingi qadam. Sessiya almashsa, ish shu fayldan davom etadi (P24) |
| SNR | Qoidaning foydalilik ulushi: odatiy ish turlarining nechtasida u kerak. Ko'p ish turida keraksiz qoida soha playbook'iga ko'chadi (P9, A5) |
| anchor | Raqamli kriteriyani asl maqsadga bog'laydigan tekshiruv: egasining tanlab tekshiruvi, haqiqiy ishlatish yoki ground truth (P21) |
| strong model / small model | Kuchli va kichik model. Sinovda ikkalasi ham ishlatilishi mumkin |
| verified / unverified | Hisobotda: tekshirilgan fakt / hali tekshirilmagan fakt |
| provisional | Egasi hali tasdiqlamagan, tavsiya bo'yicha olingan qaror. D yozuvida `(provisional: owner to confirm)` belgisi bilan turadi |
| approval | Egasining aniq tasdig'i. Loyihada egasi tanlagan so'z bilan beriladi (masalan, "boshla") |
| task types | Ish turlari: `question` (savol yoki tashxis), `small change` (egasi aniq aytgan kichik o'zgarish), `large task` (katta yoki noaniq ish) |
| goal / outcome | Maqsad — ish nima uchun qilinadi; natija (outcome) — ish oxirida egasi nimaga ega bo'ladi |
| acceptance criteria | Kriteriyalar: natijaga erishilganini tasdiqlaydigan, egasi ko'radigan va o'lchanadigan belgilar. Large task rejasida kelishiladi (P21) |
| Never / Ask first / Always | `AGENTS.md` dagi `Boundaries` blokining uch toifasi |
| external side effect | Tashqariga ta'sir qiladigan amal: xabar, post, xat, to'lov |
| irreversible action | Qaytarib bo'lmaydigan amal: o'chirish, tarixni qayta yozish, push |
| tokens per task | Vazifa uchun jami token. O'lchov shu, bitta so'rov uchun token (tokens per request) emas |
| topic tag | Jurnal yozuvi sarlavhasidagi mavzu belgisi, masalan `[docs]` |

Noaniq so'zlar: tuzilish yoki tuzilma (structure), ko'chirish (copy, move yoki migrate), holat (state yoki status), tekshiruv (check, verification yoki test), chegara (limit yoki boundary), taxmin (estimate yoki assumption). Ular har faylda birinchi uchraganda qavs ichida inglizchasi bilan yoziladi. Ma'nosi joyga qarab o'zgaradiganlari (ko'chirish, tekshiruv, chegara) har safar inglizchasi bilan yoziladi.

## Layout

```
<loyiha>/
├── AGENTS.md                  kirish nuqtasi (agent vositalari o'zi yuklaydi)
├── PAN-HARNESS.md             profile, xarita, jurnallar qoidasi, End of task
├── CLAUDE.md                  ixtiyoriy, faqat `@AGENTS.md` importi
└── pan-harness/
    ├── state.md               joriy holat (state)
    ├── plan.md                barcha ochiq ishlar va sanalar
    ├── handoff.md             faol large task'ning holati (yo'q bo'lsa: Status none)
    ├── system-map.md          komponentlar, tashqi xizmatlar, sir nomlari, repo map
    ├── runbook.md             buyruqlar, skriptlar, hujjat yozish, topic tag'lar
    ├── decisions.md           D… amaldagi qarorlar
    ├── feedback.md            F… egasining ish uslubi haqidagi so'zlari
    ├── lessons.md             L… xatolar va saboqlar
    ├── history/YYYY-MM.md     ishlar tarixi, oyma-oy
    ├── archive/               superseded qarorlar, jurnallarning eski qismlari, eski agent fayllarining asl nusxasi
    ├── playbooks/
    │   └── pan-harness.md     `ph-doctor` va loyiha qadamlari
    ├── scripts/               faqat skill'dan nusxa, loyihada tahrirlanmaydi
    │   ├── pan-harness-check.mjs   majburiy
    │   └── secret-check.mjs        profile'da `secrets` bo'lsa
    └── project/               loyihaga xos hamma narsa
        ├── check.json         ixtiyoriy sozlama
        ├── <domain-file>.md
        ├── playbooks/         loyihaning ish turlari bo'yicha yo'riqnomalar
        ├── scripts/           loyiha skriptlari va extension'lar
        └── references/        ma'lumotnomalar
```

Standart qismdagi fayllar majburiy, `secret-check.mjs` esa profile'ga bog'liq. Loyihada mos narsa bo'lmasa, fayl bitta qator bilan qoladi (masalan, `state.md`: "Live system yo'q"). Shunda agent nimani qayerdan izlashni har loyihada oldindan biladi. Standart qismda ro'yxatda yo'q fayl yoki papka turmaydi: loyihaga xos narsa `project/` ga qo'yiladi. `pan-harness-check.mjs` buni tekshiradi (check).

**Nomlar.** Fayl va papka nomlari inglizcha, kichik harf va defis bilan yoziladi (`status-check.sh`, `check-backup.mjs`). Ildizdagi `AGENTS.md`, `PAN-HARNESS.md` va `CLAUDE.md` bundan mustasno: bu nomlarni agent vositalari va konvensiya belgilaydi.

**Til.** Gaplar egasining tilida yoziladi (style-questions S2). Maydon nomlari, holat belgilari (status markers), sarlavhalar va jadval ustunlari doim inglizcha: tekshiruv (check) skripti ularni o'qiydi, boshqa fayllar esa ularga nomi bilan havola beradi. Atamalarni inglizcha yozish va noaniq so'z yonida inglizchasini qavsda berish egasining tanlovi (S27).

**Ziddiyat.** Skill fayllari bir-biriga zid bo'lsa, shu fayl (`structure.md`) ustun, keyin `audit.md`, keyin shablonlar.

## Profile

`PAN-HARNESS.md` dagi `## Profile` bo'limida bitta qator turadi:

```
Profile: live-system=yes, code=yes, sensitive-data=secrets+pii
```

| Flag | Values | `yes` bo'lsa | `no` bo'lsa |
|---|---|---|---|
| `live-system` | `yes` / `no` | Restart va deploy qoidalari (S12), status script (S25), `state.md` da live system holati, tarix yozuvida `Downtime:` | `state.md` da ish holati yoziladi (masalan, hujjatlar soni, ochiq qoralamalar). Bu qoida va maydonlar bo'lmaydi |
| `code` | `yes` / `no` | Test va linter qoidalari, yangi skriptni `--dry-run` yoki nusxada sinash | Hujjat formatlari va ularni o'qish vositalari (pdf, docx, xlsx) `runbook.md` → `Environment and access` ga yoziladi |
| `sensitive-data` | `secrets`, `pii`, `confidential` (`+` bilan birlashadi) yoki `none` | `secrets`: sir qiymati va sir fayllari qoidalari, `scripts/secret-check.mjs` o'rnatiladi. `pii` (shaxsiy ma'lumot) va `confidential` (maxfiy hujjatlar): mazmuni harness'ga ko'chirilmaydi (copy), faqat yo'l, ID va neytral tavsif yoziladi | `none`: faqat umumiy "maxfiy kontent" qoidasi |

- **Shablonlardagi `[profile: …]` belgisi** qaysi qismga tegishli:
  - qator yoki band boshida tursa — butun qatorga;
  - alohida qatorda tursa — undan keyingi bo'sh qatorgacha bo'lgan blokka;
  - nuqtadan keyin, gap boshida tursa — o'sha gapga (nuqtagacha);
  - verguldan yoki ikki nuqtadan keyin, ro'yxat ichida tursa — ro'yxatning o'sha bandiga (keyingi vergulgacha);
  - jadval qatorida tursa — butun qatorga.

  Shart mos kelmasa, o'sha qism olib tashlanadi, mos kelsa, faqat belgining o'zi olib tashlanadi. `yoki` bilan yozilgan shartdan bittasi mos kelsa yetadi. Olib tashlagandan keyin ro'yxat va qoida raqamlarini qayta tartibla, `(R…)` havolalarini yangila.
- **Universallik.** Standartning har qoidasi, shabloni va tekshiruvi (check) kod va hujjat loyihasida ishlaydi. Faqat kodga xos narsa profile sharti bilan (`[profile: code=yes]`) va hujjat loyihasidagi o'xshashi bilan birga yoziladi. Git esa har loyihada bor ("Git" bo'limi): git bo'lmagan holat uchun variant yozilmaydi.
- Profile'ni `ph-init` repo'dan aniqlaydi, egasi tasdiqlaydi, sababi D yozuviga yoziladi. `ph-doctor` uni haqiqat bilan solishtiradi (masalan, live system qo'shilgan yoki kod paydo bo'lgan) va o'zgarishni structural fix sifatida taklif qiladi.
- Node profile'ga kirmaydi, chunki muhit agentga qarab farq qiladi (egasining noutbuki, server). Agent `node --version` bilan tekshiradi (18 yoki yangi). Node bo'lmasa, `ph-init` va `ph-doctor` da skript tekshiruvlarini (checks) `audit.md` bo'yicha qo'lda bajaradi, oddiy ishda esa hisobotda "skript ishlamadi" deb yozadi.

## Root files

**`AGENTS.md`** — ko'p agent vositalari uni sessiya boshida o'zi yuklaydi (always-loaded layer). Shuning uchun hamma ishga tegishli qoidalar shu yerda turadi. Maqsadli hajmi 100–150 qator (P1). Bo'limlari (`templates/AGENTS.md.tmpl`):
1. Birinchi gap: kirish nuqtasi va `PAN-HARNESS.md` ga ko'rsatkich.
2. `## Project`: egasi, maqsad, egasi bilan muloqot qoidasi.
3. `## Boundaries`: `**Never:**`, `**Ask first:**`, `**Always:**` qatorlari, qoidalarga `(R…)` havolasi bilan. Fayl boshida turadi, chunki model uzun matnning o'rtasidagi gapni kamroq hisobga oladi (P7). Zarar keltirishi mumkin bo'lgan har qoida (uzilish, ma'lumot yo'qolishi, sir, tashqi ta'sir, qaytarib bo'lmaydigan amal) shu yerda.
4. `## Session start`: qaysi fayllar qaysi tartibda o'qiladi, faol ish bo'lsa `handoff.md` dan davom etish, holatni (state) tekshirish.
5. `## Workflow`: task types, `**Planning.**` (birinchi savol: maqsad, natija va kriteriyalar; yakuniy rejada istisnolar, byudjet va bosqichlar, P21), `**Execution.**` (`handoff.md` ni yangilash, kriteriyalarni dalil bilan tekshirish).
6. `## Working style`: har da'voni tekshirish, oldin va keyin, avval sinov, kichik qadamlar, raqam bilan gapirish, ko'lamni ushlash, halol hisobot.
7. `## Rules`: soha qoidalari ko'rsatkichi, keyin raqamli qoidalar `R1…` manbasi bilan (`← F…`, `← L…`, `← D…`). Soha qoidalari (domain rules) raqami bilan soha playbook'i boshida turadi, `AGENTS.md` da faqat ko'rsatkich qatori qoladi (P9).

**`PAN-HARNESS.md`** — agent uni `AGENTS.md` dan keyin birinchi o'qiydi (`templates/PAN-HARNESS.md.tmpl`). Bo'limlari: pan-harness ta'rifi, `## Profile`, `## Map` (har fayl: nima bor va qachon o'qiladi), `## Journals`, `## End of task`, `## Growth limits`, `## Project checks`. Oxirgi qatorda standart versiyasi turadi.

**`CLAUDE.md`** — loyihada allaqachon bo'lsa yoki egasi Claude Code'da `CLAUDE.md` ga tayanadigan sozlamani ishlatsa, ichida faqat `@AGENTS.md` importi bo'ladi. Aks holda yaratilmaydi: Claude Code (v2.1.277+) `AGENTS.md` ni o'zi o'qiydi. Loyiha bilimi unga yozilmaydi (P17). Claude Code `CLAUDE.md`, `.claude/CLAUDE.md` yoki `CLAUDE.local.md` bo'lsa `AGENTS.md` ni o'qimaydi. Ichki papkadagi `AGENTS.md` ni esa u yerdagi fayl o'qilganda yuklaydi, shuning uchun skill shablonlari `.tmpl` bilan nomlanadi.

## Standard part (`pan-harness/`)

| File | Contents | When to read |
|---|---|---|
| `state.md` | Faqat hozirgi holat: versiyalar, nima ishlayapti, ma'lum muammolar. Live system bo'lmasa, ish holati. Boshida `Last updated:` | Har sessiya boshida |
| `plan.md` | Barcha ochiq ishlar: `Queue` (faol large task maqsadi, kriteriyalari va istisnolari qisqa, holat belgisisiz: `✅` faqat tarixda; `handoff.md` ga havola), `Scheduled` (sanali ishlar jadvali), `Awaiting owner decision`, `Later and watch` (⏳ kriteriyalar: D raqami, sana yoki hodisa, qanday tekshirilishi) | Har sessiya boshida |
| `handoff.md` | Faol large task'ning holati: `**Status:** active` yoki `none`; `## Task` (ish, maqsad, istisnolar, byudjet), `## Criteria`, `## Steps` (holati `todo`, `active` — bittadan, `blocked` — sababi bilan, `done` — dalili bilan), `## Changed files`, `## Checks`, `## Decisions`, `## Open questions`, `## Next step`, `## Work files`. Hali yo'q fayl `(new)` belgisi bilan, backtick'siz. Ixcham (taxminan 8 KB): tugagan bosqich tafsiloti tarix yozuviga o'tadi. Ish uchun berilgan ruxsat (masalan, restart) shu ish bilan cheklanadi | Sessiya boshida, `**Status:** active` bo'lsa; ish davomida har holat xabarida yangilanadi |
| `system-map.md` | Komponentlar, tashqi xizmatlar, sir nomlari (qiymatsiz), repo map: asosiy papka va kirish nuqtalari, har biri bir qator. Papka va fayl tuzilishi batafsil yozilmaydi (P13) | "Qayerda?", "qanday tuzilgan?" savolida |
| `runbook.md` | Umumiy buyruqlar, skriptlar ro'yxati, hujjat yozish uslubi, `Topic tags`, `Accepted warnings` | Buyruq kerak bo'lganda va hujjat yozishdan oldin |
| `decisions.md` | D… amaldagi qarorlar | "Nega shunday?" savolida |
| `feedback.md` | F… egasining so'zlari va ular qaysi qoidaga aylangani | Qoidaning sababi kerak bo'lganda |
| `lessons.md` | L… saboqlar: nima bo'ldi, qoida, qanday tekshiriladi | O'xshash ishdan oldin |
| `history/` | Ishlar tarixi, har oy alohida faylda | O'tgan ish kerak bo'lganda, grep bilan |
| `archive/` | Superseded qarorlar, jurnallarning eski qismlari, ko'chirilgan (migrated) eski agent fayllarining asl nusxasi | Jurnalda topilmaganda, grep bilan |
| `playbooks/pan-harness.md` | Skill'larni o'rnatish buyrug'i, `ph-doctor`, loyihaning qo'shimcha qadamlari, doimiy savollar to'plami va oxirgi natijasi (`## Test questions`), egasining fresh-agent test bo'yicha doimiy javobi | `ph-doctor` da va sinovdan oldin |
| `scripts/pan-harness-check.mjs` | Tuzilma, ID, maydon, yo'l va hajm tekshiruvi (check) | Har ish oxirida |
| `scripts/secret-check.mjs` | Sir qidirish (profile'da `secrets` bo'lsa) | Commit oldidan |

## Project part (`pan-harness/project/`)

Faqat shu loyihada bor narsa turadi: domain fayllari (masalan, agentlar ro'yxati, xarajat o'lchovlari, ma'lumotlar bazasi sxemasi), loyihaning playbook'lari, skriptlari va ma'lumotnomalari. Har biri `PAN-HARNESS.md` → `Map` da "nima bor (kalit so'zlar), qachon o'qiladi" bilan turadi.

**Playbook shakli.** Boshida soha qoidalari (raqami va manbasi bilan), keyin qadamlar, oxirida `## Done`: shu sohada ish qachon tugagan hisoblanadi — tekshiruv (check) darajalari tartib bilan: statik (lint, sxema, havolalar) → ishlash (test, ishga tushirish) → butun oqim (haqiqiy yoki sinov muhitida boshidan oxirigacha). Past daraja o'tmasa, keyingisiga o'tilmaydi; majburiy darajani o'tkazib yuborgan ish tugamagan. Butun oqim tashqi ta'sir qilsa (xabar, post, to'lov), uning xavfsiz shakli yoziladi: dry-run, faqat o'qish yoki haqiqiy ishlatishgacha ⏳. Hujjat loyihasida: lint va havolalar → faktlar va iqtiboslar → butun hujjatni yig'ib o'qish yoki egasining ko'rigi.

**Murakkab ish oqimi** (bir necha qadam, tekshiruvchi va qaytish yo'li bor jarayon) domain faylida jadval bilan yoziladi: qadam → kim tekshiradi → xato bo'lsa qayerga (qayta urinish, oldingi qadam, zaxira yo'l, egasiga) → holat qayerda. Jim zaxira yo'l ham jadvalda ko'rinadi.

## Journals

| Journal | ID | Entry format (jurnal boshida ham yoziladi) |
|---|---|---|
| `decisions.md` | D1… | Bitta paragraf: `- **D<n>** (YYYY-MM-DD) [tag] Qaror. Why: … Rejected: … Where: …` |
| `feedback.md` | F1… | `### F<n> — YYYY-MM-DD — <sarlavha> [tag]`, keyin `- **Quote:**` (egasining so'zlari, iloji bo'lsa aynan), `- **Context:**`, `- **Result:**` (qaysi qoidaga aylangani: `→ R<n>`) |
| `lessons.md` | L1… | `- **L<n> (YYYY-MM-DD) — <sarlavha>.** [tag]`, keyin nima bo'ldi, `Rule: …`, `Check: …` |
| `history/YYYY-MM.md` | sana | `### YYYY-MM-DD — <ish nomi> [tag]`, keyin `- **What and why:**`, `- **Checks:**` (large task'da kriteriyalar natijasidan boshlanadi: ✅, ❌, ⏳), `- **Downtime:**` (faqat `live-system=yes`), `- **Files:**` (oxirida `(commit: <hash>)` yoki `(commit: pending)`) |

- **`Where:`** — qaror qaysi fayl yoki sozlamada amalga oshgani. Agent qarorga tayanishdan oldin o'sha joyni tekshiradi (P6).
- **Raqamlar** har jurnalda arxivi bilan birga 1 dan ketma-ket boradi va hech qachon o'zgarmaydi. R — `AGENTS.md` va playbook'lardagi qoidalar, bitta ketma-ketlik. Q — rejalashtirish savollari: ular suhbatda qoladi, natijasi D yoki F ga yoziladi.
- **Topic tags.** Har yozuv sarlavhasida kamida bitta `[tag]` bo'ladi. Ro'yxati `runbook.md` dagi `Topic tags` qatorida, tekshiruv (check) skripti uni shu yerdan o'qiydi. Standart tag'lar: `[docs]` (harness va hujjatlar), `[workflow]` (egasining ish uslubi), `[config]`, `[security]`, `[upgrade]`. Loyiha o'z tag'larini qo'shadi.
- **Append-only.** Eski yozuv mazmuni o'zgartirilmaydi. Faqat yo'l, havola va maydon nomlari (standart versiyasi o'zgarganda, `changelog.md` bo'yicha) tuzatiladi. Qaror o'zgarsa, yangi D yoziladi, eskisi oxiriga `Archived (YYYY-MM-DD): superseded by D<n>.` qo'shilib `archive/decisions.md` ga ko'chiriladi (move). Bajarilgan bir martalik qaror ham arxivlanadi: `Archived (YYYY-MM-DD): done (one-off).`
- **Provisional qaror.** Egasi javob bermagan savolda tavsiya bo'yicha olingan tanlov D ga `(provisional: owner to confirm)` belgisi bilan yoziladi va `plan.md` → `Awaiting owner decision` ga qo'shiladi.
- **Ziddiyatda** amaldagi qaror va `state.md` ustun: eski jurnal yozuvi o'z vaqtidagi holatni aytadi.
- **Yangi doimiy ko'rsatma** avval `feedback.md` ga yoziladi, keyin keyingi raqamli qoida bo'ladi: hamma ishga tegishli bo'lsa `AGENTS.md` ga, bitta sohaga tegishli bo'lsa o'sha soha playbook'i boshiga (P9). Buzilsa zarar keltirishi mumkin bo'lgan qoidaning qisqa qatori, qayerda turishidan qat'i nazar, `## Boundaries` da ham bo'ladi (P7). Ikkinchi marta takrorlangan xato saboqdan qoidaga, mexanik tekshirsa bo'lsa tekshiruvga (check) aylanadi (P16, P23).
- **Vaqtinchalik qoida** (biror nuqson tuzalguncha yoki biror narsa o'zgarguncha kerak bo'lgan) olib tashlash sharti bilan yoziladi: `Remove when: …`. Shart `plan.md` → `Later and watch` da kuzatiladi, bajarilsa qoida olib tashlanadi yoki playbook'ga ko'chadi (A41).

## History and archive

- **Tarix** oyma-oy yuritiladi: `history/YYYY-MM.md`. Yozuv joriy oy fayli oxiriga qo'shiladi, oy boshida yangi fayl oldingi oyning sarlavhasi bilan ochiladi. Yozuvlar ko'chirilmaydi (move) va qisqartirilmaydi. Oxirgi ishlar: `cat pan-harness/history/*.md | grep '^### 20' | tail -5`.
- **Arxiv** butun o'qilmaydi, lekin jurnalda topilmagan narsa arxivdan grep bilan qidiriladi (P10). `grep -rn` butun `pan-harness/` papkasini, arxivni ham qamraydi.
- **Commit raqami.** Ish commit qilingach, tarix yozuvidagi `pending` o'rniga raqam yoziladi. Bu tahrir keyingi commit'ga kiradi. Commit amend qilinsa, raqam o'zgaradi: keyingi sessiya boshida uni `git log` bilan solishtir.

## Git

Pan-harness har loyihada git'da ishlaydi: tarix, nazorat nuqtalari (checkpoint) va egasining hamda agentning o'zgarishlarini ajratish shunga tayanadi.
- **O'rnatish va sozlash** (`init.md` → "1. Preparation"). Git o'rnatilmagan bo'lsa, agent o'rnatadi. `sudo` yoki parol kerak bo'lsa, buyruqni egasiga ko'rinadigan terminalda ishga tushiradi, parolni egasi kiritadi (bunday terminal bo'lmasa, buyruqni beradi va kutadi). Keyin `git init -b main`, identity (global sozlama yoki S29), `.gitignore`, dastlabki commit, hook (`core.hooksPath .githooks`). Bu `ph-init` ning bir qismi, alohida so'ralmaydi.
- **`.gitignore`** faqat shu loyihada bor narsalar uchun: sir fayllari (`.env*`, `.env.example` dan tashqari; `*.pem`, `*.key`, topilgan sir fayllarining aniq nomi), loyiha tilining keshi va bog'liqliklari (masalan, `__pycache__/`, `node_modules/`, `.venv/`), loyihaning build va eksport papkasi, log, OS va muharrir fayllari (`.DS_Store`, `Thumbs.db`, `*.swp`), hujjat loyihasida ofis qulf fayllari (`~$*`, `.~lock.*#`). Skill'lar asbob, loyiha bilimi emas: CLI ularni o'z bloki (`# >>> pan-harness tools` … `# <<< pan-harness tools <<<`) bilan ignore qiladi va blokni har `npx … init` va `update` da qayta yozadi, shuning uchun blok ichi qo'lda tahrirlanmaydi. Sir qidiruvi naqshlari (`*secret*`, `*token*`) va boshqa ekotizimlarning tayyor shablonlari yozilmaydi: ular loyiha mazmunini yashiradi. Har o'zgarishdan keyin `git status --short --ignored` bilan tekshiriladi. 50 MB dan katta faylni kuzatish yoki kuzatmaslikni egasi hal qiladi. Har ish oxirida yangilanadi (`End of task`), `pan-harness-check` → `never_track` uni nazorat qiladi.
- **Commit tartibi** (S11 → `AGENTS.md` R4):
  - (a), standart javob: agent har ish oxirida, katta ishda har bosqich oxirida, `End of task` tekshiruvlari o'tgach commit qiladi. Savol-javob ishida commit yo'q;
  - commit'ga faqat agent shu ishda o'zgartirgan fayllar kiradi (`git add <fayl>`, `-A` emas). Egasining commit qilinmagan o'zgarishlari (`git status` da bor, faol ishning `Changed files` ro'yxatida yo'q) agentnikidan oldin alohida commit'ga tushadi (`Owner's changes: <fayllar>`). Bitta faylda ikkalasining o'zgarishi bo'lsa, fayl agentning commit'iga kiradi va bu xabarda aytiladi;
  - `ph-init` da repo'da commit qilinmagan o'zgarish bo'lsa, harness yozilishidan oldin `Pre-init state` commit'i qilinadi;
  - (b): commit faqat egasi so'raganda, agent fayllar ro'yxatini beradi;
  - ikkala holatda: hook o'tishi shart, `--no-verify` faqat egasining qarori; push'ni egasi qiladi, agent push qilmaydi va bu haqda so'ramaydi (egasi xabarida aniq so'rasa — bajaradi); tarixni qayta yozish (amend, rebase, force push) faqat egasining aniq ko'rsatmasi bilan; `sensitive-data` da `secrets` bo'lsa, commit oldidan `secret-check`.
- **Commit xabari:** birinchi qatorda 72 belgigacha nima o'zgargani, bo'sh qatordan keyin qisqa ro'yxat va D, L ID'lari; til — kod izohlari tili (`runbook.md` → `Writing docs`). Agent vositasining imzosi (masalan, `Co-Authored-By`) vositaning o'z qoidasida, standart uni yozmaydi.

## Size limits

| What | Limit | How to trim |
|---|---|---|
| Start set (`AGENTS.md`, `PAN-HARNESS.md`, `state.md`, `plan.md`) | Standart 24 KB (24 576 bayt), kichik loyihada 20 KB (S18). Loyihaniki `project/check.json` → `start_limit_bytes` da; `PAN-HARNESS.md` raqamni takrorlamaydi, aks holda biri eskiradi | "Olib tashlasam, agent xato qiladimi?" testi (P2), soha qoidasini playbook'ga ko'chirish (move) |
| Boshqa hujjat | 40 KB (`doc_limit_bytes`). 10 KB dan kattasi butun o'qilmaydi, shuning uchun `## Contents` ro'yxati bilan boshlanadi | Yopilgan qismlar arxivga; mavzu bo'yicha bo'lish |
| `history/`, `archive/` | Chegara (limit) yo'q | Butun o'qilmaydi |
| `decisions.md` | Faqat amaldagi qarorlar, hajmi boshqa hujjat kabi (`doc_limit_bytes`) | Superseded va bajarilganlar arxivga |
| `handoff.md` | Taxminan 8 KB: faol ishda sessiya boshida start set bilan birga o'qiladi | Tugagan bosqichlar tafsiloti tarix yozuviga |
| `feedback.md`, `lessons.md` | 40 KB | Qoidaga aylangan eski yozuvlar raqami bilan arxivga, saboqlar qisqartirilmaydi |

Hajmni `wc -c` bilan o'lcha, taxmin (estimate) qilma. UTF-8 da `—`, `…`, `→`, `ʻ` kabi belgilar va lotin bo'lmagan harflar 2–3 bayt oladi, shuning uchun hajm ko'z bilan chamalangandan ko'proq chiqadi. Hajm ogohlantirishi chiqsa, o'sha ishning o'zida tartibla yoki egasiga ayt.

## Extensions and settings

- **`project/scripts/check-*`** (`.mjs` yoki `.js` — `node` bilan, `.py` — `python3` bilan) — loyihaga xos tekshiruvlar (checks). `pan-harness-check.mjs` ularni ketma-ket ishga tushiradi: `node <fayl> --root <loyiha> [--live]` (`.py` uchun `python3`). Yangi extension'ni Node'da yoz: Python har kompyuterda bo'lmaydi. Extension `ERROR …` va `WARN …` qatorlarini chiqaradi, xato bo'lsa 1 bilan tugaydi.
- **`project/scripts/secret-check-*`** (`.mjs`, `.js`, `.py` yoki `.sh`) — loyihaga xos sir yoki maxfiy ma'lumot tekshiruvlari (checks): masalan, jonli sir qiymatlari bilan solishtirish yoki shaxsiy ma'lumot (PII) naqshlari. `secret-check.mjs` ularga tekshirilayotgan yo'llarni beradi. Ular qiymatni hech qachon chiqarmaydi. PII naqshlari egasi bilan kelishiladi (masalan, pasport yoki telefon formati): skill tayyor naqsh bermaydi, chunki ular mamlakatga bog'liq.
- **`project/check.json`** (ixtiyoriy):

  ```json
  {
    "start_limit_bytes": 24576,
    "doc_limit_bytes": 40960,
    "path_bases": ["src", "services/*"],
    "path_prefixes": ["pan-harness", "project", "playbooks", "scripts", "docs", "src"],
    "secret_paths": ["docs"],
    "fields_from": {"D": 12, "F": 5, "L": 3, "history": "YYYY-MM-DD"},
    "co_change": {"src/api/": ["pan-harness/project/api.md"], "chapters/*.md": ["pan-harness/project/outline.md"]},
    "markers": {"paths": ["src/**/*.py", "chapters/*.md"], "patterns": ["\\bTODO\\b", "\\bFIXME\\b", "\\bTK\\b"]},
    "never_track": ["dist/", "exports/*.pdf"],
    "track_ok": ["fixtures/sample.log"],
    "large_file_mb": 50
  }
  ```

  `path_bases` — hujjatdagi qisqa yo'llar shu papkalarga nisbatan ham qidiriladi (glob mumkin). `path_prefixes` — tekshiriladigan yo'l boshlanishlari (ildizdagi alohida fayllar, masalan `main.py`, tekshirilmaydi). Berilsa, u standart ro'yxat (`pan-harness`, `project`, `playbooks`, `scripts`, `references`, `history`, `archive`, `tests`, `docs`, `src`) o'rniga ishlatiladi. `secret_paths` — `secret-check.mjs` standart yo'llardan tashqari tekshiradigan papkalar. `fields_from` — jurnal yozuvlarining majburiy maydonlari (`Why:`, `Quote:`, `Rule:`, `Checks:` va boshqalar) qaysi raqam yoki sanadan boshlab tekshirilishi. Undan eski yozuvlar append-only bo'lgani uchun eski shaklida qoladi, ularga maydon qo'shilmaydi. `co_change` — kuzatiladigan fayl yoki papka (`/` bilan tugasa papka, aks holda glob) → uni tasvirlaydigan hujjat(lar): kuzatiladigan fayl o'zgarib, hujjati o'zgarmasa, skript ogohlantiradi. O'zgarishlar `git status` dan olinadi. Kod, config, bob va shablon uchun bir xil ishlaydi. `markers` — tugallanmagan ish belgilari (kodda `TODO`, `FIXME`; hujjatda `TK`, "[manba kerak]") qidiriladigan fayllar (glob) va naqshlar (regex); berilmasa, tekshiruv o'chiq. `never_track` — git kuzatmasligi kerak bo'lgan qo'shimcha naqshlar: `/` bilan tugasa istalgan chuqurlikdagi papka, aks holda fayl nomi yoki yo'l (glob). Skriptning o'z ro'yxati (sir, kesh, log, OS va muharrir fayllari) doim ishlaydi, bu kalit unga qo'shiladi. `track_ok` — ataylab kuzatiladigan yo'llar (istisno). `large_file_mb` — kuzatilayotgan fayl hajmi chegarasi (standart 50).
- **Git hook** (majburiy). Commit oldidan tekshiruvlarni majburiy qilish uchun loyiha `.githooks/pre-commit` ni (`templates/githooks/pre-commit.tmpl` dan) repo'da saqlaydi va `git config core.hooksPath .githooks` bilan ulaydi. Hook `pan-harness-check.mjs` (`--live` siz) va (profile'da `secrets` bo'lsa) `secret-check.mjs` ni ishga tushiradi; xato bo'lsa commit to'xtaydi, sababi tuzatiladi; Node bo'lmasa, hook commit'ni to'xtatmaydi va tekshiruvlar qo'lda bajarilishini aytadi; tekshiruvni o'tkazib yuborish (`git commit --no-verify`) faqat egasining qarori.

## Writing

Harness'ni kuchli va kichik model bir xil tushunishi kerak. Shuning uchun:
- **Buyruq shakli, bajaruvchi va shart aniq.** "Yangilanadi" emas, "`state.md` ni yangila". Qisqartma ("commit yo'q") noto'g'ri tushuniladi, to'liq gap yoz. Bitta bandda bitta fikr.
- **Xaritada kalit so'zlar.** Har fayl tavsifida u javob beradigan savollarning kalit so'zlari bo'ladi ("skill'lar: hisobot, kundalik, post"). Kichik model faqat ko'ringan so'zga ergashadi (P3).
- **Portativ buyruqlar.** Hujjatdagi buyruq har qanday shell va `grep` variantida bir xil ishlashi kerak: `grep -E 'a|b'` yoz, chunki `grep 'a\|b'` faqat GNU'da ishlaydi. Natija tartibi muhim bo'lsa, `cat fayllar | grep` yoz: ba'zi muhitlarda `grep` boshqa dasturga yo'naltirilgan bo'lib, bir necha fayl natijasini tartibsiz chiqaradi.
- **Bog'lanish bir tomonlama.** Loyihadagi vositalar (skill'lar, skriptlar) harness'ga havola beradi, harness esa ularning ichki raqamlariga (band, bosqich) havola bermaydi: aks holda harness o'tkinchi ishga bog'lanib qoladi.
- **Qaror natijaning yonida.** O'lchov yoki egasining qarori bilan tanlangan qiymat yonida qarorning D raqami turadi: kodda izohda (`# D12: …`), hujjatda yashirin izohda (`<!-- D12 -->`) yoki metadata'da. Nashr qilinadigan matnga chiqmaydi. Shunda qiymatni o'zgartirmoqchi bo'lgan agent avval sababini ko'radi.
- **Bo'lim havolasi** `` `fayl.md` → "Sarlavha" `` shaklida yoziladi va mavjud sarlavha yoki qalin yorliqqa olib boradi (skript tekshiradi). Sarlavha nomi o'zgarsa, eski nomini grep bilan qidirib, havolalarni yangila.
- **Fakt bitta joyda** (P4). Repo'da bor narsani ko'chirma (copy), unga havola ber (P13).
- **Vaqtga bog'liq gap** ("keyingi hafta", "hozircha") qoidaga yozilmaydi: sana `plan.md` ga, qoidada umumiy shakl.

## Version

`PAN-HARNESS.md` oxirida standart versiyasi turadi: `Standard: pan-harness <version>`. Versiya — `@jiemurat/pan-harness` paketining versiyasi (semver): `package.json`, har skill'dagi `metadata.version`, `pan-harness-check.mjs` dagi `VERSION` va `changelog.md` dagi oxirgi yozuv bir xil. MAJOR — harness'ni ko'chirish qadamlari kerak, MINOR — yangi imkoniyat yoki tekshiruv, PATCH — tuzatish. `ph-update` va `ph-doctor` loyihadagi versiyadan keyingi `changelog.md` yozuvlarini bajaradi va skriptlarni versiyadan qat'i nazar `diff` bilan ham tekshiradi. `Standard:` qatori yo'q yoki versiya `changelog.md` da bo'lmasa, harness noma'lum standartda: u `structure.md` va `templates/` bilan solishtirib ko'chiriladi (`doctor.md` → "3. Migration"), versiya raqamining katta-kichikligiga qaralmaydi.
