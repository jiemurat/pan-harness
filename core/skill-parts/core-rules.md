## Core rules

Skill bilan ishlaganda bu qoidalar maqsadli loyihaning qoidalaridan oldin ham amal qiladi:

1. **Faktni o'zing top, qarorni egasi qiladi.** Repo, hujjat va live system'dan topish mumkin bo'lgan narsa so'ralmaydi. Egasidan faqat qaror va repo'da yo'q bilim so'raladi.
2. **Faqat topib bo'lmaydigan narsani yoz.** Repo'da bor ma'lumotni (README, kod va papka tuzilishi, buyruqlar ro'yxati) harness'ga ko'chirma (copy), unga havola ber. Takror ma'lumot agentni chalg'itadi va xarajatni oshiradi (`references/principles.md`, P13).
3. **Har da'voni tekshir.** Hujjat, README va eski hisobotdagi fakt tekshirilmaguncha `unverified` hisoblanadi. Hisobotda `verified` va `unverified` ni ajratib yoz.
4. **Sir qiymatini hech qachon o'qima va ekranga chiqarma.** `.env`, `secrets.*`, kalit va token fayllarini ochma: faqat fayl va o'zgaruvchi nomini yoz. Shaxsiy ma'lumot va maxfiy hujjatlarning mazmunini ham harness'ga ko'chirma (copy).
5. **Katta o'zgarish reja bilan.** Tuzilma, qoida yoki ma'noni o'zgartiradigan ishni avval reja bilan ber va egasining aniq tasdig'igacha (approval) faqat o'qi. Reja maqsad, natija va kriteriyalardan (acceptance criteria) boshlanadi, yakuniy rejada istisnolar, byudjet va (bir sessiyaga sig'masa) bosqichlar bo'ladi; tasdiqdan keyin ish holati `pan-harness/handoff.md` da yuritiladi, ish oxirida har kriteriya dalil bilan tekshiriladi (`references/principles.md`, P21, P24). Qoidada belgilangan mechanical fix darhol qilinadi (`references/doctor.md`).
6. **Variantni tamoyilga asosla.** Tuzilish bo'yicha variant berishdan oldin `references/principles.md` ni o'qi va har variant qaysi tamoyilga tayanishini ayt. Internetdagi yangi amaliyotni loyihaning qoidasi yoki egasining so'rovi bo'yicha o'rgan.
7. **Hajmni o'lcha, taxmin (estimate) qilma.** `wc -c` bilan sana. Start set chegarasi (limit) `references/structure.md` da.
8. **Kichik model ham tushunadigan qilib yoz.** Buyruq shakli, bajaruvchi aniq, bitta bandda bitta fikr (`references/structure.md` → "Writing").
9. **Egasining uslubini taxmin (assumption) qilma.** Til, atamalar, murojaat, ruxsat va commit tartibi (S11, standart javob — agent o'zi commit qiladi) `references/style-questions.md` bo'yicha so'raladi va loyihaning harness'iga yoziladi.
10. **Egasining tahrirlari ustun.** Egasi o'zgartirgan matnni qaytarma. Unda yangi ko'rsatma ko'rinsa, loyihaning `feedback.md` iga yoz.
11. **Irreversible action faqat ruxsat bilan.** Fayl o'chirish va tarixni qayta yozish egasi aniq aytmaguncha qilinmaydi. Push'ni egasi qiladi: agent push qilmaydi va bu haqda so'ramaydi. Commit loyihaning R4 qoidasi bo'yicha qilinadi, `ph-init` da esa S11 javobiga ko'ra.
12. **Git doim bor.** Pan-harness git'da ishlaydi: tarix, nazorat nuqtalari va egasining hamda agentning o'zgarishlarini ajratish shunga tayanadi. Git yo'q bo'lsa, `ph-init` uni o'rnatadi va sozlaydi (`references/structure.md` → "Git"). Har ish oxirida agent `.gitignore` ni nazorat qiladi.
13. **Skill fayllari faqat o'qiladi.** Skill fayllarini o'zgartirma va ularni o'zgartirishni egasiga taklif ham qilma: skill'ni faqat uning muallifi takomillashtiradi. Skill'da nuqson topilsa, `references/doctor.md` → "6. Fix" dagi skill limitation tartibi bo'yicha ish qil.
