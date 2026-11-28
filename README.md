# orangegoat Deluxe

Kişisel yatırım uygulaması: BIST, ABD hisseleri, TEFAS fonları, gram altın, nakit/mevduat ve VİOP; fon simülasyonu,
stres testi, raporlar. İnternet adresinden açılır, tarayıcıdan **uygulama olarak yüklenir**; bilgisayara program kurmak gerekmez.

**Adres:** https://boraberkaygenc.github.io/orangegoatdeluxe/

## v2.34: Dengeleme, karşılaştırma, senaryolar, temettü, risk profili, kurum maliyeti, alarmlar

- **Yeniden dengeleme bekçisi:** Fonun İçerik ve İşlem sayfasında hedef ağırlıklar; bir kalem bandın dışına çıkınca yapılacaklar listesinde uyarı ve "Şimdi dengele" ile dolu işlem girişi.
- **Hisse karşılaştırma:** ⋯ menüsünden, hisse sayfasındaki "Karşılaştır"dan veya Ctrl K "karşılaştır THYAO GARAN" ile 2–4 hisse yan yana.
- **Kayıtlı senaryolar:** What If ve deneme işlemi senaryoları kaydedilir; Model karnesi'nde "senaryo mu daha iyi çıktı, olduğu gibi mi" karnesi.
- **Temettü planlayıcı:** Fonun Geçmiş sayfasında önümüzdeki 12 ayın temettüleri ve 5 yılda yeniden yatırma ile nakit almanın farkı.
- **Risk profilim:** Yedi soruluk anket; risk bütçesi ve hedef planlayıcının varsayılanı buna göre ayarlanır.
- **Aracı kurum maliyetleri:** Son 12 ayın işlemleri, girdiğiniz her kurumun tarifesiyle fiyatlanır.
- **Alarm merkezi:** Piyasalar › İzleme'de fiyat, puan bandı ve duyuru alarmları; bildirimlerle bağlı.

## v2.33: Eşitleme, kilit, bildirim, banka ekstresi

- **Cihazlar arası şifreli eşitleme:** ⋯ › Cihazlar arası eşitleme. Veriler parolanızla bu cihazda AES-256 ile şifrelenir; size ait gizli bir GitHub Gist'e veya bir dosyaya gider, öbür cihazda aynı parolayla açılır.
- **Banka ekstresi:** Fonlarım'da "🏦 Banka ekstresi" (veya ⋯ menüsü). CSV dosyası ya da yapıştırılan tablo okunur; satırlar para girişi/çıkışı, faiz, masraf, döviz, mevduat olarak tanınır; daha önce kaydedilenler işaretlenir; seçilenler fona tek seferde eklenir.
- **Bildirimler:** Tarayıcı/telefon bildirimi ve isteğe bağlı kendi Telegram botunuz; yalnızca uyarı metni gider, tutarlar gizlenir.
- **Uygulama kilidi ve acil durum dosyası:** PIN (ve destekleyen cihazda Windows Hello / parmak izi); güvendiğiniz kişi için varlık listesi ve hesap notlarıyla tek sayfalık dosya.
- **Tarihli temel veriler:** Veri işi her ay kâr verimi, defter/fiyat ve ROE'yi saklar; değer sinyalinin testi Model karnesi'nde, aylar biriktikçe dolar.

## v2.32: Hedef planlayıcı, vergi yardımcısı, puan karnesi

- **Hedef ve emeklilik planlayıcı:** Fonlarım'da; hedefe ulaşma olasılığı, %50 ve %80 olasılık için gereken aylık tutar, yelpaze grafiği, aylık hatırlatma.
- **Vergi yardımcısı:** Masraf ve vergi Sub deck'inde; yıl yıl gerçekleşen kazanç (ilk giren ilk çıkar, ABD hisselerinde gün kuru ve %10 üstü Yİ-ÜFE endekslemesi), temettü ve kesilen vergi; Excel (CSV) ve PDF.
- **Puan tutuyor mu?:** Model karnesi'nde her ayın en iyi ve en kötü puanlı hisselerinin sonrasındaki getirisi ve 2017–2026 testi.
- **Temettüye göre düzeltilmiş getiri:** Getiri ve risk istatistikleri temettüyü de sayar.

## v2.31: Görseller ve kolay kullanım

- **Fon:** Sağlık halkaları, beklenti yelpazesi ve hedefe ulaşma olasılığı, fon haritası (ağaç harita), getiri takvimi, zaman makinesi, korelasyon ağı, paylaşılabilir PNG kartı.
- **Özet:** Servet nehri, odak modu, tutarları gizle (göz simgesi), tek durum küresi, fon kartında renk çubuğu, takvimde 48 saat vurgusu, telefonda günün hikâyesi.
- **Her yerde:** Ctrl K ile komut ("THYAO sat", "mevduat aç", "odak"), işlem onayında onay işareti ve titreşim, borsa seansına göre üst çubuk tonu, yaşayan logo, tek renk favicon, sistemde yüksek kontrast veya büyük yazı açıksa uyum.

## v2.30: What If Manager, Deck'ler, görünüm seçici, fon simülasyonu

- **What If Manager:** Her fonun Geçmiş sayfasında ve her hisse/döviz sayfasında: gün gün kâr, aynı paranın vadeli mevduatta getireceği kâr, kalem kalem görünüm, "Bunun yerine…" ve "Bir de bunu ekleseydim…" senaryoları, "Şunu dene" önerileri.
- **Deck ve Sub deck:** Üst sekmeler Deck, alt sekmeler Sub deck; her birinde simge ve rozet. Fon ve hisse sayfalarında küçük logo.
- **Görünüm:** ⋯ menüsünde tema, yazı tipi, yazı boyutu, grafik renkleri, kazanç/kayıp renkleri ve köşe biçimi (Ayarlar değişmedi).
- **Fon simülasyonu:** "🧪 Simüle et" ile işlemleri yapmadan önce deneyin; şimdi/sonra karşılaştırması ve "Fona uygula".
- **Ana ekrandan içe aktarma:** Özet ve Fonlarım'dan ekran görüntüsü veya rapor; hisseyi tutan fona bağlanır.

## v2.28: Daha kolay okunur ekranlar

- **Tamamen Türkçe:** Bütün ekranlar taranarak Türkçe görünümde kalan İngilizce metinler (fon çıkış planı notu, araştırma ve puan açıklamaları, hedef ve risk notları, grafik açıklaması) çevrildi; sektör adları da Türkçe.
- **Tek karar dili:** Piyasa tablosu artık her hisseye "Al" yazmıyor; kartlardaki "Al adayı / İzle / Kaçın" kararını gösteriyor. Hisse sayfasındaki "Kaçın" ifadesi, kastedilen anlamla "Mevduatın altında" olarak değiştirildi.
- **Beklentiler renksiz:** Beklenen getiri sütunları yeşil/kırmızı gösterilmiyor; iyi/kötü yargısını karar ve puan bandı taşıyor.
- **Üst çubuk:** Işık sayaçlarının önünde "Dikkat" yazıyor; üzerine gelince her rengin anlamı görünüyor.

## v2.27: Daha taze veri, ayırt eden puanlar, sade fon ekranı

- **Güncellemeler aksamıyor:** GitHub zamanlanmış çalışmaların çoğunu atladığı için borsa saatlerinde (hafta içi 09:00–23:30) her güncelleme, başladıktan yaklaşık 30 dakika sonra bir sonrakini kendisi başlatır. Zamanlanmış çalışma yedek olarak kalır.
- **Fiyatı gelmeyen BIST hisseleri:** Yahoo'da bulunamayan hisselerin günlük kapanışı İş Yatırım'dan alınır. Beş gün hiçbir kaynaktan fiyat gelmezse hisse "işlem görmüyor" olarak işaretlenir; fonda tutuluyorsa yapılacaklar listesinde uyarı çıkar.
- **Yedek fiyat kaynağı ve Nasdaq-100 listesi onarıldı:** Toplu yedek istek 20 sembollük parçalarla yapılır; Nasdaq-100 üye listesi sayfa düzeni değişse de okunur.
- **Puanlar artık ayırt ediyor:** Hissenin rengi ve kararı, puanının endekse (BIST 100 / S&P 500) göre 12 ayda getirmesi beklenen farka göre verilir; mutlak getiri pozitif diye yeşil gösterilmez. Puan beş bantta gösterilir (Çok güçlü, Güçlü, Nötr, Zayıf, Çok zayıf) ve not halkası bandın rengini alır. ABD puanı "zayıf kanıt" olarak işaretlenir.
- **Fon kararı ikiye ayrıldı:** "Bu fon değer mi?" paneli beklenen getiriyi "piyasadan gelen" ve "hisse seçiminden gelen" olarak ayırır; elde tutulan zayıf hisseler gösterilir ve değiştirilmesi önerilir.
- **Tek bakışta fon:** Fon değerinin hemen altında tek satırlık "Şimdi" önerisi yer alır.
- **Veri tazeliği:** Üst satırdaki veri ışığına tıklandığında her piyasa için fiyatların ne kadar yeni olduğu ve fiyatı eski olan elde tutulan varlıklar gösterilir; kaynak hatalarının nedeni de artık görünür.
- **Daha hızlı:** Piyasa verisi dosyası yaklaşık üçte bir küçüldü; açık sayfa veriyi yalnızca yeni bir güncelleme yayımlandığında yeniden indirir.

## v2.26: Bankayla eşitle

- Fonun işlem çubuğunda “⚖ Bankayla eşitle” düğmesi vardır; İçerik ve İşlem sekmesinde aynı adlı panel açılır.
- Banka veya aracı kurum uygulamasının ekran görüntüleri birden çok olarak seçilir, yapıştırılır (Ctrl+V) veya sürüklenir. Her görüntü bu cihazda okunur ve türü tanınır: portföy/bakiye ekranı, mevduat, işlem geçmişi, emir detayı. Görüntü hiçbir yere gönderilmez.
- Kalem kalem tablo: uygulamadaki adet ve değer, bankadaki adet ve değer (okunan veya elle yazılan), fark ve olası neden. Nedenler: adet farkı (eksik alış/satış, bölünme), fiyat zamanı, dolar varlıklarda kur farkı, nakit farkı (kaydedilmemiş para girişi/çıkışı, ücret, temettü), mevduatta bankanın yalnız anaparayı veya stopaj öncesi faizi göstermesi.
- Her fark için tek tıkla düzeltme: eksik alış/satış işlem penceresini, nakit farkı para girişi/çıkışı penceresini, fonda olmayan mevduat mevduat açma penceresini dolu olarak açar. İşlem geçmişi ve emir görüntülerindeki işlemler deftere göre kontrol edilir; defterde olmayanlar “Kaydet” ile eklenir, olanlar “defterde var” diye işaretlenir. Onaylanmadan hiçbir şey kaydedilmez.
- Banka toplamı girildiğinde farkın ne kadarının satırlarla açıklandığı ve ne kadarının açıklanmadığı gösterilir. “Eşitlemeyi kaydet” tarihi ve farkı saklar; fonun Özet sekmesinde “Bankayla son eşitleme” satırı görünür.

## v2.25: Ekran görüntüsünden işlem yeniden çalışıyor ve simülasyonlar

- Ekran görüntüsü düzeltmesi: “📷 Ekran görüntüsünden” düğmesi yalnızca gizli kalan eski işlem çubuğundaydı; artık her sekmede görünen Al / Sat / Değiştir çubuğundadır. Aracı kurumun emir ekranı görüntüsü fon sayfasına yapıştırılabilir (Ctrl+V) veya sürüklenip bırakılabilir; işlem penceresi açılır, görüntü cihazda okunur ve alanlar doldurulur. Kayıt yine kullanıcının onayıyla yapılır.
- Simülasyonlar (fonun Pointer sekmesinde, tek panel, dört bölüm):
  - Ya olursa: BIST 100, Dolar/TL ve TL faizi kaydırıcılarıyla fonun değeri ve her kalemin çubuğu canlı olarak büyür ve küçülür; “2018 tipi şok”, “TL değer kaybeder” gibi hazır seçenekler vardır.
  - Olası yollar: Monte Carlo’nun 200 olası yolu ince çizgilerle (hedefin üstünde bitenler yeşil, altında bitenler kırmızı), ortanca yol kalın çizgiyle ve hedef çizgisiyle çizilir; büyük yazıyla “hedefe ulaşma olasılığı %” gösterilir. Fonun yıllık hedef getirisi varsa hedef odur, yoksa mevduattır.
  - Geçmişte: “Bu fonu 2018’de kursaydım” — yıl seçilip Oynat’a basılınca fonun değeri zamanla çizilir; aynı paranın dolarda tutulması da gösterilir, krizler işaretlenir ve çizgi oradan geçerken yanar.
  - Krizler: 2018 kur şoku, 2020 pandemi, Aralık 2021 kur şoku ve Mart 2025 piyasa şokunda fonun (bugünkü dağılımıyla) kaybı, toparlanma süresi ve küçük bir grafik kart hâlinde.
- Uzun geçmiş: Yayın aşaması, her varlık için 2015’ten bu yana haftalık kapanışları küçük ayrı dosyalara yazar (data/long); sayfa bunları yalnızca Geçmişte ve Krizler açıldığında, yalnızca fondaki varlıklar için yükler.

## v2.24: Kurulun net cevabı, resimli Pointer ve masaüstünde animasyonlar

- Masaüstü düzeltmesi: İşletim sisteminde “animasyon efektleri” kapalı olduğunda (Windows’ta sık görülür) tarayıcı “azaltılmış hareket” bildiriyordu ve uygulama bütün animasyon ve geçişleri kapatıyordu. Bu kural kaldırıldı; açılış logosu, sekme geçişleri, sayfa ve pencere geçişleri, ışıklar ve Kurul tartışması her bilgisayarda çalışır.
- Yönetim Kurulu: En üstte tek karar kutusu bulunur (ör. “Al — Güven: yüksek · 15 oyun 11’i”). Altında üç maddelik sade gerekçe, oyların tek renkli çubukta dağılımı ve “Bunu uygula →” düğmesi vardır; düğme işlem penceresini sembolle dolu açar. Süreç “Soru → Veri → Tartışma → Oylama → Karar” adımlarıyla ilerleme çubuğunda gösterilir. Masa, konuşmalar ve oylar “Tartışmanın ayrıntısı” altında katlanır; tartışma oynarken açılır, karar çıkınca kendiliğinden katlanır.
- Fon Pointer’ı: Üç kart, her biri bir cümle ve bir grafikle: “Mevduata göre” (fon ve mevduat için iki çubuk), “Ne kadar oynar” (sakin–sert kadranı ve tipik yıllık oynama tutarı TL olarak), “Dağılmış mı?” (kalemlerin payını gösteren halka). Altında “Ne yapmalı” satırı ve tek düğme (“Çözümü göster (3 işlem)”) bulunur; düğme çözüm tablosuna götürür ve onu vurgular. Teknik kontrol listesi “Tüm kontroller” altında katlıdır; “Risk (yıllık 1σ)” yerine “Yıllık dalgalanma” yazılır.

## v2.23: Sadeleştirme ve sıfırdan çizilen logo

- Açılışta keçi logosu boş ekrandan çizilir: önce çerçeve ve turuncu dolgu, sonra boynuzlar, yüz, en son gözler, sakal ve “GNC” yazısı. Çizim yükleme adımlarıyla ilerler (“Fiyatlar yükleniyor… 3/4”); veri hazır olunca açılış ekranı yaklaşık 1 saniyede kapanır, en geç 2,6 saniyede çekilir. Sonraki açılışlarda açılış ekranı gösterilmez; üst çubuktaki küçük logo kendini çizer.
- Üst alan tek ince satırdır: veri ışığı nedenini yazar (“Fiyatlar 8 gün önce güncellendi”; 1 günden eski sarı, 1 haftadan eski kırmızı), USD/TRY ve fon sayısı. “Ana para TRY” ve komut ipucu kaldırıldı. Okunmamış mesajlar yalnızca zil rozetinde gösterilir.
- Özet sayfası tek ana bilgiyle açılır: toplam varlık, bugünkü değişim ve mevduata göre fark en üstte; altında “Bugün dikkat” ve “Bugün ne yapmalıyım?”; takvim (sıradaki olay başlıkta) ve gün sonu notu katlıdır, açılan durum hatırlanır.
- Piyasa kartları: puan yalnızca halkada ve piyasa içi sıraya göre harf notuyla gösterilir (A+ = ilk %5, A = ilk %15, B = ilk %35, C = ilk %65, D = kalanı; altında “ilk %3” gibi). Ayrı “puan 100” etiketi ve renkli kart kenarı kalktı, renk yalnızca karar etiketinde. “Fona ekle” bilgisayarda kartın üzerine gelince görünür.
- Hazır listelerin ilk beşi görünür; kalanlar ve geçmişte etkisiz listeler “Diğer listeler ▾” altındadır. Hiçbir liste kaldırılmadı.
- Fon başlığı: “Düzenle” görünür; Fon bülteni (eski adıyla Factsheet), PDF ve Word “Rapor ▾”, “Fonu sil…” ve “Fonu kapat” “⋯” menüsündedir.
- Tüm sayılar aynı yazı tipinde ve eşit genişlikli rakamlarla gösterilir; sütunlar hizalıdır.
- Işıkların tek anlamı vardır; yanıp sönme yalnızca bugün yapılacak bir iş varken olur, piyasa açık ışığı artık nabız atmaz.
- Geçişler kısa solmadır (150–180 ms, kayma yok); cihazda “hareketi azalt” açıksa animasyonlar kapanır. Toplam varlık ve fon değerleri değiştiğinde yaklaşık 1 saniye yeşil/kırmızı vurgulanır. İlk veri gelirken gri iskelet kutular gösterilir.
- İşlem metinleri (döviz çevirme, mevduat, temettü vb.) seçili dilde yazılır. Terimlerin yanındaki “?” tek cümlelik açıklamanın altında somut bir örnek de verir (Alfa, Sharpe, Oynaklık, Beta, En büyük düşüş, VaR vb.).

## v2.22: Ekran görüntüsünden işlem, telefonda sekmeler

- Fonun işlem penceresinde “📷 Ekran görüntüsünden doldur”: aracı kurumun emir/gerçekleşme ekranının görüntüsü seçilir veya yapıştırılır; görüntü yalnızca bu cihazda okunur (Tesseract.js, Türkçe + İngilizce, hiçbir yere gönderilmez). Sembol, alış/satış, gerçekleşme tarihi ve saati, adet, fiyat, para birimi, ücret ve toplam çıkarılır; toplam kontrol edilir ve pencere doldurulur. Ücret dolar ise o günün kuruyla TL’ye çevrilir. Kaydetmeden önce “Emin misiniz?” ekranı gelir.
- “Örnekle dene” düğmesi, fondaki bir varlık için uydurma bir emir ekranı çizip aynı yolu gösterir. Fon sayfasında “📷 Ekran görüntüsünden” düğmesi de vardır.
- Telefonda fonun dört sekmesi tek satıra sığar; “Basit görünüm” düğmesi sekme satırından fon başlığına taşındı. Kaydırırken sekmelerin altında tek satırlık işlem çubuğu (Al, Sat, Değiştir, Çevir, ↶) sabit kalır ve fon başlığı artık içeriğin üstüne binmez.

## v2.21: Fiyat otomatik, elle giriş uyarılı, her işlemde onay ekranı

- Al / Sat / Değiştir penceresinde fiyat varsayılan olarak otomatiktir: bugün için piyasa fiyatı, geçmiş tarih için o günün kapanışı kullanılır ve fiyat kutusu kilitlidir. Satışta adet veya “Satış tutarı (TL)” yazılır; diğeri fiyattan hesaplanır.
- “Elle gir” seçilirse adet, fiyat ve tutar ayrı ayrı girilir (tutar yazılınca fiyat hesaplanır). Girilen fiyat piyasa / kapanış fiyatından %10’dan fazla saparsa kırmızı uyarı çıkar: farkın yüzdesi ve bu işlemde kaç TL tuttuğu yazılır, “Bu mantıklı bir hesap görünmüyor” denir.
- Her işlemde (Al, Sat, Değiştir ve Hisse · Mevduat · Döviz değişimi) önce “Emin misiniz?” ekranı gelir: yapılacak işlem, satış tutarı, maliyet, kâr/zarar, vergi tahmini, nakit kullanımı, varsa uyarı ve fon dağılımının önce → sonra hâli gösterilir. İşlem yalnızca “Onayla ve kaydet” ile yapılır; “Geri dön, düzelt” forma döner.

## v2.20: Fon alım-satımında kalıcı “Geri al” düğmesi

- Fonun Al / Sat / Değiştir satırında (her sekmede) ve Fonlarım’daki fon kartında “↶ Geri al” düğmesi vardır; fondaki son işlemi (alış, satış, değişim, mevduat, döviz çevirme, düzeltme) geri alır. Yanlışlıkla basmaya karşı ikinci dokunuşta onay ister ve neyin geri alınacağını yazar.
- Art arda basılarak işlemler sondan başa doğru tek tek geri alınabilir; her geri alma Değişiklik geçmişine ve günlüğe yazılır. Kaydetmeden sonra çıkan kısa bildirimdeki düğme de artık “Geri al” yazar ve 12 saniye ekranda kalır.

## v2.19: Telefonda satış ve değişim düğmeleri her yerde

- Fon açıldığında Al, Sat, Değiştir ve “Hisse · Mevduat · Döviz” düğmeleri hangi sekme seçili olursa olsun sekmelerin hemen altında görünür; telefonda büyük, iki sütunlu düğmeler olarak gösterilir.
- Fonlarım’daki her fon kartında “⇆ Sat / değiştir” düğmesi vardır; fonu açar ve değişim penceresini doğrudan getirir.

## v2.18: Fon içinde hisse, mevduat ve döviz arasında değişim

- Fonun “İçerik ve İşlem” sekmesindeki “⇆ Hisse · Mevduat · Döviz” düğmesiyle fondaki bir hisseyi, nakdi, doları veya mevduatı tek işlemde başka birine çevirebilirsiniz (örneğin hisse → vadeli mevduat, mevduat → hisse, TL → dolar, dolar → hisse).
- Gereken tüm adımlar (satış, Ziraat kuruyla çevirme, mevduat açma/bozma, alış) aynı tarihte fonun defterine yazılır; yatırılan ana para değişmez, yalnızca masraf ve kur farkı yansır. İşlem “Undo” ile geri alınabilir.

## v2.17: 66 hazır soru, fonların teşhisi, satış listesi ve önce-soru akışı

- “Fonlarımızın sorunu ne?”, “Bu hafta ne satmalıyım?”, “Hangi hisseleri almalı, hangilerini satmalıyım?” gibi yeni soru türleri; dokuz grupta 66 hazır soru, Türkçe ve İngilizce.
- Eksik bilgi varsa kurul önce sorar; cevaplarınız tercih profili olarak hatırlanır.

## v2.16: Kurul piyasayı tarıyor ve size soru soruyor

- “Hangi hisseyi alayım / ekleyeyim?” soruları (Türkçe veya İngilizce) gerçek bir piyasa taramasına gider: tüm enstrümanlar, altı farklı tarama, kısa liste ve kurul oylaması.
- Kurul cevaptan sonra piyasa, süre, risk, tutar ve fon gibi eksik bilgileri sorar; seçtiğiniz cevapla yeniden tarar ve oylar.

## v2.15: Yönetim Kurulu sorulara doğrudan cevap veriyor ve konuşulabiliyor

- Her soru kendi cevabını alır (ne kadar süre, giriş ve stop, zarar/kâr durumu, temettü, halka arz, altın vadeli mi gram altın mı, fonun zayıf halkası, fonun mevduatı geçme olasılığı, faiz kararı, bu hafta).
- General Counsel yalnızca ilgili bir hukuki veya vergisel konu varsa konuşur.
- Kurulla konuşma: devam soruları, karara itiraz ve yeniden oylama, üyeye tıklayıp yalnız ona soru.

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
