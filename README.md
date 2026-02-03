# ⚽ Football Manager

Telegram Bot & Web tabanlı futbol menajerlik oyunu.

## 🎮 Hakkında

Her oyuncu bir futbol takımına sahip olur. 11'er kişilik takımlar lig sisteminde mücadele eder. Futbolcularını geliştir, transfer yap, taktik belirle ve şampiyonluğa ulaş!

### Temel Özellikler

- **Takım Yönetimi** — 11 asil + 7 yedek, 6 formasyon, 4 taktik seçeneği
- **Maç Simülasyonu** — İstatistik bazlı 1 dakikalık gerçek zamanlı maçlar (60 tick motoru)
- **Match Tracker** — Web'de Socket.IO ile canlı, Telegram'da mesaj güncelleme ile izleme
- **Lig Sistemi** — A/B Ligi, küme düşme/çıkma, 8 haftalık sezonlar
- **Transfer Pazarı** — Oyuncular arası al-sat, dinamik fiyatlama
- **Ekonomi** — Maç ödülleri, maaşlar, antrenman maliyetleri, dengeli para sistemi
- **Gelişim** — Pasif + aktif antrenman, yaş bazlı gelişim/gerileme
- **Şampiyonlar Ligi** — Seviye bazlı turnuva sistemi
- **Seviye & XP** — Oyuncu seviye sistemi, başarılar

## 🛠️ Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| **Runtime** | Node.js + TypeScript |
| **Telegram Bot** | grammy |
| **Web Frontend** | Next.js + TailwindCSS |
| **API** | Express + Socket.IO |
| **Database** | PostgreSQL + Prisma ORM |
| **Cache & Queue** | Redis + BullMQ |
| **Job Scheduling** | node-cron |

## 📋 Proje Takip

Proje ilerlemesini takip etmek için `docs/proje-takip.html` dosyasını tarayıcıda aç.
Tüm fazlar, görevler ve ilerleme durumu interaktif olarak takip edilebilir.

## 📐 Dökümanlar

- [Game Design Document](docs/GAME-DESIGN-DOCUMENT.md) — Tüm oyun tasarım kararları
- [Proje Takip Paneli](docs/proje-takip.html) — İnteraktif görev takip arayüzü

## 🗺️ Yol Haritası

| Faz | Başlık | Süre |
|-----|--------|------|
| **Faz 0** | Proje Altyapısı & Kurulum | Hafta 0 |
| **Faz 1** | Temel Oyun Mekaniği (MVP) | Hafta 1-3 |
| **Faz 2** | Ekonomi & Gelişim | Hafta 4-5 |
| **Faz 3** | Lig & Zamanlama Sistemi | Hafta 6-7 |
| **Faz 4** | Match Tracker & Web Arayüzü | Hafta 8-10 |
| **Faz 5** | Turnuvalar & Sosyal | Hafta 11-12 |
| **Faz 6** | Polish, Güvenlik & Ölçekleme | Hafta 13+ |

## 🚀 Kurulum

```bash
# Repo'yu klonla
git clone https://github.com/thorrangonak/football-manager.git
cd football-manager

# Bağımlılıkları kur
npm install

# Docker servisleri başlat (PostgreSQL + Redis)
docker compose up -d

# Environment dosyasını oluştur
cp .env.example .env
# .env dosyasını düzenle (BOT_TOKEN vb.)

# Veritabanını oluştur
npx prisma db push

# Geliştirme sunucusunu başlat
npm run dev
```

## 📄 Lisans

MIT
