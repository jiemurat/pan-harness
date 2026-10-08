# Owner's working style: interview

`ph-init` suhbatida beriladi. Egasining uslubi so'raladi: har savol variantlar va tavsiya bilan beriladi, javob loyihaning harness'iga yoziladi. Egasining so'zlari `feedback.md` ga (F…), ulardan chiqqan qoida `AGENTS.md` ga (R…), structure tanlovi `decisions.md` ga (D…) yoziladi.

Faqat repo'dan topilmagan javobni so'ra. Raundlar mavzu bo'yicha guruhlangan: bir-biriga bog'liq bo'lmaganlarini bitta raundda ber. Odatda 1-raund (maqsad, profile va faktlarni tasdiqlash, loyiha bilimi) alohida, 2–4-raundlar birga beriladi. Boshqa javobga bog'liq savol keyingi raundga qoladi. `Profile` ustunida shart bo'lsa, savol faqat o'sha profile'da beriladi.

Egasi javob bermagan savolda tavsiya bo'yicha tanlov qilinsa, u `decisions.md` ga `(provisional: owner to confirm)` belgisi bilan yoziladi va `plan.md` → `Awaiting owner decision` ga qo'shiladi. `feedback.md` ga yozilmaydi: u faqat egasining so'zlari uchun.

## Round 1: goal and communication

| # | Question | Options | Recommendation | Profile |
|---|---|---|---|---|
| S1 | Loyihaning maqsadi va egasi harness'dan nima kutadi | Ochiq savol, 2–3 gap bilan qayta aytib tasdiqlat | — | |
| S28 | Repo'dan aniqlangan profile (`live-system`, `code`, `sensitive-data`) to'g'rimi | Tasdiqlash yoki tuzatish | Repo'dan aniqlangani, har belgining sababi bilan | |
| S11 | Commit'larni agent o'zi qilsinmi? Push'ni egasi qiladi, bu haqda so'ralmaydi. 1-raundda, chunki `ph-init` dagi `Pre-init state` commit'i shunga bog'liq | a) ha: agent har ish oxirida, katta ishda har bosqich oxirida, check'lar o'tgach o'zi commit qiladi; egasining commit qilinmagan o'zgarishlari agentnikidan oldin alohida commit'ga tushadi; b) yo'q: commit faqat egasi so'raganda (ish o'rtasidagi state'ni `handoff.md` saqlaydi) | a | |
| S29 | Commit'larda qaysi ism va email turadi (git'ning `user.name`, `user.email`) | Ochiq savol; javob repo'ning lokal sozlamasiga yoziladi | — | Git'da identity yo'q bo'lsa |
| S2 | Agent egasi bilan suhbatda qaysi tilda yozadi, harness qaysi tilda. README va boshqa loyiha hujjatlarining tili bu yerda so'ralmaydi: agent ularni `AGENTS.md` dagi matn chegarasi qoidasi (shablonda R23) bo'yicha yozadi | a) suhbat va harness egasining tilida; b) suhbat va harness ingliz tilida; c) aralash: suhbat va harness egasining tilida, kod izohlari inglizcha | c | |
| S27 | Atamalar: harness'da inglizcha atama ishlatilsinmi (maydon nomlari va sarlavhalar baribir inglizcha) | a) ha: atamalar va bir necha ma'noli so'z o'rniga inglizcha atama, izohsiz (`structure.md` → "Glossary"); b) yo'q: har tushuncha uchun harness tilidagi bitta so'z, ro'yxati `runbook.md` → `Writing the harness` da | a | S2 b bo'lmasa |
| S3 | Agent egasi bilan suhbatda qanday uslubda yozadi va egasiga qanday murojaat qiladi. Javob shablondagi R12 ga yoziladi | Uslub: a) qisqa, texnik tafsilot faqat kerak bo'lganda; b) batafsil, tushuntirishlar bilan; c) faqat texnik, izohsiz. Murojaat: ochiq savol | uslub a; murojaat tavsiyasiz, egasining so'zi bilan | |
| S4 | Agent loyihada qancha ish qila oladi | a) egasi qila oladigan har qanday ishni, aniq `Boundaries` bilan; b) faqat kod; c) faqat o'qish va taklif | a | |
| S5 | Egasining texnik darajasi: nimani soddalashtirmaslik kerak | Ochiq savol | — | |
| S26 | Harness'dagi sana va vaqt qaysi vaqt zonasida (loyiha hujjatlaridagisi matn chegarasi qoidasi bo'yicha, shablonda R23) | a) egasining vaqt zonasi; b) server vaqt zonasi | a | |

## Round 2: workflow

| # | Question | Options | Recommendation | Profile |
|---|---|---|---|---|
| S6 | Ish turlari | a) uch tur: `question` (faqat o'qish), `small change` (darhol), `large task` (reja, keyin tasdiq); b) hammasi reja bilan; c) hammasi darhol | a | |
| S7 | Large task'ni rejalashtirish formati | a) savollar raund-raund, raqamlangan, variant va tavsiya bilan, ta'siri bo'yicha tartibda, past ta'sirlilari bitta "tavsiya bo'yicha qabul qilinsinmi?" ro'yxatida, javob "1. a 2. c" shaklida; b) erkin suhbat; c) tayyor reja va bitta tasdiq | a | |
| S8 | Bir vaqtda nechta ish | a) bittadan: tugat, natijani ayt, to'xta, keyingisini egasi aytadi; b) agent o'zi navbatdagisiga o'tadi | a | |
| S9 | Javobsiz savol qolsa | a) keyingi qadam faqat javobdan keyin; b) tavsiya bilan davom etiladi | a | |
| S10 | Ish oxiridagi hisobot | a) qisqa: kriteriyalar natijasi (large task'da), nima qilindi, nima topildi, o'zgargan komponentlar xaritasi (large task'da), uzilish, fayllar ro'yxati, keyingi qadam; b) batafsil | a | |

## Round 3: permissions and safety

| # | Question | Options | Recommendation | Profile |
|---|---|---|---|---|
| S12 | Restart, deploy va live system'ga ta'sir | a) har biri uchun alohida ruxsat, reja tasdig'i ruxsat emas; b) reja tasdig'i yetadi | a | `live-system=yes` |
| S13 | Irreversible action (o'chirish, tarixni qayta yozish) | a) ro'yxatni ko'rsatib, ruxsat bilan; b) agent o'zi hal qiladi | a | |
| S14 | Sirlar | a) qiymat hech qachon o'qilmaydi va chiqarilmaydi, faqat nomlar; sir fayllari ruxsatsiz ochilmaydi; b) kerak bo'lsa o'qiladi | a | `sensitive-data` da `secrets` |
| S15 | Sinov paytida external side effect (xabar, post, xat) | a) qilinmaydi, faqat o'qish so'rovlari; b) sinov akkauntida mumkin | a | Tashqi xizmat bo'lsa |
| S16 | Ko'p qismga tegadigan o'zgarish | a) avval bittasida sinaladi; b) hammasiga birdan | a | |
| S17 | Egasining terminalida qilinadigan ishlar (`sudo`, parol, OAuth) | a) agent buyruqni beradi, egasi o'zi kiritadi; b) agentga parol beriladi | a | `code=yes` yoki `live-system=yes` |
| S24 | Pan-harness'ning standart qoidalari: agent vositasining ruxsat tizimini chetlab o'tmaslik, obyektiv baho, qaror egasi ko'rmagan narsaga bog'liq bo'lsa avval ko'rsatish, egasining tahrirlari ustunligi | a) hammasi; b) tanlab | a | |

## Round 4: the harness itself

| # | Question | Options | Recommendation | Profile |
|---|---|---|---|---|
| S18 | Start set'ning hajm limit'i | a) 24 KB; b) 20 KB; c) boshqa | Bitta xizmat va git'da ~50 dan kam fayl bo'lsa b, aks holda a | |
| S19 | `ph-doctor` qanchalik tez-tez ishga tushiriladi va kim eslatadi | a) oyda bir, eslatma (kalendar, cron yoki agent tizimi); b) faqat egasi aytganda; c) hajm ogohlantirishida | a | |
| S20 | `ph-doctor` dagi mechanical fix'lar | a) qoidada belgilangan mechanical fix darhol, structural o'zgarish reja bilan; b) hammasi reja bilan | a | |
| S21 | Structure savolida tadqiqot | a) variantdan oldin internetdagi amaliyot o'rganiladi, manbalar bilan; b) agentning o'z bilimi yetadi | a | |
| S25 | Faqat o'qiydigan status script (`project/scripts/status-check.sh` kabi) yaratilsinmi | a) ha; b) yo'q, status qo'lda tekshiriladi | a | `live-system=yes` |
| S22 | Loyihada boshqa maqsadli `AGENTS.md` lar bormi (ilovaning o'z agentlari, hujjatlar) | Repo'dan topiladi, borligi tasdiqlatiladi | Ildizdagi qoidada "ular tahrir obyekti" (R17) | Bunday fayl bo'lsa |
| S23 | Mavjud `CLAUDE.md` | Repo'dan topiladi | `CLAUDE.md` faqat `@AGENTS.md` importi bilan qoladi, mazmuni pan-harness'ga move qilinadi | `CLAUDE.md` bo'lsa |

## Project knowledge (agar repo'dan topilmasa)

- Live system bormi, qayerda ishlaydi, kim foydalanadi. Uzilish nimaga olib keladi.
- Eng xavfli amallar (ma'lumot o'chirish, to'lov, foydalanuvchiga xabar) va ular uchun qoida.
- Tashqi xizmatlar va ularning cheklovlari (narx, kvota, muddatli tokenlar).
- Shaxsiy ma'lumot yoki maxfiy hujjatlar bormi, ular qayerda (mazmunini so'rama).
- Egasining yaqin rejalari va kutayotgan qarorlari (`plan.md` ga).
- Ma'lum muammolar va o'tgan xatolar (`lessons.md` ga, sababi bilan).
- Invariant'lar: kodda arxitektura qatlamlari va bog'liqlik qoidalari, hujjatda atamalar, structure, iqtibos shakli, maxfiylik. Qaysi biri check bilan majburlangan, qaysisini majburlash kerak (P23).
