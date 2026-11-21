# orangegoat Deluxe — fikir listesi

"build" denince yapılacaklar. Numarayla seçilebilir (ör. "build 1, 7, 15") veya "build hepsi".

## Sırada (kullanıcı seçti, 2026-11-14)
7–15, 17–21, 23–53 — v2.1’de yapıldı (2026-11-14).
Sırada (2026-11-15): 56, 58, 59, 60, 63, 64, 65, 66, 67, 70. Yeni sekme planı 71–80 onaylandı ve sırada (80 kullanıcı kararıyla değiştirildi).
(18: renk körlüğü seçeneği hariç. 22, 27’nin içinde.)


## Veri ve tahmin
1. Geçmiş bilançoları tarihli saklama → değer sinyalinin (kâr verimi, defter değeri) de test edilmesi
2. Temettüye göre düzeltilmiş fiyatlar (BIST getirilerinin doğru ölçülmesi)
3. TCMB Piyasa Katılımcıları Anketi ile mevduat faizi ve kur beklentisinin her ay otomatik güncellenmesi
4. Kişisel tahmin karnesi: her fon için "o gün ne tahmin edildi, ne oldu" kaydı
5. Piyasa rejimi tespiti (sakin / çalkantılı dönem) ile risk bantlarının ve sinyal ağırlıklarının döneme göre ayarlanması
6. Aracı kurum hedef fiyatları ve konsensüs ile model tahmininin yan yana gösterilmesi

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
16. Hedef tabanlı plan ("2 yılda 1 milyon TL": ulaşma olasılığı ve gereken aylık ekleme)

## Estetik
17. **[yapıldı v2.1]** Yazı sistemi: metinler tek bir sade yazı tipinde (ör. IBM Plex Sans / Inter), yalnızca rakamlar eşit genişlikli (tabular) mono; şu an kalem adları da mono
18. **[yapıldı v2.1]** Rakam hiyerarşisi: ana tutar büyük ve koyu, USD karşılığı küçük ve soluk; yeşil/kırmızı yalnızca değişimde
19. **[yapıldı v2.1]** Kutu içinde kutu yerine ince ayraçlar; 8 piksellik ızgara ile tutarlı boşluklar; panellerde daha fazla nefes alanı
20. **[yapıldı v2.1]** Tek grafik dili: aynı eksen, ızgara ve renkler; üzerine gelince artı imleçli ipucu; uç değer etiketleri; çakışan etiketlerin düzeltilmesi (fan grafiğindeki 290k/300k gibi)
21. **[yapıldı v2.1]** Varlık türü renkleri ve simgeleri: hisse, fon, altın, döviz, mevduat, VİOP her yerde aynı renk ve küçük çizgi simgeyle
22. Yeni tema "Private Banking": lacivert ve krem, ince altın vurgu, başlıklarda zarif serif; mevcut Paper / Slate / Terminal / Mono korunur
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
55. Cihazlar arası şifreli eşitleme (telefon + bilgisayar aynı veri; uçtan uca şifreli, kendi Google Drive / GitHub alanınızda)
56. **[yapıldı v2.2]** Temettü ve sermaye artırımları fonlara otomatik: temettü kaydı (brüt, stopaj, net), bedelsiz / bedelli / bölünme uyarlaması, temettü takvimi ve yıllık temettü geliri tahmini
57. Vergi / beyanname yardımcısı: yıl içi gerçekleşen kazançlar (ABD hisseleri için ÜFE endekslemesi, FIFO, TCMB kuru), temettü gelirleri, kesilen stopaj; PDF / Excel çıktısı
58. **[yapıldı v2.2]** Dönemsel performans tablosu: her fon için ay / çeyrek / yıl bazında zaman ağırlıklı (TWR) ve para ağırlıklı (XIRR) getiri; getirinin fiyat, temettü ve kur etkisine ayrılması
59. **[yapıldı v2.2]** Reel (enflasyondan arındırılmış) görünüm: her getirinin TÜFE’ye göre reel karşılığı ve “enflasyonu yendim mi” göstergesi
60. **[yapıldı v2.2]** Yeni varlık türleri: kripto (BTC, ETH), Eurobond / DİBS / özel sektör tahvili, BES fonları, fiziki altın (çeyrek, cumhuriyet), gayrimenkul ve araç (elle değerleme), borçlar (kredi, kart) → gerçek net varlık *(Kripto, kullanıcı kararıyla kapsamdan çıkarıldı.)*
61. Telefona bildirim: fiyat, hedef / zarar-kes, vade ve KAP uyarıları (kişisel Telegram botu veya web push; yalnızca sembol listesi paylaşılır)
62. Hedef ve emeklilik planlayıcı: aylık düzenli yatırım (DCA), hedef tutar / tarih, Monte Carlo ile ulaşma olasılığı, düzenli yatırım hatırlatıcısı
63. **[yapıldı v2.2]** Masraf analizi: yıl bazında ödenen komisyon, BSMV, fon yönetim ücreti; 10 yıllık birikimli etkisi ve daha ucuz alternatif önerisi
64. **[yapıldı v2.2]** Ekonomik takvim ve haber akışı: TCMB faiz kararı, enflasyon, ABD verileri; elde tutulan hisselerin KAP bildirimleri kısa özetlerle; olayın fona olası etkisi
65. **[yapıldı v2.2]** Fon içi “X-ray”: TEFAS fonlarının portföy dağılımı (KAP raporlarından) ile tüm fonlardaki gerçek hisse ve sektör maruziyeti
66. **[yapıldı v2.2]** Temel analiz kartı: değerleme (F/K, PD/DD sektöre göre), büyüme, borçluluk, temettü güvenliği — tek bakışta görsel özet
67. **[yapıldı v2.2]** “Ya bunun yerine şunu alsaydım?”: her alımın aynı tarihte BIST 100, altın, dolar veya mevduat ile karşılaştırması
68. Aracı kurum ekstrelerinin düzenli içe aktarımı: banka / aracı kurum şablonları, mükerrer kayıt tespiti, toplu içe aktarma
69. Uygulama kilidi (PIN / Windows Hello / parmak izi) ve güvenilir kişiye acil durum dosyası (varlık listesi, hesaplar)

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
93. Bugün sayfasının sadeleşmesi: eski “Bir bakışta / Gelen kutusu / Dünkü kapanıştan beri / Karar kontrolü / Son bakışınızdan beri / …” panelleri birleştirilir veya kaldırılır (72 ile birlikte); en üstte yalnızca 4–5 kart.
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

178. **Işıkların sayısı ve çeşitliliği:** 176'daki üç renk ve beş kurala ek olarak:
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

## Kullanıcının ekledikleri
(boş)
