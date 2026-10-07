## Files and when to read them

| File | Contents | When to read |
|---|---|---|
| `references/structure.md` | Pan-harness standarti: glossary, profile, fayllar, jurnallar, hajm chegaralari (limits), yozish qoidalari | Har skill'ning boshida |
| `references/audit.md` | Moslik ro'yxati (A1…): har talab, uning smell'i, tekshirish usuli va tuzatish turi | `ph-doctor` ning 4-qadamida va `ph-init` oxirida |
| `references/changelog.md` | Standart versiyalari va har versiyaga ko'chirish (migration) qadamlari | `ph-doctor` va `ph-update` da, loyiha versiyasi skill'nikidan farq qilsa |
| `references/principles.md` | Tamoyillar (P1…) va ularning manbalari | Tuzilish yoki qoida haqidagi qarordan oldin |
| `references/style-questions.md` | Egasining ish uslubi haqidagi savollar (S1…), variantlar va tavsiyalar | `ph-init` suhbatida |
| `references/init.md` | `ph-init` qadamlari va checklist | `ph-init` da (`ph-doctor` da ham: ko'chirish (migration) qarori va migration table qoidasi shu yerda) |
| `references/doctor.md` | `ph-doctor` qadamlari, ko'chirish (migration), mechanical va structural fix chegarasi (boundary), skill limitation | `ph-doctor` va `ph-update` da |
| `references/testing.md` | Sinov tartiblari: doimiy savollar to'plami, "o'rtasidan davom ettirish" sinovi, mustaqil tekshiruvchi va skeptik rejimi, soddalashtirish tajribasi, A51 | Sinovni egasiga taklif qilishdan oldin (`ph-init` va `ph-doctor` oxirida, structural o'zgarishdan keyin) |
| `templates/` | Standart qismning shablonlari (`*.tmpl`), git hook ham (`githooks/pre-commit.tmpl`) | Fayl yaratishda va `ph-doctor` da shablon bilan solishtirishda |
| `scripts/pan-harness-check.mjs` | Tuzilma, profile, bo'lim, maydon, ID, tag, yo'l va hajm tekshiruvi (check) | Har yozishdan keyin. Loyihaga nusxasi qo'yiladi |
| `scripts/secret-check.mjs` | Sirga o'xshash qatorlarni qidirish (qiymat chiqarilmaydi). Standart yo'llar: `AGENTS.md`, `PAN-HARNESS.md`, `CLAUDE.md`, `pan-harness/` | Commit oldidan. Profile'da `secrets` bo'lsa, loyihaga nusxasi qo'yiladi |

Skriptlarni o'qima, ishga tushir: `node <skill>/scripts/pan-harness-check.mjs --root <loyiha>`.
