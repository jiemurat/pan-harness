## Report

Egasining tilida, qisqa va tushunarli: bandlar raqami emas, ma'nosi bilan nomlanadi (`Core rules` dagi egasiga tushunarli yozish qoidasi):
- reja bilan qilingan ishda har kriteriya: ✅ (dalil bilan), ❌ yoki ⏳ (qachon tekshiriladi);
- reja bilan qilingan ishda o'zgargan komponentlar xaritasi: har biri uchun nima o'zgardi, kimga ta'sir qiladi, kutilgan xarajat va sifat, qanday o'chiriladi yoki qaytariladi;
- nima qilindi va nima topildi (raqamlar bilan);
- `ph-doctor` da: bo'lim bo'yicha `ok`, `fail`, `not checked` hisobi va topilgan nuqsonlar oddiy tilda; to'liq jadval (raqamlari bilan) tarix yozuvida qoladi;
- `verified` va `unverified` alohida;
- skill limitation'lar (bo'lsa);
- egasining qarori kerak bo'lgan savollar (raqamlangan, variant va tavsiya bilan; savolning o'zi tushunarli, ichki belgisiz);
- o'zgargan fayllar ro'yxati, keyingi qadam.

Yuborishdan oldin hisobot qoralamasini vaqtinchalik faylga yoz va ikki buyruqni ishga tushir:
- `grep -nE '(^|[^[:alnum:]_])[ADFKLPRS][0-9]{1,3}([^[:alnum:]_]|$)' <fayl>`: topilgan har belgini ma'nosi bilan almashtir. Tugadi: buyruq hech narsa topmaydi.
- `grep -nE '[A-Za-z0-9_./-]+\.(md|mjs|json)' <fayl>`: fayl nomini egasi ochishi yoki shunga qarab qaror qilishi kerak bo'lmasa, nom o'rniga mazmunini yoz (masalan, "ish rejasi", "sessiya holati"). Tugadi: tanada faqat egasi ochishi yoki qarori bog'liq bo'lgan fayl nomlari qoladi; boshqa nomlar "o'zgargan fayllar" ro'yxatida.
