# ⚽ Football Manager — Geliştirme Promptları

> Bu döküman, projenin her alanı için kullanılabilecek hazır promptları içerir.
> Her prompt, ilgili fazın görevlerini tamamlamak için yeterli bağlam ve detay sağlar.
> Promptları sırasıyla kullanarak projeyi adım adım inşa edebilirsin.

---

## 📌 Kullanım Rehberi

1. İlgili fazın promptunu kopyala
2. Claude'a yapıştır
3. Gerekli dosyaları oluştur ve GitHub'a push et
4. Proje takip panelinden görevleri işaretle

> **NOT:** Her prompt birbirine bağlıdır. Faz 0'dan başlayarak sırayla ilerle.
> Önceki fazların kodları mevcut olmalıdır.

---

## FAZ 0 — Proje Altyapısı & Kurulum

### PROMPT 0.1 — Geliştirme Ortamı Kurulumu

```
Football Manager oyun projesi için geliştirme ortamını kur.

GitHub repo: https://github.com/thorrangonak/football-manager
Repo zaten oluşturuldu ve şu yapı mevcut:
- src/shared, src/engine, src/services, src/bot, src/api, src/jobs, src/socket
- prisma/, web/
- package.json, tsconfig.json, docker-compose.yml, .env.example

Şimdi yapılacaklar:

1. **package.json'ı güncelle** — Tüm bağımlılıkları ekle:
   - Runtime: dotenv, zod
   - Bot: grammy
   - DB: @prisma/client, ioredis
   - API: express, cors, socket.io
   - Queue: bullmq
   - Cron: node-cron
   - Logger: winston
   - Utils: uuid
   - DevDeps: typescript, tsx, prisma, @types/*, eslint, prettier

2. **ESLint + Prettier konfigürasyonu oluştur:**
   - .eslintrc.json (TypeScript kuralları, import sıralaması)
   - .prettierrc (singleQuote, semi, tabWidth: 2, printWidth: 100)

3. **tsconfig.json'ı güncelle:**
   - Path alias'ları: @shared/*, @engine/*, @bot/*, @api/*, @services/*, @jobs/*
   - Strict mode, ES2022 target

4. **src/shared/config.ts** oluştur:
   - .env'den tüm değişkenleri oku (zod ile validasyon)
   - DATABASE_URL, REDIS_URL, BOT_TOKEN, API_PORT, JWT_SECRET vb.
   - Eksik değişken varsa hata fırlat

5. **src/shared/logger.ts** oluştur:
   - Winston logger: console + file transport
   - Log seviyeleri: error, warn, info, debug
   - Timestamp formatı, JSON formatında dosyaya yaz

6. **src/shared/types.ts** oluştur:
   - Temel TypeScript tipleri ve enum'lar:
     - Position enum: GK, CB, LB, RB, CDM, CM, CAM, LW, RW, ST, WB
     - Formation enum: F442, F433, F352, F532, F451, F343
     - Tactic enum: ATTACK, BALANCED, DEFENSIVE, ALL_OUT_ATTACK
     - MatchEventType enum: GOAL, SHOT, FOUL, YELLOW_CARD, RED_CARD, INJURY, CORNER, PENALTY, SUBSTITUTION
     - MatchStatus enum: SCHEDULED, LIVE, FINISHED, CANCELLED
     - LeagueType enum: A_LEAGUE, B_LEAGUE

Tüm dosyaları oluştur ve çalıştığını doğrula.
```

### PROMPT 0.2 — Altyapı Servisleri (DB + Redis + Queue)

```
Football Manager projesi için altyapı servislerini kur.

Mevcut dosyalar: src/shared/config.ts, src/shared/logger.ts, src/shared/types.ts
Docker servisleri: docker-compose.yml (PostgreSQL 16 + Redis 7) hazır.

Şimdi yapılacaklar:

1. **Prisma ORM kurulumu:**
   - prisma/schema.prisma dosyasını oluştur
   - Şimdilik sadece datasource ve generator tanımla
   - Modelleri henüz ekleme (Faz 1'de eklenecek)
   - src/shared/database.ts: PrismaClient singleton instance
   - Bağlantı testi fonksiyonu

2. **Redis bağlantısı:**
   - src/shared/redis.ts: ioredis ile Redis bağlantısı
   - Singleton pattern
   - Bağlantı/disconnection event handler'ları
   - Cache helper fonksiyonları: get, set (TTL destekli), del, exists

3. **BullMQ kurulumu:**
   - src/jobs/queue.ts: Match queue tanımı
   - src/jobs/worker.ts: Temel worker yapısı (boş processor, ileride maç simülasyonu eklenecek)
   - Queue bağlantı testi

4. **src/index.ts — Ana giriş noktası:**
   - Tüm servislerin başlatılması (DB, Redis, BullMQ, Bot, API)
   - Graceful shutdown handler (SIGINT, SIGTERM)
   - Startup log mesajları

5. **Bağlantı testleri:**
   - Docker compose up yapılınca tüm servislerin bağlanabildiğini doğrulayan test script
   - npm run dev ile başlatıldığında "✅ PostgreSQL connected", "✅ Redis connected", "✅ BullMQ ready" logları

Her dosyada hata yakalama ve retry mekanizması olsun.
```

### PROMPT 0.3 — Telegram Bot Temel Kurulum

```
Football Manager projesi için Telegram bot'unun temel yapısını kur.

Mevcut: src/shared/config.ts (BOT_TOKEN), src/shared/logger.ts
Kullanılacak framework: grammy

Şimdi yapılacaklar:

1. **src/bot/index.ts — Bot ana dosyası:**
   - grammy Bot instance oluştur (config.BOT_TOKEN ile)
   - Session middleware (in-memory veya Redis-based)
   - Error handler middleware (hataları logla, kullanıcıya "Bir hata oluştu" mesajı)
   - Logger middleware (her gelen mesajı logla: user_id, command, timestamp)

2. **src/bot/commands/start.ts:**
   - /start komutu handler
   - Şimdilik basit bir hoş geldin mesajı gönder:
     "⚽ Football Manager'a Hoş Geldin!
      Kendi futbol takımını kur, antrenman yap, transfer yap ve şampiyon ol!
      Kayıt olmak için takım ismini yaz:"
   - Kullanıcı metin girdiğinde "Takımın [İsim] oluşturuldu!" yanıtı (DB kaydı Faz 1'de)

3. **src/bot/keyboards/mainMenu.ts:**
   - Ana menü inline keyboard:
     [⚽ Kadro] [📊 Lig Tablosu]
     [🏋️ Antrenman] [💰 Transfer]
     [👤 Profil] [⚙️ Ayarlar]
   - Her buton callback_data tanımı

4. **src/bot/middleware/auth.ts:**
   - Kullanıcının kayıtlı olup olmadığını kontrol eden middleware
   - Kayıtlı değilse /start'a yönlendir

5. **Bot'u src/index.ts'e entegre et:**
   - Bot.start() ile polling başlat
   - Graceful stop ekle

Bot'u başlat, /start komutunu test et, inline keyboard'un görünmesini sağla.
```

---

## FAZ 1 — Temel Oyun Mekaniği (MVP)

### PROMPT 1.1 — Veritabanı Şeması (Prisma)

```
Football Manager projesi için Prisma veritabanı şemasını oluştur.

Dosya: prisma/schema.prisma

Aşağıdaki modelleri tanımla:

1. **User:**
   - id: Int @id @default(autoincrement())
   - tgId: BigInt @unique (Telegram user ID)
   - username: String? (TG username)
   - level: Int @default(1)
   - xp: Int @default(0)
   - coins: Int @default(50000)
   - isNewPlayer: Boolean @default(true) (ilk 2 hafta koruma)
   - newPlayerUntil: DateTime? (koruma süresi)
   - lastDailyReward: DateTime? (günlük ödül)
   - notificationPrefs: Json? (bildirim tercihleri)
   - createdAt: DateTime @default(now())
   - updatedAt: DateTime @updatedAt
   - İlişkiler: team (1-1), transactions

2. **Team:**
   - id: Int @id @default(autoincrement())
   - userId: Int @unique
   - name: String @unique (takım adı, max 30 karakter)
   - formation: String @default("F442") (Formation enum)
   - tactic: String @default("BALANCED") (Tactic enum)
   - powerRating: Float @default(0) (ortalama overall)
   - stadiumLevel: Int @default(1)
   - stadiumMaintained: Boolean @default(true)
   - createdAt: DateTime @default(now())
   - İlişkiler: user, players[], leagueTeams[], homeMatches[], awayMatches[], transfersFrom[], transfersTo[]

3. **Player (Futbolcu):**
   - id: Int @id @default(autoincrement())
   - teamId: Int? (null = serbest oyuncu)
   - name: String
   - age: Int (17-38)
   - position: String (Position enum)
   - altPosition: String? (alternatif pozisyon)
   - isStarter: Boolean @default(false) (ilk 11'de mi)
   - jerseyNumber: Int?

   // 7 Ana Stat (1-99)
   - speed: Float @default(50)
   - shooting: Float @default(50)
   - passing: Float @default(50)
   - dribbling: Float @default(50)
   - defense: Float @default(50)
   - physical: Float @default(50)
   - goalkeeping: Float @default(50)

   // Overall
   - overall: Float @default(50) (pozisyona göre ağırlıklı hesaplama)

   // Dinamik Statlar
   - morale: Float @default(70) (0-100)
   - form: Float @default(50) (son 5 maç ortalaması)
   - fitness: Float @default(100) (kondisyon, 0-100)
   - injuryDuration: Int @default(0) (kalan sakatlık süresi, maç sayısı)
   - suspendedUntil: Int @default(0) (cezalı maç sayısı)
   - yellowCards: Int @default(0) (sezon toplam sarı)

   // Ekonomi
   - marketValue: Int @default(10000)
   - salary: Int @default(200)

   // Antrenman
   - lastTrainingAt: DateTime?
   - trainingCooldownUntil: DateTime?

   - createdAt: DateTime @default(now())
   - İlişkiler: team, matchEvents[], goalsScoredIn[], assistsIn[]

4. **League:**
   - id: Int @id @default(autoincrement())
   - name: String (örn: "A Ligi", "B Ligi")
   - type: String (A_LEAGUE / B_LEAGUE)
   - seasonId: Int
   - status: String @default("ACTIVE") (ACTIVE, FINISHED, TRANSFER_WINDOW)
   - İlişkiler: season, leagueTeams[], matches[]

5. **LeagueTeam (Lig-Takım bağlantısı):**
   - id: Int @id @default(autoincrement())
   - leagueId: Int
   - teamId: Int
   - played: Int @default(0)
   - wins: Int @default(0)
   - draws: Int @default(0)
   - losses: Int @default(0)
   - goalsFor: Int @default(0)
   - goalsAgainst: Int @default(0)
   - points: Int @default(0)
   - @@unique([leagueId, teamId])

6. **Match:**
   - id: Int @id @default(autoincrement())
   - leagueId: Int?
   - seasonId: Int?
   - homeTeamId: Int
   - awayTeamId: Int
   - scheduledAt: DateTime
   - status: String @default("SCHEDULED")
   - homeScore: Int @default(0)
   - awayScore: Int @default(0)
   - matchWeek: Int?
   - isFriendly: Boolean @default(false)
   - matchData: Json? (detaylı maç istatistikleri)
   - İlişkiler: league, homeTeam, awayTeam, events[]

7. **MatchEvent:**
   - id: Int @id @default(autoincrement())
   - matchId: Int
   - tick: Int (0-59)
   - minute: Int (1-90)
   - type: String (MatchEventType enum)
   - teamId: Int?
   - playerId: Int?
   - secondPlayerId: Int? (asist yapan, faul yapılan vb.)
   - detail: Json? (ek bilgi)
   - commentary: String? (Türkçe yorum)

8. **Transfer:**
   - id: Int @id @default(autoincrement())
   - playerId: Int
   - fromTeamId: Int?
   - toTeamId: Int?
   - price: Int
   - status: String @default("PENDING") (PENDING, ACCEPTED, REJECTED, EXPIRED)
   - expiresAt: DateTime?
   - createdAt: DateTime @default(now())

9. **Season:**
   - id: Int @id @default(autoincrement())
   - number: Int (sezon numarası)
   - startDate: DateTime
   - endDate: DateTime
   - status: String @default("ACTIVE")
   - İlişkiler: leagues[], matches[]

10. **Transaction (Para hareketleri):**
    - id: Int @id @default(autoincrement())
    - userId: Int
    - amount: Int (pozitif = gelir, negatif = gider)
    - type: String (MATCH_WIN, MATCH_DRAW, MATCH_LOSS, SALARY, TRAINING, TRANSFER_BUY, TRANSFER_SELL, DAILY_REWARD, LEVEL_UP, SEASON_PRIZE, STADIUM, MEDICAL)
    - description: String?
    - createdAt: DateTime @default(now())

Her modelde gerekli indexleri ekle (@index). İlişkilerde onDelete kurallarını belirle.
Migration oluştur ve çalıştır: npx prisma migrate dev --name init
Ardından npx prisma generate çalıştır.
```

### PROMPT 1.2 — Oyuncu Oluşturma Motoru

```
Football Manager projesi için futbolcu oluşturma motorunu yaz.

Dosya: src/engine/playerGenerator.ts

Mevcut: prisma/schema.prisma (Player modeli), src/shared/types.ts (Position enum)

Kurallar (Game Design Document'tan):

**Pozisyona Göre Stat Dağılımı (ağırlıklı rastgele):**
Her pozisyonun "güçlü" statları var, bunlar daha yüksek üretilir.
- GK: goalkeeping ×2.0, physical ×1.3, defense ×1.2
- CB: defense ×2.0, physical ×1.5, speed ×0.8
- LB/RB: speed ×1.5, defense ×1.3, passing ×1.2
- CDM: defense ×1.5, passing ×1.3, physical ×1.3
- CM: passing ×1.8, dribbling ×1.2, shooting ×1.0
- CAM: passing ×1.5, dribbling ×1.5, shooting ×1.3
- LW/RW: speed ×1.8, dribbling ×1.5, shooting ×1.0
- ST: shooting ×2.0, speed ×1.3, dribbling ×1.2
- WB: speed ×1.5, defense ×1.2, passing ×1.2, physical ×1.2

Fonksiyonlar:

1. **generatePlayer(options):**
   - options: { position, minOvr?, maxOvr?, age? }
   - Base stat üret: minOvr-maxOvr aralığında hedef overall
   - Pozisyon ağırlıklarına göre 7 stat'ı dağıt
   - Her stat 1-99 arasında clamp et
   - Yaş: verilmezse rastgele 17-33 (ağırlıklı: 20-28 daha olası)
   - İsim: rastgele Türkçe isim havuzundan

2. **calculateOverall(player, position):**
   Pozisyona göre ağırlıklı ortalama:
   - GK: REF×0.45 + PHY×0.20 + DEF×0.15 + SPD×0.10 + PAS×0.10
   - CB: DEF×0.35 + PHY×0.25 + SPD×0.15 + PAS×0.15 + SHT×0.10
   - LB/RB: SPD×0.25 + DEF×0.25 + PAS×0.20 + PHY×0.15 + DRB×0.15
   - CDM: DEF×0.30 + PAS×0.25 + PHY×0.25 + SPD×0.10 + DRB×0.10
   - CM: PAS×0.30 + DRB×0.20 + SHT×0.15 + DEF×0.15 + PHY×0.10 + SPD×0.10
   - CAM: PAS×0.25 + DRB×0.25 + SHT×0.25 + SPD×0.15 + PHY×0.10
   - LW/RW: SPD×0.30 + DRB×0.25 + SHT×0.20 + PAS×0.15 + PHY×0.10
   - ST: SHT×0.35 + SPD×0.20 + DRB×0.20 + PHY×0.15 + PAS×0.10
   - WB: SPD×0.20 + DEF×0.20 + PAS×0.20 + PHY×0.20 + DRB×0.20

3. **calculateMarketValue(player):**
   - Base: overall² × 15
   - Yaş çarpanı: 17-21 → ×1.4, 22-27 → ×1.0, 28-30 → ×0.7, 31-33 → ×0.4, 34+ → ×0.2
   - Form bonus: (form / 50) çarpanı

4. **calculateSalary(marketValue):**
   - marketValue × 0.02 (haftalık)

5. **generateStarterPack():**
   - 18 futbolcu üret:
     - 2 GK (1 starter)
     - 2 CB (2 starter) + 1 yedek CB
     - 1 LB (starter) + 1 RB (starter)
     - 2 CM (starter) + 1 CDM (starter)
     - 1 CAM (yedek)
     - 1 LW (starter) + 1 RW (starter)
     - 2 ST (1 starter, 1 yedek)
     - 1 WB (yedek)
   - OVR aralığı: 45-60
   - 1 yıldız oyuncu: 65-70 OVR garantisi (rastgele pozisyon)
   - Forma numaraları: 1-18 ata

6. **TÜRKÇE İSİM HAVUZU:**
   - En az 100 isim, 100 soyisim
   - Rastgele isim + soyisim kombinasyonu
   - Aynı takımda aynı isimde 2 oyuncu olmasın

Tüm fonksiyonları export et ve test için bir test script (src/engine/__tests__/playerGenerator.test.ts) yaz:
- 18 kişilik starter pack üret, overall'ların 45-70 arasında olduğunu doğrula
- Her pozisyon tipinden en az 1 oyuncu olduğunu doğrula
```

### PROMPT 1.3 — Telegram Bot: Kayıt, Takım, Kadro Yönetimi

```
Football Manager projesi için Telegram bot'unun kayıt ve takım yönetim komutlarını yaz.

Mevcut: Prisma modelleri, playerGenerator.ts, bot temel yapısı (grammy)

Komutlar:

1. **/start — Kayıt:**
   - DB'de user var mı kontrol et (tgId ile)
   - Yoksa: "⚽ Hoş geldin! Takımına bir isim ver:" → conversation/session ile isim al
   - İsim gelince:
     - User oluştur (coins: 50000)
     - Team oluştur (verilen isim)
     - generateStarterPack() ile 18 futbolcu oluştur ve team'e ata
     - Takım power_rating'ini hesapla
     - Hoş geldin mesajı + ana menü keyboard göster
   - Zaten kayıtlıysa: "Zaten bir takımın var: [Takım Adı]" + ana menü

2. **/kadro — Kadro Görüntüleme:**
   - Mevcut formasyon göster (örn: "📋 4-4-2")
   - İlk 11'i pozisyonlarına göre sıralı listele:
     ```
     🧤 GK: Ali Yılmaz (67 OVR) ❤️ 85 🏃 92
     🛡️ CB: Mehmet Kaya (61 OVR) ❤️ 70 🏃 88
     ...
     ⚡ ST: Can Demir (69 OVR) ⭐ ❤️ 90 🏃 95
     ```
     (❤️ = moral, 🏃 = kondisyon, ⭐ = yıldız oyuncu)
   - Yedekler: Aynı formatta, "📌 Yedek" başlığı altında
   - Takım OVR ortalaması göster
   - "Düzenle" inline button

3. **/oyuncu [isim] — Futbolcu Detay:**
   - Oyuncuyu isimle ara (fuzzy search — büyük/küçük harf duyarsız)
   - Detaylı kart göster:
     ```
     ⚽ Can Demir — ST
     ━━━━━━━━━━━━━━━━
     📊 Overall: 69
     🎂 Yaş: 22 | 💰 Değer: 125.000
     💵 Maaş: 2.500/hafta
     ━━━━━━━━━━━━━━━━
     ⚡ Hız: 72    🎯 Şut: 75
     📫 Pas: 58    🏀 Dribling: 65
     🛡️ Defans: 35  💪 Fizik: 68
     🧤 Kalecilik: 12
     ━━━━━━━━━━━━━━━━
     ❤️ Moral: 90  📈 Form: 65
     🏃 Kondisyon: 95  🏥 Sağlık: ✅
     📒 Sarı Kart: 0  📕 Ceza: Yok
     ```

4. **Formasyon Seçimi (inline keyboard):**
   - "Formasyon Seç" butonuna basınca 6 seçenek göster:
     [4-4-2] [4-3-3] [3-5-2]
     [5-3-2] [4-5-1] [3-4-3]
   - Seçim yapınca DB'de team.formation güncelle
   - "✅ Formasyon 4-3-3 olarak ayarlandı!" mesajı

5. **Taktik Seçimi (inline keyboard):**
   - "Taktik Seç" butonuna basınca 4 seçenek:
     [⚔️ Hücum] [⚖️ Dengeli] [🛡️ Defansif] [🔥 Tüm Güç Hücum]
   - Seçim yapınca DB güncelle
   - Her taktiğin açıklamasını göster (bonus/malus yüzdeleri)

6. **Kadro Düzenleme:**
   - "Değiştir" butonuna basınca: İlk 11'den çıkarılacak oyuncuyu seç (inline)
   - Sonra yerine koyulacak yedek oyuncuyu seç (inline)
   - Pozisyon uyumu kontrolü yap (uyarı ver ama engelleme)
   - Swap yap ve onay mesajı göster

7. **/rehber — Nasıl Oynanır:**
   - 5 adımlık interaktif tur:
     1. "Takımın kuruldu! Kadronun 18 futbolcudan oluşuyor."
     2. "Formasyonunu ve taktiğini seçerek maçlara hazırlan."
     3. "Haftada 2 lig maçı oynanır. Maçlar otomatik simüle edilir."
     4. "Antrenman yaparak oyuncularını geliştir, transfer pazarından yeni oyuncular al."
     5. "Ligi kazan ve Şampiyonlar Ligi'ne katıl! 🏆"
   - Her adımda "Sonraki →" butonu
   - Tamamlayınca: "🎁 Rehberi tamamladın! +5.000 coin ödül!" + coins güncelle

Tüm handler'ları src/bot/commands/ altında ayrı dosyalar olarak oluştur.
Keyboard tanımlarını src/bot/keyboards/ altında topla.
Callback query handler'ları src/bot/handlers/ altında yönet.
```

### PROMPT 1.4 — Maç Simülasyon Motoru

```
Football Manager projesi için maç simülasyon motorunu yaz.

Dosya: src/engine/matchEngine.ts

Bu projenin KALBİ — en önemli ve dikkatli yazılması gereken dosya.

**GENEL YAPI:**
- 60 tick = 1 maç = 90 oyun dakikası (1 tick = 1 saniye gerçek süre = 1.5 dk oyun)
- Her tick'te %35 olay şansı
- Sonuç: Match nesnesi (skor, olaylar listesi, istatistikler)

**SINIFLAR VE FONKSİYONLAR:**

1. **MatchEngine class:**

   constructor(homeTeam: MatchTeam, awayTeam: MatchTeam, matchId: number)

   **MatchTeam tipi:**
   ```ts
   interface MatchTeam {
     id: number;
     name: string;
     formation: Formation;
     tactic: Tactic;
     players: MatchPlayer[]; // 11 starter
     subs: MatchPlayer[];    // yedekler
     bonuses: FormationBonus;
   }

   interface MatchPlayer {
     id: number;
     name: string;
     position: Position;
     stats: { spd, sht, pas, drb, def, phy, ref: number };
     effectiveOvr: number; // hesaplanmış etkin overall
     fitness: number;
     morale: number;
     form: number;
   }
   ```

2. **Etkin Overall Hesaplama:**
   ```
   effectiveOvr = baseOverall × (Moral×0.15 + Form×0.25 + Kondisyon×0.60)
   ```
   - Moral, form, kondisyon: 0-100 arasında normalize edilmiş (0-1)
   - Örnek: OVR 70, Moral 80, Form 60, Kondisyon 90
     = 70 × (0.80×0.15 + 0.60×0.25 + 0.90×0.60) = 70 × (0.12 + 0.15 + 0.54) = 70 × 0.81 = 56.7

3. **Formasyon Bonusları:**
   - 4-4-2: attack +5%, midfield +5%, defense +5% (dengeli)
   - 4-3-3: attack +15%, midfield -5%, defense 0%
   - 3-5-2: attack +5%, midfield +15%, defense -10%
   - 5-3-2: attack -5%, midfield 0%, defense +15%
   - 4-5-1: attack -10%, midfield +15%, defense +5%
   - 3-4-3: attack +20%, midfield +5%, defense -15%

4. **Taktik Bonusları:**
   - ATTACK: goalChance +15%, concede +10%
   - BALANCED: 0%, 0%
   - DEFENSIVE: goalChance -10%, concede -15%
   - ALL_OUT_ATTACK: goalChance +25%, concede +25%

5. **Takım Gücü Hesaplama:**
   - attackPower: Forvet + kanat oyuncularının etkin OVR ortalaması
   - midfieldPower: Orta saha oyuncularının etkin OVR ortalaması
   - defensePower: Defans + kaleci oyuncularının etkin OVR ortalaması
   - teamPower: (attack×0.35 + midfield×0.30 + defense×0.35)
   - Formasyon bonusu uygula
   - Ev sahibi avantajı: +3 bonus

6. **Güç Farkı Etkisi:**
   - powerDiff = homeTeamPower - awayTeamPower
   - Her 5 puan fark = %8 etki
   - eventBias = 0.50 + (powerDiff / 5) × 0.08
   - Clamp: 0.25 - 0.75 arası (çok dengesiz olmasın)

7. **simulateMatch() — Ana fonksiyon:**
   ```
   for (tick = 0; tick < 60; tick++) {
     // Olay olacak mı? (%35 şans)
     if (random() > 0.35) continue;

     // Hangi takım olayı? (eventBias'a göre)
     const attackingTeam = random() < eventBias ? home : away;
     const defendingTeam = attackingTeam === home ? away : home;

     // Olay tipi belirle
     const event = determineEvent();
     // Olayı simüle et
     processEvent(tick, event, attackingTeam, defendingTeam);
   }
   ```

8. **Olay Tipleri ve Olasılıkları:**
   - POSSESSION: %30 (top kapma, pas trafiği — görsel olay, skoru etkilemez)
   - PASS_CHAIN: %25 (pas zinciri → şut şansı %30)
   - SHOT: %15 (direkt şut denemesi)
   - FOUL: %12 (faul → kart şansı, serbest vuruş)
   - CORNER: %8 (korner → şut şansı %25)
   - INJURY: %3 (sakatlık → fizik stat'a bağlı direnç)
   - CARD: %5 (doğrudan kart, provokasyon)
   - PENALTY: %2 (penaltı → %75 gol şansı + kaleci kurtarışı)

9. **Gol Hesaplama (SHOT olayında):**
   ```
   shooter = rastgele forvet/kanat/orta saha oyuncusu (pozisyon ağırlıklı)
   goalkeeper = savunan takımın GK'sı

   shotPower = (shooter.sht × 0.50) + (shooter.spd × 0.20)
              + (shooter.drb × 0.15) + (shooter.form × 0.15)
              + randomFactor(-5, +5)

   savePower = (gk.ref × 0.50) + (gk.def × 0.20)
              + (gk.phy × 0.15) + (gk.form × 0.15)
              + randomFactor(-5, +5)

   // Taktik bonusu
   shotPower *= (1 + attackingTeam.tacticBonus.goalChance)

   if (shotPower > savePower) → GOL!
   else → Kurtarış
   ```

10. **Sakatlık Hesaplama:**
    ```
    target = rastgele oynayan futbolcu
    injuryRoll = random()

    // Fizik direnci
    resistance = target.phy / 100

    // Kondisyon riski
    fitnessPenalty = target.fitness < 30 ? 2.0 : (target.fitness < 15 ? 3.0 : 1.0)

    severity:
      hafif (%8 × fitnessPenalty × (1 - resistance×0.5)): 1 maç
      orta (%3 × fitnessPenalty × (1 - resistance×0.5)): 2-3 maç
      ağır (%1 × fitnessPenalty × (1 - resistance×0.5)): 4-6 maç
    ```

11. **Kart Hesaplama (FOUL olayında):**
    ```
    cardChance = random()
    if cardChance < 0.40 → YELLOW_CARD
    if cardChance < 0.45 → RED_CARD (doğrudan)
    else → sadece faul, kart yok

    // 2. sarı kart kontrolü
    if player.yellowCardsInMatch >= 2 → RED_CARD → oyuncu atılır
    ```

12. **Kondisyon Düşüşü:**
    ```
    Her oynayan futbolcu maç sonunda: fitness -= 15 + random(0, 5)
    10 kişi kalırsa (kırmızı kart): kalan oyuncular fitness -= ekstra 5
    ```

13. **Maç Sonrası Güncellemeler:**
    - Skor kaydet
    - Lig tablosu güncelle (G/B/M/AG/YG/P)
    - Coin ödülü: Galibiyet 5000, Beraberlik 2000, Mağlubiyet 500
    - Moral güncelle: Galibiyet +10, Mağlubiyet -10
    - Kondisyon düşür (oynayan her oyuncu -15 ~ -20)
    - Sakatlık uygula
    - Kart cezası uygula (kırmızı → 1 maç ceza)
    - Kümülatif sarı kontrol (5 sarı = 1 maç ceza)
    - Pasif gelişim: Oynayan oyunculara rastgele 1-2 stat'ta +0.1-0.3

14. **Türkçe Maç Yorumları:**
    Her olay için rastgele Türkçe yorum üret:
    - GOL: "[Oyuncu] müthiş bir vuruşla topu ağlara gönderdi! ⚽"
    - SAVE: "Kaleci [GK] harika bir kurtarış yaptı! 🧤"
    - FOUL: "[Oyuncu] sert bir faul yaptı" 
    - YELLOW: "[Oyuncu] sarı kart gördü! 📒"
    - INJURY: "[Oyuncu] sakatlık geçirdi, sedyeyle çıkıyor 🏥"
    vb. (her olay tipi için en az 5 farklı yorum varyasyonu)

15. **Return tipi:**
    ```ts
    interface MatchResult {
      matchId: number;
      homeScore: number;
      awayScore: number;
      events: MatchEventData[];
      stats: {
        home: TeamMatchStats;
        away: TeamMatchStats;
      };
      manOfTheMatch: { playerId: number; name: string; rating: number };
    }

    interface MatchEventData {
      tick: number;
      minute: number; // tick × 1.5
      type: MatchEventType;
      teamId: number;
      playerId?: number;
      secondPlayerId?: number;
      commentary: string;
      scoreAfter: { home: number; away: number };
    }

    interface TeamMatchStats {
      possession: number; // yüzde
      shots: number;
      shotsOnTarget: number;
      fouls: number;
      corners: number;
      yellowCards: number;
      redCards: number;
      injuries: number;
    }
    ```

Motoru bir test fonksiyonu ile çalıştır: 2 rastgele takım oluştur, maç simüle et, sonuçları logla.
Beklenen çıktı: Her maçta ~21 olay, ~3 şut/takım, 1-2 gol/takım ortalama, skor 0-0 ile 4-3 arası.
```

### PROMPT 1.5 — Lig Sistemi & Fikstür

```
Football Manager projesi için lig sistemi ve fikstür oluşturma motorunu yaz.

Dosyalar:
- src/engine/leagueManager.ts
- src/engine/fixtureGenerator.ts
- src/services/leagueService.ts

**1. Fikstür Oluşturma (Round-Robin):**

   function generateFixtures(teamIds: number[]): Fixture[][]

   - Round-robin algoritması: Her takım birbirine 1 kez maç
   - N takım varsa N-1 hafta, her hafta N/2 maç
   - Tek sayı takım varsa bye sistemi (o hafta maçı yok)
   - Ev/deplasman dengeli olsun (mümkün olduğunca eşit)
   - Return tipi: Fixture[][] (hafta bazlı gruplanmış)
     ```ts
     interface Fixture {
       homeTeamId: number;
       awayTeamId: number;
       matchWeek: number;
     }
     ```

**2. Lig Yöneticisi:**

   class LeagueManager:

   - createLeague(name, type, seasonId, teamIds):
     - League oluştur
     - Her takım için LeagueTeam oluştur
     - Fikstür oluştur ve Match kayıtları oluştur
     - Maç zamanlaması: Hafta 1 → Çarşamba, Hafta 2 → Cuma, Hafta 3 → Çarşamba...
     - Maç saatleri: 20:00, 5'er dakika arayla (20:00, 20:05, 20:10...)

   - updateStandings(matchId, homeScore, awayScore):
     - Galibiyet: +3 puan, beraberlik: +1, mağlubiyet: +0
     - goalsFor, goalsAgainst güncelle
     - played, wins, draws, losses güncelle

   - getStandings(leagueId):
     - Sıralama: Puan > Averaj > Atılan Gol > Kendi arası puan
     - Return: Sıralı takım listesi

   - endSeason(leagueId):
     - A Ligi: Son 2 → küme düşer (B Ligi'ne)
     - B Ligi: İlk 2 → küme çıkar (A Ligi'ne)
     - Ödüller: Şampiyon 100K, 2. 60K, 3. 35K, diğerleri 10K
     - İstatistik ödülleri: Gol kralı 20K, asist kralı 15K

**3. Bot Komutları:**

   /ligtablosu:
   ```
   📊 A LİGİ — Sezon 1, Hafta 5
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   #  Takım          O  G  B  M  AG YG  P
   1. ⭐ Kaplanlar   5  4  1  0  12  3  13
   2. Şimşekler      5  3  1  1   9  5  10
   3. Kartallar      5  3  0  2   8  7   9
   ...
   13. 🔻 Yıldızlar  5  0  1  4   2  11  1
   14. 🔻 Fırtına    5  0  0  5   1  14  0
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔻 = Küme düşme hattı
   ```

   /fikstur:
   ```
   📅 Gelecek Maçlar
   ━━━━━━━━━━━━━━━━━━
   Hafta 6 — Çarşamba 20:00
   • Kaplanlar 🏠 vs 🔵 Şimşekler
   • Kartallar 🏠 vs 🔵 Aslanlar
   ...
   ```

   /sonuclar:
   ```
   📋 Son Sonuçlar — Hafta 5
   ━━━━━━━━━━━━━━━━━━
   Kaplanlar 3-1 Fırtına ⚽ Can Demir ×2, Ali Yılmaz
   Şimşekler 2-2 Aslanlar ⚽ ...
   ```
```

---

## FAZ 2 — Ekonomi & Gelişim

### PROMPT 2.1 — Ekonomi Sistemi

```
Football Manager projesi için ekonomi sistemini yaz.

Dosyalar:
- src/services/economyService.ts
- src/services/transactionService.ts

**EconomyService class:**

1. **addCoins(userId, amount, type, description):**
   - User.coins += amount
   - Transaction kaydı oluştur
   - Return: yeni bakiye

2. **removeCoins(userId, amount, type, description):**
   - Bakiye kontrolü: coins >= amount
   - Yetersiz bakiye → hata fırlat
   - User.coins -= amount
   - Transaction kaydı oluştur

3. **processMatchReward(userId, result: 'WIN' | 'DRAW' | 'LOSS'):**
   - WIN: +5000, DRAW: +2000, LOSS: +500
   - Yeni oyuncu koruması varsa (isNewPlayer && kaybettiyse): ekstra +2000

4. **processWeeklySalaries():**
   - Tüm aktif takımlar için:
     - Toplam maaş = takımdaki tüm oyuncuların salary toplamı
     - coins >= toplamMaaş → öde
     - coins < toplamMaaş → ÖDEME YAPILAMADI:
       - Tüm oyunculara moral -30
       - Log ve bildirim oluştur

5. **processStadiumMaintenance():**
   - Her takımdan haftalık 5000 coin
   - Ödenirse: stadiumMaintained = true (ev avantajı aktif)
   - Ödenmezse: stadiumMaintained = false (ev avantajı iptal)

6. **processDailyReward(userId):**
   - Son ödül tarihi kontrol: aynı gün mü?
   - Değilse: +1000 coin, lastDailyReward güncelle
   - Aynı günse: "Bugün zaten ödülünü aldın!"

7. **processSeasonPrize(userId, rank, leagueType):**
   - A Ligi: 1. → 100K, 2. → 60K, 3. → 35K, diğer → 10K
   - B Ligi: 1. → 50K, 2. → 30K, 3. → 20K, diğer → 5K

8. **processLevelUp(userId, newLevel):**
   - Ödül: 5000 × newLevel

**Bot Komutları:**
- /bakiye: Mevcut coin göster + son 10 işlem
- /gunluk: Günlük ödül al
- /gelir: Son 7 günlük gelir/gider özeti

**Cron Job (src/jobs/weeklyCron.ts):**
- Her Pazartesi 00:00: processWeeklySalaries() + processStadiumMaintenance()
```

### PROMPT 2.2 — Transfer Pazarı

```
Football Manager projesi için transfer pazarı sistemini yaz.

Dosyalar:
- src/services/transferService.ts
- src/bot/commands/transfer.ts
- src/bot/handlers/transferHandler.ts

**TransferService class:**

1. **listMarketPlayers(filters?):**
   - Sistem tarafından üretilmiş NPC futbolcular (teamId = null)
   - Her gün 5-10 yeni NPC oyuncu üretilir (cron)
   - Filtreleme: pozisyon, min/max OVR, max fiyat
   - Fiyat = marketValue × (1 + talep çarpanı)

2. **buyFromMarket(userId, playerId):**
   - Oyuncu kontrolü: teamId == null (satışta mı?)
   - Bakiye kontrolü
   - Kadro limiti: max 25 oyuncu
   - Para kes, oyuncuyu takıma ata
   - Transfer kaydı oluştur

3. **sendTransferOffer(fromUserId, toPlayerId, offerPrice):**
   - Oyuncu sahibi kontrolü
   - Teklif fiyat kontrolü: min %50 marketValue (altı → blok, anti-abuse)
   - Yeni oyuncu ilk hafta transfer engeli kontrolü
   - Aynı 2 kullanıcı arasında günde max 1 transfer kontrolü
   - Transfer güçlü ligden zayıf lige: +%50 vergi
   - Transfer kaydı: status=PENDING, expiresAt=24 saat sonra
   - Karşı tarafa bildirim gönder

4. **acceptOffer(transferId, userId):**
   - Transfer sahibi mi kontrol
   - Bakiye kontrolü (alıcının)
   - Para transfer: alıcı → satıcı
   - Oyuncu team değiştir
   - Her iki taraf bildirim

5. **rejectOffer(transferId, userId):**
   - Status = REJECTED
   - Teklif sahibine bildirim

6. **sellPlayer(userId, playerId, price):**
   - Min 11 oyuncu kontrolü (11'den az satamaz)
   - Oyuncuyu serbest bırak (teamId = null, pazara düşür)
   - Para ekle

7. **expireTransfers():**
   - Cron: 24 saati geçmiş PENDING transferleri EXPIRED yap

**Anti-Abuse Kuralları:**
- Piyasa değerinin %50 altına satış/teklif → otomatik blok + uyarı
- Aynı 2 kişi arasında günde max 1 transfer
- Yeni oyuncu ilk 7 gün transfer yapamaz
- Güçlü ligden zayıf lige transfer: +%50 vergi

**Bot — /transfer komutu:**
- Ana menü:
  [🛒 Pazar] [📤 Sat] [📨 Tekliflerim] [📩 Gelen Teklifler]

- Pazar: Pozisyon filtreli oyuncu listesi, sayfalı, "Satın Al" butonu
- Sat: Kendi oyuncularından seç, fiyat belirle
- Tekliflerim: Gönderdiğim teklifler (bekleyen/kabul/red)
- Gelen Teklifler: Bana gelen teklifler → [✅ Kabul] [❌ Red]
```

### PROMPT 2.3 — Antrenman & Gelişim Sistemi

```
Football Manager projesi için antrenman ve gelişim sistemini yaz.

Dosyalar:
- src/services/trainingService.ts
- src/engine/developmentEngine.ts
- src/bot/commands/training.ts

**Antrenman Tipleri:**

| Tip | Maliyet | Etki | Cooldown | Yan Etki |
|-----|---------|------|----------|----------|
| Kondisyon Kampı | 500 | Kondisyon +30 | 12 saat | — |
| Teknik Antrenman | 2000 | Seçilen stat +0.5 | 24 saat | Kondisyon -5 |
| Fizik Antrenmanı | 2000 | PHY +0.5, SPD +0.3 | 24 saat | Kondisyon -10 |
| Yoğun Kamp | 5000 | Seçilen stat +1.0 | 36 saat | Kondisyon -20 |
| Elit Kamp | 10000 | 2 seçilen stat +1.0 | 48 saat | Kondisyon -25 |

**Yaş Bazlı Gelişim Çarpanı:**
- 17-21: ×1.5
- 22-27: ×1.0
- 28-30: ×0.6
- 31-33: ×0.3
- 34-36: ×0.0 (gelişim duraklar)
- 37-38: ×-0.3 (gerileme, stat düşüşü)

**Catchup Mekanizması (Düşük OVR hızlı gelişir):**
- OVR 40-55: ×2.0
- OVR 56-65: ×1.5
- OVR 66-75: ×1.0
- OVR 76-85: ×0.7
- OVR 86-99: ×0.4

**TrainingService:**

1. **trainPlayer(userId, playerId, trainingType, targetStat?):**
   - Cooldown kontrolü (lastTrainingAt + cooldown > now → ret)
   - Bakiye kontrolü
   - Sakatlık kontrolü (sakatken antrenman yapılamaz)
   - Gelişim hesapla:
     statGain = baseGain × ageMultiplier × catchupMultiplier × (coachBonus || 1.0)
   - Stat güncelle (max 99, min 1)
   - Overall yeniden hesapla
   - Piyasa değeri yeniden hesapla
   - Kondisyon düşür
   - Cooldown başlat
   - Para kes
   - XP ekle: 50 × trainingType seviyesi

2. **processPassiveDevelopment(playerId, matchStats):**
   - Maç sonrası otomatik (her maç oynayan oyuncuya):
   - Rastgele 1-2 stat seç
   - +0.1 ile +0.3 arası gelişim (yaş/catchup çarpanı uygulanır)
   - Özel kurallar:
     - Gol atan ST/CAM → SHT +0.2
     - Asist yapan → PAS +0.2
     - Clean sheet GK → REF +0.2
     - Clean sheet CB → DEF +0.2

3. **processAging(seasonEnd):**
   - Sezon sonunda tüm oyuncuların yaşı +1
   - 34+ oyuncular: rastgele 2-3 stat'ta -0.5 ile -1.0 arası gerileme
   - 37+ oyuncular: daha sert gerileme (-1.0 ile -2.0)
   - Emeklilik: 38 yaşını geçen oyuncular emekli olabilir (%30 şans)

**Antrenör Sistemi:**

| Antrenör | Maliyet | Süre | Bonus | Ekstra |
|----------|---------|------|-------|--------|
| Bronz | 10.000 | 7 gün | +%20 antrenman | — |
| Gümüş | 25.000 | 7 gün | +%40 antrenman | — |
| Altın | 50.000 | 7 gün | +%60 antrenman | Sakatlık riski -%20 |

4. **hireCoach(userId, tier: 'bronze'|'silver'|'gold'):**
   - Bakiye kontrol, para kes
   - Coach kaydı: tier, expiresAt = now + 7 gün
   - Antrenman hesaplamalarında bonus uygula

**Bot — /antrenman komutu:**
- Oyuncu seç (inline keyboard, sayfalı)
- Antrenman tipi seç
- Teknik/Yoğun/Elit için stat seç (SPD/SHT/PAS/DRB/DEF/PHY/REF)
- Onay: "[Oyuncu] için [Antrenman] yapılsın mı? 💰 [Maliyet]"
- Sonuç: "✅ [Oyuncu]: SPD 62.3 → 63.1 (+0.8)"
```

### PROMPT 2.4 — Seviye Sistemi

```
Football Manager projesi için seviye ve XP sistemini yaz.

Dosya: src/services/levelService.ts

**XP Kazanma Kuralları:**
| Aksiyon | XP |
|---------|-----|
| Maç oyna (sonuç fark etmez) | +100 |
| Maç kazan | +200 |
| Maç berabere | +100 |
| Gol at (her gol) | +50 |
| Clean sheet | +150 |
| Antrenman yap | +50 |
| Günlük giriş | +25 |
| Transfer yap (al veya sat) | +75 |
| Rehberi tamamla | +500 |

**Seviye Formülü:**
- requiredXP(level) = 1000 × level × (1 + level × 0.1)
- Seviye 1→2: 1100 XP
- Seviye 5→6: 8000 XP
- Seviye 10→11: 21000 XP

**Seviye Atlama Ödülleri:**
- Coin: 5000 × newLevel
- Her 5 seviyede bonus: Ücretsiz Yoğun Kamp hakkı

**LevelService:**
1. addXP(userId, amount, source): XP ekle, seviye kontrolü yap
2. checkLevelUp(userId): XP yeterliyse seviye atla, ödül ver
3. getLevelInfo(userId): Mevcut seviye, XP, sonraki seviyeye kalan

**Bot — /profil komutu:**
```
👤 thorrangonak
━━━━━━━━━━━━━━━━━━
⚽ Takım: Kaplanlar
📊 Seviye: 7 (4.250/8.400 XP)
[████████░░░░] %51
💰 Bakiye: 127.500
📈 Takım OVR: 64.3
━━━━━━━━━━━━━━━━━━
📋 Sezon İstatistikleri:
🏆 8 Maç: 5G 2B 1M
⚽ 14 Gol | 🅰️ 8 Asist
🧤 3 Clean Sheet
━━━━━━━━━━━━━━━━━━
🏅 Başarılar: 4/20
```
```

---

## FAZ 3 — Lig & Zamanlama Sistemi

### PROMPT 3.1 — Sezon Döngüsü & Otomatik Zamanlama

```
Football Manager projesi için sezon döngüsü ve otomatik maç zamanlama sistemini yaz.

Dosyalar:
- src/services/seasonService.ts
- src/jobs/matchScheduler.ts
- src/jobs/cronJobs.ts

**Sezon Yapısı:**
- 8 hafta toplam: 7 hafta lig + 1 hafta transfer dönemi
- Haftada 2 maç günü: Çarşamba 20:00, Cuma 20:00
- Her maç günü aynı anda max 7-8 maç (5'er dk arayla: 20:00, 20:05, 20:10...)
- Pazar 18:00: Şampiyonlar Ligi (Faz 5'te eklenecek)

**SeasonService:**

1. **startNewSeason():**
   - Season kaydı oluştur (number++, startDate, endDate)
   - Takımları liglere dağıt:
     - A Ligi: Üst takımlar (powerRating sıralaması veya önceki sezon)
     - B Ligi: Alt takımlar + yeni oyuncular
     - İlk sezon: Tüm takımlar tek lige (B Ligi gibi davran)
   - Her lig için fikstür oluştur
   - Maçları zamanla (Çar+Cum, 20:00'den itibaren 5'er dk)
   - Tüm LeagueTeam istatistiklerini sıfırla
   - Duyuru gönder: "🏟️ Sezon [N] başladı!"

2. **endSeason(seasonId):**
   - Tüm maçlar oynandı mı kontrol
   - Sıralama finalize
   - Ödülleri dağıt (SeasonPrize)
   - Relegation/Promotion:
     - A Ligi son 2 → B Ligi
     - B Ligi ilk 2 → A Ligi
   - İstatistik ödülleri: Gol kralı, asist kralı vb.
   - Transfer dönemini başlat (1 hafta)
   - Yaşlandırma: Tüm oyuncuların yaşı +1
   - Gerileme: 34+ oyuncularda stat düşüşü

3. **startTransferWindow():**
   - 7 gün serbest transfer dönemi
   - NPC oyuncu sayısını artır (normalin 2 katı)
   - Transfer dönemi sonu: otomatik kapat, yeni sezon başlat

**Match Scheduler (BullMQ):**

1. **scheduleMatches():**
   - Gelecek haftanın maçlarını BullMQ'ya delayed job olarak ekle
   - Her maç için:
     - scheduledAt zamanında tetiklenecek job
     - Job data: matchId, homeTeamId, awayTeamId

2. **processMatch(job):**
   - Maç verilerini DB'den çek (takımlar, oyuncular, formasyonlar)
   - Sakatları ve cezalıları çıkar, yedekten tamamla
   - MatchEngine.simulateMatch() çalıştır
   - Sonuçları DB'ye kaydet
   - Lig tablosu güncelle
   - Ödülleri dağıt
   - Bildirimleri gönder
   - Match Tracker eventlerini emit et (Socket.IO, Faz 4'te)

3. **Worker yapısı:**
   - 3 worker paralel çalışır
   - Her worker 1 maçı sıralı işler
   - Maçlar 5'er dakika arayla başlar → çakışma yok

**Cron Jobs (node-cron):**

| Cron | İş | Zaman |
|------|----|-------|
| matchReminder1h | Maç 1 saat kala bildirim | Maç saatine göre dinamik |
| matchReminder10m | Maç 10 dk kala bildirim | Maç saatine göre dinamik |
| weeklySalaries | Maaş kesimi | Pazartesi 00:00 |
| stadiumMaintenance | Stadyum bakımı | Pazartesi 00:00 |
| dailyNPCRefresh | NPC transfer pazarını yenile | Her gün 06:00 |
| expireTransfers | Süresi dolan transferleri iptal | Her saat başı |
| fitnessRecovery | Kondisyon toparlanması | Her saat: +3 fitness (max 100) |

Kondisyon toparlanması: Her saat başı tüm oyuncuların fitness'ı +3 artar (max 100).
```

### PROMPT 3.2 — Bildirim Sistemi

```
Football Manager projesi için Telegram bildirim sistemini yaz.

Dosya: src/services/notificationService.ts

**NotificationService:**

1. **sendToUser(userId, message, keyboard?):**
   - TG Bot üzerinden DM gönder
   - Keyboard varsa inline button ekle

2. **sendToLeague(leagueId, message):**
   - Ligteki tüm oyunculara gönder

3. **Bildirim Türleri:**

   a) **matchReminder(matchId, minutesBefore):**
      - 60 dk: "⏰ Maçın 1 saat sonra! [Takımın] 🆚 [Rakip] — Kadronuzu kontrol edin!"
      - 10 dk: "🔔 Maçın 10 dakika sonra başlıyor! [Takımın] 🆚 [Rakip]"

   b) **matchStarted(matchId):**
      - "▶️ Maç başladı! [Ev] 🆚 [Deplasman] — /canli ile izle!"

   c) **goalScored(matchId, scorerName, score):**
      - "⚽ GOOOL! [Oyuncu] — [Ev] [skor] [Dep]"

   d) **matchEnded(matchId, result):**
      - "🏁 Maç Bitti!\n[Ev] [skor] [Dep]\n⚽ Goller: ...\n💰 Kazanç: +5.000"

   e) **transferOffer(fromTeam, toUser, player, price):**
      - "📨 Transfer Teklifi!\n[Takım] [Oyuncu] için 💰[Fiyat] teklif etti.\n[Kabul] [Red]"

   f) **weeklySalary(userId, totalSalary, success):**
      - Başarılı: "💰 Haftalık maaşlar ödendi: -[Tutar]"
      - Başarısız: "⚠️ Maaş ödenemedi! Bakiye yetersiz. Oyuncularınızın morali düştü!"

   g) **injuryNotification(playerId, duration):**
      - "🏥 [Oyuncu] sakatlandı! [N] maç süreyle oynayamayacak."

   h) **seasonEnd(userId, rank, prize):**
      - "🏆 Sezon Sonu!\nSıralamanız: #[rank]\nÖdül: 💰[prize]\n[detaylı istatistikler]"

4. **Bildirim Tercihleri:**
   - User.notificationPrefs JSON alanı:
     { matchReminders: true, goals: true, results: true, transfers: true, salaries: true }
   - /ayarlar komutu ile toggle edilebilir
   - Gönderim öncesi tercih kontrolü yap
```

### PROMPT 3.3 — Yeni Oyuncu Dengeleme (Catchup)

```
Football Manager projesi için yeni oyuncu koruma ve dengeleme sistemini yaz.

Dosya: src/services/newPlayerService.ts

Kurallar:
1. İlk 2 hafta (14 gün) koruma kalkanı (User.isNewPlayer, User.newPlayerUntil)

2. Koruma süresince:
   - Maaşlar %50 indirimli
   - Antrenman ücretleri %50 indirimli
   - Mağlubiyet başına ekstra +2.000 teselli ödülü
   - Rakip eşleştirme: OVR farkı max 10 (fikstürde kontrol)

3. B Ligi ataması: Yeni oyuncular otomatik B Ligi'ne

4. Sezon ortası katılım:
   - Eğer sezon ortasındaysa: Sonraki sezon başına kadar sadece dostluk maçları
   - Dostluk maçlardan da XP ve pasif gelişim kazanır

5. Koruma süresi bitince:
   - isNewPlayer = false
   - Normal ekonomi kuralları uygulanır
   - "Koruma kalkanınız sona erdi! Artık gerçek bir menajersiniz! 💪" bildirimi
```

---

## FAZ 4 — Match Tracker & Web Arayüzü

### PROMPT 4.1 — API Sunucusu

```
Football Manager projesi için Express API sunucusunu yaz.

Dosyalar:
- src/api/index.ts (Express app + Socket.IO)
- src/api/middleware/auth.ts (JWT auth)
- src/api/routes/teams.ts
- src/api/routes/players.ts
- src/api/routes/leagues.ts
- src/api/routes/matches.ts
- src/api/routes/transfers.ts
- src/api/routes/users.ts

**API Endpoints:**

Auth:
- POST /api/auth/telegram — Telegram Login Widget doğrulama → JWT token

Teams:
- GET /api/teams/:id — Takım detayı (oyuncularla birlikte)
- GET /api/teams/:id/squad — Kadro (ilk 11 + yedekler)
- PATCH /api/teams/:id/formation — Formasyon güncelle
- PATCH /api/teams/:id/tactic — Taktik güncelle
- PATCH /api/teams/:id/lineup — Kadro düzenle (swap)

Players:
- GET /api/players/:id — Oyuncu detay
- GET /api/players/:id/stats — Oyuncu istatistikleri

Leagues:
- GET /api/leagues/:id — Lig bilgisi
- GET /api/leagues/:id/standings — Puan tablosu
- GET /api/leagues/:id/fixtures — Fikstür
- GET /api/leagues/:id/results — Sonuçlar

Matches:
- GET /api/matches/:id — Maç detayı + olaylar
- GET /api/matches/live — Şu an oynanan maçlar
- GET /api/matches/upcoming — Gelecek maçlar

Transfers:
- GET /api/transfers/market — Transfer pazarı
- POST /api/transfers/buy/:playerId — Pazar'dan satın al
- POST /api/transfers/offer — Teklif gönder
- PATCH /api/transfers/:id/accept — Teklif kabul
- PATCH /api/transfers/:id/reject — Teklif red

Users:
- GET /api/users/me — Kendi profil
- GET /api/users/me/transactions — Para hareketleri

Middleware: JWT auth, rate limiting (60/dk), CORS, error handler, request logger.
```

### PROMPT 4.2 — Socket.IO Match Tracker

```
Football Manager projesi için Socket.IO ile gerçek zamanlı match tracker yaz.

Dosyalar:
- src/socket/matchTracker.ts
- src/socket/index.ts

**Match Tracker Akışı:**

1. Maç başladığında:
   - MatchEngine her tick'te event üretir
   - Her event Socket.IO ile broadcast edilir
   - Room: "match:{matchId}"

2. **Socket Events:**

   Client → Server:
   - join_match: { matchId } → ilgili odaya katıl
   - leave_match: { matchId } → odadan ayrıl
   - get_live_matches → aktif maç listesi

   Server → Client:
   - match_tick: { matchId, tick, minute, events[], score, stats }
   - match_event: { matchId, event: MatchEventData }
   - match_start: { matchId, homeTeam, awayTeam }
   - match_halftime: { matchId, score, stats }
   - match_end: { matchId, finalScore, fullStats, manOfTheMatch }
   - live_matches_update: { matches[] }

3. **Maç Engine Entegrasyonu:**
   - simulateMatch() fonksiyonunu tick-by-tick çalıştır
   - Her tick arasında 1 saniye bekle (gerçek zamanlı izleme)
   - Her tick'te socket event emit et

4. **TG Bot Match Tracker:**
   - Maç başında mesaj gönder
   - Her önemli olay: editMessageText ile güncelle
   - Rate limit: min 3 saniye arayla edit
   - Sadece önemli olaylar güncellenir: GOL, KART, SAKATLIK, PENALTI, DEVRE, MAÇ SONU
   - Mesaj formatı:
     ```
     🔴 CANLI — 67. dakika
     ━━━━━━━━━━━━━━━━━━
     Kaplanlar 2 - 1 Şimşekler
     ━━━━━━━━━━━━━━━━━━
     ⚽ 23' Can Demir (Kaplanlar)
     📒 31' Ali Veli (Şimşekler)
     ⚽ 45' Hasan Kara (Şimşekler)
     ⚽ 67' Can Demir (Kaplanlar)
     ━━━━━━━━━━━━━━━━━━
     [▓▓▓▓▓▓▓▓░░░░] %74
     ```
```

### PROMPT 4.3 — Web Frontend (Next.js)

```
Football Manager projesi için Next.js web arayüzünü yaz.

Dizin: web/
Teknoloji: Next.js 14 (App Router), TailwindCSS, Socket.IO Client

**Sayfalar:**

1. **/ (Dashboard):**
   - Takım özeti kartı (isim, OVR, formasyon, taktik)
   - Bakiye ve seviye
   - Yaklaşan maçlar (sonraki 3 maç)
   - Son sonuçlar
   - Hızlı aksiyonlar (Antrenman, Transfer, Kadro)

2. **/squad (Kadro):**
   - Formasyon görsel gösterimi (saha üzerinde oyuncular)
   - İlk 11 kartları (isim, pozisyon, OVR, kondisyon bar'ı)
   - Yedek listesi
   - Drag & drop kadro düzenleme
   - Formasyon ve taktik değiştirme dropdown'ları

3. **/player/[id] (Oyuncu Detay):**
   - Büyük oyuncu kartı (tüm statlar radar chart ile)
   - Form grafiği (son 10 maç)
   - Sezon istatistikleri
   - Antrenman butonu

4. **/league (Lig):**
   - Puan tablosu (renk kodlu: şampiyon, UCL, küme düşme)
   - Fikstür takvimi
   - Maç sonuçları

5. **/match/[id] (Match Tracker):**
   - Canlı skor (büyük, ortada)
   - Dakika sayacı
   - Olay akışı (timeline, yukarıdan aşağı)
   - Takım istatistikleri (possession bar, şut, faul vb.)
   - Eğer maç bitmişse: Tam istatistik + maçın adamı

6. **/transfers (Transfer Pazarı):**
   - Filtreler: Pozisyon, OVR aralığı, fiyat aralığı
   - Oyuncu kartları grid
   - Satın al butonu
   - Gelen/giden teklifler listesi

7. **/profile (Profil):**
   - Seviye ve XP bar'ı
   - Sezon istatistikleri
   - Başarılar (achievements)
   - Para hareketleri

**Ortak Bileşenler:**
- Navbar (logo, sayfalar, bakiye, bildirimler)
- PlayerCard component
- MatchScore component
- StandingsTable component
- Loading/Error states
- Telegram Login butonu (auth)
- Socket.IO provider (global connection)

Tasarım: Koyu tema, futbol temalı yeşil aksanlar, modern ve responsive.
TailwindCSS kullanarak mobil öncelikli tasarım.
```

---

## FAZ 5 — Turnuvalar & Sosyal

### PROMPT 5.1 — Şampiyonlar Ligi & Kupa

```
Football Manager projesi için Şampiyonlar Ligi ve Kupa turnuva sistemini yaz.

Dosyalar:
- src/engine/tournamentManager.ts
- src/services/tournamentService.ts

**Şampiyonlar Ligi:**

1. Katılım: A Ligi ilk 4 takım
2. Format:
   - Grup aşaması: 2 grup × 4 takım, çift devreli (her takım 6 maç)
   - Her gruptan ilk 2 → yarı final
   - Yarı final: Tek maç
   - Final: Tek maç (Pazar 18:00)
3. Ödüller: Şampiyon 200K, Finalist 100K, Yarı finalist 50K, Gruptan çıkamayan 20K
4. Maç günleri: Pazar 18:00

**Kupa Turnuvası:**
1. Tüm takımlar katılır (A + B Ligi)
2. Knockout (tek maç eleme)
3. Kura: Pot sistemi (A Ligi = Pot 1, B Ligi = Pot 2)
4. Final ödülü: 75K
5. Sezon sonu: Süper Kupa (Lig şampiyonu vs Kupa şampiyonu)

**TournamentManager:**
- createChampionsLeague(seasonId, qualifiedTeamIds[])
- createCup(seasonId, allTeamIds[])
- drawGroups(teamIds, groupCount)
- drawKnockout(teamIds, pots?)
- advanceRound(tournamentId)
- getTournamentBracket(tournamentId)
```

### PROMPT 5.2 — Sosyal Özellikler

```
Football Manager projesi için sosyal özellikleri yaz.

**1. Dostluk Maçı:**
- /dostlukmaci @rakip_username
- Günde max 3 dostluk maçı
- Puan tablosunu etkilemez
- XP ve pasif gelişim verir
- Sonuç: Normal maç simülasyonu

**2. Lig Sohbet Grubu:**
- Her lig için otomatik TG grubu oluştur
- Maç sonuçları otomatik paylaşılır
- Haftalık özet mesajı (puan tablosu + haftanın sonuçları)

**3. MVP Oylaması:**
- Her hafta sonu: Haftanın en iyi performans gösteren oyuncuları listelenir
- Lig üyeleri oy verir (inline keyboard)
- Kazanan oyuncunun takımına +5 moral tüm kadro
- /mvp komutu

**4. All-Star Maçı:**
- Sezon sonunda: A Ligi en iyi 11 vs B Ligi en iyi 11
- Eğlence maçı, ödül yok, sadece prestij

**5. Liderlik Tabloları:**
- /golkrali: Sezon gol sıralaması
- /asistkrali: Sezon asist sıralaması
- /eniyitakim: Takım OVR sıralaması
- /liderlik: Genel liderlik tablosu

**6. Başarı Sistemi:**
- 20+ başarı: İlk galibiyet, 10 galibiyet, 50 gol, 5 galibiyet serisi, şampiyonluk, UCL kazanma, 100K coin biriktirme vb.
- Her başarı XP + coin ödülü
```

---

## FAZ 6 — Polish, Güvenlik & Ölçekleme

### PROMPT 6.1 — Anti-Cheat & Güvenlik

```
Football Manager projesi için anti-cheat ve güvenlik önlemlerini yaz.

Dosya: src/services/antiCheatService.ts

**Kurallar:**
1. Çoklu hesap: TG hesap yaşı < 7 gün → kayıt engeli
2. IP kontrolü: Web'de aynı IP'den max 2 hesap
3. Transfer suistimali: Piyasa değerinin %50 altına satış → otomatik blok
4. Aynı 2 kişi arasında günde max 1 transfer
5. Rate limiting: Dakikada max 30 API çağrısı per kullanıcı
6. Bot davranış tespiti: Anormal aktivite pattern'i (1 dk'da 50+ komut)

**Ceza Sistemi:**
- 1. ihlal: Uyarı mesajı
- 2. ihlal: 3 gün ban (tüm komutlar kilitlenir)
- 3. ihlal: Sezon sonu hesap silme

**Loglama:**
- Her transfer, her büyük para hareketi loglanır
- Şüpheli aktiviteler ayrı log dosyasına
- Haftalık otomatik rapor (admin'e)
```

### PROMPT 6.2 — Veri Yedekleme & Deployment

```
Football Manager projesi için yedekleme ve deployment yapılandırmasını yaz.

**Yedekleme:**
1. PostgreSQL WAL: continuous archiving, 7 gün retention
2. Günlük pg_dump: Cron 04:00, sıkıştırılmış SQL → /backups/ dizini
3. Redis RDB: 15 dakikada bir snapshot
4. Kurtarma prosedürü dokümantasyonu

**Deployment:**
1. VPS: 2 vCPU, 4GB RAM, Ubuntu 22.04
2. Docker Compose production yapısı:
   - PostgreSQL 16 + Redis 7 + Node.js app
3. PM2 process manager:
   - pm2.config.js: Bot + API + Worker süreçleri
   - Auto-restart, memory limit, log rotation
4. Nginx reverse proxy:
   - SSL (Let's Encrypt)
   - WebSocket proxy (Socket.IO için)
   - Static file serving (Next.js build)
5. Monitoring:
   - pm2 monit
   - Basit health check endpoint (/api/health)

**Performans:**
1. Redis cache: Puan tablosu (TTL: 60s), oyuncu detay (TTL: 30s)
2. DB indexleri: Match.scheduledAt, Player.teamId, LeagueTeam.leagueId, Transfer.status
3. Connection pooling: Prisma default pool
```

### PROMPT 6.3 — Ekonomi Dengeleme & Son Testler

```
Football Manager projesi için ekonomi dengeleme testi ve son dokunuşları yaz.

**Simülasyon Testi:**
25-30 yapay takım oluştur ve 2 sezon simüle et.
Kontrol listesi:
1. Ortalama takım bakiyesi sezon sonunda pozitif mi?
2. En zengin ve en fakir arasındaki fark makul mü? (max 5x)
3. Transfer pazarında enflasyon var mı? (ortalama fiyat artışı < %20/sezon)
4. Maaş toplamı gelirlerden düşük mü? (sürdürülebilir)
5. Yeni oyuncu 4 hafta sonra rekabetçi olabiliyor mu?
6. 34+ yaş oyuncular doğal olarak değer kaybediyor mu?

**Ayarlama:**
Dengesizlik varsa şu parametreleri ayarla:
- Maç ödülleri (5K/2K/500)
- Maaş çarpanı (0.02)
- Antrenman maliyetleri
- Transfer NPC fiyatları
- Stadyum bakım ücreti

**Son Dokunuşlar:**
1. Tüm hata mesajlarını Türkçeleştir
2. Bot komut listesini BotFather'a kaydet
3. README.md güncelle (son kurulum adımları)
4. Kullanıcı geri bildirim toplama: /geribildirm komutu
```

---

## 🔧 YARDIMCI PROMPTLAR

### Hata Ayıklama

```
Football Manager projesinde [MODÜL] bölümünde şu hata var:
[HATA MESAJI]

Mevcut kod: [KOD]

Bu hatayı düzelt. Düzeltirken:
1. Hatanın kök nedenini açıkla
2. Düzeltme kodunu yaz
3. Benzer hataları önlemek için ek kontroller öner
```

### Yeni Özellik Ekleme

```
Football Manager projesine yeni bir özellik eklemek istiyorum:
[ÖZELLİK AÇIKLAMASI]

Mevcut yapı:
- src/engine/ — Maç motoru, oyuncu oluşturma
- src/services/ — İş mantığı servisleri
- src/bot/ — Telegram bot komutları
- src/api/ — REST API
- prisma/schema.prisma — Veritabanı modelleri

Bu özelliği:
1. Hangi dosyalara eklenmeli?
2. DB schema değişikliği gerekiyor mu?
3. Yeni endpoint/komut gerekiyor mu?
4. Mevcut sisteme etkisi ne?

Kodu yaz ve mevcut yapıya entegre et.
```

### Performans İyileştirme

```
Football Manager projesinde [BÖLÜM] yavaş çalışıyor.

Mevcut durum: [AÇIKLAMA]
Beklenen: [HEDEF]

Optimize et:
1. Database sorgu optimizasyonu (N+1 problemi, index eksikliği)
2. Redis cache ekleme
3. Bulk işlem kullanma
4. Gereksiz DB çağrılarını kaldırma
```
