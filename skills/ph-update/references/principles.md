# Principles

Pan-harness shu tamoyillarga tayanadi. Har biri: qoida, nega (manba), pan-harness'da qanday qo'llanadi. Manbalar oxirida, raqam bilan. Structure yoki qoida haqidagi qarordan oldin shu faylni o'qi. Tamoyillarni skill muallifi yangilaydi: skill'ni ishlatgan agent faylni faqat o'qiydi.

## Contents
- Context and size: P1–P5
- Writing knowledge: P6–P9
- Memory and history: P10–P12
- What to write: P13–P14
- Upkeep: P15–P16
- Agents and models: P17–P18
- Decisions: P19–P20
- Planning and verification: P21
- Continuity and checks: P22–P25
- Writing for agents: P26

## Context and size

- **P1. Always-loaded layer kichik bo'ladi.** Kontekst o'sgani sari model aniqligi pasayadi (Chroma 18 ta modelda o'lchagan [3]). Anthropic kontekstga "eng kichik, lekin eng foydali tokenlar to'plami" kiritishni tavsiya qiladi [1]. Augment o'lchovida 100–150 qatorli `AGENTS.md` eng yaxshi natija bergan, 30 dan ortiq "qilma" qoidasi esa ishni sekinlashtirgan [4]. Claude Code `CLAUDE.md` uchun 200 qatordan kam hajmni tavsiya qiladi [5], Codex 32 KiB dan keyingi qismini kesib tashlaydi [6]. Pan-harness'da: sessiya boshida start set (4 ta fayl) o'qiladi, jami hajm limit'i `structure.md` da.
- **P2. Har qatorga "buni olib tashlasam, agent xato qiladimi?" deb savol beriladi** [5]. Javob "yo'q" bo'lsa, qator olib tashlanadi yoki kerak bo'lganda o'qiladigan faylga move qilinadi. Har ko'rsatma o'z o'rnini vaqti-vaqti bilan qayta oqlashi kerak [22].
- **P3. Qolgani kerak bo'lganda o'qiladi (progressive disclosure).** `AGENTS.md` havola bergan faylni agent kerak bo'lganda ~90% sessiyada o'qiydi, havolasiz hujjatni esa 10% dan kam [4]. Xaritada har fayl yonida "nima bor" va "qachon o'qiladi" turadi. Tavsifda fayl javob beradigan savollarning kalit so'zlari bo'ladi, chunki kichik model faqat ko'ringan so'zga ergashadi. Havolalar bir pog'ona chuqur: ichma-ich havola qilingan faylni agent qisman o'qiydi [7].
- **P4. Har fakt bitta joyda yuritiladi.** Boshqa fayllar unga havola beradi. Nusxa eskiradi va ikki joyda ikki xil bo'lib qoladi (Conflicting Instructions [8]). Kod yoki konfiguratsiyadan nusxa o'rniga fayl yo'li va kalit nomi yoziladi [6].
- **P5. Joriy state va tarix alohida.** Joriy fayllarda (`state.md`, `plan.md`, xarita) faqat hozirgi state turadi. O'tgan ishlar jurnalga yoziladi va faqat qidiriladi. Bir loyihada shu usulga o'tilganda sessiya boshida o'qiladigan hajm 241 ming tokendan 5 mingga tushgan [4]. Anthropic'ning uzoq ishlaydigan agentlarida ham yangi sessiya ishni progress fayl va git tarixidan o'qib boshlaydi [2].

## Writing knowledge

- **P6. Qarorlar ADR uslubida yoziladi.** Har qaror yagona raqam oladi va keyin tahrirlanmaydi. Qaror o'zgarsa, yangi yozuv eskisining o'rnini egallaydi, eskisi superseded belgisi bilan arxivga o'tadi [9]. Har qarorda `Where:` maydoni bo'ladi: qaror qaysi fayl yoki sozlamada amalga oshgani. GitHub Copilot xotirani kodning aniq joyiga havola bilan saqlaydi va ishlatishdan oldin o'sha joyni tekshiradi [10]. Agent ham qarorga tayanishdan oldin `Where:` ni tekshiradi.
- **P7. Boundaries uch toifada yoziladi: Never / Ask first / Always.** GitHub 2500 dan ortiq repo'dagi agent fayllarini tahlil qilib, eng foydali bo'limlardan biri shu ekanini topgan [11]. Qoidalarning o'zi pastda, raqami va manbasi bilan turadi. `Boundaries` bloki `AGENTS.md` ning boshida, alohida bo'lim bo'lib turadi: model uzun matnning o'rtasidagi gapni boshi va oxiridagidan kamroq hisobga oladi ("Lost in the Middle", [28] → L04). Zarar keltirishi mumkin bo'lgan har qoida (uzilish, ma'lumot yo'qolishi, sir, tashqi ta'sir, qaytarib bo'lmaydigan amal) blokda bo'ladi: qaysi qoida qat'iy, qaysisi tavsiya ekani bir qarashda ko'rinadi [28].
- **P8. Takrorlanadigan ish uchun bosqichma-bosqich playbook yoziladi.** Qadamlar va qaror jadvallari aniqlikni ~25% oshirgan [4]. Anthropic murakkab ishni checklist va "validate → fix → repeat" sikli bilan qilishni tavsiya qiladi [7]. Bir xil turdagi ish ikkinchi marta qilinganda playbook yoziladi.
- **P9. Soha qoidasi o'z sohasining playbook'ida turadi.** Doim yuklanadigan faylda faqat hamma ishga tegishli qoida qoladi. Qolgani o'sha soha ishida o'qiladigan playbook boshiga raqami bilan move qilinadi. Kam ishlatiladigan narsa doim yuklanadigan faylga qo'shilsa, bu Skill Leakage xatosi [8]. Qaysi qoida qolishini SNR jadvali ko'rsatadi: 5 ta odatiy ish turi (tarixdagi ishlardan) va har qoida uchun "kerak" yoki "kerak emas"; ko'p ish turida kerak bo'lmagan va `Boundaries` ga kirmaydigan qoida playbook'ga move qilinadi. Har xatodan keyin `AGENTS.md` ga yangi qoida qo'shish fayl shishishining asosiy sababi, shuning uchun yangi qoida avval soha playbook'iga yoziladi [28].

## Memory and history

- **P10. Hech narsa yo'qolmaydi (lossless).** Eski qism o'chirilmaydi, qidiriladigan qatlamga o'tadi. Xulosa asliga havola beradi, yangi qism asl holida qoladi. LCM va uning OpenClaw plugin'i lossless-claw shunday ishlaydi: "Nothing is lost. Raw messages stay in the database" [12][13]. Letta'da kontekstdan chiqqan ma'lumot qidiriladigan arxiv xotirasida turadi [14]. OpenClaw'ning o'z xotirasida ham kunlik qaydlar qidiruvga indekslanadi, lekin har safar promptga kiritilmaydi [15]. Pan-harness'da: arxiv butun o'qilmaydi, lekin jurnalda topilmagan narsa arxivdan grep bilan qidiriladi.
- **P11. Epizodik tarix davr bo'yicha fayllarda turadi.** Har oy o'z faylida, har yozuv o'z oyining faylida to'liq qoladi. Bunday fayl butun o'qilmaydi, shuning uchun hajmi tokenga ta'sir qilmaydi. Shunga o'xshash usullar: OpenClaw'ning `memory/YYYY-MM-DD.md` qaydlari [15], Node.js'ning har versiya uchun alohida changelog fayli [16].
- **P12. Ortiqcha siqish qimmatga tushadi.** Agent unutgan narsasini qayta qidiradi va boshi berk yo'llarni qayta sinaydi. Shuning uchun o'lchov tokens per request emas, tokens per task [17]. Eng ko'p yo'qoladigani fayl yo'llari va qaror sabablari, aniq bo'limli shakl ularni saqlab qoladi [17]. Jurnal yozuvlarining shakli shuning uchun qat'iy.

## What to write

- **P13. Faqat repo'dan topib bo'lmaydigan bilim yoziladi.** ETH Zurich tadqiqotida (2026) LLM yozgan kontekst fayllari 8 ta vaziyatdan 5 tasida natijani pasaytirgan va xarajatni 20–23% oshirgan. Odam yozgani natijani 4% oshirgan, lekin xarajatni ham 19% oshirgan. Asosiy sabab: repo'da bor ma'lumotni takrorlash [18]. Harness'ga egasining qarorlari, ish uslubi, xavfli joylar, tekshirilgan faktlar va saboqlar yoziladi. Kod, papka va fayllar structure'i, README mazmuni va buyruqlar ro'yxatiga havola beriladi. Qisqa yo'nalish ko'rsatkichi bundan mustasno: repo xaritasi qayerga qarashni aytadi, mazmunni takrorlamaydi.
- **P14. Agent fayllarining (`AGENTS.md`, `CLAUDE.md` va shunga o'xshash agent fayllari) 6 ta tipik xatosi bor** (configuration smells [8]): Lint Leakage (linter allaqachon tekshiradigan qoida, fayllarning 62% ida), Context Bloat (ortiqcha batafsil, 42%), Skill Leakage (kam kerak bo'ladigan narsa doim yuklanadi, 35%), Conflicting Instructions (zid ko'rsatmalar), Init Fossilization (loyiha boshidagi, endi eskirgan narsa), Blind References (qachon kerakligi aytilmagan havola). Ularni topish usuli: `audit.md` (`Smell` ustuni).

## Upkeep

- **P15. Harness muntazam tartiblanadi.** Eskirgan narsa olib tashlanadi, takror birlashtiriladi, muhimi doimiy qatlamga o'tadi. Claude Code'ning Auto Dream'i [19], OpenClaw'ning dreaming'i [15] va OpenAI'ning doc-gardening agenti [6] aynan shuni qiladi. Claude Code'ning `/doctor prompt-audit` buyrug'i agent fayllarini eskirgan va zid ko'rsatmalar, yo'q fayl va buyruqlarga havolalar bo'yicha tekshiradi [5]. Amaliyotchilar agent fayllarini har bir necha haftada audit qilishni tavsiya qiladi [22]. Pan-harness'da bu `ph-doctor`, odatda oyda bir marta. Hajm ogohlantirishi chiqsa, o'sha ishning o'zida tartiblanadi.
- **P16. Takrorlangan xato qoidaga aylanadi.** Claude Code qo'llanmasi agent fayliga qoida qo'shishni aynan shunday vaziyatda tavsiya qiladi: agent bir xatoni ikkinchi marta qilganda yoki egasi o'tgan sessiyadagi tuzatishni qayta yozishiga to'g'ri kelganda [5]. Saboq birinchi marta jurnalga yoziladi, ikkinchi marta takrorlansa, qoida yoki playbook qadamiga aylanadi. Mexanik tekshirsa bo'ladigan qoida uchinchi pog'onada check'ga aylanadi (P23).

## Agents and models

- **P17. Hammasi har qanday agent o'qiy oladigan oddiy matnda.** `AGENTS.md` — ochiq standart, uni ko'p vositalar o'zi yuklaydi [21]. Biror vositaning o'z fayli, xotirasi yoki sozlamasiga tayanilmaydi. Claude Code loyihada `CLAUDE.md` bo'lsa, `AGENTS.md` ni o'qimaydi, ichki papkadagi `AGENTS.md` ni esa u yerdagi fayl o'qilganda yuklaydi [5]. Shuning uchun `CLAUDE.md` faqat `@AGENTS.md` importi bilan qoladi, skill va shablonlarda `AGENTS.md` nomli fayl bo'lmaydi.
- **P18. Harness yangi agent bilan sinaladi, kichik model bilan ham.** Anthropic skill'ni hamma ishlatiladigan model bilan sinashni tavsiya qiladi: kuchli modelga ishlagan narsa kichik modelga yetmasligi mumkin [7]. Sinovda agentdan "nima noaniq bo'ldi?" deb ham so'raladi: bu savol yozuvchi ko'rmagan bo'shliqlarni ochadi. Sinov token sarflaydi, shuning uchun uni o'tkazish va qaysi model bilan o'tkazishni egasi hal qiladi. Tartiblari `testing.md` da: doimiy savollar to'plami structure o'zgarishidan oldin va keyin bir xil beriladi, aks holda natijalarni solishtirib bo'lmaydi; qisqa fayl ham yaxshilanish kafolati emas, ko'rsatmani o'zi xizmat qiladigan vazifada sinash kerak [18], [28].

## Decisions

- **P19. Structure bo'yicha variant tamoyilga asoslanadi.** Har variantda u qaysi tamoyilga tayanishi aytiladi. Internetdagi yangi amaliyot loyihaning o'z qoidasi (style-questions S21) yoki egasining so'rovi bo'yicha o'rganiladi, variantlar shunda manbalar bilan beriladi. Bu pan-harness tanlovi, tashqi manbasi yo'q.
- **P20. Faktni agent topadi, qarorni egasi qiladi.** Repo, hujjat va live system'dan topiladigan narsa egasidan so'ralmaydi. Har savolda variantlar va agentning sababli tavsiyasi bo'ladi. Bu pan-harness tanlovi, tashqi manbasi yo'q.

## Planning and verification

- **P21. Reja maqsad, natija va kriteriyalardan boshlanadi, natija dalil bilan tekshiriladi.** OpenAI'ning uzoq ishlar uchun reja shakli (ExecPlan) maqsaddan boshlanadi va acceptance shartini ichki xossa emas, odam tekshira oladigan natija qilib yozadi; ish oxirida natija maqsad bilan solishtiriladi [23]. GitHub Spec Kit'da success criteria majburiy: o'lchanadigan, foydalanuvchi ko'radigan va tekshiriladigan [25]. Anthropic kriteriya aniq, o'lchanadigan, erishiladigan va maqsadga tegishli bo'lishini tavsiya qiladi [26]. Agent sinamasdan ishni "tayyor" deb belgilashga moyil, shuning uchun unga pass/fail beradigan check beriladi va u "tugadi" deyish o'rniga dalil ko'rsatadi [2], [24]. Scrum'da ish Definition of Done ga yetgandagina tayyor deb ko'rsatiladi [27]. Pan-harness'da: large task rejasining birinchi savoli — maqsad, natija (egasi oxirida nimaga ega bo'lishi) va 1–5 ta kriteriya loyihasi, egasi uni tasdiqlaydi yoki tuzatadi. Har kriteriya egasi ko'radigan natija: nima kuzatiladi, threshold (raqam yoki ha/yo'q), qanday va qachon tekshiriladi. Kriteriyaga faqat shu ishning natijasi yoziladi, har ishdagi doimiy check'lar Execution'da. Yakuniy reja kriteriyalarning oxirgi ro'yxatini beradi. Tasdiqdan keyin ular `plan.md` dagi ish bandiga yoziladi: kontekst siqilsa yoki yangi sessiya ochilsa, yo'qolmaydi. Ish oxirida har kriteriya ✅ (dalil bilan), ❌ yoki ⏳ (qachon tekshiriladi, `plan.md` → `Later and watch`) bilan hisobotga va tarix yozuvining `Checks:` maydoniga yoziladi. Kriteriyani faqat egasi o'zgartiradi, ❌ bor ish tugadi deyilmaydi.
  - **Istisnolar va byudjet.** Yakuniy rejada nima qilinmasligi va byudjet (vaqt, token yoki sub-agentlar soni, pullik API xarajati) aytiladi; byudjet ikki barobar oshsa, agent to'xtab so'raydi [28]. Bir sessiyaga sig'maydigan ish bosqichlarga bo'linadi, har bosqich o'z check'i va hisoboti bilan tugaydi [28].
  - **Dalil.** Iloji bo'lsa qayta ishga tushiriladi: buyruq, skript, takrorlanadigan sinov. "Yaxshi ko'rinadi" dalil emas [28].
  - **Baholash.** Subyektiv natijada 2–4 darajali rubric va kim baholashi aytiladi. Raqamli kriteriyada anchor bo'ladi: raqam o'sib, asl maqsad yomonlashishi mumkin (Goodhart), anchor — egasining tanlab ko'rishi, haqiqiy ishlatish yoki ground truth. Agent yoki LLM baholovchi avval kichik namunada egasining bahosi bilan solishtiriladi [28].
  - **Egasining e'tibori.** Egasining ko'rigi yagona ketma-ket resurs: savollar ta'siri bo'yicha tartiblanadi, past ta'sirlilari bitta "tavsiya bo'yicha qabul qilinsinmi?" ro'yxatiga jamlanadi; hisobotda har o'zgargan komponent uchun bir qator beriladi (nima o'zgardi, kimga ta'sir, kutilgan xarajat va sifat, qanday o'chiriladi) [28].

## Continuity and checks

- **P22. Bo'sh joy ish davomida yoziladi.** Repo'da yo'q bilim agent uchun yo'q, xaritada ko'rinmagani esa topish uchun kontekst sarflatadi va har yangi sessiyada agentni qayta qidirishga yoki assumption'ga majbur qiladi [28]. Shuning uchun agent ish oxirida topa olmagan, uzoq qidirgan yoki assumption bilan to'ldirgan faktini tegishli faylga yoki xaritaga kalit so'z bilan yozadi (P3, P13 doirasida). Saboq (L) faqat xato bo'lganda yoziladi, bo'sh joy esa xatosiz ham: har oddiy ish bepul fresh-agent test bo'ladi. Bu pan-harness tanlovi, g'oyasi [28] dan.
- **P23. Matnni e'tiborsiz qoldirish mumkin, check'ni emas.** Hujjat odam uchun, check tizim uchun [28]. OpenAI arxitektura qoidalarini linter va CI bilan majburlaydi, xato xabari agentga tuzatish yo'lini aytadi [6]. Pan-harness'da zarari katta va mexanik tekshirsa bo'ladigan qoida skript, test yoki git hook'ga aylanadi, matni havolagacha qisqaradi (A6 ning teskarisi: linter tekshiradigan qoida matnda takrorlanmaydi). Har xabar uch narsani aytadi: nima noto'g'ri, nega muhim, qanday tuzatiladi. Kuzatiladigan fayl o'zgarib, uni tasvirlaydigan hujjat o'zgarmasa, skript eslatadi (`co_change`): hujjat eskirishi hujjat yo'qligidan xavfliroq [28].
- **P24. Faol ish state'i faylda turadi.** Kontekst cheklangan: compaction "nima" ni saqlab, "nega" ni yo'qotadi; yangi sessiya oldingi tahlilni bilmay boshqa yo'l tanlashi, ishni takrorlashi yoki maqsaddan siljishi mumkin [28]. Anthropic'ning uzoq ishlaydigan agentlari progress fayli va git tarixidan davom etadi [2], OpenAI ExecPlan'da progress va qarorlar jurnali bor [23]. Pan-harness'da large task state'i `handoff.md` da: qadamlar (bir vaqtda bittasi faol, WIP=1), o'zgargan fayllar, check'lar, qarorlar sababi bilan, keyingi qadam. Agent uni har status xabarida yangilaydi, kontekst tugashiga yaqin ham check'larni to'liq o'tkazadi (model shu paytda shoshilib tugatishga moyil [28]). Agent har bosqich oxirida commit qilsa (S11 a), commit nazorat nuqtasi bo'ladi, bosqich ichidagi state'ni esa shu fayl saqlaydi. Commit faqat egasi so'raganda qilinsa (S11 b), ish o'rtasidagi state'ni faqat shu fayl saqlaydi. Ikkala vaziyatda uning "o'zgargan fayllar" ro'yxati egasining tahrirlarini agentning ishidan ajratadi: egasiniki agentning commit'iga kirmaydi.
- **P25. Ishni qilgan agent uni yolg'iz baholamaydi.** Model o'z ishini muntazam yuqori baholaydi, ayniqsa subyektiv ishda; yechim — atayin kamchilik qidiradigan alohida tekshiruvchi, topilmalarni esa mustaqil skeptik rad etishga urinadi [28]. Tekshiruvchi bilan kelishmovchilikni egasi hal qiladi. Pan-harness'da bu `testing.md` dagi ixtiyoriy sinov: token sarflaydi, egasining roziligi bilan o'tkaziladi, hujjat va harness kabi subyektiv natijada foydasi katta.

## Writing for agents

- **P26. Harness matni agentga har safar bir xil jarayon beradi.** Agent o'qiydigan hujjat (skill, `AGENTS.md`, havola orqali o'qiladigan fayl) bir xil yozish dastaklari bilan barqaror bo'ladi [29]:
  - **Context pointer.** Kontekstdagi havola qatori material nima ekanini va qachon o'qilishini aytadi. Materialga qachon va qanchalik ishonchli yetib borishni havolaning matni hal qiladi: kalit so'z boshida, har vaziyatga bitta trigger.
  - **Progressive disclosure va co-location.** Har vaziyatga keragi faylning o'zida, faqat ba'zi vaziyatga keragi havola ortida turadi (P3, P9). Bir tushunchaning ta'rifi, qoidasi va istisnosi bir sarlavha ostida: bir qismini o'qigan agent qolganini ham ko'radi.
  - **Completion criterion.** Har qadam aniq va talabchan shart bilan tugaydi. Aniq shart tugaganini tekshirishga imkon beradi, talabchan shart ("har D tekshirildi") ishni to'liq qildiradi. Noaniq shart agentni keyingi qadamga shoshiltiradi.
  - **Positive form.** Taqiq taqiqlangan ishni eslatib, uni kuchaytiradi. Anthropic ham nima qilmaslik o'rniga nima qilishni aytishni tavsiya qiladi [30]. Taqiq faqat qat'iy qoida uchun qoladi, yonida nima qilish kerakligi bilan.
  - **Leading word.** Modelga tanish bitta atama uch gaplik tushuntirish o'rnini bosadi va har joyda bir xil shaklda takrorlanadi. Bir so'z bir necha tushunchani bildiradigan tilda (o'zbekchada "ko'chirish": copy, move, migration) inglizcha atamaning o'zi yoziladi.
  - **Single source.** Har ma'no bitta joyda (P4). Repo, config va `--help` dagi narsaga havola beriladi, nusxa faqat qidirish qimmat bo'lgan narsa uchun qoladi (P13).
  - **Manba.** Har fakt manbasi bilan yoziladi: egasining xabari, repo yoki buyruq natijasi. Harness'ga tushgan to'qilgan gapni keyingi sessiya tekshirmay fakt deb oladi, kichik model esa yozganda yetishmagan faktni to'ldirib yuborishga moyil.
  - **No-op.** Model shusiz ham qiladigan ishni aytgan gap butunlay o'chiriladi. Gap no-op ekanini bahs emas, sinov ko'rsatadi (`testing.md` → "Simplification experiment").

  Pan-harness'da qoidalar `structure.md` → "Writing" da, loyihada `runbook.md` → `Writing the harness` da va har faylning boshidagi yozuv shaklida turadi; `ph-doctor` ularni yangi matnda tekshiradi (`audit.md` → "Writing"). Shablon va skill matnlari ham shu qoidalar bilan yoziladi, chunki agent yangi matnni atrofdagi matndan namuna olib yozadi: prompt shakli javob shakliga ta'sir qiladi [30]. Tamoyil agent o'qiydigan harness matni uchun; README, hisobot va commit xabari inson uchun yoziladi.

## Sources

1. Anthropic, "Effective context engineering for AI agents": https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
2. Anthropic, "Effective harnesses for long-running agents": https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
3. Chroma, "Context Rot": https://www.trychroma.com/research/context-rot
4. Augment Code, "A good AGENTS.md is a model upgrade": https://www.augmentcode.com/blog/how-to-write-good-agents-dot-md-files
5. Claude Code, "How Claude remembers your project": https://code.claude.com/docs/en/memory
6. OpenAI, "Harness engineering: leveraging Codex in an agent-first world": https://openai.com/index/harness-engineering/
7. Anthropic, "Skill authoring best practices": https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
8. "Configuration Smells in AGENTS.md Files": https://arxiv.org/html/2606.15828v2
9. Architecture Decision Records: https://adr.github.io/
10. GitHub Copilot agentic memory (xotira kod havolasi bilan saqlanadi va tekshiriladi)
11. GitHub Blog, "How to write a great agents.md: lessons from over 2,500 repositories": https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/
12. "LCM: Lossless Context Management": https://arxiv.org/abs/2605.04050
13. lossless-claw: https://github.com/martian-engineering/lossless-claw
14. Letta, "Agent Memory": https://www.letta.com/blog/agent-memory/
15. OpenClaw, "Memory overview" va "Dreaming": https://docs.openclaw.ai/concepts/memory, https://docs.openclaw.ai/concepts/dreaming
16. Node.js changelog'lari: https://github.com/nodejs/node/tree/main/doc/changelogs
17. Factory, "Evaluating Context Compression for AI Agents": https://factory.com/news/evaluating-compression
18. ETH Zurich, "Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?": https://www.sri.inf.ethz.ch/publications/gloaguen2026agentsmd
19. Claude Code Auto Dream: https://claudefa.st/blog/guide/mechanics/auto-dream
20. Anthropic, Memory tool: https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool
21. AGENTS.md: https://agents.md/
22. Addy Osmani, "Audit your Agent files": https://addyosmani.com/blog/audit-your-agent-files/
23. OpenAI Cookbook, "Using PLANS.md for multi-hour problem solving" (ExecPlan): https://github.com/openai/openai-cookbook/blob/main/articles/codex_exec_plans.md
24. Claude Code, "Best practices for Claude Code": https://code.claude.com/docs/en/best-practices
25. GitHub Spec Kit, spec shabloni va `/specify` buyrug'i: https://github.com/github/spec-kit/blob/main/templates/spec-template.md
26. Anthropic, "Define success criteria": https://platform.claude.com/docs/en/test-and-evaluate/define-success
27. The Scrum Guide (2020), "Definition of Done": https://scrumguides.org/scrum-guide.html
28. walkinglabs, "Learn Harness Engineering", ma'ruzalar L03–L05, L07–L14 (2026): https://walkinglabs.github.io/learn-harness-engineering/en/lectures/ (masalan, `lecture-04-why-one-giant-instruction-file-fails/`). Ma'ruzalarning raqamli misollari o'qitish uchun estimate; ular tayangan manbalar: [2], [6], [18], Liu va boshq. "Lost in the Middle" (2023), Anthropic "Harness design for long-running application development".
29. Matt Pocock, "writing-for-agents" skill (MIT): https://github.com/mattpocock/skills/tree/main/skills/productivity/writing-for-agents
30. Anthropic, "Prompting best practices": https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
