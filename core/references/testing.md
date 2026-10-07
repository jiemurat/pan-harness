# Testing the harness

Harness'ni faqat repo'ni ko'rgan yangi agent sinaydi: u yozgan agent ko'rmagan bo'shliqlarni topadi (P18, P25). Har sinov token sarflaydi, shuning uchun uni o'tkazish va qaysi model bilan o'tkazishni har safar egasi hal qiladi.

## Contents
- When to test
- How to run a test agent
- Fixed question set
- Resume test
- Independent checker
- Simplification experiment
- Start set check without tokens (A51)
- Recording results

## When to test

Egasiga variant va tavsiya ber, tavsiyani vaziyatga qarab tuz:
- **o'zgarish turi:** yangi harness yoki structural o'zgarishdan keyin — doimiy to'plam, o'zgarishdan oldin va keyin bir xil; faqat mechanical fix'dan keyin odatda shart emas;
- **uzun large task** (bir sessiyadan oshadigan) — "o'rtasidan davom ettirish" sinovi;
- **subyektiv natija** (matn, hujjat, harness'ning o'zi, dizayn) — mustaqil tekshiruvchi;
- **`ph-doctor`** — vaqti-vaqti bilan soddalashtirish tajribasi;
- **oxirgi sinov qachon bo'lgani** (tarixdan) va **egasining doimiy javobi** (`playbooks/pan-harness.md` → `Fresh-agent test`);
- **token taxmini:** start set va o'qiladigan fayllar hajmidan. Mo'ljal: kichik model bilan 5 savol ~90 ming token, kuchli model bilan 7 savol ~200 ming token, mustaqil tekshiruvchi ~100 ming token.

Egasi doimiy javob bersa (masalan, "faqat kichik model bilan"), uni `playbooks/pan-harness.md` → `Fresh-agent test` ga yoz. Keyingi safar u tavsiyaga ta'sir qiladi, lekin baribir so'raladi.

## How to run a test agent

- Claude Code'da — sub-agent, modeli tanlanadi (strong model yoki small model). Boshqa vositada savollar faylini tayyorla, sinovni egasi yangi sessiyada o'zi ishga tushiradi.
- Sinov agentiga yoz: faylni o'zgartirma, live system buyruqlarini ishlatma, external side effect qilma, sir fayllarini ochma, fayllarni diskdan o'qi (sessiya davomida `AGENTS.md` o'zgargan bo'lsa, vosita avtomatik yuklagan matn eski bo'lishi mumkin).
- Sinovlarni bittadan yoki ikkitadan ishga tushir: ko'p parallel agent sessiya limitiga urilishi mumkin.

## Fixed question set

Savollar loyihaning `playbooks/pan-harness.md` → `## Test questions` da saqlanadi va har safar bir xil beriladi, aks holda natijalarni solishtirib bo'lmaydi. 5 ta universal savol (har qanday loyihada):
1. Bu loyiha nima va kim uchun?
2. U qanday tuzilgan: asosiy qismlari qayerda?
3. Natija qanday yaratiladi yoki ishga tushiriladi (build, eksport, deploy)?
4. U qanday tekshiriladi (test, lint, korrektura, faktlar)?
5. Hozirgi holat qanday, qaysi ish ochiq?

Keyin 4–6 ta loyihaga xos savol: ishni qaysi fayllardan boshlaydi, o'tgan ishni qanday topadi, ish oxirida nima qiladi, loyihaning eng xavfli amalida nima qiladi. Oxirida: "Harness'da siz aniq tushunmagan yoki sizni taxmin qilishga majbur qilgan gap bormi? Har biri uchun fayl:qator va nimasi noaniq."

Har javobni `to'g'ri`, `qisman` yoki `noto'g'ri` deb bahola. Kontekst sarfini (discovery cost) vosita beradigan raqam bilan o'lcha: token va tool chaqiruvlari soni. Agentning o'zi aytgan o'qilgan KB ishonchsiz, uni faqat qaysi fayllar o'qilganini bilish uchun ishlat. Tuzilma (structure) o'zgarishidan oldin va keyin bir xil to'plam bir xil model bilan beriladi: keyingisi oldingisidan yomon bo'lmasligi kerak. Qisqa fayl ham yaxshilanish kafolati emas (`principles.md` → Sources, [18]).

## Resume test

Large task o'rtasida (yoki ataylab to'xtatilgan nusxasida) yangi agentga faqat repo beriladi, `handoff.md` da `**Status:** active`. Savollar:
- Ish qayerda to'xtagan va keyingi qadam nima, nega?
- Qaysi o'zgargan fayllar agentning chala ishi, qaysilari egasiniki?
- Qaysi kriteriya bajarilgan, qaysisi yo'q, dalili nima?

Javob `Next step` va `Changed files` ga mos bo'lsa, sinov o'tgan. Noaniqlik chiqsa, `handoff.md` yozuvini yoki shablonni tuzat (P24).

## Independent checker

Large task oxirida, egasining roziligi bilan. Ishni qilgan agent o'z ishini yuqori baholaydi, shuning uchun tekshiruvchi alohida va yangi kontekstda ishlaydi (P25):
- unga repo, o'zgarishlar (`git diff` va `handoff.md` → `Changed files`) va rejadagi kriteriyalar beriladi, subyektiv kriteriya bo'lsa — rejadagi shkala ham;
- ko'rsatma: "Kriteriyalarga mos kelmaydigan joyni qidiring, injiq bo'ling. Har topilma dalil bilan (fayl:qator), dalilsiz fikr yozmang.";
- **skeptik rejimi** (topilmalar ro'yxati uchun, masalan `ph-doctor` yoki audit natijasi): har topilma boshqa mustaqil agentga beriladi, u topilmani rad etishga urinadi; tasdiqlanmagan topilma egasiga berilmaydi;
- tekshiruvchi va ishni qilgan agent kelishmasa, agent ikkala fikrni dalil bilan ko'rsatadi, qarorni egasi qiladi.

Hujjat loyihasida tekshiruvchi matnni kriteriyalar, uslub qo'llanmasi va faktlar bo'yicha ko'radi; kod loyihasida diff, testlar va o'zgarmas shartlar (invariant) bo'yicha.

## Simplification experiment

`ph-doctor` da, ixtiyoriy, egasining roziligi bilan. Har harness qoidasi model biror narsani ishonchli qila olmagani uchun qo'shilgan; model kuchaygan sari ba'zisi ortiqcha bo'ladi (`principles.md` → Sources, [28]):
1. Modelning zaifligini to'ldiradigan bitta qoida yoki komponentni tanla (vaqtinchalik qoidaning `Remove when:` sharti shunga yordam beradi).
2. Uni loyiha nusxasida vaqtincha olib tashla.
3. Doimiy to'plamni eng kichik qo'llab-quvvatlanadigan model bilan ishga tushir: harness kichik model bilan ham ishlashi kerak (P18).
4. Natija yomonlashmasa, olib tashlashni structural taklif qil; yomonlashsa, qoldir yoki yengilrog'iga almashtir.

## Start set check without tokens (A51)

5 ta universal savolning har biri uchun start set qayerda javob berishini yoki qaysi faylga olib borishini top (fayl → bo'lim). Javobsiz savol — xaritadagi bo'shliq: tegishli faylga yoki xaritaga yoz (P22). Bu tekshiruv sinov agentisiz, `ph-init` va `ph-doctor` da bajariladi.

## Recording results

Tarix yozuvining `Checks:` maydoniga yoz: qaysi sinov, model, token va tool chaqiruvlari, har savol bahosi, noaniq joylar, nima tuzatildi. Byudjetni oldindan ayt: mustaqil tekshiruvchi katta diff'da kutilganidan ko'p sarflaydi (yuz minglab token), shuning uchun unga ko'rib chiqiladigan fayllarni va topilmalar sonini chekla. Doimiy to'plamning oxirgi natijasini `playbooks/pan-harness.md` → `## Test questions` dagi "Oxirgi natijalar" qatoriga ham yoz: keyingi sinov u bilan solishtiriladi.
