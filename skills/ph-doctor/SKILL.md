---
name: ph-doctor
description: Panoramic Harness bor loyihada harness'ni standart bo'yicha tekshiradi va tuzatadi: moslik jadvali, mechanical fix, structural taklif, migration. Harness, AGENTS.md yoki agent qoidalarini tekshirish so'ralganda va oylik parvarishda ishlatiladi.
license: MIT
metadata:
  version: "1.3.1"
  package: "@jiemurat/pan-harness"
---

# ph-doctor

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

1. **Faktni o'zing top, qarorni egasi qiladi.** Repo, hujjat va live system'dan topiladigan narsani o'zing top; egasidan faqat qaror va repo'da yo'q bilimni so'ra. Tavsiyasi aniq va xavfsiz standart tanlov savolsiz olinadi, rejada ko'rsatiladi, egasi o'zgartiradi (P20).
2. **Faqat repo'da yo'q bilimni yoz** (P13): egasining qarorlari, uslubi, xavfli joylar, tekshirilgan faktlar. README, kod, config, `--help`, papka structure'i va buyruqlarga havola ber: nusxa eskiradi va xarajatni oshiradi.
3. **Har da'voni tekshir.** Hujjat, README va eski hisobotdagi fakt tekshirilmaguncha `unverified` hisoblanadi. Hisobotda `verified` va `unverified` ni ajratib yoz.
4. **Sir qiymatini hech qachon o'qima va ekranga chiqarma.** `.env`, `secrets.*`, kalit va token fayllaridan faqat fayl va o'zgaruvchi nomini yoz. Shaxsiy ma'lumot va maxfiy hujjat o'rniga ham harness'ga yo'l, ID va neytral tavsif yoziladi.
5. **Katta o'zgarish reja bilan.** Structure, qoida yoki ma'noni o'zgartiradigan ishni avval reja bilan ber va egasining aniq tasdig'igacha faqat o'qi. Reja maqsad, natija va kriteriyalardan boshlanadi, yakuniy rejada istisnolar, byudjet va (bir sessiyaga sig'masa) bosqichlar bo'ladi. Tasdiqdan keyin ish state'i `pan-harness/handoff.md` da yuritiladi, ish oxirida har kriteriya dalil bilan tekshiriladi (P21, P24). Qoidada belgilangan mechanical fix darhol qilinadi (`references/doctor.md`).
6. **Variantni tamoyilga asosla.** Structure bo'yicha variant berishdan oldin `references/principles.md` ni o'qi va har variant qaysi tamoyilga tayanishini ayt. Internetdagi yangi amaliyotni loyihaning qoidasi yoki egasining so'rovi bo'yicha o'rgan.
7. **Hajmni o'lcha.** `wc -c` bilan sana; start set limit'i `references/structure.md` → "Size limits" da.
8. **Kichik model ham tushunadigan qilib yoz.** Harness matnini `references/structure.md` → "Writing" (P26) bo'yicha yoz: buyruq shakli, positive form, completion criterion, bitta atama.
9. **Faqat egasi bila oladigan narsani so'ra.** Maqsad, "tayyor" degani nima va chegaralar `references/style-questions.md` → `Asked` bo'yicha so'raladi. Til, atamalar, murojaat, ruxsat, ish tartibi va commit tartibi (S11, agent o'zi commit qiladi) standart tanlov: rejada ko'rsatiladi, javob kutilmaydi, egasi aytsa `feedback.md` ga yoziladi va qoida yangilanadi.
10. **Egasining tahrirlari ustun.** Egasi o'zgartirgan matnni saqla va ishingni uning ustiga qur. Unda yangi ko'rsatma ko'rinsa, loyihaning `feedback.md` iga yoz.
11. **Irreversible action faqat ruxsat bilan.** Fayl o'chirish va tarixni qayta yozish faqat egasining aniq ko'rsatmasi bilan. Push'ni egasi qiladi: agent uni faqat egasi aniq so'raganda bajaradi va bu haqda o'zi so'ramaydi. Commit loyihaning R4 qoidasi bo'yicha qilinadi, `ph-init` da esa commit tartibining standart tanloviga (S11) ko'ra. Hook xato bersa, sababini tuzat: `--no-verify` uchun egasi shu commit uchun alohida ruxsat bergan bo'lishi kerak.
12. **Git doim bor.** Pan-harness git'da ishlaydi: tarix, checkpoint'lar va egasining hamda agentning o'zgarishlarini ajratish shunga tayanadi. Git yo'q bo'lsa, `ph-init` uni o'rnatadi va sozlaydi (`references/structure.md` → "Git"). Har ish oxirida agent `.gitignore` ni nazorat qiladi.
13. **Skill fayllari faqat o'qiladi:** skill'ni uning muallifi takomillashtiradi. Skill'da nuqson topilsa, `references/doctor.md` → "6. Fix" dagi skill limitation tartibini bajar.
14. **Egasiga tushunarli yoz.** Egasi harness fayllarini o'qimaydi: savol, hisobot, taklif va statusda gapni ma'nosi bilan ayt. Ichki belgi (A1, P1, S2, K4 kabi raqamli nom; qoida, qaror, fikr va saboq raqamlari ham shunday) va hujjat ichidagi qadam yoki bo'lim raqami o'rniga mazmunini oddiy so'z bilan yoz; atamani birinchi ishlatganingda tushuntir; harness bo'limi va fayl nomi (Working style, Awaiting owner decision, handoff kabi) ham atama: mazmunini yoz. Savol va band tartib raqamlari (1, 2, 3) qoladi: ular javob berishni osonlashtiradi. Fayl nomini egasi uni ochishi yoki shunga qarab qaror qilishi kerak bo'lganda, havola bilan yoz. Belgilar harness fayllarida (tarix yozuvi, `plan.md`, jurnallar) qoladi. Egasi belgini o'zi so'rasa yoki tilga olsa, ma'nosini ayt va kerak bo'lsa belgini ham ko'rsat. `references/style-questions.md` → `Asked` dagi savolni o'sha jadvaldagi matn bilan ber; `#` ustunidagi raqam agent uchun. Standart tanlovni rejada oddiy so'z bilan ayt.

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

## Files and when to read them

| File | Contents | When to read |
|---|---|---|
| `references/structure.md` | Pan-harness standarti: glossary, profile, fayllar, jurnallar, hajm limit'lari, yozish qoidalari (P26) | Har skill'ning boshida |
| `references/audit.md` | Moslik ro'yxati (A1…): har talab, uning smell'i, tekshirish usuli va tuzatish turi | `ph-doctor` ning 4-qadamida va `ph-init` oxirida |
| `references/changelog.md` | Standart versiyalari va har versiyaning migration qadamlari | `ph-doctor` va `ph-update` da, loyiha versiyasi skill'nikidan farq qilsa |
| `references/principles.md` | Tamoyillar (P1…) va ularning manbalari | Structure yoki qoida haqidagi qarordan oldin |
| `references/style-questions.md` | Egasiga beriladigan savollar (`Asked`) va standart tanlovlar (S1…) | `ph-init` suhbatida va rejasida |
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
