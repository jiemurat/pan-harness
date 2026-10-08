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
