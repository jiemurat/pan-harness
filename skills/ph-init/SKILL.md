---
name: ph-init
description: Loyihaga harness quradi: AGENTS.md, PAN-HARNESS.md va pan-harness/ (Panoramic Harness). Harness yo'q loyihada ishlatiladi: bo'sh papka, kod yoki hujjat loyihasi, boshqa shakldagi AGENTS.md, CLAUDE.md yoki .cursor/rules bor loyiha.
license: MIT
metadata:
  version: "1.3.0"
  package: "@jiemurat/pan-harness"
---

# ph-init

Panoramic Harness (qisqasi pan-harness) — loyihaning agentlar uchun bilim va qoidalar tizimi. Uni har qanday agent va model o'qiy oladi: hammasi oddiy Markdown, biror vositaga xos fayl yoki xotiraga tayanilmaydi. Har sessiyadagi agent yangi va oldingi suhbatni eslamaydi, shuning uchun loyihani davom ettirishga kerak hamma narsa repo'da yoziladi.

Pan-harness ph-paketdagi (`@jiemurat/pan-harness`) to'rt skill bilan ishlaydi:

| Skill | When | Result |
|---|---|---|
| `ph-init` | Loyihada pan-harness yo'q: papka bo'sh yoki loyiha bor (boshqa shakldagi `AGENTS.md`, `CLAUDE.md` yoki `CONTEXT.md` bo'lishi mumkin) | Profile, standart structure, egasi bilan kelishilgan qoidalar, check'dan o'tgan harness |
| `ph-doctor` | Pan-harness bor. Muntazam (masalan, oyda bir) yoki egasi so'raganda | Moslik jadvali, mechanical fix'lar, yangi standart versiyasiga migration, structural takliflar |
| `ph-update` | ph-paketning yangi versiyasi chiqqan | Skill'lar yangilangan, harness yangi versiyaga migration qilingan, to'liq `ph-doctor` o'tkazilgan |
| `ph-grilling` | Katta ishni rejalashtirish suhbati | Raund-raund savollar, kelishilgan qarorlar |

Skill'lar loyihaga `npx @jiemurat/pan-harness@latest init` bilan o'rnatiladi va git'ga kirmaydi: ular asbob, loyiha bilimi esa harness'da. Egasi skill'ni agentida chaqiradi: Claude Code, Antigravity, Cursor, GitHub Copilot, Gemini CLI va OpenCode'da `/ph-init`, Codex'da `$ph-init`. Agent maqsadli loyihaning ildizida ishlaydi. Atama noaniq bo'lsa, `references/structure.md` → "Glossary" ni o'qi.

## Core rules

Skill bilan ishlaganda bu qoidalar maqsadli loyihaning qoidalaridan oldin ham amal qiladi:

1. **Faktni o'zing top, qarorni egasi qiladi.** Repo, hujjat va live system'dan topiladigan narsani o'zing top; egasidan faqat qaror va repo'da yo'q bilimni so'ra (P20).
2. **Faqat repo'da yo'q bilimni yoz** (P13): egasining qarorlari, uslubi, xavfli joylar, tekshirilgan faktlar. README, kod, config, `--help`, papka structure'i va buyruqlarga havola ber: nusxa eskiradi va xarajatni oshiradi.
3. **Har da'voni tekshir.** Hujjat, README va eski hisobotdagi fakt tekshirilmaguncha `unverified` hisoblanadi. Hisobotda `verified` va `unverified` ni ajratib yoz.
4. **Sir qiymatini hech qachon o'qima va ekranga chiqarma.** `.env`, `secrets.*`, kalit va token fayllaridan faqat fayl va o'zgaruvchi nomini yoz. Shaxsiy ma'lumot va maxfiy hujjat o'rniga ham harness'ga yo'l, ID va neytral tavsif yoziladi.
5. **Katta o'zgarish reja bilan.** Structure, qoida yoki ma'noni o'zgartiradigan ishni avval reja bilan ber va egasining aniq tasdig'igacha faqat o'qi. Reja maqsad, natija va kriteriyalardan boshlanadi, yakuniy rejada istisnolar, byudjet va (bir sessiyaga sig'masa) bosqichlar bo'ladi. Tasdiqdan keyin ish state'i `pan-harness/handoff.md` da yuritiladi, ish oxirida har kriteriya dalil bilan tekshiriladi (P21, P24). Qoidada belgilangan mechanical fix darhol qilinadi (`references/doctor.md`).
6. **Variantni tamoyilga asosla.** Structure bo'yicha variant berishdan oldin `references/principles.md` ni o'qi va har variant qaysi tamoyilga tayanishini ayt. Internetdagi yangi amaliyotni loyihaning qoidasi yoki egasining so'rovi bo'yicha o'rgan.
7. **Hajmni o'lcha.** `wc -c` bilan sana; start set limit'i `references/structure.md` → "Size limits" da.
8. **Kichik model ham tushunadigan qilib yoz.** Harness matnini `references/structure.md` → "Writing" (P26) bo'yicha yoz: buyruq shakli, positive form, completion criterion, bitta atama.
9. **Egasining uslubini so'ra.** Til, atamalar, murojaat, ruxsat va commit tartibi (S11, standart javob — agent o'zi commit qiladi) `references/style-questions.md` bo'yicha so'raladi va loyihaning harness'iga yoziladi.
10. **Egasining tahrirlari ustun.** Egasi o'zgartirgan matnni saqla va ishingni uning ustiga qur. Unda yangi ko'rsatma ko'rinsa, loyihaning `feedback.md` iga yoz.
11. **Irreversible action faqat ruxsat bilan.** Fayl o'chirish va tarixni qayta yozish faqat egasining aniq ko'rsatmasi bilan. Push'ni egasi qiladi: agent uni faqat egasi aniq so'raganda bajaradi va bu haqda o'zi so'ramaydi. Commit loyihaning R4 qoidasi bo'yicha qilinadi, `ph-init` da esa S11 javobiga ko'ra. Hook xato bersa, sababini tuzat: `--no-verify` uchun egasi shu commit uchun alohida ruxsat bergan bo'lishi kerak.
12. **Git doim bor.** Pan-harness git'da ishlaydi: tarix, checkpoint'lar va egasining hamda agentning o'zgarishlarini ajratish shunga tayanadi. Git yo'q bo'lsa, `ph-init` uni o'rnatadi va sozlaydi (`references/structure.md` → "Git"). Har ish oxirida agent `.gitignore` ni nazorat qiladi.
13. **Skill fayllari faqat o'qiladi:** skill'ni uning muallifi takomillashtiradi. Skill'da nuqson topilsa, `references/doctor.md` → "6. Fix" dagi skill limitation tartibini bajar.
14. **Egasiga tushunarli yoz.** Egasi harness fayllarini o'qimaydi: savol, hisobot, taklif va statusda gapni ma'nosi bilan ayt. Ichki belgi (A1, P1, S2, K4 kabi raqamli nom; qoida, qaror, fikr va saboq raqamlari ham shunday) va hujjat ichidagi qadam yoki bo'lim raqami o'rniga mazmunini oddiy so'z bilan yoz; atamani birinchi ishlatganingda tushuntir; harness bo'limi va fayl nomi (Working style, Awaiting owner decision, handoff kabi) ham atama: mazmunini yoz. Savol va band tartib raqamlari (1, 2, 3) qoladi: ular javob berishni osonlashtiradi. Fayl nomini egasi uni ochishi yoki shunga qarab qaror qilishi kerak bo'lganda, havola bilan yoz. Belgilar harness fayllarida (tarix yozuvi, `plan.md`, jurnallar) qoladi. Egasi belgini o'zi so'rasa yoki tilga olsa, ma'nosini ayt va kerak bo'lsa belgini ham ko'rsat. `references/style-questions.md` dagi savolni o'sha jadvaldagi matn bilan ber; `#` ustunidagi raqam agent uchun.

## Steps

Batafsil qadamlar va checklist: `references/init.md`. Har qadam "Tugadi" sharti bajarilgach keyingisiga o't:

0. **Vaziyat.** Harness bor bo'lsa, `ph-doctor` yoki (`Standard:` dagi versiya skill'nikidan farq qilsa yoki harness unknown standard'da bo'lsa) `ph-update` ni taklif qil va shu yerda to'xta. Papka bo'sh bo'lsa, birinchi raundda (3-qadam) loyiha nima bo'lishini ham so'ra va javobdan keyin `README.md`, `.gitignore` va git bilan minimal structure yarat. Tugadi: uch vaziyatdan biri aniqlangan; harness bor bo'lsa, taklif egasida.
1. **Preparation.** Git'ni tayyorla (`references/init.md` → "1. Preparation"): o'rnatish, `git init -b main`, `.gitignore`, dastlabki commit. Mavjud agent fayllarini, sir fayllarini (faqat nomlar) va Node versiyasini aniqla. Tugadi: `git status` ishlaydi, `.gitignore` va dastlabki commit bor, agent va sir fayllari ro'yxatlangan, Node bor-yo'qligi ma'lum.
2. **Facts.** README va manifestlarni o'rgan (ro'yxati `references/init.md` → "2. Facts"): til, stack, ishga tushirish, deploy, live system, maxfiy ma'lumot, mavjud hujjatlar. Tugadi: har fakt `verified` yoki `unverified` belgisi bilan yozilgan, profile loyihasi tuzilgan.
3. **Interview.** Birinchi raundning Q1 savoli — maqsad, egasi oxirida nimaga ega bo'lishi va kriteriyalar (P21); shu raundda profile va commit tartibini (S11) ham so'ra. Keyin `references/style-questions.md` dagi savollarni va repo'da yo'q loyiha bilimini so'ra. S11 javobi a bo'lsa va commit qilinmagan o'zgarish bo'lsa, `Pre-init state` commit'ini qil, b bo'lsa, egasidan so'ra (`references/init.md` → "1. Preparation"). Tugadi: har savolga javob yoki egasi qabul qilgan tavsiya bor, provisional tanlovlar `style-questions.md` boshidagi tartib bilan yozilgan, `git status` da egasining commit qilinmagan o'zgarishi yo'q yoki egasi uni o'zi commit qilishini aytgan; bo'sh papkada `README.md` va `.gitignore` bor.
4. **Plan va tasdiq.** Egasiga reja ber: kriteriyalarning oxirgi ro'yxati, yaratiladigan va move qilinadigan fayllar, migration table, bo'sh papkada README tili (suhbat tili, egasi aytsa boshqasi). Tugadi: egasi rejani tasdiqlagan.
5. **Create.** `node <skill>/scripts/scaffold.mjs --root .` ni ishga tushir (profile'da `secrets` bo'lsa `--secrets` bilan): u standart qismni, skriptlarni va hook'ni shablondan copy qiladi. Keyin har yaratilgan faylda `{{…}}` joylarini to'ldir, `[profile: …]` belgilarini qo'lla va boshidagi shablon izohini o'chir; shablon matni o'z holicha qoladi. Loyihaga xos bilimni `pan-harness/project/` ga yoz. `CLAUDE.md` bo'lsa, unda faqat `@AGENTS.md` importi qoladi. Tugadi: `pan-harness-check.mjs` `{{…}}`, `[profile: …]` va shablon izohi haqida xato bermaydi, `project/` fayllari bor, migration table'ning har qatori yangi joyini ko'rsatadi.
6. **Check.** `node pan-harness/scripts/pan-harness-check.mjs` ni va profile'da `secrets` bo'lsa `node pan-harness/scripts/secret-check.mjs` ni ishga tushir, keyin harness'ni `references/audit.md` bo'yicha tekshir (A51 token sarflamaydi). Check xato bersa, avval yaratgan faylingni shablon bilan solishtir. Fresh-agent test haqida egasidan so'ra (`references/testing.md`). Tugadi: 0 xato, `secrets` bo'lsa `RESULT: clean`, audit'ning har `fail` qatori tuzatilgan yoki hisobotda, egasining test bo'yicha javobi yozilgan.
7. **Report.** Egasiga hisobot ber: har kriteriya natijasi, nima yaratildi, qaysi qarorlar yozildi, nima `unverified`, commit raqamlari (S11 a bo'lsa, `ph-init` ishini agent commit qiladi) va `git show` da nima ko'rinadi. Tugadi: hisobot egasida, har kriteriya natijasi dalil bilan.

## Files and when to read them

| File | Contents | When to read |
|---|---|---|
| `references/structure.md` | Pan-harness standarti: glossary, profile, fayllar, jurnallar, hajm limit'lari, yozish qoidalari (P26) | Har skill'ning boshida |
| `references/audit.md` | Moslik ro'yxati (A1…): har talab, uning smell'i, tekshirish usuli va tuzatish turi | `ph-doctor` ning 4-qadamida va `ph-init` oxirida |
| `references/changelog.md` | Standart versiyalari va har versiyaning migration qadamlari | `ph-doctor` va `ph-update` da, loyiha versiyasi skill'nikidan farq qilsa |
| `references/principles.md` | Tamoyillar (P1…) va ularning manbalari | Structure yoki qoida haqidagi qarordan oldin |
| `references/style-questions.md` | Egasining ish uslubi haqidagi savollar (S1…), variantlar va tavsiyalar | `ph-init` suhbatida |
| `references/init.md` | `ph-init` qadamlari va checklist | `ph-init` da; `ph-doctor` da migration qarori va migration table kerak bo'lganda |
| `references/doctor.md` | `ph-doctor` qadamlari, migration, mechanical va structural fix boundary'si, skill limitation | `ph-doctor` va `ph-update` da |
| `references/testing.md` | Sinov tartiblari: doimiy savollar to'plami, "o'rtasidan davom ettirish" sinovi, mustaqil tekshiruvchi va skeptik rejimi, soddalashtirish tajribasi, A51 | Sinovni egasiga taklif qilishdan oldin (`ph-init` va `ph-doctor` oxirida, structural o'zgarishdan keyin) |
| `templates/` | Standart qismning shablonlari (`*.tmpl`), git hook ham (`githooks/pre-commit.tmpl`) | Fayl yaratishda va `ph-doctor` da shablon bilan solishtirishda |
| `scripts/pan-harness-check.mjs` | Structure, profile, bo'lim, maydon, ID, tag, yo'l, hajm va atama check'i; `--since` bilan yangi qatorlar ro'yxati (`REVIEW`, `ph-doctor` ning 2-qadamida); `ph-init` nusxasini loyihaga qo'yadi | Har harness yozuvidan keyin |
| `scripts/secret-check.mjs` | Sirga o'xshash qatorlarni qidirish (qiymat chiqarilmaydi). Standart yo'llar: `AGENTS.md`, `PAN-HARNESS.md`, `CLAUDE.md`, `pan-harness/` | Commit oldidan, profile'da `secrets` bo'lsa |
| `scripts/scaffold.mjs` | Standart qismni va hook'ni `templates/` dan, skriptlarni `scripts/` dan loyihaga copy qiladi, mavjud faylga tegmaydi | `ph-init` ning 5-qadamida |
| `scripts/migrate.mjs` | `changelog.md` dagi `mechanical` qadamlarni bajaradi, skriptlarni almashtiradi, `Standard:` ni yangilaydi | `ph-update` va `ph-doctor` da, loyiha versiyasi eski bo'lsa |

Skriptlarni o'qish o'rniga ishga tushir: `node <skill>/scripts/pan-harness-check.mjs --root <loyiha>`.

## Fresh-agent test

Sinovni har safar egasidan so'ra: qaysi sinov, qaysi model va token estimate'i. Qaysi sinovni qachon taklif qilish: `references/testing.md` → "When to test"; egasining doimiy javobi loyihaning `playbooks/pan-harness.md` → `Fresh-agent test` da.

## Report

Egasining tilida, qisqa va tushunarli: bandlar raqami emas, ma'nosi bilan nomlanadi (`Core rules` dagi egasiga tushunarli yozish qoidasi):
- reja bilan qilingan ishda har kriteriya: ✅ (dalil bilan), ❌ yoki ⏳ (qachon tekshiriladi);
- reja bilan qilingan ishda o'zgargan komponentlar xaritasi: har biri uchun nima o'zgardi, kimga ta'sir qiladi, kutilgan xarajat va sifat, qanday o'chiriladi yoki qaytariladi;
- nima qilindi va nima topildi (raqamlar bilan);
- `ph-doctor` da: bo'lim bo'yicha `ok`, `fail`, `not checked` hisobi va topilgan nuqsonlar oddiy tilda; to'liq jadval (raqamlari bilan) tarix yozuvida qoladi;
- `verified` va `unverified` alohida;
- skill limitation'lar (bo'lsa);
- egasining qarori kerak bo'lgan savollar (raqamlangan, variant va tavsiya bilan; savolning o'zi tushunarli, ichki belgisiz);
- o'zgargan fayllar ro'yxati, keyingi qadam.

Yuborishdan oldin hisobot qoralamasini vaqtinchalik faylga yoz va ikki buyruqni ishga tushir:
- `grep -nE '(^|[^[:alnum:]_])[ADFKLPRS][0-9]{1,3}([^[:alnum:]_]|$)' <fayl>`: topilgan har belgini ma'nosi bilan almashtir. Tugadi: buyruq hech narsa topmaydi.
- `grep -nE '[A-Za-z0-9_./-]+\.(md|mjs|json)' <fayl>`: fayl nomini egasi ochishi yoki shunga qarab qaror qilishi kerak bo'lmasa, nom o'rniga mazmunini yoz (masalan, "ish rejasi", "sessiya holati"). Tugadi: tanada faqat egasi ochishi yoki qarori bog'liq bo'lgan fayl nomlari qoladi; boshqa nomlar "o'zgargan fayllar" ro'yxatida.
