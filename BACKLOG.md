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

## Kullanıcının ekledikleri
(boş)
