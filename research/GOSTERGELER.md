# Teknik göstergeler: işe yarıyor mu? (araştırma, 19.11.2026)

## 1. Kendi testimiz (Borsa İstanbul ve ABD, Kasım 2017 – Kasım 2026)
- Veri: 646 BIST ve 1.276 ABD hissesi, günlük açılış/yüksek/düşük/kapanış ve hacim (temettü ve bölünmeye göre düzeltilmiş), Yahoo Finance.
- Evren: son 60 günün ortanca işlem hacmi BIST’te ≥ 30 milyon TL, ABD’de ≥ 20 milyon USD olan günler.
- Ölçüm: sinyal günü kapanışından sonraki 5/10/21/63 işlem günü getirisi − endeks getirisi (XU100 / S&P 500), aynı ayın rastgele bir hisse gününe göre fark. Aynı hissede 10 gün içinde tekrarlanan sinyal sayılmaz. t değeri aylık kümelere göre (|t| ≥ 2 anlamlı kabul).
- Toplam: BIST’te 213.008, ABD’de 1.105.850 sinyal.
- Sınırlar: Evren bugün işlem gören hisselerden oluştuğu için batıp kotasyondan çıkanlar yok (hayatta kalan yanlılığı); bu, özellikle olumsuz sinyalleri gerçekte olduğundan daha iyi gösterir. İşlem maliyeti (BIST gidiş-dönüş ≈ %0,25, ABD ≈ %0,10) tabloya dahil değildir.
- Kod ve tam sonuç: `indicator-backtest.mjs`, `indicator-backtest.json`, `indicator-backtest.txt`.

### BIST: 21 günlük sonuç (rastgele güne göre fark, isabet farkı, t)
| Sinyal | N | 5 gün | 21 gün | 63 gün | 2017–21 / 2022–26 | Karar |
|---|---|---|---|---|---|---|
| Tek günde −%9’dan sert düşüş (taban benzeri) | 3.534 | −4,6% | **−7,0%** (−6,4 p, t −6,3) | −6,7% | −2,5 / −8,0 | **Kaçın** |
| Hacim patlaması (3×) + düşüş günü | 1.957 | −3,8% | **−6,4%** (−11,2 p, t −6,4) | −8,0% | −3,6 / −6,9 | **Kaçın** |
| 1 ayda −%25 | 2.500 | −1,2% | **−3,1%** (t −5,2) | −4,1% | −1,4 / −3,3 | **Kaçın** (dönüş beklenmez) |
| Güçlü trendde tek gün sert düşüş (−%7) | 1.937 | −2,3% | **−2,9%** (t −3,6) | −3,5% | −1,2 / −3,3 | **Kaçın** |
| RSI14 70 üstü ama 200G altında | 338 | −1,4% | **−2,9%** (−8,3 p, t −2,2) | −6,6% | −1,9 / −3,1 | Kaçın |
| Hacim patlaması (3×) + yükseliş günü | 3.502 | −0,7% | **−2,0%** (t −4,2) | −3,6% | −1,6 / −2,1 | Kovalamayın |
| RSI14 30 altına indi (“aşırı satım”) | 3.150 | −0,9% | **−1,4%** (t −3,4) | −0,8% | +0,6 / −1,8 | Al sinyali **değil** |
| Bollinger alt bandı kırıldı | 6.387 | −1,0% | −0,7% (t −2,2) | −0,4% | −0,2 / −0,8 | Al sinyali değil |
| Yeni 52 hafta dibi | 1.683 | −1,1% | −1,0% (−7,2 p, t −1,9) | −0,7% | +1,1 / −1,2 | Zayıf, kaçın |
| Tek günde +%9 (tavan benzeri) | 5.489 | **+0,9%** | −0,6% (t −2,4) | −2,7% | −1,3 / −0,5 | En fazla 1 hafta; sonra geri verir |
| **Yeni 52 hafta zirvesi** | 5.588 | +0,7% | **+1,2%** (+4,0 p, t 1,2) | +1,6% | +1,2 / +1,2 | **Olumlu, 1–3 ay** (iki dönemde aynı) |
| 60 günlük zirve kırılımı | 4.416 | +0,7% (t 1,7) | +0,8% | +0,7% | +1,1 / +0,7 | Olumlu, zayıf |
| MACD al kesişimi, sıfır üstünde | 5.324 | +0,5% (t 2,0) | +0,4% (t 2,2) | +0,3% | +0,8 / +0,4 | Küçük; maliyet sonrası ≈ 0 |
| RSI14 70 üstü + 200G üstünde | 5.488 | +0,2% | +0,7% | +0,7% | +0,3 / +0,8 | “Aşırı alım = sat” **yanlış**; güç devam eder |
| Stokastik, ADX, OBV, altın/ölüm kesişimi, bant daralması, 200G kesişimi | — | ≈ 0 | ≈ 0 (|t| < 2) | ≈ 0 | tutarsız | **Geçmişte etkisiz** |

### ABD: neredeyse hiçbir sinyal maliyeti karşılamıyor
- Hafif kısa vadeli dönüş: RSI14 30 altı +0,36% (t 3,3), Bollinger alt bandı +0,29% (t 2,8) — 21 günde; isabet farkı 1–2 puan.
- Hafif zayıflık: RSI 70 üstü −0,2%, Bollinger üst bandı −0,2%, 200G altında RSI 70 üstü −1,9%.
- 52 hafta zirvesi, MACD, Stokastik, ADX, OBV, kesişimler: ≈ 0.

### Ana bulgu
**Aynı gösterge iki piyasada ters anlam taşıyor.** BIST’te “aşırı satım” göstergeleri (RSI < 30, Bollinger alt bandı, 1 ayda −%25) düşüşün **devam ettiğini** gösteriyor; ABD’de ise küçük bir tepki yükselişi geliyor. BIST’te sert, hacimli ve taban benzeri düşüşler en güçlü “kaçın” sinyali; zirve yakınlığı en tutarlı olumlu sinyal. Klasik osilatörlerin (Stokastik, ADX, OBV, MACD) iki piyasada da anlamlı katkısı yok.

## 2. Akademik literatür (özet)
| Gösterge | Kanıt | Kaynak |
|---|---|---|
| 12-1 momentum | Çalışıyor, ama ani çöküşlere açık | Jegadeesh & Titman 1993 (doi:10.1111/j.1540-6261.1993.tb04702.x); Daniel & Moskowitz 2016 (doi:10.1016/j.jfineco.2015.12.002) |
| 52 hafta zirvesine yakınlık | ABD hisselerinde 6–12 ay çalışıyor | George & Hwang 2004 (doi:10.1111/j.1540-6261.2004.00695.x) |
| Tek gün sıçrama (MAX / piyango etkisi) | Olumsuz sinyal olarak çalışıyor; **Türkiye’de güçlü**, bireysel yatırımcı kaynaklı | Bali, Cakici & Whitelaw 2011 (doi:10.1016/j.jfineco.2010.08.014); Alkan & Güner 2018 (doi:10.1016/j.intfin.2018.02.015) |
| Yüksek hacim primi | ABD ve 41 ülkede 1–4 hafta olumlu | Gervais, Kaniel & Mingelgrin 2001 (doi:10.1111/0022-1082.00349); Kaniel, Ozoguz & Starks 2012 |
| Kısa vadeli dönüş (1 ay) | Brüt var, maliyet sonrası yok olur; BIST’te karşıt stratejiler eski dönemde kârlı | Jegadeesh 1990; Novy-Marx & Velikov 2016; Bildik & Gülay 2007 |
| Hareketli ortalama kuralları (BLL, 200G, Faber) | ABD büyük hisselerde 1990 sonrası zayıf; asıl katkı düşüşü sınırlamak; BIST endeksinde daha iyi | Brock, Lakonishok & LeBaron 1992 (doi:10.1111/j.1540-6261.1992.tb04681.x); Faber 2007 (ssrn 962461); Ülkü 2009; Metghalchi vd. 2021 |
| RSI, MACD, Bollinger, Stokastik, ADX, OBV | Maliyet ve veri madenciliği düzeltmesi sonrası zayıf veya yok | Park & Irwin 2007 (doi:10.1111/j.1467-6419.2007.00519.x); Sullivan, Timmermann & White 1999; Bajgrowicz & Scaillet 2012 |
| Tavan/taban fiyat limitleri | Limite yaklaşan hisse limite çekilir (mıknatıs etkisi); fiyat keşfi gecikir | Aktaş, Kryzanowski & Zhang 2022 (doi:10.1108/IMEFM-04-2020-0151) |

Not: Hacim primi literatürde olumlu; bizim BIST testimizde ise **hacim patlamalı yükseliş günleri sonradan geri veriyor**. Bu, Türkiye’de bireysel yatırımcı kaynaklı “piyango” davranışıyla (Alkan & Güner 2018) uyumlu.

## 3. Uygulamaya yansıması
1. Göstergeler “al/sat oku” olarak değil, **durum + geçmiş sonuç** olarak gösterilir: “RSI 26 · BIST’te bu durumdan sonra 21 günde ortalama −1,4% (piyasaya göre), 3.150 örnek”.
2. Piyasaya göre ayrı yorum: aynı RSI değeri BIST’te “düşüş sürebilir”, ABD’de “kısa tepki olabilir” der.
3. **Kaçın** listesi (BIST): taban benzeri düşüş, hacimli düşüş, 1 ayda −%25, güçlü trendde sert düşüş, 200G altında aşırı alım.
4. **Olumlu** (BIST): yeni 52 hafta zirvesi, 60 günlük zirve kırılımı; önerilen tutma 1–3 ay.
5. **Kısa tut** (BIST): tavan benzeri gün — ilk hafta olumlu, 21 günde geri verir, 63 günde −2,7%.
6. Etkisiz göstergeler (Stokastik, ADX, OBV, kesişimler) “geçmişte etkisiz” etiketiyle yalnızca bilgi olarak; puana girmez.
7. Parametreler sabit (RSI 14, MACD 12/26/9, Bollinger 20/2); hisse başına en iyi ayarı aramak veri madenciliğidir.
8. Sonuçlar her çeyrek yeniden hesaplanır; işlem maliyeti düşülmüş hali gösterilir.
