# orangegoat Deluxe — fikir listesi

"build" denince yapılacaklar. Numarayla seçilebilir (ör. "build 1, 7, 15") veya "build hepsi".

## Sırada (kullanıcı seçti, 2026-11-14)
7–15, 17–21, 23–32 — "build" dendiğinde bu sırayla yapılacak.
(18: renk körlüğü seçeneği hariç. 22, 27’nin içinde.)


## Veri ve tahmin
1. Geçmiş bilançoları tarihli saklama → değer sinyalinin (kâr verimi, defter değeri) de test edilmesi
2. Temettüye göre düzeltilmiş fiyatlar (BIST getirilerinin doğru ölçülmesi)
3. TCMB Piyasa Katılımcıları Anketi ile mevduat faizi ve kur beklentisinin her ay otomatik güncellenmesi
4. Kişisel tahmin karnesi: her fon için "o gün ne tahmin edildi, ne oldu" kaydı
5. Piyasa rejimi tespiti (sakin / çalkantılı dönem) ile risk bantlarının ve sinyal ağırlıklarının döneme göre ayarlanması
6. Aracı kurum hedef fiyatları ve konsensüs ile model tahmininin yan yana gösterilmesi

## Arayüz ve kullanım
7. **[sırada]** Ana ekranda "Bugün ne yapmalıyım?" kartı (vadesi dolan mevduat, hedefe ulaşan hisse, atıl nakit tek listede)
8. **[sırada]** Her rakamın yanında sözlüğe bağlanan küçük "?"
9. **[sırada]** Telefon için kart görünümü ve alttan açılan menü
10. **[sırada]** "Basit / Uzman" görünüm anahtarı
11. **[sırada]** Gün sonu piyasa notu (endeksler, kur, en çok yükselen/düşen, fonların günlük değişimi)
12. **[sırada]** Her fon için aylık "factsheet" PDF'i (tek sayfa, Wall Street fon bülteni biçiminde)
13. **[sırada]** Kâr/zarar ısı haritası
14. **[sırada]** Uygulama açıldığında vade, hedef ve zarar-kes uyarıları
15. **[sırada]** Etkileşimli senaryo kaydırıcıları ("dolar %20 artarsa", "faiz 5 puan düşerse" → fon değeri anında)
16. Hedef tabanlı plan ("2 yılda 1 milyon TL": ulaşma olasılığı ve gereken aylık ekleme)

## Estetik
17. **[sırada]** Yazı sistemi: metinler tek bir sade yazı tipinde (ör. IBM Plex Sans / Inter), yalnızca rakamlar eşit genişlikli (tabular) mono; şu an kalem adları da mono
18. **[sırada]** Rakam hiyerarşisi: ana tutar büyük ve koyu, USD karşılığı küçük ve soluk; yeşil/kırmızı yalnızca değişimde
19. **[sırada]** Kutu içinde kutu yerine ince ayraçlar; 8 piksellik ızgara ile tutarlı boşluklar; panellerde daha fazla nefes alanı
20. **[sırada]** Tek grafik dili: aynı eksen, ızgara ve renkler; üzerine gelince artı imleçli ipucu; uç değer etiketleri; çakışan etiketlerin düzeltilmesi (fan grafiğindeki 290k/300k gibi)
21. **[sırada]** Varlık türü renkleri ve simgeleri: hisse, fon, altın, döviz, mevduat, VİOP her yerde aynı renk ve küçük çizgi simgeyle
22. Yeni tema "Private Banking": lacivert ve krem, ince altın vurgu, başlıklarda zarif serif; mevcut Paper / Slate / Terminal / Mono korunur
23. **[sırada]** Akıcılık: "Yükleniyor…" yerine iskelet yükleme, değişen rakamlarda yumuşak geçiş, panelin kayarak açılması, sade bildirim balonları
24. **[sırada]** Marka: orangegoat için küçük bir keçi logosu, turuncu vurgu rengi, uyumlu favicon ve uygulama simgesi; üst çubuğun sadeleştirilmesi
25. **[sırada]** Boş durumlar: fon yokken, veri gelmemişken kısa yönlendirme ve tek tıkla başlama düğmesi
26. **[sırada]** PDF ve Word raporlarının uygulamayla aynı tasarım dilinde olması (aynı renk, yazı tipi, grafik stili)
27. **[sırada]** Kullanıcı kararı (2026-11-14): "Private Banking" ve "Bloomberg Terminal" temaları birlikte, Ayarlar'dan seçilebilir; daha özelleştirilebilir görünüm (vurgu rengi, yazı tipi, yoğunluk / satır aralığı, köşe yuvarlaklığı, rakam boyutu). Mevcut temalar korunur. 22. madde bunun içine alınır.

## Enstrümanlar ve öngörüler (2026-11-14)
28. **[sırada]** VİOP öngörüleri daha net ve detaylı: her sözleşme için beklenen uzlaşma fiyatı ve aralığı, vadeye kadar senaryolar (iyi / orta / kötü), teminat tamamlama çağrısı olasılığı ve hangi fiyatta geleceği, kaldıraçlı getiri (teminata göre), başabaş fiyatı, taşıma maliyeti (spot–vadeli farkı, ima edilen faiz), vade devri maliyeti, sade dille özet cümle
29. **[sırada]** Emtialar: petrol (Brent, WTI), gümüş, altın (ons ve gram), bakır, platin, paladyum, doğalgaz ve diğerleri; fiyat, grafik, istatistik, öngörü, fona eklenebilme (TL karşılığıyla)
30. **[sırada]** Emtia fonları: TEFAS kıymetli maden / emtia fonları ve borsada işlem gören altın-gümüş fonları; listede görülebilir, karşılaştırılabilir, fona eklenebilir
31. **[sırada]** Her enstrüman için ayrı ROI öngörüsü: 1 ay / 3 ay / 6 ay / 1 yıl ve tutma süresi sonu için beklenen getiri, aralık, mevduata göre fark; hem fon içinde hem enstrüman sayfasında
32. **[sırada]** Fon kartının sonunda hem kırılımlı (her kalem ayrı: değer, getiri, öngörü) hem konsolide (fonun tamamı: değer, beklenen getiri, aralık, mevduata göre) durum

## Fon içi kırılım fikirleri (seçim bekliyor)
33. Varlık sınıfı kırılımı: hisse, fon, emtia, döviz, mevduat, VİOP — ağırlık, değer, getiri, öngörü
34. Gizli döviz riski: ABD hissesi, altın, USD mevduat ve dolar bazlı VİOP dahil gerçek TL / USD dağılımı
35. Risk katkısı: her kalemin ağırlığı ile fonun riskine katkısı yan yana (ör. %16 ağırlık, %55 risk)
36. Getiri katkısı (attribution): toplam getirinin hangi kalemden, varlık sınıfından ve kurdan geldiği; şelale grafik
37. Vade merdiveni: mevduat vadeleri ve VİOP vade tarihleri takvim üzerinde, hangi ay ne kadar paranın serbest kalacağı
38. Yoğunlaşma: en büyük 5 kalemin payı, sektör dağılımı, tek kaleme bağımlılık uyarısı
39. Faktör maruziyeti: BIST betası, dolar, emtia ve faiz duyarlılığı tek tabloda
40. Likidite: kalemlerin kaç günde nakde dönebileceği (düşük likidite, vadeli mevduat kırma, VİOP)

## Yatırım iyileştirici motor fikirleri (seçim bekliyor)
41. Optimizasyon: beklenen getiri ile risk arasında en iyi dağılım (ortalama-varyans ve risk paritesi), kalem başına üst sınır gibi kısıtlarla; bugünkü dağılıma göre “ne alınmalı, ne satılmalı”
42. Maliyet ve vergi farkındalığı: komisyon, BSMV, stopaj ve alış-satış farkı hesaba katılarak yalnızca maliyetini çıkaran değişikliklerin önerilmesi
43. Yeniden dengeleme bantları: hedef ağırlıktan belirli bir oranda sapınca uyarı ve tek tıkla düzeltme planı
44. Riskten korunma (hedge) önerileri: BIST riskine karşı endeks vadeli kısa pozisyon, kur riskine karşı dolar vadeli; ne kadar sözleşme gerektiği ve maliyeti
45. Mevduat merdiveni optimizasyonu: nakit ihtiyacı ve faiz eğrisine göre vadelerin bölünmesi
46. Atıl nakit süpürme: belirli tutarın üstündeki nakdin otomatik olarak mevduat / para piyasası fonu önerisi
47. Stres dayanımlı öneri: önerilen değişikliğin kötü senaryolarda (kur şoku, endeks düşüşü) fonu daha kötüye götürmediğinin kontrolü
48. Önce / sonra karşılaştırması: önerinin uygulanmasıyla beklenen getiri, risk, VaR ve mevduata göre farkın yan yana gösterilmesi
49. “Neden?” açıklaması: her önerinin hangi sinyale, hangi riske ve hangi geçmiş isabet oranına dayandığının sade dille yazılması
50. Hedefe göre motor: kullanıcının hedefi (ör. mevduatı yenmek, sermayeyi korumak, dolar bazında büyümek) seçilerek önerilerin buna göre değişmesi

## Kullanıcının ekledikleri
(boş)
