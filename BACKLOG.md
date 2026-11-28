# orangegoat Deluxe — fikir listesi

"build" denince yapılacaklar. Numarayla seçilebilir (ör. "build 1, 7, 15") veya "build hepsi".

## Sırada (kullanıcı seçti, 2026-11-14)
7–15, 17–21, 23–53 — v2.1’de yapıldı (2026-11-14).
Sırada (2026-11-15): 56, 58, 59, 60, 63, 64, 65, 66, 67, 70. Yeni sekme planı 71–80 onaylandı ve sırada (80 kullanıcı kararıyla değiştirildi).
(18: renk körlüğü seçeneği hariç. 22, 27’nin içinde.)


## Veri ve tahmin
1. **[yapıldı v2.33]** Geçmiş bilançoları tarihli saklama → değer sinyalinin (kâr verimi, defter değeri) de test edilmesi
2. **[yapıldı v2.32]** Temettüye göre düzeltilmiş fiyatlar (BIST getirilerinin doğru ölçülmesi)
3. **[zaten vardı]** TCMB Piyasa Katılımcıları Anketi ile mevduat faizi ve kur beklentisinin her ay otomatik güncellenmesi
4. **[zaten vardı]** Kişisel tahmin karnesi: her fon için "o gün ne tahmin edildi, ne oldu" kaydı
5. **[zaten vardı]** Piyasa rejimi tespiti (sakin / çalkantılı dönem) ile risk bantlarının ve sinyal ağırlıklarının döneme göre ayarlanması
6. **[zaten vardı]** Aracı kurum hedef fiyatları ve konsensüs ile model tahmininin yan yana gösterilmesi

## Arayüz ve kullanım
7. **[yapıldı v2.1]** Ana ekranda "Bugün ne yapmalıyım?" kartı (vadesi dolan mevduat, hedefe ulaşan hisse, atıl nakit tek listede)
8. **[yapıldı v2.1]** Her rakamın yanında sözlüğe bağlanan küçük "?"
9. **[yapıldı v2.1]** Telefon için kart görünümü ve alttan açılan menü
10. **[yapıldı v2.1]** "Basit / Uzman" görünüm anahtarı
11. **[yapıldı v2.1]** Gün sonu piyasa notu (endeksler, kur, en çok yükselen/düşen, fonların günlük değişimi)
12. **[yapıldı v2.1]** Her fon için aylık "factsheet" PDF'i (tek sayfa, Wall Street fon bülteni biçiminde)
13. **[yapıldı v2.1]** Kâr/zarar ısı haritası
14. **[yapıldı v2.1]** Uygulama açıldığında vade, hedef ve zarar-kes uyarıları
15. **[yapıldı v2.1]** Etkileşimli senaryo kaydırıcıları ("dolar %20 artarsa", "faiz 5 puan düşerse" → fon değeri anında)
16. **[yapıldı v2.32]** Hedef tabanlı plan ("2 yılda 1 milyon TL": ulaşma olasılığı ve gereken aylık ekleme)

## Estetik
17. **[yapıldı v2.1]** Yazı sistemi: metinler tek bir sade yazı tipinde (ör. IBM Plex Sans / Inter), yalnızca rakamlar eşit genişlikli (tabular) mono; şu an kalem adları da mono
18. **[yapıldı v2.1]** Rakam hiyerarşisi: ana tutar büyük ve koyu, USD karşılığı küçük ve soluk; yeşil/kırmızı yalnızca değişimde
19. **[yapıldı v2.1]** Kutu içinde kutu yerine ince ayraçlar; 8 piksellik ızgara ile tutarlı boşluklar; panellerde daha fazla nefes alanı
20. **[yapıldı v2.1]** Tek grafik dili: aynı eksen, ızgara ve renkler; üzerine gelince artı imleçli ipucu; uç değer etiketleri; çakışan etiketlerin düzeltilmesi (fan grafiğindeki 290k/300k gibi)
21. **[yapıldı v2.1]** Varlık türü renkleri ve simgeleri: hisse, fon, altın, döviz, mevduat, VİOP her yerde aynı renk ve küçük çizgi simgeyle
22. **[zaten vardı]** Yeni tema "Private Banking": lacivert ve krem, ince altın vurgu, başlıklarda zarif serif; mevcut Paper / Slate / Terminal / Mono korunur
23. **[yapıldı v2.1]** Akıcılık: "Yükleniyor…" yerine iskelet yükleme, değişen rakamlarda yumuşak geçiş, panelin kayarak açılması, sade bildirim balonları
24. **[yapıldı v2.1]** Marka: orangegoat için küçük bir keçi logosu, turuncu vurgu rengi, uyumlu favicon ve uygulama simgesi; üst çubuğun sadeleştirilmesi
25. **[yapıldı v2.1]** Boş durumlar: fon yokken, veri gelmemişken kısa yönlendirme ve tek tıkla başlama düğmesi
26. **[yapıldı v2.1]** PDF ve Word raporlarının uygulamayla aynı tasarım dilinde olması (aynı renk, yazı tipi, grafik stili)
27. **[yapıldı v2.1]** Kullanıcı kararı (2026-11-14): "Private Banking" ve "Bloomberg Terminal" temaları birlikte, Ayarlar'dan seçilebilir; daha özelleştirilebilir görünüm (vurgu rengi, yazı tipi, yoğunluk / satır aralığı, köşe yuvarlaklığı, rakam boyutu). Mevcut temalar korunur. 22. madde bunun içine alınır.

## Enstrümanlar ve öngörüler (2026-11-14)
28. **[yapıldı v2.1]** VİOP öngörüleri daha net ve detaylı: her sözleşme için beklenen uzlaşma fiyatı ve aralığı, vadeye kadar senaryolar (iyi / orta / kötü), teminat tamamlama çağrısı olasılığı ve hangi fiyatta geleceği, kaldıraçlı getiri (teminata göre), başabaş fiyatı, taşıma maliyeti (spot–vadeli farkı, ima edilen faiz), vade devri maliyeti, sade dille özet cümle
29. **[yapıldı v2.1]** Emtialar: petrol (Brent, WTI), gümüş, altın (ons ve gram), bakır, platin, paladyum, doğalgaz ve diğerleri; fiyat, grafik, istatistik, öngörü, fona eklenebilme (TL karşılığıyla)
30. **[yapıldı v2.1]** Emtia fonları: TEFAS kıymetli maden / emtia fonları ve borsada işlem gören altın-gümüş fonları; listede görülebilir, karşılaştırılabilir, fona eklenebilir
31. **[yapıldı v2.1]** Her enstrüman için ayrı ROI öngörüsü: 1 ay / 3 ay / 6 ay / 1 yıl ve tutma süresi sonu için beklenen getiri, aralık, mevduata göre fark; hem fon içinde hem enstrüman sayfasında
32. **[yapıldı v2.1]** Fon kartının sonunda hem kırılımlı (her kalem ayrı: değer, getiri, öngörü) hem konsolide (fonun tamamı: değer, beklenen getiri, aralık, mevduata göre) durum. Kullanıcı: kırılımda her enstrüman ayrı ayrı gösterilsin

## Fon içi kırılım (kullanıcı seçti)
33. **[yapıldı v2.1]** Varlık sınıfı kırılımı: hisse, fon, emtia, döviz, mevduat, VİOP — ağırlık, değer, getiri, öngörü
34. **[yapıldı v2.1]** Gizli döviz riski: ABD hissesi, altın, USD mevduat ve dolar bazlı VİOP dahil gerçek TL / USD dağılımı
35. **[yapıldı v2.1]** Risk katkısı: her kalemin ağırlığı ile fonun riskine katkısı yan yana (ör. %16 ağırlık, %55 risk)
36. **[yapıldı v2.1]** Getiri katkısı (attribution): toplam getirinin hangi kalemden, varlık sınıfından ve kurdan geldiği; şelale grafik
37. **[yapıldı v2.1]** Vade merdiveni: mevduat vadeleri ve VİOP vade tarihleri takvim üzerinde, hangi ay ne kadar paranın serbest kalacağı
38. **[yapıldı v2.1]** Yoğunlaşma: en büyük 5 kalemin payı, sektör dağılımı, tek kaleme bağımlılık uyarısı
39. **[yapıldı v2.1]** Faktör maruziyeti: BIST betası, dolar, emtia ve faiz duyarlılığı tek tabloda
40. **[yapıldı v2.1]** Likidite: kalemlerin kaç günde nakde dönebileceği (düşük likidite, vadeli mevduat kırma, VİOP)

## Yatırım iyileştirici motor (kullanıcı seçti)
41. **[yapıldı v2.1]** Optimizasyon: beklenen getiri ile risk arasında en iyi dağılım (ortalama-varyans ve risk paritesi), kalem başına üst sınır gibi kısıtlarla; bugünkü dağılıma göre “ne alınmalı, ne satılmalı”
42. **[yapıldı v2.1]** Maliyet ve vergi farkındalığı: komisyon, BSMV, stopaj ve alış-satış farkı hesaba katılarak yalnızca maliyetini çıkaran değişikliklerin önerilmesi
43. **[yapıldı v2.1]** Yeniden dengeleme bantları: hedef ağırlıktan belirli bir oranda sapınca uyarı ve tek tıkla düzeltme planı
44. **[yapıldı v2.1]** Riskten korunma (hedge) önerileri: BIST riskine karşı endeks vadeli kısa pozisyon, kur riskine karşı dolar vadeli; ne kadar sözleşme gerektiği ve maliyeti
45. **[yapıldı v2.1]** Mevduat merdiveni optimizasyonu: nakit ihtiyacı ve faiz eğrisine göre vadelerin bölünmesi
46. **[yapıldı v2.1]** Atıl nakit süpürme: belirli tutarın üstündeki nakdin otomatik olarak mevduat / para piyasası fonu önerisi
47. **[yapıldı v2.1]** Stres dayanımlı öneri: önerilen değişikliğin kötü senaryolarda (kur şoku, endeks düşüşü) fonu daha kötüye götürmediğinin kontrolü
48. **[yapıldı v2.1]** Önce / sonra karşılaştırması: önerinin uygulanmasıyla beklenen getiri, risk, VaR ve mevduata göre farkın yan yana gösterilmesi
49. **[yapıldı v2.1]** “Neden?” açıklaması: her önerinin hangi sinyale, hangi riske ve hangi geçmiş isabet oranına dayandığının sade dille yazılması
50. **[yapıldı v2.1]** Hedefe göre motor: kullanıcının hedefi (ör. mevduatı yenmek, sermayeyi korumak, dolar bazında büyümek) seçilerek önerilerin buna göre değişmesi

## Kayıt düzeltme, para ve toplam varlık (2026-11-14)
51. **[yapıldı v2.1]** Kalem bazında geriye etkili düzeltme, her yerden kolay erişimle. Mevcut “Fon içeriği → Düzenle / Kaldır” (2026-11-13'te yayında) genişletilecek: fon kartındaki ve enstrüman sayfasındaki her kalemde Düzenle / Kaldır; yanlış eklenen VİOP'u hiç etki doğurmamış gibi silme; Midas vb. rapordan çekilen alımların tarih, adet, fiyat, komisyon düzeltmesi; mevduat vadesi, faiz, başlangıç tarihi düzeltmesi; değişiklik geçmişi (ne, ne zaman, eski → yeni) ve geri alma
52. **[yapıldı v2.1]** Fonda “Para ekle” kaldırılacak: bir işlem girildiğinde o paranın zaten var olduğu kabul edilir (alım tutarı fona otomatik giriş sayılır, “yetersiz nakit” uyarısı çıkmaz); satış ve vade sonu paraları fon içinde nakit olarak kalır
53. **[yapıldı v2.1]** Ana sayfada toplam varlık: bütün fonlar + fon dışı vadesiz mevduat birlikte; kırılım hisse / fon / emtia / mevduat / döviz / VİOP / nakit; her satır hem TL hem USD; ana sayfada “Para ekle” ile vadesiz mevduattaki (TL veya döviz) varlığın kaydedilmesi, düzenlenmesi ve silinmesi

## Yapay zekâ asistanı — sonraki sürüme ertelendi (kullanıcı kararı, 2026-11-14)
54. **[iptal — kullanıcı kararı 2026-11-16]** Claude'a bağlı sohbet penceresi: uygulamanın kullanımı ve yatırım aksiyonları hakkında soru-cevap, Türkçe, akışlı (yazarken görünen) yanıt.
    - Bağlantı: Anthropic Claude API (claude.ai aboneliğinden ayrı, kullandıkça ödenen bir API anahtarı gerekir; anahtar platform.claude.com üzerinden alınır). Varsayılan model Claude Opus 5.5 (`claude-opus-5-5`); Ayarlar'dan Sonnet 5.5 / Haiku 5.5 seçilebilir. Reddedilen isteklerde sunucu tarafı yedek model (fallbacks) açık.
    - Anahtarın saklanması: GitHub sürümünde yalnızca bu tarayıcıda (IndexedDB), depoya ve siteye asla yazılmaz; bilgisayar sürümünde config.json'da, sunucu üzerinden çağrılır.
    - Kod: resmî Anthropic SDK (`@anthropic-ai/sdk`). Kurulum kullanıcı onayı gerektirir (kural: Node.js dışında kurulum için izin).
    - Asistanın araçları (yalnızca okuma ve hesaplama): fonları ve defteri okuma, enstrüman bilgisi, simülasyon, plan, konsolide durum, stres testi, model karnesi, sözlük. İşlem önerisi yalnızca doldurulmuş form olarak açılır; kullanıcı kaydetmeden hiçbir şey değişmez.
    - Gizlilik: soru sorulduğunda ilgili fon ve piyasa verisi Anthropic'e gönderilir; ilk kullanımda açık onay, Ayarlar'dan kapatılabilir; sohbet geçmişi yalnızca cihazda.
    - Yanıtlar uygulamadaki rakamlara dayanır ve kaynağını gösterir; “yatırım tavsiyesi değildir” notu.
    - Maliyet: soru başına yaklaşık birkaç cent (Opus 5.5: girdi $4, çıktı $20 / milyon token); Ayarlar'da aylık harcama sayacı ve üst sınır.

## Benzer uygulamalarla karşılaştırma — eksikler (2026-11-15, seçim bekliyor)
55. **[yapıldı v2.33]** Cihazlar arası şifreli eşitleme (telefon + bilgisayar aynı veri; uçtan uca şifreli, kendi Google Drive / GitHub alanınızda)
56. **[yapıldı v2.2]** Temettü ve sermaye artırımları fonlara otomatik: temettü kaydı (brüt, stopaj, net), bedelsiz / bedelli / bölünme uyarlaması, temettü takvimi ve yıllık temettü geliri tahmini
57. **[yapıldı v2.32]** Vergi / beyanname yardımcısı: yıl içi gerçekleşen kazançlar (ABD hisseleri için ÜFE endekslemesi, FIFO, TCMB kuru), temettü gelirleri, kesilen stopaj; PDF / Excel çıktısı
58. **[yapıldı v2.2]** Dönemsel performans tablosu: her fon için ay / çeyrek / yıl bazında zaman ağırlıklı (TWR) ve para ağırlıklı (XIRR) getiri; getirinin fiyat, temettü ve kur etkisine ayrılması
59. **[yapıldı v2.2]** Reel (enflasyondan arındırılmış) görünüm: her getirinin TÜFE’ye göre reel karşılığı ve “enflasyonu yendim mi” göstergesi
60. **[yapıldı v2.2]** Yeni varlık türleri: kripto (BTC, ETH), Eurobond / DİBS / özel sektör tahvili, BES fonları, fiziki altın (çeyrek, cumhuriyet), gayrimenkul ve araç (elle değerleme), borçlar (kredi, kart) → gerçek net varlık *(Kripto, kullanıcı kararıyla kapsamdan çıkarıldı.)*
61. **[yapıldı v2.33]** Telefona bildirim: fiyat, hedef / zarar-kes, vade ve KAP uyarıları (kişisel Telegram botu veya web push; yalnızca sembol listesi paylaşılır)
62. **[yapıldı v2.32]** Hedef ve emeklilik planlayıcı: aylık düzenli yatırım (DCA), hedef tutar / tarih, Monte Carlo ile ulaşma olasılığı, düzenli yatırım hatırlatıcısı
63. **[yapıldı v2.2]** Masraf analizi: yıl bazında ödenen komisyon, BSMV, fon yönetim ücreti; 10 yıllık birikimli etkisi ve daha ucuz alternatif önerisi
64. **[yapıldı v2.2]** Ekonomik takvim ve haber akışı: TCMB faiz kararı, enflasyon, ABD verileri; elde tutulan hisselerin KAP bildirimleri kısa özetlerle; olayın fona olası etkisi
65. **[yapıldı v2.2]** Fon içi “X-ray”: TEFAS fonlarının portföy dağılımı (KAP raporlarından) ile tüm fonlardaki gerçek hisse ve sektör maruziyeti
66. **[yapıldı v2.2]** Temel analiz kartı: değerleme (F/K, PD/DD sektöre göre), büyüme, borçluluk, temettü güvenliği — tek bakışta görsel özet
67. **[yapıldı v2.2]** “Ya bunun yerine şunu alsaydım?”: her alımın aynı tarihte BIST 100, altın, dolar veya mevduat ile karşılaştırması
68. **[yapıldı v2.33]** Aracı kurum ekstrelerinin düzenli içe aktarımı: banka / aracı kurum şablonları, mükerrer kayıt tespiti, toplu içe aktarma
69. **[yapıldı v2.33]** Uygulama kilidi (PIN / Windows Hello / parmak izi) ve güvenilir kişiye acil durum dosyası (varlık listesi, hesaplar)

## Emtia işlemleri (2026-11-15)
70. **[yapıldı v2.2]** Emtianın kendisiyle (vadeli değil) işlem: Brent, WTI, altın ons, gümüş, platin, paladyum, bakır, doğalgaz için “Al / Sat” — birim (varil, ons, libre, MMBtu), kesirli miktar, USD fiyat ve o günün kuru; fonda “Emtia” sınıfında, VİOP’tan ayrı. Vadeli sözleşmeler ayrıca kalır; emtia sayfasında “Vadeli sözleşmeler” bölümü olarak görünür.

## Yeni sekme planı ve sadeleştirme (2026-11-15, onaylandı)
71. **[yapıldı v2.2]** Beş ana sekme: Özet · Fonlarım · Piyasalar · Analiz (yalnızca Uzman görünümde) · Ayarlar. F tuşları etikette görünmez, kısayol olarak kalır.
72. **[yapıldı v2.2]** Özet: “Bugün ne yapmalıyım?”, toplam varlık, fon kartları (kısa), takvim (vade, temettü, ekonomik veri), ısı haritası, gün sonu notu (katlanır). Ayrı “Takvim” sekmesi kalkar.
73. **[yapıldı v2.2]** Fonlarım: fon listesi + “Tüm varlıklar” (eski Pozisyonlar), “Performans” (dönemsel ve reel getiri), “İşlem defteri” (tüm fonlar), “Vergi”. Sepet → Paket → Emirler akışı kalkar; yerine tek “Yeni fon” sihirbazı (boş, rapordan, öneriden).
74. **[yapıldı v2.2]** Fon sayfası sekmeli: Genel bakış · İçerik · Performans · Riskler (kırılımlar, stres, senaryo) · Gelecek (simülasyon, görünüm) · İyileştir · Defter ve geçmiş. Uzun tek sayfa kalkar.
75. **[yapıldı v2.2]** Piyasalar: tek “Enstrümanlar” ekranı ve üstte segmentler: BIST · ABD · Fonlar · Emtia · Döviz · VİOP; ardından Takip listesi, Makro, Halka arz. Karşılaştır, Araştırma, Lighthouse, Model karnesi ve Lab “Analiz” sekmesine taşınır.
76. **[yapıldı v2.2]** Tek enstrüman sayfası: fiyat, grafik, getiri öngörüsü, “fonlarınızda”, ilgili VİOP sözleşmeleri, KAP / haber; tek ana düğme “Al / Sat”.
77. **[yapıldı v2.2]** Tek ad, tek yer: “Paket / Sepet / Fon” yerine yalnızca “Fon”; işlem yalnızca fon veya enstrüman sayfasından girilir; “Raporlar” düğmesi yerine her sayfada “Dışa aktar”.
78. **[yapıldı v2.2]** Bildirimler tek yerde: Gelen kutusu ile “Bugün ne yapmalıyım?” birleşir.
79. **[yapıldı v2.2]** İlk açılışta 4 adımlı kısa tanıtım; yeni kullanıcı için varsayılan Basit görünüm; Sözlük ve Yardım Ayarlar altına (her terimin yanındaki “?” kalır).
80. **[yapıldı v2.2]** Dil, para birimi ve tarih (kullanıcı kararı 2026-11-15): arayüz seçime göre tamamen İngilizce veya tamamen Türkçe (karışık metin kalmaz); USD karşılığı her tutarın yanında her zaman görünür (gizleme yok); tarih biçimi ay-gün-yıl (ör. Nov 15, 2026 / 15 Kas yerine Kas 15, 2026; kısa biçim 11/15/2026).

## Görünüm incelemesi (2026-11-15, seçim bekliyor)
81. **[yapıldı v2.2]** Açılış ekranı: keçi logolu kısa açılış, “piyasa verisi yükleniyor %…” ilerleme çubuğu, ardından verinin saati; ilk boyamada iskelet görünüm. Kurulum penceresi ve karşılama mesajı seçilen dilde; telefonda alt menünün üstüne binmez.
82. **[yapıldı v2.2]** Borsa durumu ışıkları: her borsa için renkli ışık — yeşil (açık, hafif nabız), sarı (açılış / kapanış seansı), gri (kapalı), mavi (tatil); “açılışa 20 sa 52 dk” geri sayımı; BIST, VİOP, ABD, TEFAS fiyat saati, kripto (7/24); tek satırda kompakt.
83. **[yapıldı v2.2]** Veri sağlığı ışığı: “Sources 7 failing” kırmızı yazısı yerine tek ışık (yeşil taze < 1 sa, sarı eski, kırmızı sorunlu) ve tıklayınca hangi kaynağın neden çalışmadığı.
84. **[yapıldı v2.2]** Fon sağlığı ışığı: her fon kartında trafik ışığı — mevduatın önünde / yakın / gerisinde; uyarı varsa turuncu nokta.
85. **[yapıldı v2.2]** Üst çubuk sadeleşmesi: sürüm yazısı ve F tuşları kaldırılır (sürüm Ayarlar’da); arama kutusu “Sembol ara…” (kesilmeyen metin) ve ⌘K / Ctrl K ile açılan komut paleti; Raporlar ve ? düğmeleri tek “⋯” menüsünde.
86. **[yapıldı v2.2]** Yazı: rakamlar mono yerine aynı yazı ailesinde eşit genişlikli (tabular) rakamlarla — daha kurumsal görünüm; mono yalnızca Terminal temasında. Panel başlıklarında BÜYÜK HARF yerine normal yazım; Türkçe büyük harf hatası (“SİLVER”) giderilir. Kullanıcı: yazı tipi Ayarlar’dan seçilebilsin, birkaç seçenek olsun (ör. IBM Plex Sans, Inter, Source Serif, IBM Plex Mono / Terminal).
87. **[yapıldı v2.2]** Tek tarih ve saat biçimi: her yerde ay-gün-yıl (Nov 15, 2026 / Kas 15, 2026; kısa 11/15/2026), saat 13:18, “24 sa önce” gibi göreli zaman ve üzerine gelince tam tarih.
88. **[yapıldı v2.2]** USD her yerde: tarayıcı, fon kartı, kırılımlar, raporlar dahil her TL tutarın yanında küçük USD karşılığı (gizleme yok).
89. **[yapıldı v2.2]** Renk uyumu: logo turuncusu ile vurgu rengi (teal) çakışıyor — marka paleti: lacivert + turuncu vurgu (Paper / Slate / Private Banking temalarında uyumlu tonlar); yeşil / kırmızı yalnızca yön için, yanında ▲▼ işareti.
90. **[yapıldı v2.2]** Tablolar: sabit başlık satırı, satır üzerine gelince vurgu, tekrar eden etiketler (her satırda “BIST equity”, “12 months”) yerine sütun başlığında bir kez; 1 aylık mini grafik (sparkline); “Zaman” sütunu varsayılanda gizli; satır başındaki renkli çizginin anlamı açıklanır.
91. **[yapıldı v2.2]** Fiyat değişince yumuşak yanıp sönme (yeşil / kırmızı), sayıların kayarak değişmesi; panel açılış-kapanış geçişleri; odak halkası ve klavye ile gezinme.
92. **[yapıldı v2.2]** Boş ve ilk kullanım durumları: “0 TRY” büyük rakamı yerine “İlk fonunuzu ekleyin” çağrısı; boş paneller gizlenir.
93. **[zaten vardı]** Bugün sayfasının sadeleşmesi: eski “Bir bakışta / Gelen kutusu / Dünkü kapanıştan beri / Karar kontrolü / Son bakışınızdan beri / …” panelleri birleştirilir veya kaldırılır (72 ile birlikte); en üstte yalnızca 4–5 kart.
94. **[yapıldı v2.2]** Telefon: üst çubuk tek satır (logo + arama + bildirim), kart görünümü, büyük dokunma alanları, alt menüde simgeler; bildirim balonu alt menünün üstünde.
95. **[yapıldı v2.2]** Grafikler: tek renk paleti, ince ızgara, sağda son değer etiketi, üzerine gelince artı imleç ve değer; açık ve koyu temada aynı okunurluk.
96. **[yapıldı v2.2]** Erişilebilirlik ve okunurluk: en küçük yazı 12 px, gri metinlerde yeterli kontrast, ışıkların yanında metin etiketi (renk tek başına anlam taşımaz). Kullanıcı: yazı büyüklüğü Ayarlar’dan seçilebilsin (Küçük / Normal / Büyük / Çok büyük).

97. **[yapıldı v2.2]** Açılıştaki “Set up GNC Terminal” penceresi kaldırılır (kullanıcı onayı 2026-11-15). Puanlama profili Ayarlar’da kalır; çekirdek pay ve USD payı hedefleri (eski Sepet / Pozisyonlar ekranı, ana sayfa öneri cümlesi, USD sapma uyarısı) fon bazlı hedef dağılımla değiştirilerek emekliye ayrılır; aylık katkı ileride 62 seçilirse orada kullanılır; kullanılmayan “ufuk” ayarı kaldırılır. İlk açılışta yerine 79’daki kısa tanıtım.

98. **[yapıldı v2.3]** Puanlama v3: 10 yıllık BIST ve ABD verisiyle geriye dönük test (2017–2026). Sinyaller grup içinde sıralanıp normal puana çevrilir; değer ve kalite sektör içinde karşılaştırılır (UMS 29 nedeniyle BIST’te PD/DD yarım ağırlık); toplam puan şirket büyüklüğünden arındırılır; fiyat sinyali ağırlıkları her hafta kalibrasyonda sıralama IC’sinden öğrenilir (araştırma önceliklerine büzülerek). BIST IC 0,064 → 0,112.
99. **[yapıldı v2.3]** Yükselenler paneli (Piyasalar): bugün / 1 hafta / 1 ay en çok yükselenler; hacim artışı, 52 hafta zirvesine uzaklık ve geçmiş teste dayalı yükseliş türü etiketi (yeşil: devam eğilimli, turuncu: geri verme eğilimli).

100. **[yapıldı v2.4]** Süre önerisi: her hisse için maliyet ve vergi sonrası mevduata göre en iyi tutma süresi (puan dilimi × süre test tablosundan), mevduatı geçme olasılığı ve çıkış kuralı.
101. **[yapıldı v2.4]** “Yanına ne eklemeli”: hisse sayfasında ve fonda, bütünün risk başına getirisini en çok artıran adaylar (marjinal Sharpe kuralı, korelasyon, yarım Kelly pay).
102. **[yapıldı v2.4]** “Bu fon değer mi?”: fonun 12 aylık beklentisi mevduat, dolar, altın ve BIST 100 ile karşılaştırılır; devam / zayıf / mevduat daha iyi kararı ve TL kazancına göre sıralı iyileştirme listesi.
103. **[yapıldı v2.4]** VİOP net pozisyon motoru: trend (1/3/12 ay) + taşıma, oynaklığa göre boyutlama, %30 teminat sınırı, döviz için şok koruması ve 1,5× sınır, zarar kes ve devalüasyon stres kaybı; 10 yıllık test sonuçları gösterilir.
104. **[yapıldı v2.4]** Davranış uyarıları: al/sat penceresinde süre önerisi, piyango hissesi uyarısı, düşük puan uyarısı, “kazananı satıp kaybedeni tutma” uyarısı.
105. **[yapıldı v2.4]** Akıcı geçişler: sekme ve fon açılışında paneller kayarak gelir, sayılar değerine doğru sayar (hareket azaltma ayarına uyar).

### v2.5 adayları (2026-11-16)

106. **[yapıldı v2.5]** Fon düzenleme: yalnızca hisseler değil, fondaki her kalem düzenlenebilir — vadeli/vadesiz mevduat (anapara, faiz, başlangıç ve vade), TL ve USD nakit, döviz çevirileri, gram altın, ABD hissesi, TEFAS fonu, BYF ve VİOP pozisyonu (yön, adet, giriş fiyatı). Her kalem kendi türüne uygun alanlarla gösterilir.
107. **[yapıldı v2.5]** Fon düzenleme: fonun kuruluş tarihi ve her kalemin alış tarihi düzenlenebilir; değişiklikten sonra geçmiş değer serisi, getiri ve mevduat karşılaştırması yeniden hesaplanır; fiyat verisinin başladığı tarihten önceki tarihlerde uyarı verilir.
108. **[yapıldı v2.5]** Tutar girişi her yerde aynı kuralla: binlik ayırıcı virgül, ondalık ayırıcı nokta. Kullanıcı virgülü kendisi yazabilir; yazmazsa uygulama yazarken ekler (100000 → 100,000). Nokta yalnızca ondalıktır (1,250.75). Tutar, adet ve fiyat alanlarının tamamı (104 alan) bu biçime geçer; yapıştırılan değerler de aynı kuralla okunur.
109. **[yapıldı v2.5]** Fon teşhisi “Sorun → Çözüm → Sonuç”: fonun tek cümlelik ana sorunu (ör. “THYAO’ya %46 bağımlı ve iki hissesi mevduatın altında”), bunu gideren somut işlem bileti (ör. “THYAO’dan 120 adet sat ≈ 38,400 TL → TSKB 3,600 adet al”, “AKSGY’yi sat → 32 günlük vadeli mevduat”) ve işlem sonrası rakamlar (beklenen getiri, risk, risk başına getiri, mevduat farkı, yıllık TL etkisi) öncesi/sonrası olarak.
110. **[yapıldı v2.5]** Gerçekçi iyileştirme motoru: aday işlemler (azalt/sat/al/mevduata geç/koruma ekle) arasından risk başına getiriyi en çok artıran en fazla 3 işlem seçilir; komisyon, BSMV, alış-satış farkı, vergi, lot yuvarlama dahil; kazanç maliyetin altında kalıyorsa veya iyileşme küçükse (ör. +1 puan / +0,05 risk başına getiri altı) “değişiklik gerekmiyor” denir; tek hisse %20, sektör %40, en az 5 kalem sınırları; “Uygula” düğmesi işlemleri onaylı taslak emir olarak fona ekler.
111. **[yapıldı v2.5]** Öneri karnesi: verilen her öneri kaydedilir; 1, 3 ve 6 ay sonra “uygulanmış olsaydı / uygulanmasaydı” farkı gösterilir, böylece motorun isabeti zamanla ölçülür.
112. **[iptal]** AI asistan — yer: her sayfada açılabilen yan panel; bulunduğu sayfayı bağlam olarak alır (“bu fonun sorunu ne?”, “bu hisseyi kaç ay tutmalıyım?”); Türkçe/İngilizce arayüz diline göre; yanıtlar yazılırken akar.
113. **[iptal]** AI asistan — araçlar: rakamları kendisi uydurmaz, uygulamanın motorunu araç olarak çağırır: fonları/kalemleri oku, fon kararı ve teşhisi, hisse kartı ve puan dökümü, süre önerisi, “yanına ne eklemeli”, işlem simülasyonu (öncesi/sonrası), VİOP net pozisyon, makro ve takvim, sözlük; yanıtında rakamın hangi panelden geldiğini belirtir.
114. **[iptal]** AI asistan — güvenlik: hiçbir işlemi kendiliğinden yapmaz; önerdiği işlemleri taslak olarak hazırlar, kullanıcı onaylar; yatırım tavsiyesi uyarısı; veriler yalnızca soru sorulduğunda ve gösterilen kapsamda gönderilir.
115. **[iptal]** AI asistan — anahtar: GitHub sürümünde sunucu olmadığı için kullanıcının kendi Anthropic API anahtarı Ayarlar’a girilir ve yalnızca bu tarayıcıda saklanır; bilgisayar sürümünde anahtar config.json’da durur ve sunucu üzerinden çağrılır.
116. **[iptal]** AI asistan — model ve maliyet: varsayılan Claude Opus 5.5 (girdi $4, çıktı $20 / milyon token; önbelleğe alınmış girdi $0.20); ekonomik seçenek Claude Haiku 5.5 ($0.10 / $0.50). Sistem talimatı ve araç tanımları önbelleğe alınır; aylık harcama sınırı ve soru başına maliyet göstergesi Ayarlar’da.
117. **[iptal]** AI asistan — isteğe bağlı: web araması ile güncel haber/KAP özeti (ek maliyet), sohbet geçmişinin tarayıcıda saklanması, “haftalık fon raporu” gibi hazır komutlar.

### Pointer — analiz akıl yürütme katmanı (öneri, 2026-11-16)

Pointer, uygulamanın kendi verisiyle (fiyat, puan, SEC/EDGAR ve İş Yatırım mali tabloları, temettü, VİOP, makro) her enstrüman için analist kontrol listesini kural tabanlı olarak çalıştırır; yapay zekâ/API anahtarı gerektirmez. Her bulgu: tek cümlelik sonuç → rakam, dönem ve kaynak bağlantısı → eksik veri uyarısı → güven etiketi (kanıt / varsayım). Adı “Pointer”, yanında küçük bir av köpeği (pointer) logosu.

118. **[yapıldı v2.6]** Pointer ekranı ve logo: Analiz altında “Pointer” sekmesi + her hisse, fon ve VİOP sayfasında “Pointer ile incele” düğmesi; küçük pointer köpeği SVG logosu (işaret pozunda, tema renkleriyle); rapor PDF/Word olarak dışa aktarılabilir.
119. **[yapıldı v2.6]** Veri genişletme (ABD, SEC): mevcut EDGAR alanlarına yatırım harcaması (capex), hisse bazlı ödeme, işletme sermayesi değişimi, hisse geri alımı, ödenen temettü, nakit, borç ve borç vadeleri (1/2 yıl), amortisman, faiz gideri, vergi, brüt kâr, çeyreklik (10-Q) değerler ve dosyalama bağlantıları eklenir.
120. **[yapıldı v2.6]** Veri genişletme (BIST, İş Yatırım): gelir tablosu, bilanço ve nakit akışı çeyreklik ve yıllık; UMS 29 (enflasyon muhasebesi) uyarısı; karşılaştırmalar reel veya USD bazında yapılır.
121. **[yapıldı v2.6]** Tarama (1): kriterlerle hisse tarama — piyasa değeri, gelir büyümesi, serbest nakit akışı (işletme nakdi − capex), puan, sektör; BIST ve ABD; rakam, dönem ve kaynakla sıralı liste.
122. **[yapıldı v2.6]** Kâr nakde dönüyor mu (4): 3 yıl net kâr, işletme nakdi, capex, serbest nakit; aradaki farkı işletme sermayesi, hisse bazlı ödeme ve tek seferlik kalemlerle açıklar; geçici artışları işaretler.
123. **[yapıldı v2.6]** Bilanço stres testi (5): nakit, kullanılabilir kredi, 2 yıl içinde vadesi gelen borç; işletme nakdi %25 düşer, harcama sabit, yeniden finansman yok → yıl sonu nakit ve açık uyarısı. Bankalarda bunun yerine sermaye yeterliliği ve özkaynak kârlılığı.
124. **[yapıldı v2.6]** Emsal karşılaştırma ve rekabet avantajı (6–7): F/K, FD/FAVÖK, gelir büyümesi, faaliyet marjı; emsal ortancasına göre prim/iskonto ve gerekçesi; 3 yıllık marj istikrarı ve fiyatlama gücü göstergeleri; sıfır/negatif paydalar “yok” olarak işaretlenir.
125. **[yapıldı v2.6]** Ters indirgenmiş nakit akışı (8): bugünkü firma değerinin ima ettiği 5 yıllık gelir büyümesi (uzun vade %2,5, iskonto %8/9/10; BIST için USD veya reel bazda), marj, vergi ve yeniden yatırım varsayımları gösterilir ve gerçekleşen 3 yıllık büyümeyle karşılaştırılır.
126. **[yapıldı v2.6]** Ayı / baz / boğa senaryoları (9): sonraki mali yıl için gelir, faaliyet marjı ve hisse başı kâr; her senaryoda izlenecek bir tetikleyici; ana sürücü %5 değişirse hisse başı kâr etkisi.
127. **[yapıldı v2.6]** Geri alım ve sulanma (10): 3 yıl geri alım harcaması, alınan hisse, dönem başı/sonu hisse sayısı, çalışan hisseleri ile mutabakat, net değişim %; açıklanamayan farklar işaretlenir. BIST’te sermaye artırımları (bedelli/bedelsiz) dahil.
128. **[yapıldı v2.6]** Katalizör takvimi (11): önümüzdeki 90 günde bilanço tarihi, temettü, genel kurul, endeks değişimi, VİOP vadesi, TCMB/Fed/TÜFE, halka arz kilidi; “kesin/tahmini” etiketi ve izlenecek sonuç.
129. **[yapıldı v2.6]** Tezini çürüt (12): kullanıcı tek cümlelik tezini yazar (ör. “THYAO marjlarını korur”); Pointer verilerden en güçlü 3 karşı kanıtı bulur, her birinin hangi varsayımı zorladığını ve 2 çeyrekte tezi zayıflatacak ölçülebilir eşiği (varsayım olarak) yazar.
130. **[yapıldı v2.6]** Gelir ve kâr kaynakları / kazanç sürprizi (2–3): yıllık ve çeyreklik gelir/kâr değişimi, en büyük katkılar; segment verisi ve analist beklentisi bulunamazsa açıkça “veri yok” denir (SEC özet verisinde segment yok; beklenti verisi ücretsiz kaynaklarda sınırlı).
131. **[yapıldı v2.6]** Hisse dışı enstrümanlar için Pointer: TEFAS/BYF (içerik, ücret, endekse göre sapma), altın/emtia (mevduata göre taşıma, trend, reel faiz), döviz (faiz farkı, ima edilen değer kaybı, şok testi), VİOP (baz, vade geçişi, teminat stresi — mevcut net pozisyon motoruyla), mevduat (reel getiri, PPK yolu), tahvil/Eurobond (getiri, süre, faiz şoku).
132. **[yapıldı v2.8]** Dolar değerlemesi ve getirisi Ziraat Bankası günlük gişe döviz satış kuruna endeksli, alış kuruyla değer parantez içinde; çevirmede Ziraat kuru önerisi; çevirme satırında ödenen kur, Ziraat satışına göre fark ve kur hareketi ayrımı.
133. **[yapıldı v2.8]** Döviz çevirmede KMV alanı (%0,2 otomatik), satır maliyeti ve getirisine dahil; kur–tutar tutarlılık uyarısı ve tek tıkla düzeltme; Ziraat döviz dekontundan (PDF/metin) otomatik doldurma.

## Hız ve akıcılık (ölçüm: 16.11.2026, 1440 px masaüstü, Chromium)
Sekme geçişi 180–450 ms sürüyor (Piyasalar en yavaşı: 418–451 ms). JS işi geçiş başına yalnızca 100–130 ms; geri kalanı her geçişte tüm görünümün baştan çizilmesi, sayfanın tamamında çeviri/tarih taraması, ~100 stil hesaplaması ve 25 zorunlu yerleşim (layout). Bellek sızıntısı yok (3 tur sonra düğüm ve heap sabit).
134. **[yapıldı v2.9]** Kirli bayrak ile çizim: her görünüm yalnızca verisi değiştiyse yeniden çizilsin; veri değişmeden sekmeye dönülünce son çizim aynen gösterilsin (beklenen: geçiş 180 ms → 30–60 ms).
135. **[yapıldı v2.9]** Çeviri ve tarih düzeltmesini sayfanın tamamında değil yalnızca yeni çizilen kapta yap (dlTr/dlWalk/dlFixDates: geçiş başına 40–60 ms).
136. **[gerek kalmadı]** (tablo zaten yaklaşık 60 satır çiziyor; Piyasalar’daki gecikme 134–135 ile giderildi) Piyasalar tablosunu sanallaştır: ekranda görünen ~60 satır + kaydırdıkça devamı (beklenen: 420 ms → 120 ms; çöp toplama duraklaması 100 ms → ~0).
137. **[yapıldı v2.8]** Panel giriş animasyonundaki zorunlu yerleşimleri kaldır (panel başına offsetWidth okuması → tek requestAnimationFrame içinde sınıf ekleme); okuma ve yazmaları toplu yap.
138. **[yapıldı v2.8–v2.10]** Rakamların gelişi: tabular rakam (sabit genişlik) ile zıplamasız yerleşim; hazır olmayan değerde rakam boyunda iskelet (hafif parıltılı gri çubuk); sayıların sıfırdan sayması yerine yalnızca değer değiştiğinde eski değerden yeniye 250–300 ms geçiş ve 1 sn hafif yeşil/kırmızı vurgu; aynı değere dönülen sekmede animasyon yok; “hareketi azalt” tercihine uyum.
139. **[yapıldı v2.10, boşta zaman ile]** Ağır hesapları (Monte Carlo, fon değer serisi, puanlama) arka plan iş parçacığına (Web Worker) veya boşta zamana (requestIdleCallback) al; panel kendi iskeletini gösterip sonuç gelince dolsun — sekme hiç donmasın.
140. **[yapıldı v2.10]** Önceden hazırlık: fare sekmenin üzerine geldiğinde (ya da dokunmada) o sekmenin verisini hesaplamaya başla; geçiş anında hazır olsun.
141. **[yapıldı v2.10]** GitHub sürümünde açılış: view.json (8,8 MB) ve series.json (11,9 MB) önce tarayıcı önbelleğinden anında gösterilsin, yenisi arkadan gelip yalnızca değişen rakamları güncellesin; seriler sembol gruplarına bölünüp ihtiyaç oldukça yüklensin.
142a. **[yapıldı v2.9]** Piyasa ışığının sürekli “nabız” animasyonu ekran kartına taşındı: boştayken saniyede ~60 stil hesabı → 0.
142. **[yapıldı v2.10]** Hız bütçesi ve gösterge: Ayarlar’da “Hız” paneli (son 20 geçişin süresi, en yavaş bileşen); hedef sekme geçişi < 100 ms, fon açma < 150 ms; testlerde bu sınırın aşılması hata sayılsın.

143. **[yapıldı v2.11]** Dolar bazında getiri, Ziraat satış kuruyla: o gün aynı parayla kaç dolar, bugün kaç dolar, fark (her kalem ve fon); USD mevduat maliyeti açılış günü Ziraat satışı.
144. **[yapıldı v2.11]** Fon düzenleme ekranı: geniş iki sütunlu pencere, gruplanmış ve filtrelenebilir kayıtlar, kayıt ekleme kartları.
145. **[yapıldı v2.11]** Geri tarihli VİOP işlemi (açılış + kapanış), vadesi geçmiş sözleşme elle.
146. **[yapıldı v2.11]** Fon ayarlarında hedef yıllık getiri, renk etiketi ve notlar.

## Fon ekranı: işlem, Fon Pointer'ı ve sadeleştirme (19.11.2026)
Bugünkü fon ekranında 7 sekme ve 19 panel bulunuyor: Genel bakış (6), İçerik (2), Performans (4), Riskler (4), Gelecek (2), İyileştir (2), Defter ve geçmiş (1). Bazı paneller birbirini tekrarlıyor ("Performance since" ile "Başlangıçtan bugüne fon değeri"; "Analitik" ile "Kırılımlar"), ikisi hâlâ İngilizce ("Bu fonu yönet · converted to orders", "Performance since").
147. **[yapıldı v2.12]** **İşlem bileti (düzenleme değil, alım-satım):** Fon açık olduğu sürece İçerik'te her satırda "Sat" ve "Değiştir", üstte "Al" düğmesi. "Değiştir": X'ten şu kadar sat → gelirle Y'den şu kadar al; tek pencerede adet/tutar, fiyat (bugün veya geçmiş tarih), komisyon ve BSMV, satıştan doğan kâr/zarar ve stopaj, artan nakit fonun nakdine. Kayıtlar sat + al olarak deftere işlenir; geri alınabilir.
148. **[yapıldı v2.12]** **Fon Pointer'ı:** Pointer fonun içinde çalışır. Tek ekranda: fonun temel sorunu (bir cümle, örn. "THYAO fonun %62'si, tek hisse riski"), rakamı ve kaynağı; 2–3 ikincil sorun; her biri için kırmızı/sarı/yeşil işaret.
149. **[yapıldı v2.12]** **Düzeltme reçetesi:** "Hangi hisseden ne kadar al/sat" listesi: sembol, adet, yaklaşık tutar, fonun yeni ağırlığı, sorunu nasıl azalttığı. Önce/sonra görseli (ağırlık çubukları, risk ve beklenen getiri oku). Tek tıkla 147'deki işlem biletine aktarılır.
150. **[yapıldı v2.12]** **"Başka bir fikir" (another opinion):** Aynı sorunu farklı yoldan çözen alternatif reçete; sıra (kullanıcı seçimi): 1) hisse çeşitlendirme, 2) mevduata kısmi geçiş, 3) altın/dolar koruması, 4) VİOP ile hedge. Her basışta bir sonraki yaklaşım; artı ve eksileri yan yana.
151. **[yapıldı v2.12]** **Sekme sadeleştirme (kullanıcı seçimi):** 7 sekme → 4 sekme: Özet · İçerik ve İşlem · Pointer · Geçmiş; tekrarlayan ve İngilizce kalan paneller silinmez, sekmenin altındaki kapalı "Ayrıntılar" bölümüne alınır, Riskler/Gelecek/İyileştir içerikleri Pointer'a özet olarak taşınır, ayrıntılar katlanır bölümde kalır.
152. **[yapıldı v2.12]** Düzenleme penceresinin üstündeki İngilizce açıklama satırı Türkçeleştirilir.

## Uygulama sekmelerini sadeleştirme (19.11.2026)
Bugün 5 üst sekme ve 18 alt sekme var: Özet; Fonlarım (Fonlar, Tüm varlıklar, Performans, İşlem defteri, Masraflar, Vergi); Piyasalar (Tüm enstrümanlar, İzleme listesi, Makro, Halka arz takibi); Analiz (Pointer, Karşılaştır, Araştırma, Deniz feneri, Laboratuvar, Model karnesi); Ayarlar (Ayarlar, Sözlük).
153. **[yapıldı v2.12]** **Fonlarım 6 → 4 (kullanıcı seçimi):** Fonlar (Tüm varlıklar ve Fon röntgeni bunun içinde) · Performans · Defter · Masraf ve vergi.
154. **[yapıldı v2.12]** **Piyasalar (kullanıcı seçimi):** Enstrümanlar · İzleme · Makro · Duyurular (Araştırma + Deniz feneri + Halka arz tek sekmede, bölümler halinde).
155. **[yapıldı v2.12]** **Analiz → Pointer (kullanıcı seçimi):** Üst sekmenin adı Pointer olur; alt sekmeler: Pointer (Karşılaştır içinde, 2–4 enstrüman yan yana modu) · Model karnesi. Laboratuvar (çıkış kurallarını geçmiş fiyatlarla test) kaldırılır.
156. **[yapıldı v2.12]** Ayarlar ve Sözlük olduğu gibi kalır (kullanıcı seçimi). Sonuç: 5 üst sekme (Özet · Fonlarım · Piyasalar · Pointer · Ayarlar), 18 alt sekme → 12. Eski sekme adlarına giden kısayollar ve komutlar (ör. LAB, IPO, LIGHT, RSRCH, FEES, TAX, ALLPOS) yeni yerlerine yönlendirilir; tekrarlayan veya İngilizce kalan paneller silinmez, kapalı “Ayrıntılar” bölümüne alınır.

## Piyasalar ekranı: görsel, anlaşılır, yön gösteren (19.11.2026)
Bugün: 198 satırlık tek tablo (puan, beklenen getiri, faktörler) + “Yükselenler” paneli (etiket: 2017–2026 BIST geçmişinde bu tür yükselişin sonucu). Düşenler listesi yok; “ne kadar süre tutulmalı” bilgisi yok; hazır listeler yok.
157. **[yapıldı v2.12]** **Görsel mod:** Tablo/kart geçişi. Kart: sembol, ad, 3 aylık mini grafik, puan halkası (0–100, renkli), beklenen getiri aralığı çubuğu, tek işaret (▲ Al adayı / ● İzle / ▼ Kaçın) ve nedenini anlatan 2–3 etiket. Üstte sektör ısı haritası (kutu boyu piyasa değeri, renk değişim) ve varlık sınıfı kartları (BIST, ABD, fonlar, altın/emtia, döviz, VİOP); tıklayınca filtreler.
158. **[yapıldı v2.12]** **Düşenler ve “Kaçın” işareti:** Yükselenlerin karşısına “Düşenler” paneli. Her düşüşe, 2017–2026 geçmişinde aynı tür düşüşün sonraki 5/10/21/63 günde ne yaptığına göre etiket: “Düşen bıçak — kaçın” (200 günlük ortalamanın altında, 52 hafta dibine yakın, momentum zayıf), “Tek gün aşırı tepki — izle” (yüksek puanlı hissede tek gün sert düşüş), “Hacimli satış — kaçın”, “Trend içinde düzeltme — fırsat olabilir”. Kırmızı/sarı/gri işaretli, geçmiş isabet oranıyla.
159. **[yapıldı v2.12]** **Yükselenler için süre:** Her yükseliş türü için geçmişte 5/10/21/63 günlük ortalama sonuç ve isabet oranı; bunlardan “önerilen tutma süresi” (örn. “≈1 ay; geçmişte %58 isabet, piyasaya göre ort. +3,1%”), önerilen zarar-kes ve hedef seviyesi. Turuncu etiketlilerde “kısa tut / girme” uyarısı. Aynı geriye dönük test yeniden çalıştırılıp sonuçları veriyle saklanır.
160. **[yapıldı v2.12]** **Hazır listeler (sekme şeridi):** Puana göre en iyiler · Ucuz (F/K, PD/DD, FD/FAVÖK emsal ortancasına göre iskontolu) · Kısa vadede en yüksek beklenen getiri (1–3 ay, model; olasılık ve kötü senaryo ile) · Zirvedeki güçlüler · Temettü · Sakin ve düşük riskli · Kalite (marj, nakit dönüşümü, düşük borç) · Toparlanma adayları. Her listede ilk 10–20, satırda “neden bu listede” etiketleri; liste tek tıkla fona eklenebilir.
161. **[yapıldı v2.12]** **Dürüstlük kuralı:** “Süper kâr” iddiası yerine model tahmini, olasılık, kötü senaryo ve modelin geçmiş isabeti birlikte gösterilir (Model karnesi bağlantısı); spekülatif (düşük likidite, tek gün sıçrama) olanlar ayrı işaretlenir.
162. **[yapıldı v2.12]** **Enstrüman sayfası özeti:** Hisseye tıklayınca üstte tek satır karar kartı: işaret, önerilen süre, beklenen aralık, en büyük risk; “Pointer ile incele” ve “Fona ekle” düğmeleri.

## Teknik göstergeler (19.11.2026)
Bugün hesaplananlar: RSI 14, 20/50/200 günlük ortalamalar, ATR, 52 hafta zirvesine uzaklık, hacim patlaması, 12-1 momentum, beta, oynaklık, en büyük düşüş. Hesaplanmayanlar: MACD, Bollinger bantları, Stokastik, ADX, OBV, destek/direnç, altın/ölüm kesişimi. Göstergeler bugün yalnızca puanın içinde kullanılıyor; kullanıcıya ayrı ve görsel olarak gösterilmiyor.
163. **[yapıldı v2.12]** **Eksik göstergelerin eklenmesi:** MACD (12/26/9), Bollinger (20, 2σ) ve bant genişliği, Stokastik (14,3), ADX (14, trend gücü), OBV (hacim teyidi), son 1 yılın destek/direnç seviyeleri, 50/200 kesişimi ve tarihi. Hisse, BYF, emtia, döviz ve VİOP dayanakları için aynı motor.
164. **[yapıldı v2.12; araştırma: research/GOSTERGELER.md]** **Göstergeler gerçekten işe yarıyor mu (geriye dönük test):** Her göstergenin her sinyali (örn. RSI<30, MACD kesişimi, Bollinger alt bant, ADX>25 + yükseliş, altın kesişim) için 2017–2026 BIST ve ABD verisinde sonraki 5/10/21/63 günlük ortalama sonuç (piyasaya göre), isabet oranı ve örnek sayısı. Sonuç tablosu Model karnesinde; işe yaramayan sinyal “geçmişte etkisiz” etiketiyle gösterilir, puana eklenmez.
165. **[yapıldı v2.12]** **Gösterge paneli (enstrüman sayfası):** Göstergeler ibre/çubuk olarak (aşırı satım–nötr–aşırı alım; trend zayıf–güçlü), fiyat grafiğinde ortalamalar, Bollinger bantları, destek/direnç çizgileri ve sinyal noktaları (▲/▼). Her göstergenin yanında tek cümle açıklama ve 164'teki geçmiş isabeti. Altta göstergelerin toplu okuması: “Teknik görünüm: güçlü / nötr / zayıf”, kaç göstergenin hangi yöne baktığı.
166. **[yapıldı v2.12]** **Piyasalar'da gösterge filtreleri ve listeleri:** Hazır listelere (160) ek: “Aşırı satımda ama trendi sağlam”, “Yeni altın kesişim”, “Bant daralması (sert hareket öncesi)”, “Güçlü trend (ADX)”. Kart görünümünde (157) gösterge işaretleri küçük simgelerle. Yalnızca 164'te geçmişte işe yaradığı görülen sinyaller öne çıkarılır.

### Gösterge araştırmasının sonuçlarına göre ek maddeler (research/GOSTERGELER.md)
167. **[yapıldı v2.12]** **Piyasaya göre ters yorum:** BIST’te aşırı satım (RSI<30, Bollinger alt bandı, 1 ayda −%25) “düşüş sürebilir” (21 günde −0,7…−3,1%, t −2…−5); ABD’de “kısa tepki olabilir” (+0,3%, t ≈ 3). Uygulamadaki tüm “aşırı satım = fırsat” ifadeleri BIST için kaldırılır.
168. **[yapıldı v2.12]** **BIST Kaçın kuralları (puandan bağımsız kırmızı bayrak):** taban benzeri gün (−7,0%/21g), hacimli düşüş (−6,4%), 1 ayda −%25 (−3,1%), güçlü trendde sert düşüş (−2,9%), 200G altında RSI>70 (−2,9%); bayrak 21 işlem günü kalır.
169. **[yapıldı v2.12]** **Tavan benzeri gün:** “En fazla 1 hafta” etiketi (+0,9% 5g; −0,6% 21g; −2,7% 63g); Yükselenler ve kartlarda süre önerisi buna göre.
170. **[yapıldı v2.12]** **Hacimli yükselişi kovalama uyarısı:** BIST’te 3× hacimli yükseliş günü sonrası −2,0%/21g (t −4,2); mevcut “Hacim patlaması” etiketi bu rakamla güncellenir.
171. **[yapıldı v2.12]** **Etkisiz göstergeler:** Stokastik, ADX, OBV, altın/ölüm kesişimi, bant daralması, 200G kesişimi — gösterilir ama “geçmişte etkisiz (BIST ve ABD, 2017–2026)” etiketiyle; puana girmez.
172. **[yapıldı v2.12, kısmen: kanıt tablosu uygulamada; çeyreklik yeniden test elle (research/indicator-backtest.mjs), kotasyondan çıkan hisseler henüz eklenmedi]** **Yaşayan kanıt tablosu:** research/indicator-backtest.json uygulamaya veri olarak eklenir; her gösterge satırında N, 5/21/63 gün sonucu, isabet, iki dönem tutarlılığı ve maliyet sonrası değer. Test her çeyrek yeniden çalışır; kotasyondan çıkan hisseler eklenerek hayatta kalan yanlılığı azaltılır.

### Fonlarım hatası, sekme görünümü, tarih ve yanıp sönen ışıklar (2026-11-20)
173. **[yapıldı v2.12.1]** **Fonlarım'da fon kartlarının görünmemesi:** v2.11'den kalan “son alt sekme” tercihi (Tüm varlıklar, Vergi, Deniz feneri, Halka arzlar, Karşılaştır, Laboratuvar) artık birleştirilmiş bir görünümü gösterdiği için Fonlarım açıldığında fon kartları çizilmiyordu. Eski tercihler yeni sekmelere çevrilir; fonlar kayıtlı olduğu hâlde kart yoksa kartlar yeniden çizilir.
174. **[yapıldı v2.13]** **Sekme ve alt sekmelerin sade, geçişli görünümü:** Üst sekmelerde kutu ve kalın çerçeve yerine ince alt çizgi; seçili sekmenin altındaki çizgi sekmeler arasında kayarak geçer. Alt sekmeler daha küçük, gri metin, seçili olan tek renkli “hap” zemin; görünüm değişirken içerik kısa bir solma/kayma ile gelir. Simgeler tek renk ve küçük.
175. **[yapıldı v2.13]** **Üst çubukta tarih:** Logonun yanında bugünün tarihi ve saati (örn. “20 Kas 2026 Per · 09:18 İstanbul”), dakikada bir güncellenir; dil ayarına göre Türkçe/İngilizce.
176. **[yapıldı v2.13; kapatma düğmesi Ayarlar yerine ışık listesinde, KAP bildirimi henüz ışık vermiyor]** **Önemli enstrümanlar için yanıp sönen ışıklar:** Fonlardaki ve izleme listesindeki enstrümanlarda önemli bir durum olduğunda satırın/kartın yanında yanıp sönen nokta: kırmızı = Kaçın bayrağı, taban benzeri gün veya stop seviyesine yaklaşma; yeşil = hedefe ulaşma veya tavan benzeri gün; sarı = fiyat alarmı veya KAP bildirimi. Üst çubuktaki zil, kaç önemli ışık olduğunu gösterir; ışığın üzerine gelince nedeni yazar. Ayarlar'dan kapatılabilir; hareket azaltma tercihi açıksa yanıp sönme yerine sabit nokta.

177. **[yapıldı v2.13]** **TEFAS'ın yeni veri adresleri ve tüm fonlar:** TEFAS Nisan 2026'da eski /api/DB adreslerini kapattı; uygulama yeni /api/funds adreslerine (JSON) taşınır, kendini her istekte “GNC-Terminal” olarak tanıtır, istekler arasında bekler ve 429 yanıtında 50 saniye durur. TEFAS'ta işlem gören tüm yatırım fonları uygulamaya eklenir (günlük fiyat, büyüklük, yatırımcı sayısı, kategori sırası); Piyasalar'da tüm yatırım ve emeklilik fonlarını gösteren “TEFAS fon rehberi” bulunur. Fiyatlar her çalışmada zaman sınırıyla çekilir, yetişmeyenler sonraki çalışmaya kalır.

178. **[yapıldı v2.14; araştırma notu ışığı henüz yok]** **Işıkların sayısı ve çeşitliliği:** 176'daki üç renk ve beş kurala ek olarak:
   - **Renkler ve biçimler:** kırmızı (hemen bak), turuncu (yakında karar), sarı (alarm/olay), yeşil (fırsat/kâr al), mavi (bilgi), mor (Pointer önerisi), gri (veri eski). Aciliyete göre üç hız: hızlı çift atım (acil), yavaş yanıp sönme (dikkat), sabit halka (bilgi).
   - **Yeni kırmızı:** 52 haftanın dibi, satırda %20'den fazla zarar, fonun mevduatın gerisine düşmesi, fonda tek satırın %40'ı aşması, USD/TRY'de günde %2'den fazla hareket, VİOP teminat tamamlama riski.
   - **Yeni turuncu:** planlanan çıkış tarihine 7 günden az kalması, VİOP vadesine 5 günden az kalması, Kaçın işaretinin bitmesine 3 gün kalması.
   - **Yeni sarı:** 7 gün içinde temettü hak kullanımı, bilanço tarihi veya genel kurul; elinizdeki hisse için yeni KAP bildirimi; aracı kurum not/hedef değişikliği.
   - **Yeni yeşil:** 52 haftanın zirvesi (geçmişte olumlu sinyal), fonun hedef getiriye ulaşması, aracı kurum hedefinin %30 üstü potansiyel.
   - **Mavi:** temettü hesaba geçti, yeni halka arz, elinizdeki hisse için yeni araştırma notu.
   - **Mor:** fonun Pointer'ında kırmızı ana sorun ve uygulanabilir reçete.
   - **Gri:** fiyatı 3 işlem gününden eski veya TEFAS'tan çekilemeyen enstrüman.
   - **Nerede:** fon kartları ve içerik, Tüm varlıklar, izleme listesi, Özet sayfasında “Bugün dikkat” şeridi, Piyasalar kartları ve hareket edenler tablosu, üst sekmelerde (ilgili sekmenin yanında küçük nokta), VİOP pozisyonları.
   - **Liste:** zilin yanındaki listede renge göre gruplama ve süzme; her ışığın nedeni, tarihi ve “gördüm” (o gün için susturma) düğmesi; renk başına aç/kapat.

179. **[beklemede: kullanıcı farklı bir yol düşünüyor]** **Yatırımcı heyeti (virattt/ai-hedge-fund'dan, MIT lisansı):** Seçim: uygulamaya taşı, model sağlayıcısı Anthropic.
   - **Ne taşınır:** Beş yatırımcı ajanının talimatları (Buffett, Munger, Graham, Lynch, Druckenmiller), tarih sızıntısını önleyen kurallar (“yalnızca verilen veriden, son bilanço tarihini bugün say, sayı uydurma”), JSON yanıt biçimi (yön, güven 0–100, 2–4 cümle gerekçe) ve kazanç sürprizi (PEAD) modeli. Kaynak ve lisans dosyada belirtilir.
   - **Veri:** Financial Datasets yerine uygulamanın kendi tarihli temel verileri (ABD: SEC EDGAR, BIST: İş Yatırım; fund.json). Böylece BIST hisseleri de değerlendirilir.
   - **Nerede çalışır:** Her gece yayın işleminde; fonlardaki hisseler, izleme listesi ve en yüksek puanlı hisseler için sınırlı sayıda. Temel veri değişmedikçe aynı hisse yeniden sorulmaz (içerik özeti ile önbellek); günlük istek ve süre sınırı vardır.
   - **Anahtar:** ANTHROPIC_API_KEY, GitHub deposunun gizli değerlerine kullanıcı tarafından eklenir; kodda ve sohbette yer almaz. Anahtar yoksa bölüm boş kalır, uygulama etkilenmez.
   - **Görünüm:** Hisse sayfasında “Yatırımcı heyeti” paneli (beş ajanın yönü, güveni, Türkçe gerekçesi, oy dağılımı); fonun Pointer'ında fondaki hisselerin heyet görüşü; Piyasalar'da “Heyetin sevdikleri” listesi.
   - **Karne:** Her görüş tarihiyle saklanır; 1, 3 ve 12 ay sonra piyasaya göre sonucu Model karnesinde gösterilir. Kanıt birikene kadar puana eklenmez ve “deneysel” etiketi taşır.

180. **[yapıldı v2.14]** **Yönetim Kurulu (Board of Directors) sekmesi:** Yeni üst sekme; simgesi yukarıdan görünen oval toplantı masası ve çevresinde sandalyeler. 17 kişi, 15 oy (basit çoğunluk, eşitlik olmaz).
   - **Oy veren 13 yatırımcı** (gerçek kişiler değil, yayımlanmış ilkelerinin yaklaşık modeli; ağızlarına alıntı konmaz): Warren Buffett (kalıcı kârlılık, düşük borç, makul fiyat), Charlie Munger (kalite, “tersine çevir”: neyin batıracağını sorar), Benjamin Graham (güvenlik marjı, Graham sayısı, PD/DD, cari oran), Peter Lynch (PEG, anlaşılır büyüme, hisse türü), Stanley Druckenmiller (likidite, trend, pozisyon büyüklüğü, yanılınca hızlı çıkış), Howard Marks (döngü, risk primi, kötü senaryo), Ray Dalio (çeşitlendirme, korelasyon, enflasyon ve kur rejimi), Jim Simons (yalnızca istatistiksel kanıt: 2017–2026 sinyal testleri ve model puanı), George Soros (makro, TL ve kur, refleksivite), Mark Mobius (gelişmekte olan piyasa ve Türkiye riski), Joel Greenblatt (sihirli formül: sermaye getirisi + kazanç getirisi), Ed Thorp (beklenen değer, Kelly ile pozisyon büyüklüğü, vadeli işlem matematiği), John Bogle (maliyet ve vergi sonrası endeks/mevduata karşı: “neden yalnızca BIST 100 veya mevduat değil?”).
   - **Chief Risk Officer** (kurgusal, oy verir): VaR, stop, yoğunlaşma, teminat, en kötü senaryoda kayıp; risk sınırlarını aşan kararı açıkça işaretler.
   - **Chief Financial Officer** (kurgusal, oy verir): kararın kaç TL ile, hangi paradan (fondaki nakit, yeni para, mevduattan çekiş) uygulanacağı; komisyon, BSMV, stopaj ve vergi; mevduatın fırsat maliyeti; nakit tamponu.
   - **Chief General Counsel** (kurgusal, oy vermez): SPK mevzuatına göre yan bilgi: yatırım danışmanlığı uyarısı, piyasa dolandırıcılığı ve içsel bilgi yasakları (6362 sayılı SPKn), VBTS tedbirleri (brüt takas, açığa satış ve kredili işlem yasağı, tek fiyat), VİOP uygunluk testi, teminat ve kaldıraç kuralları, açığa satış, stopaj ve beyan. “Genel bilgidir, hukuki görüş değildir.”
   - **Executive Director** (kurgusal, başkan, oy vermez): soruyu yorumlar, oturumu yönetir, 15 oyu sayar, sonucu yazar.
   - **Hazır sorular (gruplu düğmeler; sembol, tutar ve kontrat alanları otomatik doldurulur):**
     - Hisse: “X alayım mı?”, “X'i satayım mı, yarısını mı?”, “X'e ekleme yapayım mı?”, “X'te zarardayım, ne yapayım?”, “X'te kârdayım, kârı alayım mı?”, “X için doğru giriş fiyatı ve stop nedir?”, “X mi Y mi?”, “X'i ne kadar süre tutmalıyım?”, “X temettü/bedelsiz öncesi alınır mı?”, “X halka arzına katılayım mı?”
     - VİOP: “XU030 vadeli uzun mu kısa mı?”, “Kaç kontrat ve ne kadar teminat?”, “Fonumu VİOP ile nasıl korurum?”, “Dolar vadeli alayım mı?”, “Altın vadeli mi gram altın mı?”, “Vade dönümünde ne yapayım?”, “Teminat tamamlama çağrısı gelirse ne yapayım?”
     - Fon ve portföy: “Fonum için ne yapmalıyım?”, “Fonumun en zayıf halkası hangisi?”, “Fonumu yeniden dengeleyeyim mi?”, “Elimdeki nakdi nereye koyayım?”, “X TL yeni param var, nasıl dağıtayım?”, “Fonum mevduatı geçecek mi?”, “Fonumu kapatıp mevduata mı geçeyim?”
     - Piyasa ve makro: “Bugün ne yapmalıyım?”, “Bu hafta neye dikkat edeyim?”, “Faiz kararı öncesi ne yapayım?”, “Dolar/TL'de sert hareket olursa ne yapayım?”, “BIST mi ABD mi?”, “Altın mı hisse mi mevduat mı?”, “Hangi sektörler öne çıkıyor?”
     - Fonlar (TEFAS): “Hangi TEFAS fonunu alayım?”, “Para piyasası fonu mu mevduat mı?”, “X fonu ile Y fonu hangisi?”
     - Vergi ve hukuk: “Bu satışın vergisi ne olur?”, “Yurt dışı kazancı beyan etmem gerekir mi?”, “Brüt takastaki hisseyi alabilir miyim?”, “Açığa satış yapabilir miyim?”
   - **Ekran düzeni:** ortada yukarıdan görünen oval masa ve 17 koltuk (baş harfli rozetler; daire rengi yatırım okulu: değer, büyüme, makro, nicel, endeks, yönetim; kenar halkası oy rengine döner). Konuşma balonu yerine: (1) masanın altında TV alt yazısı biçiminde “söz şeridi” (konuşanın rozeti, adı, okulu ve görüşü; önceki sözler yukarı kayar); (2) konuşan koltuktan masanın ortasına ışık çizgisi; (3) itirazlar iki koltuk arasında renkli yay olarak çizilir. Sağda karar kartı ve 15 oyun yarım daire meclis grafiği (Al / Tut / Sat / Uzak dur); altta açılır tam tutanak.
   - **Akış:** canlı; görüşler birkaç saniyeye yayılarak sırayla gelir, “Atla” düğmesi hepsini anında açar. Sıra: 1) başkan soruyu ve ilgili veriyi özetler; 2) her üye oy ve gerekçe verir; 3) karşı görüşteki üyeler birbirine itiraz eder; 4) Risk Officer, CFO ve General Counsel notları; 5) meclis grafiği ve karar kartı: ne yapılacağı, tutar/adet veya kontrat, hangi paradan, süre, stop, beklenen aralık, en büyük risk; “Bilete aktar”.
   - **Motor:** kural tabanlı kurul her zaman çalışır (API ve ücret gerekmez, uygulamanın kendi verisiyle anında). İsteğe bağlı: kullanıcı Yönetim Kurulu sekmesinde kendi Anthropic API anahtarını girerse aynı kurul yapay zekâ ile serbest tartışır; anahtar yalnızca o tarayıcıda saklanır, rakamlar yine uygulamanın verisinden gelir.
   - **Tutanak ve karne:** her oturum tarihiyle tutanak olarak saklanır; 1, 3 ve 12 ay sonra kararın ve her üyenin oyunun sonucu gösterilir (üye karnesi).

181. **[yapıldı v2.15]** **Yönetim Kurulu düzeltmeleri ve etkileşim:** Her sorunun kendi cevabı karar kartının başında (“Sorunuzun cevabı”): ne kadar süre (vade motorundan en iyi süre, süreye göre mevduat farkı ve olasılık tablosu), giriş fiyatı/stop/hedef, zarardayken, kârdayken (iz süren stop), temettü öncesi, halka arz (sembolsüz kontrol listesi), altın vadeli mi gram altın mı, fonun en zayıf halkası, fon mevduatı geçer mi (olasılık), faiz kararı ve bu hafta (takvim). General Counsel yalnızca soruyla ilgili hukuki/vergisel konu varsa konuşur; genel uyarı sayfa altında. Etkileşim: devam soruları (“Neden?”, “Ya %10 düşerse?”, tutar, süre, daha temkinli/atak; kurul önceki oturumu hatırlar ve yeniden oylar, fikrini değiştirenler gösterilir), “İtiraz et” (8 gerekçe; yeniden oylama), masadaki üyeye tıklayınca gerekçesi, baktığı rakamlar, karnesi ve yalnız o üyeye soru.

182. **[yapıldı v2.16]** **Kurul piyasayı tarar ve size soru sorar:** “Which share should I add/buy”, “ne alayım”, “fonuma hangi hisseyi ekleyeyim” gibi her ifade (Türkçe/İngilizce, yazım hatalı da) piyasa taramasına gider. Tarama seçilen piyasadaki tüm enstrümanlara bakar (fiyat ve likidite kapısı, Kaçın elemesi, elde olanlar hariç) ve altı ayrı taramadan (model puanı, ucuz ve kaliteli, güçlü trend, düşük risk, temettü, fonlarda olmayan sektör) kısa liste çıkarır; kurul bu listeden oylar. Cevaptan sonra kurul eksik bilgiyi sorar (piyasa, süre, risk, tutar, hangi fon; satışta “neden?”, VİOP'ta teminat, fonda hedef); seçiminizle yeniden tarar ve oylar. Tutar satırı artık gerçek maliyeti gösterir; Türkçe sayı ekleri düzeltildi.

183. **[yapıldı v2.17]** **Kurula 66 hazır soru, fon teşhisi, satış listesi, al-sat ve önce-soru akışı:** Dokuz grupta 66 hazır soru (Fonlarımız, Ne satmalı, Ne almalı, Al ve sat, Tek hisse, VİOP, Piyasa ve para, TEFAS, Vergi ve hukuk); hepsi Türkçe ve İngilizce test edildi. Yeni soru türleri: tüm fonların teşhisi (önce toplam: yoğunlaşma, ortak hisseler, mevduata göre durum, TL koruması, boşta nakit, Kaçın sinyalleri; sonra her fon ayrıntılı: değer, getiri ve mevduat, ana sorun, tüm kırmızı/sarı kontroller, Pointer'ın çözümü), bu hafta ne satılmalı (uyarı ve stop, mevduatın gerisinde, kâr al, yoğunlaşma, planlanan çıkış; her aday için satış oyu, adet ve tutar), ne alınmalı ne satılmalı / neyi neyle değiştirmeli (satış adayları + piyasa taraması + değişim çiftleri), odaklı taramalar (temettü, düşük risk, güçlü trend, ucuz ve kaliteli, yeni sektör, kısa/uzun vade). Eksik kritik bilgi varsa kurul önce sorar (piyasa, tutar, süre, risk); cevaplar tercih profili olarak hatırlanır, “değiştir” ile sıfırlanır, “Varsayılanlarla şimdi toplan” ile beklemeden toplanır. İngilizce soru ayrıştırma düzeltildi (ABD kodlarıyla çakışan kelimeler: low, has, cash, gold…).

184. **[yapıldı v2.18]** **Fon içi değişim (hisse ↔ mevduat ↔ döviz):** Fonun “İçerik ve İşlem” sekmesine “⇆ Hisse · Mevduat · Döviz” düğmesi eklendi. Kaynak olarak açık bir hisse/fon/altın satırı, TL nakit, USD nakit veya açık bir mevduat; hedef olarak hisse/fon/altın, TL nakit, dolar, TL vadeli mevduat veya USD vadeli mevduat seçilir. Gerekli adımlar (satış, Ziraat kuruyla çevirme ve %0,2 KMV, mevduat açma veya bozma, alış) aynı tarihte tek seferde deftere yazılır; önizleme önce/sonra dağılımını gösterir; vadeden önce bozmada faiz kaybı seçilebilir; geri alınabilir. Ayrıca fon kayıtlarındaki “Undo” düğmesinin kayıttan sonra çalışmaması hatası düzeltildi.

185. **[yapıldı v2.19]** **Telefonda alım-satım düğmelerinin görünür olması:** Al, Sat, Değiştir ve “Hisse · Mevduat · Döviz” düğmeleri yalnızca “İçerik ve İşlem” sekmesindeydi; telefonda fon “Özet” sekmesinde açıldığı için görülmüyordu. Düğmeler artık fonun sekmelerinin hemen altında her sekmede görünür (telefonda iki sütun, kaydırırken üstte sabit kalır); ayrıca Fonlarım’daki her fon kartına “⇆ Sat / değiştir” düğmesi eklendi.
186. **[yapıldı v2.20]** **Fon alım-satımında geri alma:** Geri alma yalnızca 7 saniyelik “Undo” bildirimindeydi; mevduat ve döviz çevirme işlemleri değişiklik geçmişine hiç yazılmıyordu. Artık fonun işlem satırında ve fon kartında kalıcı, onaylı, adım adım çalışan “↶ Geri al” düğmesi vardır; tüm fon işlemleri geçmişe kaydedilir.
187. **[yapıldı v2.21]** **İşlem penceresinde otomatik fiyat, uyarılı elle giriş ve onay ekranı:** Fiyat varsayılan olarak piyasa / kapanış fiyatından otomatik gelir ve adet ↔ tutar birbirinden hesaplanır; kullanıcı isterse adet, fiyat ve tutarı elle girer. Fiyat piyasadan %10’dan fazla saparsa yüzde ve TL farkıyla uyarı verilir. Tüm fon işlemleri “Emin misiniz?” ekranında işlem ve sonuçları gösterildikten sonra “Onayla ve kaydet” ile gerçekleşir.
188. **[yapıldı v2.23]** **Üst alanın tek satıra inmesi:** Piyasa durumu ve veri zamanı tek ince satırda; “Ana para TRY” kalkar. Telefonda içerik daha yukarıdan başlar.
189. **[yapıldı v2.23]** **Uyarıların tek yerde toplanması:** Okunmamış mesaj ve veri uyarısı yalnızca zil rozetinde gösterilir; “Bugün ne yapmalı” kutusundaki tekrar ve ayrı kırmızı ışık kalkar.
190. **[yapıldı v2.23]** **Piyasa kartlarının sadeleşmesi:** Puan yalnızca halkada; renk yalnızca karar etiketinde; “Fona ekle” üzerine gelince veya kart menüsünde.
191. **[yapıldı v2.23]** **Ayırt edici puan ölçeği:** 98–100 yığılması yerine liste içi sıra (ilk %5) veya harf notu (A+/A/B…).
192. **[yapıldı v2.23]** **Hazır listelerin iki seviyeye ayrılması:** En sık 4–5 liste görünür, kalanlar “Diğer listeler ▾” altında; hiçbir liste kaldırılmaz.
193. **[yapıldı v2.23]** **Fon başlığındaki düğmelerin gruplanması:** Düzenle görünür; PDF/Word/Factsheet “Rapor ▾”; Sil ve Fonu kapat “⋯” menüsünde.
194. **[yapıldı v2.23]** **Tutarlı sayı yazı tipi:** Tüm sayılarda tabular rakamlı tek yazı tipi; sütunlar hizalı.
195. **[yapıldı v2.23]** **Işıkların tek anlamı:** Yeşil normal, sarı dikkat, kırmızı müdahale; yanıp sönme yalnızca bugün yapılacak bir iş varken.
196. **[yapıldı v2.23]** **Veri ışığının nedenini söylemesi:** “Fiyatlar 8 gün önce güncellendi” gibi açıklama; 1 günden eski sarı, 1 haftadan eski kırmızı.
197. **[yapıldı v2.23]** **Sade ve kısa geçişler:** 150–200 ms solma; kayma/sıçrama yok; sistemde “hareketi azalt” açıksa animasyon kapalı.
198. **[yapıldı v2.23]** **Değişen değerin kısa vurgusu:** Güncellenen fiyat/NAV yaklaşık 1 sn yeşil/kırmızı zeminle vurgulanır.
199. **[yapıldı v2.23]** **İskelet yükleme görünümü:** Veri gelirken kutuların gri iskeletleri; düzen kaymaz.
200. **[yapıldı v2.23]** **Kısa ve işlevli açılış ekranı:** Logo + “Fiyatlar yükleniyor… 2/4”; en fazla ~1 sn; sonraki açılışlarda yalnızca veri yoksa.
201. **[yapıldı v2.23]** **Özet sayfasının tek ana bilgiyle açılması:** En üstte büyük toplam varlık, bugünkü değişim, mevduata göre fark; altında “Bugün yapılacaklar”; takvim ve gün sonu notu katlanır.
202. **[yapıldı v2.23]** **Tutarlı dil:** Seçili dilde bütün metinler aynı dilde (ör. döviz çevirme kaydı, Factsheet).
203. **[yapıldı v2.23]** **Terimlerin tek tıkla açıklanması:** Alfa, Sharpe, Oynaklık vb. için tutarlı ? simgesi; tek cümle + somut örnek.
204. **[yapıldı v2.31]** **Fon sağlık halkaları:** Apple Watch tarzı üç iç içe halka: mevduata göre getiri, risk bütçesi kullanımı, çeşitlendirme. Fonun durumu tek bakışta okunur.
205. **[yapıldı v2.31]** **Zaman makinesi kaydırıcısı:** Fon sayfasının altında tarih kaydırıcısı; sürüklendikçe NAV, dağılım ve kâr/zarar o güne akıcı biçimde döner.
206. **[yapıldı v2.31]** **Servet nehri:** Özet’te fon bileşiminin zaman içindeki değişimini gösteren akış (streamgraph) grafiği; durağan pasta yerine.
207. **[yapıldı v2.31]** **Beklenti yelpazesi:** Tek tahmin sayısı yerine hedef tarihe uzanan güven bantlı yelpaze grafiği; hedef çizgisi ve “hedefe ulaşma olasılığı %”.
208. **[yapıldı v2.31]** **Fon röntgeni ağaç haritası:** Fon içeriği ağırlığa göre boyutlanan, kâr/zarara göre renklenen kareler; dokununca içine inilir.
209. **[yapıldı v2.31]** **Getiri takvim ısı haritası:** Fonun günlük getirisi GitHub tarzı takvim karelerinde; iyi ve kötü dönemler bir bakışta.
210. **[yapıldı v2.31]** **Piyasa saatine göre ortam tonu:** Üst şeridin rengi BIST seansına göre çok hafif değişir (açılış öncesi, açık, kapalı); akşam sistem koyu moddaysa koyu tema. Ayarlara seçenek eklenmez.
211. **[yapıldı v2.31]** **Sayaç tarzı sayı geçişi:** NAV ve toplam varlık değiştiğinde rakamlar sayaç gibi kayarak yeni değere geçer (hareketi azalt açıksa kapalı).
212. **[yapıldı v2.31]** **Günün hikâyesi (telefon):** Açılışta kaydırılabilir 4–5 kart: toplam varlık, en çok kazandıran/kaybettiren, bugün yapılacaklar, yaklaşan olaylar.
213. **[yapıldı v2.31]** **Onayda dokunsal ve görsel geri bildirim:** İşlem onaylanınca kısa bir onay işareti animasyonu ve telefonda hafif titreşim.
214. **[yapıldı v2.31]** **Paylaşılabilir fon kartı:** Fonun özetini (getiri, mevduata göre fark, dağılım) şık bir PNG kart olarak indirme; tutarlar isteğe bağlı gizlenir.
215. **[yapıldı v2.31]** **Komut paleti:** Ctrl K araması eylem de alır: “THYAO sat”, “mevduat aç”, “GNC II’yi aç”; ilgili pencere dolu açılır.
216. **[yapıldı v2.31]** **Korelasyon ağı:** Fondaki varlıkların birbirleriyle ilişkisi ağ grafiği; birlikte hareket edenler yakın ve kalın çizgiyle — çeşitlendirmenin görsel kanıtı.
217. **[yapıldı v2.31]** **Kurumsal tipografi ve marka:** Logo turuncusu yalnızca vurgu rengi; başlıklar için ince ve geniş bir display yazı tipi, metin için okunaklı sans; 4–6 boyutlu net tipografi ölçeği.
218. **[yapıldı v2.23]** **Logonun sıfırdan oluşması:** Açılışta keçi logosunun hatları SVG ile boş ekrandan çizilir, ardından turuncu dolgu ve “GNC” yazısı belirir (~0,9 sn). Çizimin ilerlemesi veri yüklemesine bağlıdır: logo tamamlandığında veri hazırdır.
219. **[yapıldı v2.31]** **Logo ailesi:** Tek renk monogram, küçük boyutta okunur sade favicon, açık/koyu tema varyantları; turuncu yalnızca vurgu.
220. **[yapıldı v2.31]** **Yaşayan logo:** Piyasa açıkken logoda çok hafif bir nabız, veri eskiyse logo griye döner; logo durum göstergesi olarak da çalışır.
221. **[yapıldı v2.25]** **“Ya olursa” simülatörü:** Kaydırıcılarla BIST (−%30…+%30), USD/TRY ve faiz değiştirilir; fonun değeri ve kalemleri canlı çubuklarla tepki verir.
222. **[yapıldı v2.25]** **Olası yollar grafiği:** Monte Carlo’nun 200 olası yolu ince çizgiler, ortanca kalın çizgi, hedef çizgisi ve “hedefe ulaşma olasılığı %”.
223. **[yapıldı v2.25]** **Geriye dönük oynatıcı:** “Bu fonu 2018’de kursaydım” — oynat düğmesiyle grafik zamanla çizilir; kur şoku, pandemi gibi krizler işaretlenir.
224. **[yapıldı v2.25]** **Kriz kartları:** 2018 kur şoku, 2020 pandemi, Aralık 2021 gibi senaryolarda fonun kaybı ve toparlanma süresi kart hâlinde.
225. **[yapıldı v2.31]** **Odak modu:** Tek dokunuşla yalnızca toplam varlık, bugünkü değişim ve bugün yapılacaklar görünür.
226. **[yapıldı v2.31]** **Tutarları gizle:** Üst çubukta göz simgesiyle tüm tutarlar ••• olur, yüzdeler kalır; kalabalık ortamda kullanım için.
227. **[yapıldı v2.31]** **Sistem tercihine uyum:** Cihazda büyük yazı veya yüksek kontrast açıksa uygulama kendiliğinden uyar; Ayarlara seçenek eklenmez.
228. **[yapıldı v2.31]** **Tek durum küresi:** Üst çubukta piyasa, veri ve fonların ortak durumunu gösteren tek küre; dokununca nedenler listelenir.
229. **[yapıldı v2.31]** **Fon kartında ışık yerine renk çubuğu:** Kartın sol kenarında mevduata göre durumu gösteren ince renk çubuğu; parlama yok.
230. **[yapıldı v2.31]** **Takvim nabzı:** TCMB, TÜİK gibi yaklaşan önemli günler takvimde ve özet satırında yalnızca son 48 saatte hafifçe vurgulanır.
231. **[yapıldı v2.22]** **Sekme yerleşimi sorunu:** Telefonda fonun sekmeleri (Özet, İçerik ve İşlem, Pointer, Geçmiş) satıra sığmıyor ve “Basit görünüm” düğmesi sekme satırında kesiliyor; sekmeler tam görünür hâle getirilecek, görünüm düğmesi sekme satırından çıkarılacak.
232. **[yapıldı v2.24]** **Yönetim Kurulu: net cevap ve süreç:** En üstte tek karar kutusu (ör. “THYAO’nun %30’unu sat — güven: orta”), 3 maddelik gerekçe, “Bunu uygula” düğmesi (işlem penceresi dolu açılır); süreç adımları Soru → Veri → Tartışma → Oylama → Karar ilerleme çubuğuyla; oy dağılımı tek çubuk; tartışma ayrıntısı katlanır.
233. **[yapıldı v2.24]** **Pointer: görselli ve kolay analiz:** Her bulgu bir cümle + bir grafik: mevduata göre fark iki çubuk, risk kadranı, yoğunlaşma halka grafiği, “ne yapmalı” tek düğme; teknik terim yok, gerekirse ? ile açıklanır.
234. **[yapıldı v2.22]** **Ekran görüntüsünden fon içi işlem:** Fonda “📷 Ekran görüntüsünden ekle”: aracı kurum emir ekranı yüklenir; yalnızca tarayıcı içinde (Tesseract.js OCR, görüntü cihazdan çıkmaz) sembol, yön, tarih-saat, adet, fiyat, para birimi, ücret ve toplam çıkarılır; toplam kontrolü yapılır (ör. NVIDIA limit satış 0,18 × 135,20 $ − 1,50 $ = 22,83 $); işlem penceresi dolu açılır ve onay ekranından sonra fona işlenir. Örnek görüntü test olarak eklenir.
235. **[yapıldı v2.24]** **Masaüstünde animasyonlar çalışmıyor:** İşletim sisteminde animasyon efektleri kapalıyken uygulama bütün animasyon ve geçişleri kapatıyordu; uygulama artık bu sistem ayarından bağımsız olarak animasyonları gösterir.
236. **[yapıldı v2.25]** **Ekran görüntüsünden talimat alınamıyor:** “📷 Ekran görüntüsünden” düğmesi v2.22’de yalnızca İçerik sekmesindeki eski işlem çubuğuna eklenmişti; v2.23’ten sonra görünen işlem çubuğunda bulunmadığı için özellik kullanılamıyordu. Düğme görünen çubuğa taşındı; ayrıca fon sayfasına görüntü yapıştırma (Ctrl+V) ve sürükleyip bırakma eklendi.
237. **[yapıldı v2.26]** **Bankayla eşitle (mutabakat):** Fonda “Bankayla eşitle” düğmesi: bankanın/aracı kurumun ekranındaki toplam değer, nakit bakiye ve her kalemin adedi girilir (veya portföy ekranının görüntüsü/raporu okunur). Uygulama farkı kalem kalem ve nedeniyle gösterir (adet farkı, fiyat zamanı, kur alış/satış farkı, mevduat faizi ve stopaj, eksik temettü/bölünme, ücret). Her fark için tek tıkla düzeltme önerir: eksik işlemi kaydet, adedi düzelt, nakit düzeltme kaydı ekle, değerlemede bankanın fiyatını/kurunu kullan. Son eşitleme tarihi fon başlığında görünür.
238. **[yapıldı v2.33]** **Banka hesap dökümü içe aktarma:** Bankanın internet/mobil şubesinden indirilen hesap hareketleri (Excel/CSV/PDF ekstre) ve mevduat/yatırım hesabı dökümü tarayıcıda okunur; dosya hiçbir yere gönderilmez. Para girişleri, çıkışları, faiz, döviz alım-satımı ve fon/hisse işlemleri tanınıp fona önerilir; daha önce girilenler atlanır; kullanıcı onaylamadan hiçbir şey kaydedilmez. Desteklenecek bankalar için örnek ekstre gerekir. Doğrudan banka bağlantısı (açık bankacılık) lisans gerektirdiğinden bu yol izlenir.
239. **[yapıldı v2.26]** **Ekran görüntüsüyle eşitleme (kullanıcının tercihi):** Kullanıcı ekstre yerine ekran görüntüsü göndermeyi tercih ediyor. Birden çok görüntü aynı anda yüklenir veya yapıştırılır; her görüntünün türü tanınır: portföy/hesap özeti (kalemler, adet, değer, nakit), mevduat hesabı (anapara, faiz, vade), döviz hesabı, işlem geçmişi ve emir detayı. Okunanlar tek tabloda uygulamadaki fonla karşılaştırılır (237) ve eksik işlemler tek tıkla önerilir; aynı işlem iki kez kaydedilmez. Okuma tarayıcıda yapılır, görüntü hiçbir yere gönderilmez. Bankalara göre okuma kuralları kullanıcının örnek görüntüleriyle ayarlanır.
240. **[yapıldı v2.27]** **Güncellemelerin aksamadan çalışması:** Takvim her 30 dakikada bir güncelleme ister, ancak GitHub zamanlanmış çalışmaları büyük ölçüde atlıyor (26–27 Kasım'da günde 2–3 çalışma; borsa saatlerinde 12 saate varan boşluk). Çözüm: her çalışma bittiğinde, borsa saatlerindeyse bir sonrakini kendisi başlatır (workflow_dispatch, GITHUB_TOKEN ile); böylece fiyatlar gün içinde yaklaşık 30 dakikada bir tazelenir. Zamanlanmış çalışma yedek olarak kalır.
241. **[yapıldı v2.27]** **Adı değişen / borsadan çıkan BIST hisseleri:** KOZAL, KOZAA, IPEKE, DOBUR, METUR, MARKA, SELGD, SNKRN, YGYO, DMLKT ve benzerleri Yahoo'da artık bulunmuyor (HTTP 404); fiyatları donuk kalıyor (19 BIST hissesi 4 günden eski). Yeni kodlar eşlenir (örn. KOZAL → TRALT), gerçekten çıkanlar "işlem görmüyor" olarak işaretlenir; fonda tutuluyorsa kullanıcıya bildirilir. Yahoo'da olmayanlar için İş Yatırım fiyatı yedek kaynak olur.
242. **[yapıldı v2.27]** **Yedek fiyat kaynağının onarılması:** Toplu fiyat (Yahoo quotes) çalışmadığında devreye giren "spark" yedeği HTTP 400 veriyor (istek başına sembol sınırı düşmüş). Parça boyutu küçültülür; böylece ana kaynak düştüğünde fiyatlar 2.000 ayrı istek yerine birkaç toplu istekle gelir.
243. **[yapıldı v2.27]** **Nasdaq-100 üyelik listesi:** Endeks üyeliği kaynağı Nasdaq-100 için 0 üye okuyor; sayfa yapısı değişmiş. Ayrıştırıcı düzeltilir, bulunamazsa son geçerli liste korunur.
244. **[yapıldı v2.27]** **Veri tazeliğinin görünmesi:** Her güncellemede sınıf başına "bugün / 1–4 gün / daha eski" fiyat sayısı ve çalışmayan kaynaklar derleme günlüğüne yazılıyor (v2.26 sonrası eklendi); aynı özet uygulamada fiyat tarihi eski olan varlıkların listesiyle gösterilir.
245. **[yapıldı v2.27]** **Puanın karara yansıması (kullanıcı: "puanlar hep olumlu, gösterge olmuyor"):** 19 Kasım verisiyle ölçüldü: puan 0–100 arasında düzgün dağılıyor, fakat karar mutlak beklenen getiriye bakıyor. BIST'te piyasa beklentisi (%51,7) mevduatı (%41,5) her durumda geçtiği için puanı 0–20 olan hisseler dahil 645 hissenin 644'ü "12 ay tut" görünüyor; ABD'de ise 1.275 hissenin tamamı "kaçın". Çözüm: renk ve karar, hissenin kendi katkısına (BIST 100'e / S&P 500'e göre beklenen fark, puan beşlisinden) göre verilir; piyasa beklentisi ayrı bir satırda gösterilir. Bantlar: 80+ "Güçlü al adayı", 60–80 "Olumlu", 40–60 "Nötr", 20–40 "Zayıf", 0–20 "Sat adayı"; elde tutulan zayıf hisseler için uyarı çıkar.
246. **[yapıldı v2.27]** **ABD puanının kanıt düzeyi:** Geriye dönük testte ABD hisselerinde puan beşlileri arasında getiri farkı çok küçük (6 ayda en iyi ile en kötü arası ~1 puan; BIST'te ~7 puan). ABD puanı "zayıf kanıt" olarak etiketlenir veya yeniden ayarlanır; kanıtı zayıf olan puan kararda daha az ağırlık alır.
247. **[yapıldı v2.32]** **Puanın sınanması ekranda:** Geçmişte verilen puanların sonrasında ne olduğu (puanı yüksekler endeksi geçti mi, düşükler geride kaldı mı) aylık bir tabloyla gösterilir; puanın güvenilirliği kullanıcıya rakamla görünür.
248. **[yapıldı v2.27]** **Açılış hızı:** Sayfa açılışta view.json (14,6 MB) ve series.json (17,8 MB) indiriyor. Liste ve özet için gereken küçük bir dosya önce yüklenir; fiyat geçmişi yalnızca açılan varlık ve tutulan varlıklar için, gerektiğinde çekilir. Açılış süresinin belirgin kısalması beklenir.
249. **[yapıldı v2.27]** **Tek bakışta fon ekranı:** Fonun Özet sekmesi en üstte üç rakam (değer, mevduata göre fark, risk) ve tek bir "şimdi yapılacak" önerisiyle başlar; diğer paneller kapalı başlar ve açıldığında yüklenir. Hiçbir araç kaldırılmaz.
250. **[yapıldı v2.27]** **Renk dilinin tutarlılığı:** Yeşil yalnızca alternatifinden (mevduat veya endeks) iyi olanı, kırmızı yalnızca kötü olanı gösterir; mutlak getiri pozitif diye yeşil gösterilmez. Bütün ekranlarda aynı kural uygulanır.
251. **[yapıldı v2.28]** **Türkçe ekranda kalan İngilizce metinler:** Bütün ekranlar taranarak Türkçe görünümde kalan 28 İngilizce metin (fon "Satırlar ve çıkış planı" notu, piyasa ve kurum araştırması açıklamaları, puan açıklaması, hedef ve risk notları, grafik açıklaması, "BIST equity", "by" vb.) Türkçeye çevrildi.
252. **[yapıldı v2.28]** **Türkçe sektör adları:** Isı haritası, piyasa tablosu ve X-ray'deki İngilizce sektör adları (Finance, Retail Trade, Non-Energy Minerals…) Türkçe gösterilir; aynı sektörün büyük/küçük harf farklı yazımları da aynı adı alır.
253. **[yapıldı v2.28]** **Piyasa tablosunda tek karar:** Tablonun son sütunu her hisseye "Al" yazıyordu; artık kartlardaki kararın aynısı (Al adayı / İzle / Kaçın) renkli etiketle gösterilir.
254. **[yapıldı v2.28]** **Beklenti sütunları renksiz:** "Bekl. 6 ay" ve "Beklenen" sütunları yeşil/kırmızı gösterilmez (tahmin, sonuç değildir); yargıyı karar ve puan bandı taşır.
255. **[yapıldı v2.28]** **Hisse sayfasında çelişki giderildi:** Dolar hisselerde görülen "Avoid — TL mevduat daha çok kazandırıyor" ifadesi "Mevduatın altında" olarak değiştirildi; "Kaçın" yalnızca kararın kendisi için kullanılır. Üst çubuktaki ışık sayaçlarının önüne "Dikkat" yazıldı ve her rengin anlamı ipucunda açıklandı.
256. **[yapıldı v2.30]** **Görünüm seçici (Ayarlar'a dokunmadan):** Üst çubuktaki ⋯ menüsünde "Görünüm": 12 tema (yeni: Gece mavisi, Orman, Kum, Okyanus, Mürdüm, Yüksek kontrast), 7 yazı tipi (yeni: Atkinson Hyperlegible, Nunito), yazı boyutu, grafik renkleri (Canlı, Pastel, Renk körü dostu, Toprak), kazanç/kayıp renkleri (mavi/turuncu seçeneği) ve köşe biçimi. Bu tarayıcıda saklanır.
257. **[yapıldı v2.30]** **Fon simülasyonu — deneme işlemi:** Fonun al/sat çubuğunda "🧪 Simüle et"; Simülasyonlar panelinin ilk sekmesi "Deneme işlemi". Alış/satış yazılır veya öneriden seçilir (zayıf hisseyi sat, bugünün al adayları); fonun şimdi ve sonra beklenen getirisi, mevduata göre farkı, riski, risk başına getirisi, hisse seçiminin endekse göre katkısı, en büyük tek kalemi ve dağılımı gösterilir. "Fona uygula" işlem girişini dolu açar.
258. **[yapıldı v2.30]** **Ana ekrandan ekran görüntüsü veya rapor:** Özet ve Fonlarım'da "📥 Ekran görüntüsü veya rapor" düğmesi; fon açık değilken yapıştırma ve sürükleyip bırakma da çalışır. Emir görüntüsü hisseyi tutan fona bağlanır (bilet dolu açılır); portföy/geçmiş/mevduat görüntüsü o fonun "Bankayla eşitle" paneline gider; hisse sayfası da açılabilir. PDF/CSV raporda, rapordaki hisseleri tutan fon "Mevcut fona ekle" olarak önceden seçilir.
259. **[yapıldı v2.30]** **What If Manager:** Her fonun Geçmiş sayfasında ve her hisse/döviz sayfasında kendi logosuyla: gün gün kâr, aynı paranın vadeli mevduatta getireceği kâr, fonun tamamı / kalem kalem / tek kalem görünümü, "Bunun yerine…" (mevduat, dolar, altın, BIST 100, S&P 500 veya yüksek puanlı hisseler) ve "Bir de bunu ekleseydim…" senaryoları, üzerine gelince tarih tarih değerler; "Şunu dene": aynı günlerde daha iyi olacak seçenekler (geriye dönük) ve bugünün al adayları (simülasyonda denenir). Elde olmayan hisse için tarih ve tutar seçilerek "alsaydım" hesabı.
260. **[yapıldı v2.30]** **Deck ve Sub deck:** Üst sekmeler "Deck", ikinci sıra "Sub deck" olarak adlandırıldı. Her Deck, Sub deck ve fon sayfası sekmesinde küçük simge ve rozet (yapılacak iş sayısı, açık fon, zayıf hisse, kayıt sayısı, getiri, fon kararı); fon sayfasında fonun baş harfleriyle renkli küçük logo, hisse sayfasında sınıf simgesi ve puan bandı rozeti.
261. **[seçildi 2026-11-28, sırada]** **Yeniden dengeleme bekçisi:** Her fon için hedef ağırlıklar belirlenir; bir kalem hedeften belirli bir oranda saptığında bildirim gelir ve dengeyi geri getiren işlemler (vergi ve masraf dahil) hazır gelir.
262. **[seçildi 2026-11-28, sırada]** **Hisse karşılaştırma ekranı:** 2–4 hisse yan yana: fiyat grafiği, puan bandı, temel göstergeler, What If kârı ve risk; "hangisi?" sorusuna tek ekranda cevap.
263. **[seçildi 2026-11-28, sırada]** **Kayıtlı senaryolar:** What If ve deneme işlemi senaryoları adıyla kaydedilir; zamanla "senaryom tuttu mu?" karnesi çıkar.
264. **[seçildi 2026-11-28, sırada]** **Temettü planlayıcı:** Gelecek temettü takvimi, yıllık temettü geliri tahmini ve temettülerin yeniden yatırılması simülasyonu.
265. **[öneri]** **Haftalık otomatik rapor:** Her pazar fonların haftası tek sayfalık PDF olarak hazır olur (isteğe bağlı Telegram ile gönderilir).
266. **[seçildi 2026-11-28, sırada]** **Risk profili anketi:** 6–8 soruluk anketle risk toleransı belirlenir; öneriler, risk bütçesi ve hedef planlayıcı buna göre ayarlanır.
267. **[seçildi 2026-11-28, sırada]** **Aracı kurum maliyet karşılaştırması:** Komisyon, saklama ve döviz makası farklarıyla aynı işlemlerin hangi kurumda kaça mal olacağı.
268. **[seçildi 2026-11-28, sırada]** **Fiyat alarmı merkezi:** Her hisse için fiyat, puan bandı değişimi ve haber alarmları tek listede; bildirimlerle bağlı.

## Kullanıcının ekledikleri
(boş)
