# Panoramic Harness: qo'llanma

Panoramic Harness (qisqasi pan-harness) — loyihaning AI agentlar uchun bilim va qoidalar tizimi. U loyiha papkasidagi oddiy matnli fayllardan iborat: `AGENTS.md` (loyiha, ish tartibi, qoidalar), `PAN-HARNESS.md` (harness qanday tuzilgani) va `pan-harness/` papkasi (joriy holat, rejalar, qarorlar, tarix). Har sessiyadagi agent oldingi suhbatni eslamaydi, shuning uchun loyihani davom ettirishga kerak hamma narsa shu fayllarda, git'da yoziladi. Ularni har qanday agent va model o'qiy oladi.

`@jiemurat/pan-harness` paketi harness'ni yaratadigan va yuritadigan besh skill'ni loyihaga o'rnatadi:

| Skill | Nima qiladi |
|---|---|
| `ph-init` | Harness yaratadi. Papka bo'sh bo'lsa, avval loyiha nima bo'lishini so'raydi. Mavjud kod yoki hujjat loyihasida boshqa agent fayllarini (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules`) bilim yo'qotmasdan ko'chiradi. Harness bor bo'lsa, `ph-doctor` yoki `ph-update` ni taklif qiladi |
| `ph-doctor` | Harness'ni standart bo'yicha bandma-band tekshiradi, mexanik xatolarni darhol tuzatadi, tuzilmaviy o'zgarishlarni reja bilan taklif qiladi |
| `ph-update` | Paketni yangi versiyaga yangilaydi, harness'ni changelog bo'yicha ko'chiradi va oxirida to'liq `ph-doctor` o'tkazadi |
| `ph-grilling` | Katta ishni rejalashtirish suhbati: savollar raund-raund, har biri tavsiya bilan ([mattpocock/skills](https://github.com/mattpocock/skills) asosida, MIT) |
| `ph-writing-for-agents` | Agent o'qiydigan har matnni yozish usuli: skill, `AGENTS.md`, prompt ([mattpocock/skills](https://github.com/mattpocock/skills) dagi writing-for-agents skill'i, MIT, faqat nomi o'zgargan) |

## O'rnatish

Loyiha papkasida:

```bash
npx @jiemurat/pan-harness@latest init
```

Buyruq skill'larni ikki joyga nusxalaydi:
- `.agents/skills/` — Codex, Gemini CLI, Antigravity, GitHub Copilot, Cursor, OpenCode, Amp va Cline shu yerdan o'qiydi;
- `.claude/skills/` — Claude Code.

Gemini CLI va OpenCode uchun `/ph-*` buyruq fayllarini ham yozadi (`.gemini/commands/`, `.opencode/commands/`). Bu fayllar `.gitignore` ga qo'shiladi: skill'lar asbob, loyiha bilimi esa harness'da. Kerak bo'lsa, ular qayta o'rnatiladi.

Boshqa agentlar uchun: `--agents windsurf,kiro,qwen,goose` yoki `--agents all`.

## Ishni boshlash

Agentni loyiha papkasida oching va yozing:

| Agent | Buyruq |
|---|---|
| Claude Code, Antigravity, Cursor, GitHub Copilot, Gemini CLI, OpenCode | `/ph-init` |
| Codex | `$ph-init` |

Agent loyihani o'rganadi, savollarni raund-raund beradi (har biri variant va tavsiya bilan), reja tuzadi va sizning "boshla" deganingizdan keyin harness'ni yaratadi. Git bo'lmasa, uni o'rnatadi (`sudo` kerak bo'lsa, buyruqni sizga ko'rinadigan terminalda ishga tushiradi, parolni siz kiritasiz), `.gitignore` va dastlabki commit qiladi. Commit'larni agent o'zi qilsinmi, birinchi raundda so'raydi (standart javob — ha); push'ni har doim siz qilasiz.

## Nima yaratiladi

```
loyihangiz/
├── AGENTS.md              kirish nuqtasi: loyiha, chegaralar, ish tartibi, qoidalar
├── PAN-HARNESS.md         profile, harness xaritasi, ish oxiridagi tekshiruvlar
├── .githooks/pre-commit   har commit oldidan harness tekshiruvlari
└── pan-harness/
    ├── state.md, plan.md, handoff.md         joriy holat, ochiq ishlar, faol katta ish
    ├── decisions.md, feedback.md, lessons.md faqat qo'shib boriladigan jurnallar
    ├── history/, archive/                    oyma-oy tarix, arxiv
    ├── playbooks/pan-harness.md              parvarish qadamlari
    ├── scripts/                              tekshiruv skriptlari (Node)
    └── project/                              faqat shu loyihaga xos bilim
```

Harness loyiha bilan birga git'ga commit qilinadi: har sessiya va har agent bir xil bilimdan boshlaydi. Agentlar uni agent o'quvchi uchun yozish qoidalari bilan yozadi (Matt Pocock'ning [writing-for-agents](https://github.com/mattpocock/skills/tree/main/skills/productivity/writing-for-agents) skill'i asosida): har havola nima borligini va qachon o'qilishini aytadi, har qadam tekshirsa bo'ladigan shart bilan tugaydi, qoida nima qilishni aytadi, har tushuncha bitta atama bilan yoziladi. `ph-doctor` yangi matnni shu qoidalar bilan tekshiradi. Bu qoidalar agent o'qiydigan boshqa matnlarga ham (agent kontekst fayllari, skill'lar, mahsulotdagi prompt'lar) qo'llanadi, inson uchun matnlar (README, xat, foydalanuvchi qo'llanmasi) esa siz aytgan tarzda yoki hujjatning o'z tili va uslubida yoziladi, ikkalasi ham bo'lmasa, agent suhbat tilida yozadi va buni sizga aytadi: boshqa til kerak bo'lsa, ayting.

## Keyin

- **Har oy:** `/ph-doctor` — harness'ni tekshirish va tartibga solish.
- **Yangi versiya chiqqanda:** `/ph-update`. Yoki terminalda holatni ko'ring: `npx @jiemurat/pan-harness@latest status`.
- **Rejalashtirish:** katta ishda agent `ph-grilling` bilan savollar beradi.

## Jamoa va yangi klon

Skill'lar git'ga kirmaydi. Repo'ni klon qilgandan keyin yoki boshqa kompyuterda bir marta `npx @jiemurat/pan-harness@latest init` ni ishga tushiring: harness'ning o'zi repo bilan keladi, uning `AGENTS.md` si esa skill'lar yo'q bo'lsa, ularni o'rnatishni agentga aytadi.

## CLI buyruqlari

| Buyruq | Nima qiladi |
|---|---|
| `init` | Skill'larni o'rnatadi |
| `update` | O'rnatilgan skill'larni shu versiyaga almashtiradi (`ph-update` uni o'zi ishga tushiradi); `--agents` bilan boshqa agentlar uchun qayta o'rnatadi |
| `remove` | Skill'larni, buyruq fayllarini va `.gitignore` qatorlarini o'chiradi; harness'ga tegmaydi |
| `status` | O'rnatilgan va npm'dagi versiya, qo'lda o'zgartirilgan fayllar |

Bayroqlar: `--dir <papka>`, `--agents <ro'yxat>`, `--no-commands`, `--yes` (qo'lda o'zgartirilgan faylni so'ramasdan almashtirish), `--dry-run`. Chiqish kodi 3 — qo'lda o'zgartirilgan fayllar bor, `--yes` bilan qayta ishga tushiring.

CLI faqat o'zi boshqaradigan skill va buyruq papkalariga (va `.gitignore` dagi o'z blokiga) yozadi, har fayl xeshi bilan manifest yuritadi va qo'lda o'zgartirilgan faylni so'ramasdan almashtirmaydi yoki o'chirmaydi. `remove` harness'ga tegmaydi.

## Bilib qo'ying

- To'liq `/ph-init` yoki `/ph-doctor` skill ma'lumotnomalarini va loyihani o'qiydi: kuchli model bilan taxminan 150–300 ming token. Kichik modellar qadamlarni bajaradi, lekin suhbatda kamroq aniq, harness'ga yozgan yozuvlarida esa to'qilgan fakt bo'lishi mumkin: Claude Haiku 4.5 bilan sinovda beshta yozish vazifasidan uchtasida shunday bo'ldi. Qaror va qoida kabi muhim yozuvlarni kuchli model bilan yozing yoki ko'rib chiqing.
- Cursor va VS Code `.agents/skills/` ni ham, `.claude/skills/` ni ham o'qiydi va har skill'ni ikki marta ko'rsatishi mumkin: Claude Code ishlatmasangiz, `--agents agents` bilan o'rnating.
- Telemetriya yo'q. CLI internetga faqat `status` da (npm registry) chiqadi; `PH_OFFLINE=1` buni o'chiradi.
- Tekshiruvlar sir qiymatini hech qachon chiqarmaydi: `secret-check` faqat fayl, qator va naqsh nomini aytadi.

## Boshqa o'rnatish yo'llari

- `npx skills add jiemurat/pan-harness` (Vercel'ning ko'p agentli vositasi).
- Claude Code plugin: `/plugin marketplace add jiemurat/pan-harness`, keyin `/plugin install pan-harness@jiemurat`. Bu holda buyruqlar `/pan-harness:ph-init` va hokazo.

## Talablar

Node.js 18 yoki yangi: harness tekshiruvlari (`pan-harness/scripts/*.mjs`) Node'da ishlaydi. Git'ni `ph-init` o'zi o'rnatadi.

## Til

Skill'lar ko'rsatmasi o'zbekcha, `ph-grilling` va `ph-writing-for-agents` esa upstream'dagidek inglizcha. Harness esa `ph-init` da siz tanlagan tilda yoziladi.
