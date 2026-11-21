# orangegoat Deluxe

Kişisel yatırım uygulaması: BIST, ABD hisseleri, TEFAS fonları, gram altın, nakit/mevduat ve VİOP; fon simülasyonu,
stres testi, raporlar. İnternet adresinden açılır, tarayıcıdan **uygulama olarak yüklenir**; bilgisayara program kurmak gerekmez.

**Adres:** https://boraberkaygenc.github.io/orangegoatdeluxe/

## v2.14: Yönetim Kurulu ve daha çok ışık

- Yeni üst sekme “Yönetim Kurulu”: 13 yatırımcı modeli (Buffett, Munger, Graham, Lynch, Druckenmiller, Marks, Dalio, Simons, Soros, Mobius, Greenblatt, Thorp, Bogle), Risk Officer ve CFO oy verir (15 oy, basit çoğunluk; eşitlikte başkan temkinli tarafı seçer), General Counsel SPK mevzuatı notu ekler, Executive Director oturumu yönetir. Hisse, karşılaştırma, VİOP (yön, kontrat, koruma, teminat çağrısı, vade dönümü), fon, para dağılımı, TEFAS fonu, sektör, gündem ve vergi/hukuk soruları; altı grupta yaklaşık 40 hazır soru. Toplantı masası, söz şeridi, itiraz yayları, meclis grafiği, karar kartı (“Bilete aktar”), tutanak ve üye karnesi.
- İsteğe bağlı yapay zekâ modu: Anthropic API anahtarı yalnızca tarayıcıda saklanır; tartışmayı Claude yazar, rakamlar uygulamadan gelir; hata olursa kural tabanlı kurul gösterilir.
- Işıklar: yedi renk (hemen bak, yakında karar, olay/alarm, fırsat, bilgi, Pointer önerisi, eski veri), üç tempo, yeni kurallar (52 hafta dibi/zirvesi, satırda %20 zarar, fon mevduatın gerisinde, tek satır %40'ı aşıyor, USD/TRY'de günde %2, VİOP teminat ve vade, planlanan çıkış, KAP, makro takvim, halka arz, hedef getiri), Özet'te “Bugün dikkat” şeridi, sekmelerde nokta, renge göre süzme, renk başına aç/kapat ve “Gördüm”.

## v2.13: tüm TEFAS fonları, sade sekmeler, tarih ve uyarı ışıkları

- TEFAS Nisan 2026'da veri adreslerini değiştirdi; uygulama yeni adreslere taşındı. TEFAS'ta işlem gören tüm yatırım fonları günlük fiyatlarıyla uygulamada; Piyasalar'daki “TEFAS fon rehberi” tüm yatırım ve emeklilik fonlarını tür, risk ve dönem getirisine göre listeler.
- Üst sekmelerde kayan ince alt çizgi, alt sekmelerde sade hap görünümü, sayfa geçişinde kısa solma.
- Üst çubukta gün, tarih ve İstanbul saati.
- Fonlarınızdaki, izleme listenizdeki ve alarmlarınızdaki önemli durumlar için yanıp sönen ışıklar (kırmızı: Kaçın, taban benzeri gün, stop'a yakın, sert düşüş; yeşil: hedef geldi, tavan benzeri gün, sert yükseliş; sarı: alarm). Zilin yanındaki sayaç nedenleri listeler; ışıklar oradan kapatılıp açılır.

## v2.12.1: düzeltme

- Fonlarım açıldığında fon kartlarının görünmemesi düzeltildi. Önceki sürümden kalan “son alt sekme” tercihi (Tüm varlıklar, Vergi vb.) artık yeni sekmelere çevrilmektedir.

## v2.12: fonda işlem, fonun Pointer’ı, sade sekmeler, yeni Piyasalar ve göstergeler
- **Sekmeler:** Üstte Özet · Fonlarım · Piyasalar · Pointer · Ayarlar. Fonlarım: Fonlar (Tüm varlıklar dahil) · Performans · Defter · Masraf ve vergi. Piyasalar: Enstrümanlar · İzleme · Makro · Duyurular (Araştırma, Deniz feneri, Halka arzlar). Pointer: Pointer (Karşılaştır dahil) · Model karnesi. Laboratuvar kaldırıldı; eski kısayollar yeni yerlerine gider.
- **Fon ekranı 4 sekme:** Özet · İçerik ve İşlem · Pointer · Geçmiş. Tekrarlayan ve eski paneller silinmedi, sekmenin altındaki kapalı “Ayrıntılar” bölümünde.
- **İşlem bileti:** fon açıkken Al, Sat ve Değiştir (birini sat, diğerini al). Satıştan gelen para fonda TL nakit olarak kalır; alım önce bu nakitten ödenir, kalanı yeni para olur — böylece değiştirme “yatırılan” tutarı şişirmez. Geçmiş tarih, komisyon ve BSMV, kâr/zarar ve vergi tahmini, önce → sonra dağılım çubukları. Alıştan önceki tarihe satış kabul edilmez.
- **Fonun Pointer’ı:** temel sorun (tek cümle), yedi kontrol kırmızı/sarı/yeşil (yoğunlaşma, mevduata karşı, boştaki nakit, birlikte hareket, riske göre getiri, uyarı sinyalleri, TL koruması) ve düzeltme reçetesi: hangi hisseden kaç adet al/sat, yeni ağırlık, beklenen getiri / risk / risk başına getiri okları, maliyet, artılar ve eksiler. “Başka bir fikir” sırayla: Pointer’ın önerisi · hisse çeşitlendirme · mevduata kısmi geçiş · altın / dolar koruması · VİOP ile koruma. Reçete tek tıkla işleme veya satır satır işlem biletine aktarılır.
- **Piyasalar:** varlık sınıfı kartları, sektör ısı haritası (gün/hafta/ay), hazır listeler kart veya tablo olarak (puana göre, zirvedeki güçlüler, kısa vadede en yüksek beklenen getiri, emsallerine göre ucuz, temettü, sakin, kalite, kaçın; ayrıca gösterge listeleri). Her kartta ▲ Al adayı / ● İzle / ▼ Kaçın işareti, nedenleri, puan halkası, 3 aylık grafik, beklenen aralık ve “Fona ekle”. Yükselenlerde “Süre” sütunu; yeni “Düşenler” paneli, her düşüşün 2017–2026’daki sonucuyla.
- **Göstergeler:** RSI, MACD, Bollinger, Stokastik, ADX, OBV, 50/200 günlük, destek/direnç; her enstrüman sayfasında ibreler, gösterge grafiği, son 30 günün sinyalleri ve her sinyalin geçmiş sonucu; sayfanın üstünde karar kartı (işaret, süre, beklenen 3 aylık aralık, en büyük risk). Pointer › Model karnesi’nde kanıt tablosu.
- **Araştırma:** research/GOSTERGELER.md — 646 BIST ve 1.276 ABD hissesinde 1,3 milyon sinyal (2017–2026) ve literatür. Ana bulgu: BIST’te aşırı satım alım sinyali değil; taban benzeri, hacimli ve 1 ayda −%25 düşüşler en güçlü “kaçın” sinyali; yeni zirveler en tutarlı olumlu sinyal. Kod: research/indicator-backtest.mjs, research/make-evidence.mjs.

## v2.11: dolar bazı ve yeni fon düzenleme ekranı
- Dolar bazında getiri (Ziraat satış kuruyla): her kalem ve fonun tamamı için “harcanan para o gün kaç dolar alıyordu, bugünkü değer bugün kaç dolar alıyor, fark ne”. USD mevduatı tam olarak net faizi kadar dolar kazanır; TL hisse, TL getirisinden doların yükselişi düşülmüş olarak görünür. USD mevduatının maliyeti açılış gününün Ziraat satış kuruyla hesaplanır.
- Fon düzenleme ekranı büyük, iki sütunlu bir pencere: solda fon ayarları (ad, tutma süresi, gerekçe, kuruluş tarihi, hedef yıllık getiri, renk etiketi, notlar) ve “Kayıt ekle” kartları; sağda tüm kayıtlar türe göre gruplanmış, ara toplamlı, filtre ve aramalı; emir planı altta katlanmış.
- Geri tarihli VİOP işlemi: listedeki sözleşmeler veya vadesi geçmiş bir sözleşme elle (kod, dayanak, çarpan, vade, para birimi); açılış ve isteğe bağlı kapanış, komisyon ve BSMV ile; sonuç kaydetmeden önce gösterilir.
- Hedef getiri ve notlar fon başlığında, renk etiketi fon kartında görünür.

## v2.10: hız, ikinci adım
- Fon açılırken gizli sekmelerdeki ağır paneller (Konsolide durum ve beklenti, Dönemsel getiri) önce iskelet olarak gelir, tarayıcı boşa çıkınca dolar; sekmesine tıklanırsa hemen dolar.
- Fare bir sekmenin üzerine geldiğinde (telefonda dokunuşta) o sekmenin bekleyen güncellemesi önceden yapılır.
- GitHub sürümü son gördüğü piyasa verisiyle anında açılır; yeni veri arkadan gelip yalnızca değişeni günceller.
- Ayarlar › Hız: son 20 sekme geçişi ve fon açılışının süresi (tıklamadan ilk kareye), hedefe göre (sekme 100 ms, fon 150 ms) ve en yavaş bölümler.

## v2.9: hız
- Sekme değiştirmek artık bütün uygulamayı yeniden çizmez: veri değişince yalnızca ekrandaki görünüm çizilir, gizli görünümler açıldıkları anda güncellenir. Sekme geçişinin ilk kareye kadar süresi: Özet 115–160 ms → 20–27 ms, Fonlarım 120–145 ms → 9–15 ms, Analiz 90–135 ms → 12–22 ms, Piyasalar 145–190 ms → 45–115 ms.
- Sayfanın tamamını dolaşan çeviri taraması yalnızca dil değiştiğinde çalışır; yeni metin göründükçe çevrilir.
- Piyasa ışığının nabız animasyonu ekran kartında çalışır: uygulama boştayken işlemciyi meşgul etmez.

## v2.8: Ziraat Bankası kurları
- Fondaki dolar (USD nakit, USD mevduat, döviz çevirme kalemleri, cüzdan) Ziraat Bankası'nın günlük gişe **döviz satış** kuruyla TL'ye çevrilir; değer ve getiri (ROI) bu kura endekslidir. Yanında parantez içinde **alış** kuruyla değer (doları bugün bankaya satsanız eline geçecek tutar) ve getiri gösterilir; fon başlığında da aynı ayrım vardır.
- Döviz çevirme penceresi kuru kendiliğinden doldurur: TL → USD için Ziraat **satış**, USD → TL için **alış** kuru.
- Çevirme satırı ödenen gerçek kuru gösterir ve sonucu ikiye ayırır: o günün Ziraat satış kuruna göre fark ve o günden beri kur hareketi.
- Döviz çevirmede **KMV** (kambiyo muamele vergisi) ayrı alandır: TL ile döviz alırken %0,2 olarak kendiliğinden hesaplanır, değiştirilebilir; satırın maliyetine ve getirisine, fonun toplamına ve Masraflar raporuna (BSMV / KMV sütunu) girer.
- Kur ile TL ve döviz tutarları birbirini tutmazsa (%0,2'den fazla) pencere uyarır ve tek tıkla üç düzeltme önerir: alınan tutar, çevrilen tutar ya da kur. Uyarıya rağmen kaydetmek için Kaydet'e ikinci kez basılır.
- **Dekonttan doldur:** Ziraat Bankası döviz alış/satış dekontu (PDF) yüklendiğinde ya da metni yapıştırıldığında tarih, kur, tutarlar, KMV ve masraf okunup pencere doldurulur. Dekonttan yalnızca tutarlar, kur, tarih ve referans alınır; IBAN, hesap ve vergi numarası saklanmaz. Dekont ana içe aktarma ekranına yüklenirse kullanıcı doğru pencereye yönlendirilir.
- Hareket: rakamlar sabit genişlikte durur; bir rakam ilk göründüğünde kısa bir belirme efekti, değeri değiştiğinde eski değerden yenisine sayma ve kısa yeşil/kırmızı parıltı alır; değişmeyen rakam sekmeye dönüşte yeniden canlandırılmaz. Paneller tarayıcıyı ek ölçüme zorlamadan kayarak gelir. “Hareketi azalt” ayarında efektler kapalıdır.
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
