# Changelog: pan-harness standard

`ph-update` va `ph-doctor` loyihadagi versiyani (`PAN-HARNESS.md` → `Standard:`) shu ro'yxat bilan solishtiradi va undan keyingi yozuvlarni eskisidan yangisiga qarab ketma-ket bajaradi. Har qadamda turi ko'rsatilgan: `mechanical` qadam darhol bajariladi, `structural` qadam reja va egasining tasdig'i bilan (`doctor.md` → "6. Fix"). Harness unknown standard'da bo'lsa, `doctor.md` → "3. Migration" dagi tartib bajariladi (ta'rifi: `structure.md` → "Glossary").

Yozuv shakli: `## <versiya>`, bir-ikki gapda nima o'zgargani, keyin raqamlangan qadamlar (`mechanical` yoki `structural` — nima qilinadi).

## 1.0.0

Birinchi versiya. Migration qadamlari yo'q: harness `ph-init` bilan shu standartda yaratiladi.

## 1.1.0

Harness matnini yozish qoidalari (P26): context pointer, progressive disclosure va co-location, completion criterion, positive form, leading word, single source, manba, no-op. Ular yangi va o'zgartirilgan matnga qo'llanadi, eski matn tegilganda moslanadi. `pan-harness-check` yangi qatorlardagi atama izohini ko'rsatadi (`terms`), `ph-doctor` P26 bandlarini yangi matnda tekshiradi (`audit.md` → "Writing").

Quyidagi qadamlarni `node <skill>/scripts/migrate.mjs --root .` bajaradi; u `by hand` deb chiqargan bandni shu qadam bo'yicha qo'lda bajar.

1. `mechanical` — `runbook.md`: `Writing docs` bo'limini `Writing the harness` deb qayta nomla (raqami qoladi) va unga havolalarni yangila: `grep -rn "Writing docs" AGENTS.md PAN-HARNESS.md pan-harness/ --exclude-dir=archive`. Tugadi: shu buyruq hech narsa topmaydi.
2. `mechanical` — `runbook.md` → `Writing the harness`: bo'limni shablondagi bo'lim bilan, fayl boshidagi kirish qatorini shablondagi qator bilan almashtir; loyihaning qiymatlari (til, `Atamalar`, vaqt zonasi, egasi uchun so'z, topic tag'lar) va loyiha qo'shgan bandlar o'z joyida qoladi. Tugadi: bo'limda kirish gapi va `Context pointer` dan `No-op` gacha sakkiz qoida bor, loyihaning har qiymati saqlangan, `git diff pan-harness/runbook.md` da faqat shu bo'lim va kirish qatori o'zgargan.
3. `mechanical` — `runbook.md` → `Writing the harness` → `Atamalar`: `Atamalar` qatori atamalarni inglizcha yozishni aytsa (S27 a), uni shablondagi shaklga keltir; harness tilidagi atamalarni aytsa (S27 b), o'z holicha qoldir. Tugadi: S27 a da qatorda qavsdagi izoh haqida gap yo'q.
4. `mechanical` — `PAN-HARNESS.md`: `Map` dagi `runbook.md` qatorini va `End of task` dagi yozish bandini shablondagidek qil, fayldagi qolgan qatorlar o'z holicha qoladi. Tugadi: `git diff PAN-HARNESS.md` da shu ikki qator, 1-qadam o'zgartirgan havola va `Standard:` qatoridan boshqa qator o'zgarmagan.
5. `mechanical` — `decisions.md`, `feedback.md`, `lessons.md`, joriy oyning `history/` fayli, `plan.md` va `handoff.md` boshidagi yozuv shaklini shablon bilan solishtir va yetishmagan qatorlarni qo'sh. Yozuvlar o'z holicha qoladi, shakli eski bo'lsa ham: jurnallar append-only. Tugadi: oltita faylning boshi shablondagidek, `git diff` da birorta yozuv qatori o'zgarmagan.

## 1.3.0

Egasiga yozilgan xabar tushunarli bo'ladi: egasi harness fayllarini o'qimaydi, shuning uchun savol, hisobot, taklif va statusda ichki belgi (A1, P1, S2, K4 kabi raqamli nom; qoida, qaror, fikr va saboq raqamlari ham shunday) va hujjat ichidagi qadam raqami o'rniga ma'nosi yoziladi; belgilar harness fayllarida qoladi. Qoida `AGENTS.md` shablonidagi suhbat qoidasining ostbandi (R12), uchala skill'ning umumiy qoidalarida (14-qoida) va hisobot shaklida turadi; `ph-doctor` suhbat qoidasi bandini (A64) shunga ko'ra tekshiradi, `pan-harness-check` 1.3.0 harness'da ostband yo'q bo'lsa ogohlantiradi. Uslub savollari jadvalining egasiga ko'rsatiladigan kataklaridan belgilar olib tashlandi; `ph-doctor` hisobotida to'liq jadval o'rniga bo'limlar bo'yicha qisqa hisob va topilmalar oddiy tilda beriladi. Sinov qoidasi: o'zgartirishdan oldin alohida run shart emas, oxirgi yozilgan natija bilan solishtiriladi. "ph-paket" termini glossary'ga kiritildi.

Quyidagi qadamlarni `node <skill>/scripts/migrate.mjs --root .` bajaradi; u `by hand` deb chiqargan bandni shu qadam bo'yicha qo'lda bajar. Harness o'zbekcha bo'lmasa, qo'shilgan bandni harness tiliga o'gir: skript suhbat qoidasini "Egasi bilan suhbatda" bilan boshlanishidan, qo'shilgan bandni "A1, P1, S2, K4" misollaridan taniydi.

1. `mechanical` — `AGENTS.md`: suhbat qoidasi (shablondagi R12, "Egasi bilan suhbatda" bilan boshlanadi) ostiga shablondagi ostbandni qo'sh ("Egasi harness fayllarini o'qimaydi: ..."); qoidaning o'z so'zlari o'z holicha qoladi. Tugadi: `AGENTS.md` da suhbat qoidasi ostida shu band bor, `pan-harness-check` shu band haqida ogohlantirmaydi.
2. `mechanical` — `playbooks/pan-harness.md`: "structure o'zgarishidan oldin va keyin bir xil beriladi, natijalar solishtiriladi." gapini shablondagi gap bilan almashtir ("structure o'zgarishidan keyin beriladi, natijalar oxirgi yozilgan natija bilan solishtiriladi (oldin run shart emas)."). Tugadi: playbook'da eski gap yo'q.

## 1.2.0

Agent matni va inson matni chegarasi (`AGENTS.md` shablonidagi R23): harness matni `runbook.md` → `Writing the harness` ning hamma qoidalari bilan, agent o'qiydigan boshqa matn undagi to'qqizta P26 qoidasi bilan (`Buyruq shakli` dan `No-op` gacha) yoziladi; harness tili va atamalari faqat harness fayllariga, suhbat qoidasi (shablondagi R12) faqat suhbatga. Inson o'qiydigan matnning tili va uslubi egasining ko'rsatmasi, bo'lmasa hujjatning o'z tili va uslubi, yangi hujjatda o'xshash hujjatlarniki bilan tanlanadi, bular bo'lmasa suhbat tilida va hujjat turiga mos uslubda, agent buni egasiga aytadi. `ph-doctor` buni A64 va A65 bilan tekshiradi, `pan-harness-check` `**Writing**` guruhi yo'qligini ko'rsatadi.

Quyidagi qadamlarni `node <skill>/scripts/migrate.mjs --root .` bajaradi; u `by hand` deb chiqargan bandni shu qadam bo'yicha qo'lda bajar. Harness o'zbekcha bo'lmasa, qo'shilgan gaplarni harness tiliga o'gir: skript qoidani `**Writing**` guruhidan taniydi.

1. `mechanical` — `AGENTS.md`: `## Rules` dagi oxirgi qoidadan keyin `**Writing**` guruhini va shablondagi R23 ni ichki bandlari bilan, keyingi bo'sh raqam bilan qo'sh (R raqamlari `AGENTS.md` va playbook'lar bo'yicha 1..n). Manbasi — shablondagi R16 ning D manbasi, u bo'lmasa D1. Tugadi: `AGENTS.md` da `**Writing**` qatori va undan keyin shu qoida bor, check'da R raqamlari va manba xatosi yo'q.
2. `mechanical` — `AGENTS.md`: suhbat qoidasini (`**Communication**` guruhining birinchi qoidasi, shablondagi R12: "<til> va qisqa yoz") "Egasi bilan suhbatda" bilan boshla va oxiriga, manbadan oldin, "Faylga yoziladigan matnning tili va uslubi R<n> da." gapini qo'sh (`<n>` — 1-qadamdagi raqam); qolgan so'zlari o'z holicha qoladi. Qoidada fayl matni haqida gap bo'lsa (README tili, kod izohlari), uni suhbat qoidasidan chiqar, masalan `runbook.md` → `Writing the harness` → `Til:` ga. Tugadi: suhbat qoidasi "Egasi bilan suhbatda" bilan boshlanadi, R<n> ga havola beradi va unda fayl matni haqida gap yo'q.
3. `mechanical` — `runbook.md` → `Writing the harness`: kirish gapini shablondagi gap bilan almashtir, undagi R23 o'rniga 1-qadamdagi raqamni yoz; bandlar o'z holicha qoladi. Tugadi: kirish gapi agent matnlarini va ularga qo'llanadigan qoidalarni nomma-nom sanaydi, R<n> ga havola beradi.
4. `mechanical` — `PAN-HARNESS.md`: `Map` dagi `runbook.md` qatorini va `End of task` dagi yozish bandini shablondagidek qil, R23 o'rniga 1-qadamdagi raqam. Tugadi: `git diff PAN-HARNESS.md` da shu ikki qator va `Standard:` qatoridan boshqa qator o'zgarmagan.
5. `mechanical` — `playbooks/pan-harness.md`: skill faylini loyiha yo'li bilan emas, skill nomi bilan yoz: "(`ph-doctor` skill'idagi testing.md, \"Fixed question set\" bo'limi)". Tugadi: check'da `references/testing.md` yo'li haqida xato yo'q.
