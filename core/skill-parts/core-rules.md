## Core rules

Skill bilan ishlaganda bu qoidalar maqsadli loyihaning qoidalaridan oldin ham amal qiladi:

1. **Faktni o'zing top, qarorni egasi qiladi.** Repo, hujjat va live system'dan topiladigan narsani o'zing top; egasidan faqat qaror va repo'da yo'q bilimni so'ra (P20).
2. **Faqat repo'da yo'q bilimni yoz** (P13): egasining qarorlari, uslubi, xavfli joylar, tekshirilgan faktlar. README, kod, config, `--help`, papka structure'i va buyruqlarga havola ber: nusxa eskiradi va xarajatni oshiradi.
3. **Har da'voni tekshir.** Hujjat, README va eski hisobotdagi fakt tekshirilmaguncha `unverified` hisoblanadi. Hisobotda `verified` va `unverified` ni ajratib yoz.
4. **Sir qiymatini hech qachon o'qima va ekranga chiqarma.** `.env`, `secrets.*`, kalit va token fayllaridan faqat fayl va o'zgaruvchi nomini yoz. Shaxsiy ma'lumot va maxfiy hujjat o'rniga ham harness'ga yo'l, ID va neytral tavsif yoziladi.
5. **Katta o'zgarish reja bilan.** Structure, qoida yoki ma'noni o'zgartiradigan ishni avval reja bilan ber va egasining aniq tasdig'igacha faqat o'qi. Reja maqsad, natija va kriteriyalardan boshlanadi, yakuniy rejada istisnolar, byudjet va (bir sessiyaga sig'masa) bosqichlar bo'ladi. Tasdiqdan keyin ish state'i `pan-harness/handoff.md` da yuritiladi, ish oxirida har kriteriya dalil bilan tekshiriladi (P21, P24). Qoidada belgilangan mechanical fix darhol qilinadi (`references/doctor.md`).
6. **Variantni tamoyilga asosla.** Structure bo'yicha variant berishdan oldin `references/principles.md` ni o'qi va har variant qaysi tamoyilga tayanishini ayt. Internetdagi yangi amaliyotni loyihaning qoidasi yoki egasining so'rovi bo'yicha o'rgan.
7. **Hajmni o'lcha.** `wc -c` bilan sana; start set limit'i `references/structure.md` → "Size limits" da.
8. **Kichik model ham tushunadigan qilib yoz.** Harness matnini `references/structure.md` → "Writing" (P26) bo'yicha yoz: buyruq shakli, positive form, completion criterion, bitta atama.
9. **Egasining uslubini so'ra.** Til, atamalar, murojaat, ruxsat va commit tartibi (S11, standart javob — agent o'zi commit qiladi) `references/style-questions.md` bo'yicha so'raladi va loyihaning harness'iga yoziladi.
10. **Egasining tahrirlari ustun.** Egasi o'zgartirgan matnni saqla va ishingni uning ustiga qur. Unda yangi ko'rsatma ko'rinsa, loyihaning `feedback.md` iga yoz.
11. **Irreversible action faqat ruxsat bilan.** Fayl o'chirish va tarixni qayta yozish faqat egasining aniq ko'rsatmasi bilan. Push'ni egasi qiladi: agent uni faqat egasi aniq so'raganda bajaradi va bu haqda o'zi so'ramaydi. Commit loyihaning R4 qoidasi bo'yicha qilinadi, `ph-init` da esa S11 javobiga ko'ra. Hook xato bersa, sababini tuzat: `--no-verify` uchun egasi shu commit uchun alohida ruxsat bergan bo'lishi kerak.
12. **Git doim bor.** Pan-harness git'da ishlaydi: tarix, checkpoint'lar va egasining hamda agentning o'zgarishlarini ajratish shunga tayanadi. Git yo'q bo'lsa, `ph-init` uni o'rnatadi va sozlaydi (`references/structure.md` → "Git"). Har ish oxirida agent `.gitignore` ni nazorat qiladi.
13. **Skill fayllari faqat o'qiladi:** skill'ni uning muallifi takomillashtiradi. Skill'da nuqson topilsa, `references/doctor.md` → "6. Fix" dagi skill limitation tartibini bajar.
