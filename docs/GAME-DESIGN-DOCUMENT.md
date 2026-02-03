# ⚽ Futbol Manager — Game Design Document (GDD)
# Tüm Tasarım Kararları & Detaylar

---

## A. OYUN TASARIMI KARARLARI

---

### A1. Formasyon Sistemi

**Karar:** 6 formasyon seçeneği, her biri maç motorunu doğrudan etkiler.

| Formasyon | Hücum Bonusu | Orta Saha Bonusu | Defans Bonusu | Karakter |
|-----------|-------------|-------------------|---------------|----------|
| **4-4-2** | +0% | +5% | +5% | Dengeli, başlangıç formasyonu |
| **4-3-3** | +10% | -5% | +0% | Atak futbol |
| **3-5-2** | +5% | +10% | -10% | Orta saha hakimiyeti |
| **5-3-2** | -10% | +0% | +15% | Defansif |
| **4-5-1** | -5% | +15% | +0% | Kontrollü oyun |
| **3-4-3** | +15% | +0% | -15% | Ultra atak |

**Pozisyon Dağılımı:**

```
4-4-2 → 1 GK, 2 CB, 1 LB, 1 RB, 2 CM, 1 LM, 1 RM, 2 ST
4-3-3 → 1 GK, 2 CB, 1 LB, 1 RB, 2 CM, 1 CAM, 1 LW, 1 RW, 1 ST
3-5-2 → 1 GK, 3 CB, 2 CM, 2 WB, 1 CAM, 2 ST
5-3-2 → 1 GK, 3 CB, 1 LWB, 1 RWB, 2 CM, 1 CDM, 2 ST
4-5-1 → 1 GK, 2 CB, 1 LB, 1 RB, 3 CM, 1 LM, 1 RM, 1 ST
3-4-3 → 1 GK, 3 CB, 2 CM, 2 WB, 1 LW, 1 RW, 1 ST
```

**Taktik Tercihi (her maç öncesi seçilir):**

| Taktik | Etki |
|--------|------|
| **Hücum** | Gol atma +15%, Gol yeme +10% |
| **Dengeli** | Standart oranlar |
| **Defansif** | Gol atma -10%, Gol yeme -15% |
| **Tüm Güç Hücum** | Gol atma +25%, Gol yeme +25% (riskli) |

---

### A2. Futbolcu Özellikleri (Attributes)

**Karar:** 7 Ana Stat + 4 Dinamik Stat + Meta Veriler

#### Ana Statlar (1-99 arası, kalıcı, antrenmanla gelişir)

| Stat | Kısaltma | Etki Alanı |
|------|----------|------------|
| **Hız (Speed)** | SPD | Kontra atak başarısı, kanat koşuları |
| **Şut (Shooting)** | SHT | Gol olasılığı, şut isabeti |
| **Pas (Passing)** | PAS | Top tutma, asist, organize atak |
| **Dribling (Dribbling)** | DRB | 1v1 geçme, top taşıma |
| **Defans (Defense)** | DEF | Top kesme, adam kapatma |
| **Fizik (Physical)** | PHY | İkili mücadele, sakatlık direnci, dayanıklılık |
| **Kaleci Refleksi (Reflexes)** | REF | Yalnız GK için anlamlı, kurtarış başarısı |

#### Dinamik Statlar (maçtan maça değişir)

| Stat | Aralık | Nasıl Değişir |
|------|--------|---------------|
| **Moral** | 0-100 | Galibiyet +10, beraberlik +0, mağlubiyet -10, gol atarsa +5 |
| **Form** | 0-100 | Son 5 maç performansının ortalaması |
| **Kondisyon** | 0-100 | Her maç -15 düşer, saatte +3 yenilenir (maks 24 saat = tam) |
| **Sakatlık** | 0 veya N maç | 0 = sağlıklı, N = kaç maç boyunca sakatlanmış |

#### Meta Veriler

| Veri | Açıklama |
|------|----------|
| **Yaş** | 17-38 arası. 17-27 gelişir, 28-32 stabil, 33+ gerileme |
| **Pozisyon** | Ana pozisyon + 1 alternatif pozisyon |
| **Piyasa Değeri** | Statların ağırlıklı ortalaması × yaş çarpanı × form çarpanı |
| **Maaş** | Haftalık maaş = Piyasa Değeri × 0.02 |
| **Overall Rating** | Pozisyona göre ağırlıklı stat ortalaması |

#### Overall Hesaplama (Pozisyona göre ağırlıklar)

```
GK:  REF×0.40 + DEF×0.15 + PHY×0.20 + SPD×0.10 + PAS×0.10 + SHT×0.00 + DRB×0.05
CB:  DEF×0.35 + PHY×0.25 + SPD×0.10 + PAS×0.10 + SHT×0.05 + DRB×0.05 + REF×0.10
LB/RB: DEF×0.20 + SPD×0.25 + PAS×0.15 + PHY×0.15 + DRB×0.15 + SHT×0.05 + REF×0.05
CM:  PAS×0.30 + DEF×0.15 + PHY×0.15 + DRB×0.15 + SHT×0.10 + SPD×0.10 + REF×0.05
LW/RW: SPD×0.25 + DRB×0.25 + SHT×0.15 + PAS×0.15 + PHY×0.10 + DEF×0.05 + REF×0.05
ST:  SHT×0.35 + SPD×0.20 + DRB×0.15 + PHY×0.15 + PAS×0.10 + DEF×0.00 + REF×0.05
```

#### Etkin Overall (Maç anında kullanılan gerçek güç)

```
Etkin Overall = Overall × (Moral/100 × 0.15 + Form/100 × 0.25 + Kondisyon/100 × 0.60)
```

> Kondisyon en ağırlıklı çünkü yorgun futbolcu gerçek hayatta da çok kötü oynar.

---

### A3. Maç Simülasyon Algoritması

**Karar:** İstatistik bazlı olasılık motoru, "tick" sistemi ile.

#### Temel Yapı

```
1 maç = 60 saniye gerçek süre = 90 dakika oyun süresi
1 tick = 1 saniye = 1.5 oyun dakikası
Toplam 60 tick per maç
Her tick'te bir olay olabilir veya olmayabilir.
```

#### Tick Döngüsü (Her Saniye)

```
for tick in 1..60:
    1. Olay olacak mı? → %35 olasılıkla "EVET" (her tick'te olay şansı)
    2. Olay türü belirle:
       - Top Kapma / Mücadele : %30
       - Pas Zinciri (atak)   : %25
       - Şut                  : %15
       - Faul                 : %12
       - Korner/Serbest Vuruş : %8
       - Sakatlık              : %3
       - Kart                  : %5
       - Penaltı               : %2
    3. Olayı çöz (aşağıdaki formüller)
    4. Skoru güncelle
    5. Match Tracker'a event gönder
```

#### Gol Olasılık Formülü

```
Bir şut olayı gerçekleştiğinde:

şut_gücü = Atan oyuncunun (SHT × 0.5 + SPD × 0.2 + DRB × 0.15 + Form × 0.15)
kurtarış_gücü = Kalecinin (REF × 0.5 + DEF × 0.2 + PHY × 0.15 + Form × 0.15)
taktik_bonus = Formasyon + Taktik bonusu
random_factor = Math.random() × 20 - 10  // -10 ile +10 arası

gol_skoru = şut_gücü + taktik_bonus + random_factor
kurtarış_skoru = kurtarış_gücü + random_factor_2

EĞER gol_skoru > kurtarış_skoru → GOL!
DEĞİLSE →
  fark < 5 → direk, kurtarış
  fark < 15 → korner
  fark >= 15 → aut
```

#### Maç Başına Beklenen Olay Sayısı

```
60 tick × %35 olay şansı ≈ 21 olay/maç
21 olay × %15 şut oranı ≈ 3.15 şut/maç (her takım)
Ortalama gol dönüşümü ~%33 → Maç başına 1-2 gol/takım
Gerçekçi skor aralığı: 0-0 ile 4-3 arası
```

#### Takım Gücü Farkı Etkisi

```
güç_farkı = ev_takımı_avg_overall - deplasman_takımı_avg_overall

Ev sahibi avantajı: +3 tüm olasılıklara
Her 5 puan güç farkı = %8 olay lehine dönüşüm

Örnek: Ev takımı 75 OVR, Deplasman 65 OVR
→ 10 puan fark = +16% ev lehine + 3% ev avantajı = %19 ev lehine swing
```

---

### A4. Ekonomi Sistemi

**Karar:** Kontrollü enflasyon ile dengeli ekonomi.

#### Para Kaynakları (Faucet — Para Giriş Noktaları)

| Kaynak | Miktar | Sıklık |
|--------|--------|--------|
| Maç Galibiyeti | 💰 5.000 | Her galibiyet |
| Beraberlik | 💰 2.000 | Her beraberlik |
| Mağlubiyet | 💰 500 | Her mağlubiyet (katılım ödülü) |
| Lig Şampiyonluğu | 💰 100.000 | Sezon sonu |
| Lig 2.si | 💰 60.000 | Sezon sonu |
| Lig 3.sü | 💰 35.000 | Sezon sonu |
| Şampiyonlar Ligi Kazanma | 💰 200.000 | Turnuva sonu |
| Günlük Giriş Ödülü | 💰 1.000 | Günde 1 |
| Futbolcu Satışı | Değişken | Transfer |
| Seviye Atlama Ödülü | 💰 5.000 × seviye | Her seviye |

#### Para Harcamaları (Sink — Para Çıkış Noktaları)

| Harcama | Miktar | Sıklık |
|---------|--------|--------|
| Haftalık Maaşlar | Kadro toplamı | Her hafta (otomatik) |
| Antrenman (basit) | 💰 500 / oyuncu | Her antrenman |
| Antrenman (yoğun) | 💰 2.000 / oyuncu | Her antrenman |
| Antrenman (elit) | 💰 5.000 / oyuncu | Her antrenman |
| Transfer Alım | Piyasa değeri | Her alım |
| Sakatlık Tedavisi (hızlı) | 💰 3.000 | İsteğe bağlı |
| Kondisyon İksiri | 💰 1.500 | Anlık kondisyon +50 |
| Moral Takviyesi | 💰 2.000 | Moral +20 tüm kadro |
| Stadyum Bakımı | 💰 5.000 | Haftalık (otomatik) |
| Antrenör Kirala (temp) | 💰 10.000 | 7 gün boost |

#### Başlangıç Bakiye: 💰 50.000

#### Enflasyon Kontrolü

- Maaşlar otomatik kesilir, ödenmezse moral -30 tüm kadro
- Sakatlık tedavisi ödenmezse oyuncu 3 maç bekler (1 yerine)
- Stadyum bakımı ödenmezse ev sahibi avantajı kalkıyor
- Transfer fiyatları dinamik: talep arttıkça fiyat yükselir

---

### A5. Sezon Döngüsü

**Karar:** 4 haftalık kısa sezonlar (25-30 kişi için ideal)

```
┌─────────────────────────────────────────────┐
│              SEZON YAPISI                     │
│                                              │
│  25-30 takım → 2 lig (A Ligi, B Ligi)       │
│  Her lig: ~13-15 takım                       │
│  Her takım birbirine karşı 1 maç             │
│  (Çift deplasman 30 kişide çok uzun sürer)   │
│                                              │
│  15 takımlı lig = 14 hafta (round-robin)     │
│  Haftada 2 lig maçı günü (Çar + Cum)        │
│  14 hafta ÷ 2 maç/hafta = 7 hafta/sezon     │
│                                              │
│  + 1 hafta transfer dönemi                   │
│  = TOPLAM 8 HAFTA / SEZON (~2 ay)           │
└─────────────────────────────────────────────┘
```

#### Sezon Sonu Kuralları

| Durum | Sonuç |
|-------|-------|
| A Ligi son 2 | B Ligine düşer (**Relegation**) ✅ |
| B Ligi ilk 2 | A Ligine çıkar (**Promotion**) |
| A Ligi ilk 4 | Şampiyonlar Ligi'ne katılır |
| A Ligi şampiyonu | 💰100K + 🏆 Kupa rozeti |
| B Ligi şampiyonu | 💰40K + terfi |

#### Maç Günleri & Saatleri

```
Her Çarşamba: 20:00 (UTC+3)  → Lig Maç Günü 1
Her Cuma:     20:00 (UTC+3)  → Lig Maç Günü 2
Her Pazar:    18:00 (UTC+3)  → Şampiyonlar Ligi (varsa)

Maçlar 20:00'dan itibaren 5'er dakika arayla başlar:
20:00 - Maç 1 (1 dk)
20:05 - Maç 2 (1 dk)
20:10 - Maç 3 (1 dk)
... (böylece herkes birden fazla maç izleyebilir)
```

---

### A6. Başlangıç Dengeleme (Catchup Mechanic)

**Karar:** Çok katmanlı dengeleme sistemi

#### 1. Yeni Oyuncu Koruma Kalkanı (İlk 2 Hafta)

```
- Maaş ödemesi %50 indirimli
- Antrenman maliyeti %50 indirimli
- Her mağlubiyette ekstra 💰2.000 teselli ödülü
- Rakip eşleşmede güç farkı max 10 OVR olacak şekilde dengelenir
```

#### 2. Dinamik Lig Sistemi

```
Oyuncu gücüne göre lig ataması:
- Yeni oyuncular → B Ligi'ne atanır
- Güçlü oyuncularla aynı ligde olmaz
- Lig içi denge sürekli kontrol edilir
```

#### 3. Gelişim Hız Bonusu

```
Düşük OVR oyuncular daha hızlı gelişir:
- 40-55 OVR: Antrenman etkisi ×2.0
- 56-65 OVR: Antrenman etkisi ×1.5
- 66-75 OVR: Antrenman etkisi ×1.0
- 76-85 OVR: Antrenman etkisi ×0.7
- 86-99 OVR: Antrenman etkisi ×0.4

(Yeni oyuncunun 50 OVR takımı 2 haftada 60'a gelir,
 eskinin 80 OVR takımı 2 haftada ancak 82 olur)
```

#### 4. Transfer Pazarı Dengesi

```
- Yeni oyuncular ilk hafta transfer yapamaz (manipülasyon engeli)
- Güçlü oyuncuların düşük ligdeki ucuz oyuncuları alması:
  → Düşük lig oyuncusu fiyatına +%50 "lig farkı vergisi"
```

---

### A7. Sakatlık & Kart Sistemi

**Karar:** Gerçekçi ama oyunu bozmayan sistem

#### Sakatlık Sistemi

| Sakatlık Seviyesi | Olasılık (maç başı) | Süre | Hızlı İyileşme |
|-------------------|---------------------|------|----------------|
| Hafif (kramp) | %8 | 1 maç | 💰1.000 → anında |
| Orta (burkulma) | %3 | 2-3 maç | 💰3.000 → 1 maça düşür |
| Ağır (yırtık) | %1 | 4-6 maç | 💰8.000 → yarıya düşür |

**Sakatlık Direnci:** PHY stat'ı yüksek olan oyuncuların sakatlık olasılığı düşer.
```
sakatlık_şansı = base_şans × (1 - PHY/200)
Örnek: PHY=80 → %8 × (1 - 80/200) = %8 × 0.6 = %4.8
```

**Kondisyon & Sakatlık İlişkisi:**
```
Kondisyon < 30 → Sakatlık olasılığı ×2
Kondisyon < 15 → Sakatlık olasılığı ×3
```

#### Kart Sistemi

| Kart | Olasılık (foul olaylarında) | Sonuç |
|------|----------------------------|-------|
| Sarı Kart | %40 (foul olduğunda) | 2 sarı = 1 maç ceza |
| Kırmızı Kart | %5 (foul olduğunda) | Anında atılma + 1 maç ceza |
| İkinci Sarı | Otomatik | Kırmızı'ya döner + 1 maç ceza |

**Kümülatif Sarı Kart Kuralı:**
```
Bir sezonda 5 sarı kart = 1 maç ceza (otomatik)
Her 5 sarı kartta tekrarlar
```

**Kırmızı Kart Olasılığı Artışı:**
```
DEF < 40 olan oyuncunun foul yapma olasılığı +%10
PHY > 80 olan oyuncunun sert foul yapma olasılığı +%5
Taktik: "Tüm Güç Hücum" seçilmişse → foul olasılığı +%8
```

---

### A8. Antrenman Mekanikleri

**Karar:** Hibrit sistem — pasif gelişim + aktif antrenman seçimi

#### Pasif Gelişim (Otomatik)

```
Her maç sonrası oynayan futbolcular:
- Rastgele 1-2 stat'ta +0.1 ile +0.3 arası gelişim
- Yaş bazlı çarpan uygulanır
- Maçta gol atan ST → SHT +0.2 bonus
- Maçta clean sheet tutan GK → REF +0.2 bonus
- Maçta asist yapan → PAS +0.2 bonus
```

#### Aktif Antrenman (Oyuncunun Seçtiği)

Maçlar arası dönemde Telegram Bot üzerinden antrenman seçimi:

| Antrenman Tipi | Maliyet | Etki | Cooldown |
|---------------|---------|------|----------|
| **Kondisyon Kampı** | 💰500/oyuncu | Kondisyon +30, rastgele stat +0.2 | 12 saat |
| **Teknik Antrenman** | 💰2.000/oyuncu | SHT veya PAS veya DRB +0.5 (seçilebilir) | 12 saat |
| **Taktik Antrenman** | 💰2.000/oyuncu | DEF +0.5 veya PAS +0.3 & DEF +0.3 | 12 saat |
| **Fizik Antrenman** | 💰2.000/oyuncu | PHY +0.5, SPD +0.3 | 12 saat |
| **GK Antrenman** | 💰2.000/oyuncu | REF +0.5 (sadece GK) | 12 saat |
| **Yoğun Kamp** | 💰5.000/oyuncu | Seçilen stat +1.0, kondisyon -20 | 24 saat |
| **Elit Kamp** | 💰10.000/oyuncu | Seçilen 2 stat +1.0 | 48 saat |

> Antrenman yapılmazsa da oyuncu yine gelişir (pasif), ama çok daha yavaş.

#### Yaş Bazlı Gelişim Çarpanı

```
Yaş 17-21: ×1.5  (genç yetenek, hızlı gelişir)
Yaş 22-27: ×1.0  (prime yıllar, stabil gelişim)
Yaş 28-30: ×0.6  (gelişim yavaşlar)
Yaş 31-33: ×0.3  (zar zor gelişir)
Yaş 34-36: ×0.0  (gelişmez, her sezon rastgele 1-2 stat -0.5)
Yaş 37-38: ×-0.3 (aktif gerileme, her maç sonrası rastgele stat -0.2)
```

#### Antrenör Sistemi (Geçici Buff)

| Antrenör | Maliyet | Süre | Etki |
|----------|---------|------|------|
| **Bronz Antrenör** | 💰10.000 | 7 gün | Tüm antrenman etkileri +%20 |
| **Gümüş Antrenör** | 💰25.000 | 7 gün | Tüm antrenman etkileri +%40 |
| **Altın Antrenör** | 💰50.000 | 7 gün | Tüm antrenman etkileri +%60, sakatlık riski -%20 |

---

## B. TEKNİK KARARLAR

---

### B1. Eşzamanlılık Çözümü

**Karar:** BullMQ + Worker Pool

```
Maçlar sıralı değil, paralel çalışır:

┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Scheduler   │────▶│  BullMQ      │────▶│  Workers    │
│  (node-cron) │     │  Match Queue │     │  (3 adet)   │
└─────────────┘     └──────────────┘     └─────────────┘
                                               │
                          ┌────────────────────┼────────────────────┐
                          ▼                    ▼                    ▼
                    Worker 1              Worker 2              Worker 3
                    Maç A simüle          Maç B simüle          Maç C simüle
                    60 tick               60 tick               60 tick
                          │                    │                    │
                          ▼                    ▼                    ▼
                    Socket.IO ile         Socket.IO ile         Socket.IO ile
                    tracker'a gönder      tracker'a gönder      tracker'a gönder

25-30 kişi = maks 15 maç aynı anda
3 worker → her worker 5 maç = rahat handle eder
Her maç 1 dk CPU = toplam ~1 dk (paralel)

VPS Gereksinimi: 2 vCPU, 4GB RAM yeterli (başlangıç için)
```

---

### B2. Match Tracker Gerçek Zamanlılığı

**Karar:** WebSocket (Socket.IO) — hem Web hem TG Bot için

#### Web Match Tracker

```
Socket.IO bağlantısı:
Client → "join_match" (match_id) → Server
Server → her tick'te "match_event" emit → Client

Event Payload:
{
  match_id: "abc123",
  tick: 23,            // 60 üzerinden
  minute: 34,          // oyun dakikası (tick × 1.5)
  event_type: "goal",
  team: "home",
  player: "Ali Yılmaz",
  score: { home: 1, away: 0 },
  commentary: "Ali Yılmaz sol çaprazdan harika bir şutla ağları buldu! ⚽"
}
```

#### Web Tracker Görünümü

```
┌─────────────────────────────────────────┐
│  🔴 CANLI   34'                          │
│  FC Kartal  1 - 0  Yıldız FK            │
│  ─────────────────────────────────────── │
│  ⚽ 12' Ali Yılmaz (Kartal)              │
│  🟨 23' Mehmet Demir (Yıldız)            │
│  🔄 30' Burak → Can (Kartal)             │
│  ⚽ 34' GOOOL! Ali Yılmaz (Kartal)       │
│  ─────────────────────────────────────── │
│  ▰▰▰▰▰▰▰▰▰▰▰▱▱▱▱▱▱▱▱▱  34/90 dk       │
└─────────────────────────────────────────┘
```

#### Telegram Bot Match Tracker

TG Bot'ta WebSocket yok → **Mesaj Güncelleme (Edit Message)** yöntemi:

```
1. Maç başlayınca bot bir mesaj gönderir
2. Her önemli olayda mesajı editler (editMessageText)
3. Kullanıcı tek mesajda maçın son durumunu görür
4. Rate limit: Maksimum 3 saniyede 1 edit (TG API limiti)

→ Her olay değil, sadece önemli olaylar güncellenir:
   Gol, Kart, Sakatlık, Penaltı, Devredönümü, Maç Sonu
```

```
📱 Telegram Mesajı (sürekli güncellenir):

🔴 CANLI | 34. Dakika
━━━━━━━━━━━━━━━━━━
⚽ FC Kartal  1 - 0  Yıldız FK
━━━━━━━━━━━━━━━━━━
📋 Olaylar:
12' ⚽ Ali Yılmaz (Kartal)
23' 🟨 Mehmet Demir (Yıldız)
34' ⚽ Ali Yılmaz (Kartal)
━━━━━━━━━━━━━━━━━━
▓▓▓▓▓▓▓░░░░░░░░░░░ %38

[🔄 Yenile] [📊 İstatistik]
```

---

### B3. Veri Yedekleme & Kurtarma

**Karar:** 3 katmanlı yedekleme

```
Katman 1: PostgreSQL otomatik WAL (Write-Ahead Log)
→ Son 7 gün point-in-time recovery

Katman 2: Günlük pg_dump → S3/MinIO'ya yükle
→ Cron: Her gün 04:00'da tam yedek
→ 30 gün saklama

Katman 3: Redis RDB snapshot
→ Her 15 dakikada bir
→ Puan tablosu ve cache kurtarma

Kurtarma süresi hedefi: < 30 dakika
Veri kaybı toleransı: < 1 saat
```

---

### B4. Anti-Cheat Sistemi

**Karar:** Çok hesap tespiti + rate limiting

```
1. Telegram Hesap Kontrolü:
   - Her TG hesabı 1 takım (tg_id unique)
   - Hesap yaşı < 7 gün → kayıt yapamaz
   - Telefon numarası doğrulaması (TG zaten yapıyor)

2. IP/Fingerprint Kontrolü (Web):
   - Aynı IP'den max 2 hesap
   - Browser fingerprint takibi
   - Şüpheli çoklu hesaplar → admin onayı gerekir

3. Transfer Suistimali Kontrolü:
   - Aynı 2 kullanıcı arasında günde max 1 transfer
   - Piyasa değerinin %50'sinden ucuza satış → otomatik blok
   - Tek yönlü sürekli transfer (hep A→B) → uyarı

4. Bot Kullanımı:
   - Rate limiting: dakikada max 30 API çağrısı
   - Antrenman/transfer zamanlamaları microsaniye hassasiyetinde
     aynı ise → bot şüphesi
   - CAPTCHA yok (TG bot ortamında uygun değil), bunun yerine
     insan davranış kalıpları analizi

5. Ceza Sistemi:
   - 1. ihlal → uyarı
   - 2. ihlal → 3 gün ban (maç oynayamaz)
   - 3. ihlal → sezon sonu silme
```

---

### B5. Bildirim Sistemi

**Karar:** Telegram Bot push bildirimleri

| Bildirim | Zamanlama | Kanal |
|----------|-----------|-------|
| Maç 1 saat kala | Maçtan 60 dk önce | TG Bot DM |
| Maç 10 dakika kala | Maçtan 10 dk önce | TG Bot DM |
| Maç başladı | Maç anı | TG Bot DM + Grup |
| GOL bildirim | Anında | TG Bot DM |
| Maç bitti | Bitiş anı | TG Bot DM + Grup |
| Transfer teklifi geldi | Anında | TG Bot DM |
| Haftalık maaş kesildi | Hafta başı | TG Bot DM |
| Futbolcu sakatlandı | Maç sonrası | TG Bot DM |
| Sezon sonu rapor | Sezon bitişi | TG Bot DM |
| Yeni sezon başladı | Sezon başı | TG Bot DM + Grup |

**Bildirim Tercihleri:** Oyuncu hangi bildirimleri alacağını seçebilir (mute seçeneği).

---

## C. KULLANICI DENEYİMİ KARARLARI

---

### C1. Onboarding (İlk Giriş Deneyimi)

**Karar:** Rehberli başlangıç + starter pack

```
ADIM 1: /start komutu
Bot: "⚽ Futbol Manager'a hoş geldin! Takımına bir isim ver:"
Kullanıcı: "FC Kartal"

ADIM 2: Starter Pack atanır (otomatik)
→ 18 rastgele futbolcu (11 asil + 7 yedek)
→ Overall aralığı: 45-60 (dengeli başlangıç)
→ Her pozisyon için en az 1 futbolcu garantili
→ 1 "yıldız" oyuncu (65-70 OVR, motivasyon için)
→ 💰 50.000 başlangıç parası

ADIM 3: Kadro düzenleme rehberi
Bot: "Kadronuz hazır! İlk 11'inizi düzenlemek ister misiniz?"
[📋 Kadroyu Gör] [⚙️ Formasyon Seç] [📖 Nasıl Oynanır]

ADIM 4: "Nasıl Oynanır" interaktif tur
→ 5 adımlık kısa tur (her adım 1 mesaj)
→ Antrenman yapma, kadro dizme, taktik seçme
→ Turu tamamlayana bonus: 💰 5.000

ADIM 5: Lige atanma
→ Mevcut B Ligi'ne eklenir
→ Eğer sezon ortasıysa, sonraki sezon başında dahil olur
→ Bu arada dostluk maçları yapabilir
```

#### Starter Pack Futbolcu Dağılımı

```
GK:  2 oyuncu (50-55 OVR)
CB:  3 oyuncu (48-58 OVR)
LB:  1 oyuncu (48-55 OVR)
RB:  1 oyuncu (48-55 OVR)
CM:  3 oyuncu (50-58 OVR)
LW:  1 oyuncu (48-55 OVR)
RW:  1 oyuncu (48-55 OVR)
ST:  2 oyuncu (50-60 OVR)
CAM: 1 oyuncu (48-55 OVR) ← yıldız aday
WB:  1 oyuncu (48-55 OVR)
CDM: 1 oyuncu (48-55 OVR)
─────────────────────────
TOPLAM: 18 oyuncu

"Yıldız oyuncu": Rastgele 1 tanesi 65-70 OVR
(motivasyon: "Bu oyuncunu geliştir, yıldızın parlasın!")
```

---

### C2. Liderlik Tablosu & İstatistikler

**Karar:** Kapsamlı istatistik sistemi

#### Lig Puan Tablosu

```
📊 A Ligi — 2025/26 Sezonu (Hafta 8/14)

#  Takım          O  G  B  M  AG YG  AV  P
1. FC Kartal     8  6  1  1  18  7  +11 19
2. Yıldız FK     8  5  2  1  14  6  +8  17
3. Aslan SK      8  5  1  2  16 10  +6  16
...
```

#### Bireysel İstatistikler

| Kategori | Takip Edilen Veriler |
|----------|---------------------|
| **Gol Kralı** | Toplam gol, maç başı gol ortalaması |
| **Asist Kralı** | Toplam asist |
| **En Çok Katkı** | Gol + Asist toplamı |
| **En İyi GK** | Clean sheet sayısı, maç başı yenilen gol |
| **En İyi Defans** | Takım bazında en az gol yiyen |
| **Disiplin** | En çok sarı/kırmızı kart alan |
| **En Değerli** | En yüksek piyasa değerine sahip futbolcu |
| **En Gelişen** | Son 1 haftada en çok OVR artan futbolcu |
| **Demir Adam** | En çok arka arkaya maç oynayan (sakatlıksız) |

#### Kullanıcı Profil İstatistikleri

```
👤 Oyuncu Profili: @kullanici
━━━━━━━━━━━━━━━━━━━━
🏟️ Takım: FC Kartal
⭐ Seviye: 12 (XP: 8.450/10.000)
💰 Bakiye: 127.500
📊 Takım OVR: 68.4
━━━━━━━━━━━━━━━━━━━━
📈 Sezon İstatistikleri:
  Maç: 14 | G: 8 | B: 3 | M: 3
  Atılan Gol: 22 | Yenilen: 12
  Galibiyet %: 57.1%
━━━━━━━━━━━━━━━━━━━━
🏆 Başarılar:
  🥇 B Ligi Şampiyonu (S1)
  ⚽ 50 Gol Kulübü
  🔥 5 Maç Üst Üste Galibiyet
```

---

### C3. Sosyal Özellikler

**Karar:** Aşamalı sosyal özellikler

#### Faz 1'de Gelen (Başlangıç)

```
1. Lig Sohbeti:
   - Her lig için TG grup otomatik oluşturulur
   - Maç sonuçları otomatik paylaşılır
   - Oyuncular sohbet edebilir

2. Dostluk Maçı:
   - /friendlymatch @rakip komutu
   - Puan tablosunu etkilemez
   - Para kazanılmaz (sadece XP)
   - Taktik denemek için ideal
   - Günde max 3 dostluk maçı
```

#### Faz 2'de Gelen

```
3. Transfer Teklif Sistemi:
   - Oyuncular birbirine transfer teklifi gönderebilir
   - Karşılıklı müzakere (bot üzerinden)
   - Teklif süresi: 24 saat (kabul/red)

4. Haftalık MVP Oylaması:
   - Her hafta lig en iyi performansı oylanır
   - Kazanan +5 moral tüm kadro
```

#### Faz 3'te Gelen (İleride)

```
5. Kupa Turnuvaları:
   - Knockout usulü (16, 8, yarı final, final)
   - Lig dışı ekstra heyecan

6. Süper Kupa:
   - Lig şampiyonu vs Kupa şampiyonu

7. All-Star Maçı:
   - Sezon sonu, en iyi 11'ler otomatik seçilir
   - A Ligi All-Star vs B Ligi All-Star
```

---

## 📐 ÖZET: TAM ÖZELLİK HARİTASI

```
✅ = Kesinleşti    🔶 = Faz 2+    ⬜ = İleride düşünülecek

OYUN TASARIMI
✅ 6 Formasyon + 4 Taktik seçeneği
✅ 7 Ana Stat + 4 Dinamik Stat sistemi
✅ Tick bazlı maç simülasyon motoru (60 tick/maç)
✅ Dengeli ekonomi (faucet + sink)
✅ 8 haftalık sezon döngüsü
✅ Relegation / Promotion sistemi
✅ Catchup mekanikler (yeni oyuncu dengeleme)
✅ Sakatlık + Kart sistemi
✅ Hibrit antrenman (pasif + aktif)
✅ Yaş bazlı gelişim/gerileme
🔶 Antrenör kiralama sistemi
🔶 Stadyum yükseltme
⬜ Genç altyapı akademisi

TEKNİK
✅ BullMQ paralel maç işleme
✅ Socket.IO gerçek zamanlı tracker
✅ TG Bot editMessageText tracker
✅ 3 katmanlı yedekleme
✅ Anti-cheat temelleri
✅ Push bildirim sistemi
🔶 IP/fingerprint kontrolü (web)
⬜ Advanced bot detection

KULLANICI DENEYİMİ
✅ Rehberli onboarding + starter pack
✅ Kapsamlı istatistik & liderlik tablosu
✅ Lig sohbet grubu
✅ Dostluk maçı
🔶 Transfer müzakere sistemi
🔶 Kupa turnuvaları
⬜ All-Star maçları
⬜ Kulüp rozeti/amblem editörü
```
