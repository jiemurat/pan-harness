# Owner's working style: interview and standard choices

`ph-init` suhbatida egasidan faqat egasidan boshqa hech kim bila olmaydigan narsa so'raladi (`Asked`). Uslub, ish tartibi va ehtiyot choralari savol emas, standart tanlov (`Standard choices`): u rejada egasiga oddiy so'z bilan, guruhlab ko'rsatiladi, javob kutilmaydi. Egasi tanlovni noto'g'ri deb topsa, o'zi aytadi: uning so'zi `feedback.md` ga (F…) yoziladi va qoida yangilanadi.

Shablonning `{{…}}` joylari `Standard` ustunidagi qiymat bilan to'ldiriladi (egasi boshqasini aytgan bo'lsa, uning so'zi bilan). Hamma standart tanlov `decisions.md` ga bitta qaror sifatida (D…) yoziladi; reja tasdig'i uni tasdiqlangan qiladi, shuning uchun `(provisional: owner to confirm)` belgisi va `plan.md` → `Awaiting owner decision` bandi kerak emas. Qoida shu qarorga, egasi aytgan bo'lsa o'sha F yozuviga `←` bilan havola beradi. `Condition` ustunida shart bo'lsa, tanlov faqat o'sha loyihada qo'llanadi va rejada faqat qo'llangani aytiladi.

Savolni egasiga `Asked` jadvalidagi matn bilan ber: `#` va `Condition` ustunlari agent uchun. Bo'sh papkada savollar ikki raundda beriladi: 1-raund — S1 (va git'da identity bo'lmasa S29), 2-raund — S30 va S31, 1-javobga moslab (loyiha turi kod, hujjat yoki boshqa ekani savol matniga ta'sir qiladi). Mavjud loyihada (repo bor) loyiha turi repo'dan ma'lum, shuning uchun hammasi bitta raundda. Kodsiz, serversiz, sirsiz loyihada savollar soni ko'pi bilan 5, odatda 3–4.

Ochiq savolda `Suggestion` ustunidagi taklifni Facts dan topilgan narsalar bilan to'ldirib, o'z taklifing sifatida yoz: egasi "ha" desa qabul, o'zgartirsa uning so'zi qoida bo'ladi. "Bilmayman" yoki "hali hal qilmaganman" javobi qabul qilinadi: u ochiq masala sifatida rejada ro'yxatlanadi va 5-qadamda `plan.md` → `Awaiting owner decision` ga yoziladi, ish to'xtamaydi. Agent topadigan fakt (suhbat tili, kompyuterning vaqt zonasi, profile) savol ham, tasdiq savoli ham emas: u rejada axborot sifatida aytiladi.

Repo'dan topilmagan loyiha bilimi (xavfli amallar, tashqi xizmatlar, maxfiy ma'lumot, yaqin rejalar, ma'lum muammolar, invariant'lar) yangi savol emas: u S1, S30 va S31 ga kiradi.

## Asked

| # | Question | Options | Suggestion | Condition |
|---|---|---|---|---|
| S1 | Loyihaning maqsadi, egasi harness'dan nima kutadi va kim uchun; yaqin rejalar; mavjud loyihada repo'dan topilmagan ma'lum muammolar. Bo'sh papkada loyiha nima bo'lishi ham: kod yoki hujjat va nomi (egasining ismi so'ralmaydi) | Ochiq savol; maqsad rejada 2–3 gapda qayta aytiladi (alohida tasdiq savoli yo'q) | Mavjud loyihada: README va manifestdan topilgan maqsad (taklif sifatida); bo'sh papkada — | |
| S29 | Commit'larda qaysi ism va email turadi (git'ning `user.name`, `user.email`) | Ochiq savol; javob repo'ning lokal sozlamasiga yoziladi | — | Git'da identity yo'q bo'lsa |
| S30 | "Tayyor" degani nima: natija qanday yaratiladi yoki ishlatiladi (build, eksport, nashr, sinxronlash) va qanday tekshiriladi (test, lint, korrektura, faktlar, havolalar); loyihaning qoidalari: atamalar, tuzilma, iqtibos shakli va qaysi biri skript bilan majburlanadi | Ochiq savol; o'z taklifingni yoz | Facts dagi mavjud check'lar; hujjat loyihasida: havolalar ishlaydi, qoralama belgilari (`TODO`, `TK`, "[manba kerak]") yo'q, manbalar ko'rsatilgan | |
| S31 | Chegaralar: shaxsiy yoki maxfiy ma'lumot bormi va qayerda (mazmuni so'ralmaydi); eng xavfli yoki qaytarib bo'lmaydigan amal (masalan, hujjatni o'chirish yoki ko'chirish); tashqi xizmat va uning cheklovlari (kvota, muddatli token, bulutga sinxronlash); doimiy ishlaydigan xizmat va uzilish oqibati | Ochiq savol; o'z taklifingni yoz | Ruxsatsiz o'chirish va ko'chirish yo'q; Facts dagi sir va maxfiy hujjat fayllarining nomlari (qiymatsiz) | Doimiy xizmat qismi: `live-system=yes` |

## Standard choices: communication

| # | Choice | Options | Standard | Condition |
|---|---|---|---|---|
| S28 | Profile (`live-system`, `code`, `sensitive-data`): repo'dan va `Asked` javoblaridan aniqlanadi | Agent aniqlaydi, rejada oddiy so'z bilan aytadi | Repo'dan va javoblardan aniqlangani, har belgining sababi bilan | |
| S11 | Commit'larni agent o'zi qiladi, push'ni egasi qiladi, bu haqda so'ralmaydi. Egasining commit qilinmagan o'zgarishlari reja tasdig'idan keyin, harness yozilishidan oldin alohida `Pre-init state` commit'iga tushadi | a) ha: agent har ish oxirida, katta ishda har bosqich oxirida, check'lar o'tgach o'zi commit qiladi; egasining commit qilinmagan o'zgarishlari agentnikidan oldin alohida commit'ga tushadi; b) yo'q: commit faqat egasi so'raganda (ish o'rtasidagi state'ni `handoff.md` saqlaydi) | a | |
| S2 | Agent egasi bilan suhbatda qaysi tilda yozadi, harness qaysi tilda. README va boshqa loyiha hujjatlarining tili bu yerda so'ralmaydi: agent ularni `AGENTS.md` dagi matn chegarasi qoidasi bo'yicha yozadi | a) suhbat va harness egasining tilida; b) suhbat va harness ingliz tilida; c) aralash: suhbat va harness egasining tilida, kod izohlari inglizcha | egasining tili — u suhbatda yozgan til; kodli loyihada c, kodsiz loyihada a | |
| S27 | Atamalar: harness'da inglizcha atama ishlatilsinmi (maydon nomlari va sarlavhalar baribir inglizcha) | a) ha: atamalar va bir necha ma'noli so'z o'rniga inglizcha atama, izohsiz (`structure.md` → "Glossary"); b) yo'q: har tushuncha uchun harness tilidagi bitta so'z, ro'yxati `runbook.md` → `Writing the harness` da | a | S2 b bo'lmasa |
| S3 | Agent egasi bilan suhbatda qanday uslubda yozadi va egasiga qanday murojaat qiladi. Javob `AGENTS.md` dagi suhbat qoidasiga yoziladi | Uslub: a) qisqa, texnik tafsilot faqat kerak bo'lganda; b) batafsil, tushuntirishlar bilan; c) faqat texnik, izohsiz. Murojaat: egasi aytsa, uning so'zi bilan | uslub a; murojaat tavsiyasiz: aytilmasa qoidaga yozilmaydi | |
| S4 | Agent loyihada qancha ish qila oladi | a) egasi qila oladigan har qanday ishni, aniq `Boundaries` bilan; b) faqat kod; c) faqat o'qish va taklif | a | |
| S5 | Egasining texnik darajasi: nimani soddalashtirmaslik kerak | Egasi aytsa, uning so'zi bilan | aytilmasa qoidaga yozilmaydi | |
| S26 | Harness'dagi sana va vaqt qaysi vaqt zonasida (loyiha hujjatlaridagisi matn chegarasi qoidasi bo'yicha) | a) egasining vaqt zonasi; b) server vaqt zonasi | a: kompyuter sozlamasidagi zona | |

## Standard choices: workflow

| # | Choice | Options | Standard | Condition |
|---|---|---|---|---|
| S6 | Ish turlari | a) uch tur: `question` (faqat o'qish), `small change` (darhol), `large task` (reja, keyin tasdiq); b) hammasi reja bilan; c) hammasi darhol | a | |
| S7 | Large task'ni rejalashtirish formati | a) savollar raund-raund, raqamlangan, variant va tavsiya bilan, ta'siri bo'yicha tartibda, past ta'sirlilari bitta "tavsiya bo'yicha qabul qilinsinmi?" ro'yxatida, javob "1. a 2. c" shaklida; b) erkin suhbat; c) tayyor reja va bitta tasdiq | a | |
| S8 | Bir vaqtda nechta ish | a) bittadan: tugat, natijani ayt, to'xta, keyingisini egasi aytadi; b) agent o'zi navbatdagisiga o'tadi | a | |
| S9 | Javobsiz savol qolsa | a) keyingi qadam faqat javobdan keyin; b) tavsiya bilan davom etiladi | a | |
| S10 | Ish oxiridagi hisobot | a) qisqa: kriteriyalar natijasi (large task'da), nima qilindi, nima topildi, o'zgargan komponentlar xaritasi (large task'da), uzilish, fayllar ro'yxati, keyingi qadam; b) batafsil | a | |

## Standard choices: permissions and safety

| # | Choice | Options | Standard | Condition |
|---|---|---|---|---|
| S12 | Restart, deploy va live system'ga ta'sir | a) har biri uchun alohida ruxsat, reja tasdig'i ruxsat emas; b) reja tasdig'i yetadi | a | `live-system=yes` |
| S13 | Irreversible action (o'chirish, tarixni qayta yozish) | a) ro'yxatni ko'rsatib, ruxsat bilan; b) agent o'zi hal qiladi | a | |
| S14 | Sirlar | a) qiymat hech qachon o'qilmaydi va chiqarilmaydi, faqat nomlar; sir fayllari ruxsatsiz ochilmaydi; b) kerak bo'lsa o'qiladi | a | `sensitive-data` da `secrets` |
| S15 | Sinov paytida external side effect (xabar, post, xat) | a) qilinmaydi, faqat o'qish so'rovlari; b) sinov akkauntida mumkin | a | Tashqi xizmat bo'lsa |
| S16 | Ko'p qismga tegadigan o'zgarish | a) avval bittasida sinaladi; b) hammasiga birdan | a | |
| S17 | Egasining terminalida qilinadigan ishlar (`sudo`, parol, OAuth) | a) agent buyruqni beradi, egasi o'zi kiritadi; b) agentga parol beriladi | a | `code=yes` yoki `live-system=yes` |
| S24 | Pan-harness'ning standart qoidalari: agent vositasining ruxsat tizimini chetlab o'tmaslik, obyektiv baho, qaror egasi ko'rmagan narsaga bog'liq bo'lsa avval ko'rsatish, egasining tahrirlari ustunligi | a) hammasi; b) tanlab | a | |

## Standard choices: the harness itself

| # | Choice | Options | Standard | Condition |
|---|---|---|---|---|
| S18 | Start set'ning hajm limit'i | a) 24 KB; b) 20 KB; c) boshqa | git'da ~50 dan kam fayl bo'lsa b, aks holda a | |
| S19 | `ph-doctor` qanchalik tez-tez ishga tushiriladi va kim eslatadi | a) oyda bir, eslatma (kalendar, cron yoki agent tizimi); b) faqat egasi aytganda; c) hajm ogohlantirishida | a; eslatmani sozlashni hisobotda taklif qil | |
| S20 | `ph-doctor` dagi mechanical fix'lar | a) qoidada belgilangan mechanical fix darhol, structural o'zgarish reja bilan; b) hammasi reja bilan | a | |
| S21 | Structure savolida tadqiqot | a) variantdan oldin internetdagi amaliyot o'rganiladi, manbalar bilan; b) agentning o'z bilimi yetadi | a | |
| S25 | Faqat o'qiydigan status script (`project/scripts/status-check.sh` kabi) yaratilsinmi | a) ha; b) yo'q, status qo'lda tekshiriladi | a | `live-system=yes` |
| S22 | Loyihada boshqa maqsadli `AGENTS.md` lar bormi (ilovaning o'z agentlari, hujjatlar) | Repo'dan topiladi, borligi rejada aytiladi | Ildizdagi qoidada "ular tahrir obyekti" | Bunday fayl bo'lsa |
| S23 | Mavjud `CLAUDE.md` | Repo'dan topiladi | `CLAUDE.md` faqat `@AGENTS.md` importi bilan qoladi, mazmuni pan-harness'ga move qilinadi | `CLAUDE.md` bo'lsa |
