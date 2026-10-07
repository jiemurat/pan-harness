# ph-doctor: harness'ni standartga moslash

Maqsad: loyihaning pan-harness'ini skill'dagi standart (`structure.md`) va tamoyillarga (`principles.md`) moslash. Buning uchun `ph-doctor` uni tekshiradi (check), tuzatadi va standartning yangi versiyasiga ko'chiradi (migrate). Natijada yangi agent harness'ni kam token bilan to'g'ri ishlata oladi. Odatda oyda bir marta yoki egasi so'raganda ishga tushiriladi.

Shu checklist'ni javobingga ko'chirib (copy), belgilab bor:

```
ph-doctor:
- [ ] 1. Preparation: start set, git, versiyalar, playbook, Node
- [ ] 2. Scripts: pan-harness-check, secret-check, project checks
- [ ] 3. Migration: changelog.md bo'yicha yoki (noma'lum standartda) shablonlar bilan solishtirib
- [ ] 4. Conformance audit: audit.md bandma-band
- [ ] 5. Facts: joriy fayllar va qarorlarning Where maydoni haqiqat bilan
- [ ] 6. Fix: mechanical darhol, structural reja (maqsad, natija, kriteriyalar) va tasdiq bilan
- [ ] 7. Re-check va fresh-agent test (egasidan so'rab)
- [ ] 8. History entry va hisobot
```

## 1. Preparation

1. Loyihaning `AGENTS.md`, `PAN-HARNESS.md`, `pan-harness/state.md` va `pan-harness/plan.md` fayllarini o'qi va ularning qoidalariga amal qil.
2. `git status` va `git log --oneline -5` ni ko'r. Papka git repo bo'lmasa, bu structural fix: `init.md` → "1. Preparation" dagi git qadamlarini egasining tasdig'i bilan bajar. Commit qilinmagan o'zgarish egasiniki: R4 (S11 a) bo'yicha ish oxirida alohida commit qilinadi, S11 b bo'lsa, ishdan oldin egasiga ayt. Tarixda `pending` turgan ish commit qilingan bo'lsa, raqamini yoz.
3. `PAN-HARNESS.md` dagi `Standard:` versiyasini skill'ning `metadata.version` i bilan solishtir. `Standard:` qatori yo'q yoki versiya `changelog.md` da bo'lmasa, harness noma'lum standartda: versiya raqamining katta-kichikligiga qaralmaydi (3-qadam).
4. `playbooks/pan-harness.md` dagi loyiha qadamlarini va egasining fresh-agent test bo'yicha doimiy javobini o'qi.
5. `node --version` ni tekshir (18 yoki yangi). Node bo'lmasa, 2-qadamdagi skript tekshiruvlarini (checks) 4-qadamda `audit.md` bo'yicha qo'lda bajar va hisobotda "skript ishlamadi" deb yoz.

## 2. Scripts

1. `node pan-harness/scripts/pan-harness-check.mjs` ni ishga tushir. `PAN-HARNESS.md` → `Project checks` da `--live` yozilgan bo'lsa, u bilan ishga tushir: extension'lar live system'ni faqat o'qiydi. Versiyalar farq qilsa, skill'dagi yangi skriptni ham ishga tushir: `node <skill>/scripts/pan-harness-check.mjs --root .`. U yangi standart nimani talab qilishini ko'rsatadi.
2. Profile'da `secrets` bo'lsa, `node pan-harness/scripts/secret-check.mjs` ni ishga tushir.
3. `PAN-HARNESS.md` → `Project checks` dagi status check'larni ishga tushir. Live system'ga faqat o'qish buyruqlari bilan teg.

## 3. Migration

Loyiha versiyasi skill versiyasidan eski bo'lsa, `changelog.md` dagi loyiha versiyasidan keyingi yozuvlarni eskisidan yangisiga qarab bajar. `ph-update` ham shu qadamni bajaradi, paketni yangilagandan keyin. `mechanical` qadamlarni darhol, `structural` qadamlarni 6-qadamdagi tartibda bajar. Skriptlarni versiyadan qat'i nazar skill'dagisi bilan solishtir (`diff`): loyihada ular tahrirlanmasligi kerak, farq bo'lsa skill'dagisi bilan almashtiriladi.

Harness noma'lum standartda bo'lsa (1-qadam), changelog qadamlari o'rniga uni `structure.md` va `templates/` bilan bandma-band solishtir: fayllar, bo'limlar, maydon nomlari, profile, skriptlar va hook. Farqni 6-qadamdagi tartibda tuzat (mechanical darhol, structural reja bilan), egasining bilimi (qoidalar, qarorlar, jurnallar) saqlanadi. Oxirida `Standard:` qatoriga skill versiyasini yoz.

## 4. Conformance audit

`audit.md` ni bandma-band o'tib chiq. Har qator uchun natija yoz: `ok`, `fail` (nima topilgani, fayl:qator), `not checked` (sababi) yoki profile'ga tegishli bo'lmasa `n/a`. Skript natijasi bor qatorlarda skriptga tayan, lekin skript faqat o'z qismini tekshiradi: `How to check` da `manual` qismi ham bo'lsa (masalan, A3 dagi qamrov), uni baribir qo'lda tekshir. Qolgan qatorlarni o'zing tekshir. Hisobotga moslik jadvalini qo'sh: bo'lim bo'yicha `ok`, `fail` va `not checked` soni, keyin `fail` qatorlar ro'yxati.

## 5. Facts

- `state.md`, `system-map.md` va `project/` dagi domain fayllaridagi faktlarni live system, konfiguratsiya va o'rnatilgan versiyaning hujjati bilan solishtir. Har birini `verified` yoki `unverified` deb belgila.
- Qarorlarning `Where:` maydonini tekshir: ko'rsatilgan fayl yoki sozlama haliyam shundaymi. Qaror ko'p bo'lsa, oxirgi oyda qo'shilganlarini va eng muhimlarini tekshir.
- `plan.md` dagi muddati o'tgan yoki bajarilgan bandlarni ko'r. `history/` da yozilgan ish `plan.md` da qolib ketmaganini tekshir. Har ⏳ uchun: tekshiriladigan hodisa yoki sana o'tganmi (skript o'tgan sanali `Scheduled` qatorini va ochiq ⏳ lar ro'yxatini ko'rsatadi); o'tgan bo'lsa, dalilni top va yop yoki egasiga ayt.
- Vaqtinchalik qoidalarning `Remove when:` shartini tekshir (A41): bajarilgan bo'lsa, olib tashlashni taklif qil.
- `handoff.md` da `**Status:** active` bo'lsa-yu, ish ko'pdan beri yurmagan bo'lsa (tarix va `git log`), egasiga ayt: ish tashlab ketilgan bo'lishi mumkin.

## 6. Fix

| Type | Examples | How |
|---|---|---|
| `mechanical` (darhol) | Buzilgan yo'l yoki havola; live system'da tekshirilgan eskirgan fakt (`state.md` ni status check natijasidan yangilash); qoidada belgilangan arxivlash (superseded yoki bajarilgan qaror, 40 KB dan oshgan jurnal); joriy oy tarix fayli; commit raqami; mavjud faylni xaritaga qo'shish; standart skriptlarni almashtirish; `changelog.md` dagi `mechanical` qadamlar | Darhol tuzat, hisobotda ro'yxatini ber |
| `structural` (reja bilan) | Qoida qo'shish, o'zgartirish yoki ko'chirish (move); standart qism va `project/` orasida fayl yoki bo'limni ko'chirish (move) yoki qayta nomlash; yangi playbook yoki fayl; ma'noga tegadigan qisqartirish; hajm chegarasini (limit) o'zgartirish; profile o'zgarishi; loyiha skriptidagi xatoni tuzatish (bu loyiha kodi); `changelog.md` dagi `structural` qadamlar | Raqamlangan savollar va reja bilan ber, birinchi savol maqsad, natija va kriteriyalar (P21). Egasining tasdig'isiz (approval) qilma. Egasi javob berguncha har taklif `plan.md` → `Awaiting owner decision` da bitta qator bo'lib turadi, tafsiloti tarix yozuvida |

Shubha bo'lsa, tuzatishni structural deb hisobla. Qoida o'chirilmaydi: kerak bo'lmasa, raqami bilan playbook'ga ko'chadi (move), raqamlar o'zgarmaydi.

**Nom yoki joy o'zgarganda** hamma havolani grep bilan top: hujjatlar, skriptlar, boshqa skill'lar, izohlar, rejali ishlarning (cron) tavsiflari. Skript ichidagi nisbiy yo'l (`../..`) papka chuqurligi o'zgarganda buziladi, uni alohida tekshir.

**Skill limitation.** Skill'ning o'zida nuqson topilishi mumkin: masalan, standart skript soxta ogohlantirish beradi yoki shablon `structure.md` ga zid. Bunda nuqsonni loyiha ichida aylanib o't:
- ogohlantirishni sababi bilan `runbook.md` → `Accepted warnings` ga yoz yoki `project/check.json` sozlamasini o'zgartir, buni tarix yozuvida qayd et;
- loyihadagi standart skriptni tahrirlama: keyingi `ph-doctor` uni skill'dagisi bilan almashtiradi;
- skill fayllari bir-biriga zid bo'lsa, `structure.md` ustun.

Hisobotda buni skill limitation deb ochiq ayt, lekin skill'ni o'zgartirishni taklif qilma: skill'ni faqat uning muallifi takomillashtiradi.

## 7. Re-check and test

1. `pan-harness-check.mjs` va (profile'da `secrets` bo'lsa) `secret-check.mjs` ni qayta ishga tushir: 0 xato va `RESULT: clean` bo'lishi kerak.
2. Fresh-agent test o'tkazish yoki o'tkazmaslikni egasidan so'ra (`testing.md`): structural o'zgarishdan oldin va keyin doimiy to'plam; topilmalar ko'p bo'lsa, ularni skeptik rejimida tekshirish; vaqti-vaqti bilan soddalashtirish tajribasi.

## 8. History entry and report

- Joriy oy tarix fayliga yozuv qo'sh: nima tekshirildi (moslik jadvali qisqa), nima tuzatildi, nima taklif qilindi, sinov natijasi. Structural fix bo'lsa, `Checks:` kriteriyalar natijasidan boshlanadi.
- Structural o'zgarish uchun D yozuvi, egasining yangi gapi uchun F yozuvi yoz. L yozuvi xatodan chiqqan va takrorlanmasligi kerak bo'lgan saboq uchun (agentning yoki harness'ning xatosi), oddiy topilma uchun emas.
- Hisobot (`SKILL.md` → "Report"): structural fix'lar kriteriyalarining natijasi, o'zgargan komponentlar xaritasi, moslik jadvali, mechanical tuzatishlar ro'yxati, structural takliflar (raqamlangan, variant va tavsiya bilan), skill limitation'lar, o'zgargan fayllar, keyingi qadam.
