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
