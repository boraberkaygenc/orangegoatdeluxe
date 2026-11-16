# orangegoat Deluxe

Kişisel yatırım uygulaması: BIST, ABD hisseleri, TEFAS fonları, gram altın, nakit/mevduat ve VİOP; fon simülasyonu,
stres testi, raporlar. İnternet adresinden açılır, tarayıcıdan **uygulama olarak yüklenir**; bilgisayara program kurmak gerekmez.

**Adres:** https://boraberkaygenc.github.io/orangegoatdeluxe/

## v2.8: Ziraat Bankası kurları
- Fondaki dolar (USD nakit, USD mevduat, döviz çevirme kalemleri, cüzdan) Ziraat Bankası'nın günlük gişe **döviz satış** kuruyla TL'ye çevrilir; değer ve getiri (ROI) bu kura endekslidir. Yanında parantez içinde **alış** kuruyla değer (doları bugün bankaya satsanız eline geçecek tutar) ve getiri gösterilir; fon başlığında da aynı ayrım vardır.
- Döviz çevirme penceresi kuru kendiliğinden doldurur: TL → USD için Ziraat **satış**, USD → TL için **alış** kuru.
- Çevirme satırı ödenen gerçek kuru gösterir ve sonucu ikiye ayırır: o günün Ziraat satış kuruna göre fark ve o günden beri kur hareketi.
- Döviz çevirmede **KMV** (kambiyo muamele vergisi) ayrı alandır: TL ile döviz alırken %0,2 olarak kendiliğinden hesaplanır, değiştirilebilir; satırın maliyetine ve getirisine, fonun toplamına ve Masraflar raporuna (BSMV / KMV sütunu) girer.
- Kur ile TL ve döviz tutarları birbirini tutmazsa (%0,2'den fazla) pencere uyarır ve tek tıkla üç düzeltme önerir: alınan tutar, çevrilen tutar ya da kur. Uyarıya rağmen kaydetmek için Kaydet'e ikinci kez basılır.
- **Dekonttan doldur:** Ziraat Bankası döviz alış/satış dekontu (PDF) yüklendiğinde ya da metni yapıştırıldığında tarih, kur, tutarlar, KMV ve masraf okunup pencere doldurulur. Dekonttan yalnızca tutarlar, kur, tarih ve referans alınır; IBAN, hesap ve vergi numarası saklanmaz. Dekont ana içe aktarma ekranına yüklenirse kullanıcı doğru pencereye yönlendirilir.
- Kurlar günde iki kez ve her açılışta (1 saatten eskiyse) alınır; son iki yılın günlük kurları kademeli olarak doldurulur. Kur yayımlanmayan günlerde son kur, hiç kur yoksa piyasa kuru × Ziraat'in olağan alış/satış oranı kullanılır. ABD hisseleri piyasa kuruyla değerlenmeye devam eder.

## v2.6: Pointer

Analiz › Pointer (veya hisse sayfasındaki “Pointer ile incele”), bir enstrümanı analist kontrol listesi gibi inceler: gelir ve kâr sürücüleri, kârın nakde dönüşümü, bilanço stres testi, emsallere göre değerleme, rekabet avantajı, fiyatın ima ettiği büyüme (ters İNA), ayı/baz/boğa senaryoları, geri alım ve sulanma, 90 günlük katalizör takvimi ve isteğe bağlı “tezini çürüt”. Her bulgu rakam, dönem ve kaynak bağlantısıyla gelir; veri yoksa açıkça söyler. Tarama bölümü kriterlere uyan BIST veya ABD hisselerini listeler. Veriler: ABD için SEC EDGAR, BIST için İş Yatırım mali tabloları (gece güncellemesi, data/fund.json).

## v2.5: fon düzenleme ve teşhis

Fon “Düzenle” penceresi artık fondaki her kalemi (hisse, fon, altın, mevduat, nakit, döviz çevirisi, VİOP, para giriş/çıkışı) tarihiyle gösterir ve düzenletir; fonun kuruluş tarihi değiştirilebilir. Tüm tutar alanlarında virgül binlik, nokta ondalık ayırıcıdır; virgül yazılmazsa uygulama ekler. Fon genel bakışındaki “Teşhis: sorun → çözüm → sonuç” bölümü fonun ana sorununu, bunu gideren işlemleri (adet ve TL ile) ve işlem öncesi/sonrası rakamları gösterir; “Taslak işlem olarak uygula” işlemleri onaya hazır açar. İyileştir sekmesindeki “Öneri karnesi” her önerinin 1, 3 ve 6 ay sonraki sonucunu izler.

## v2.4: tavsiye katmanı

Hisse sayfası artık “Ne kadar tutmalı” (maliyet ve vergi sonrası mevduata göre en iyi süre) ve “Yanına ne eklemeli” bölümlerini gösterir. Her fonun genel bakışında “Bu fon değer mi?” kararı ve iyileştirme listesi yer alır. Piyasalar › VİOP’ta “Tutulması gereken net pozisyon” tablosu trend ve taşımaya göre kontrat sayısını, teminatı ve zarar kes seviyesini önerir.

## v2.3: puanlama v3

Hisse puanı artık 2017–2026 BIST ve ABD verisiyle yapılan geriye dönük testte en iyi sonucu veren yöntemle hesaplanır: sinyaller grup içinde sıralanıp sınırlı normal puana çevrilir, değer ve kalite sektör içinde karşılaştırılır, toplam puan şirket büyüklüğünden arındırılır, fiyat sinyallerinin ağırlıkları her hafta kalibrasyonda yeniden öğrenilir. Ayrıntı: Analiz › Model › “Puan nasıl hesaplanıyor”. Piyasalar sekmesindeki “Yükselenler” paneli kısa vadeli yükselişleri, geçmişte nasıl sonuçlandıklarını gösteren etiketlerle listeler.

## v2.1 yenilikleri
- **Emtialar:** altın, gümüş, platin, paladyum, bakır, Brent ve WTI petrol, doğalgaz; gram gümüş; borsadaki altın ve gümüş fonları (GLDTR, ZGOLD, ISGLK, GMSTR). Tarama ekranında **Emtia** sekmesi.
- **Her enstrüman için getiri öngörüsü:** 1, 3, 6, 12 ay ve tutma süresi sonu; maliyet ve vergi sonrası beklenen getiri, olası aralık, mevduatı geçme olasılığı.
- **VİOP öngörüsü:** vadeye kadar senaryolar, başabaş, teminat çağrısı fiyatı, taşıma ve vade devri. Dolar bazlı sözleşmeler artık TL’ye çevrilerek değerlenir.
- **Fon:** “Para ekle” gerekmez — girilen işlem paranın var olduğu anlamına gelir. Her kalem fon kartından, fon ekranından ve enstrüman sayfasından düzeltilir veya hiç girilmemiş gibi kaldırılır; **değişiklik geçmişi** ile önceki her hâle dönülür.
- **Kırılımlar:** varlık sınıfı, gizli döviz riski, risk katkısı, getiri kaynağı, vade merdiveni, yoğunlaşma, duyarlılık, likidite.
- **Yatırım iyileştirici:** hedef (mevduatı geç, sermayeyi koru, dolar bazında büyü, en yüksek getiri), maliyet ve vergi farkındalığı, kalem başına sınır, yeni para, stres kontrolü, önce/sonra, “neden”, koruma (hedge), mevduat merdiveni, hedef dağılım ve sapma uyarısı.
- **Ana sayfa:** toplam varlık (TL ve USD), fon dışı hesaplar için **Para ekle**, “Bugün ne yapmalıyım?”, ısı haritası, gün sonu notu, açılışta acil uyarılar.
- **Kullanım:** terimlerin yanında “?” açıklaması, **Basit / Uzman** görünüm, telefon düzeni, “Ya şöyle olursa” kaydırıcıları, tek sayfalık **Factsheet**.
- **Görünüm:** Ayarlar › Görünüm’de **Private Banking** ve **Bloomberg Terminal** temaları; yazı tipi, köşeler, rakam boyutu ve istenen vurgu rengi. Yeni keçi logosu.

## Kurulum (bir kez)
1. Adresi **Edge** veya **Chrome** ile açın.
2. Adres çubuğundaki “Uygulamayı yükle” simgesine (veya Ayarlar › “Bu tarayıcıdaki verileriniz” › **Uygulama olarak yükle**) tıklayın.
   Uygulama kendi penceresinde açılır; Başlat menüsünde ve görev çubuğunda yer alır. Android’de: Chrome menüsü › **Uygulamayı yükle**.
3. Bilgisayardaki eski sürümden geçiyorsanız: Ayarlar › **Bu tarayıcıdaki verileriniz** › **Geri yükle / bilgisayar sürümünden aktar** ve
   eski klasördeki `data\store.json` dosyasını seçin. Fonlarınız, işlem defteriniz, günlüğünüz ve ayarlarınız aktarılır.

## Verileriniz
- Fonlar, işlem defteri, günlük ve ayarlar **yalnızca bu cihazdaki tarayıcıda** tutulur; hiçbir yere gönderilmez.
- Aracı kurum raporları (Ak Yatırım İşlem Sonuç Formu, Midas, diğer PDF/CSV) **tarayıcıda okunur**; dosya hiçbir yere gönderilmez.
- Düzenli olarak **Yedek indir** düğmesiyle yedek alın. Başka bir cihazda kullanmak için yedeği orada geri yükleyin.

## Piyasa verisi
- GitHub Actions iş günleri 09:00–23:30 arasında yaklaşık 30 dakikada bir (GitHub zaman zaman geciktirebilir) ve her gece tam güncelleme yapar.
- Kaynaklar: Yahoo Finance, TEFAS, TCMB EVDS, Borsa İstanbul (VİOP gün sonu dosyaları), KAP, SPK, SEC, İş Yatırım.
- TCMB EVDS anahtarı depo ayarlarında **EVDS_KEY** adlı “secret” olarak saklanır (Settings › Secrets and variables › Actions); kodda veya sayfada yer almaz.

## Bilgisayar sürümü
Aynı kod bilgisayarda da çalışır (Node.js 18+): `node launcher/gnc.mjs --setup` — ayrıntılar `README.txt` dosyasında.

## Geliştirme
`engine.js`, `reports.js`, `deluxe.js`, `ui-deluxe.js` dosyaları `node tools/build-page.mjs` ile `public/index.html` içine gömülür.
GitHub sürümü `tools/static-build.mjs` ile üretilir (`tools/static/`: tarayıcı veri katmanı ve service worker).
