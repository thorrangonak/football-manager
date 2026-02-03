/**
 * ⚽ Football Manager — Futbolcu Oluşturma Motoru
 *
 * Pozisyona göre stat dağılımı, overall hesaplama,
 * piyasa değeri, maaş ve starter pack üretimi.
 */

import { Position, type StatName, GAME_CONSTANTS } from '../shared/types';

// ===================================
// Türkçe İsim Havuzu (100+ isim, 100+ soyisim)
// ===================================
const FIRST_NAMES = [
  'Ahmet', 'Mehmet', 'Mustafa', 'Ali', 'Hüseyin', 'Hasan', 'İbrahim', 'İsmail', 'Yılmaz', 'Osman',
  'Murat', 'Fatih', 'Emre', 'Burak', 'Arda', 'Cenk', 'Uğur', 'Volkan', 'Selim', 'Kerem',
  'Kaan', 'Berk', 'Cem', 'Deniz', 'Eren', 'Furkan', 'Gökhan', 'Hakan', 'Kemal', 'Levent',
  'Mert', 'Nihat', 'Onur', 'Ömer', 'Recep', 'Serkan', 'Tuncay', 'Umut', 'Yusuf', 'Zan',
  'Barış', 'Caner', 'Doruk', 'Emir', 'Ferdi', 'Gürkan', 'Halil', 'İlhan', 'Koray', 'Luan',
  'Mahir', 'Necip', 'Orkun', 'Özkan', 'Poyraz', 'Rıdvan', 'Semih', 'Taylan', 'Uğurcan', 'Veysel',
  'Yunus', 'Zafer', 'Alp', 'Batuhan', 'Can', 'Devrim', 'Erkan', 'Feyyaz', 'Günay', 'Haydar',
  'İlker', 'Kazım', 'Lütfi', 'Musa', 'Nazim', 'Ozan', 'Rıza', 'Samet', 'Tolga', 'Ufuk',
  'Vedat', 'Yakup', 'Adem', 'Bilal', 'Cemal', 'Doğan', 'Engin', 'Fikret', 'Gazi', 'Hamza',
  'İhsan', 'Kazım', 'Muhammed', 'Nuri', 'Orhan', 'Polat', 'Ramazan', 'Sinan', 'Tuncer', 'Vüsal',
  'Yavuz', 'Ziya', 'Alperen', 'Bora', 'Coşkun', 'Dursun', 'Erdem', 'Fuat', 'Gündoğdu', 'Hüsniye',
];

const LAST_NAMES = [
  'Yıldız', 'Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir',
  'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Erdoğan', 'Koç', 'Kurt', 'Öz', 'Korkmaz', 'Polat',
  'Akın', 'Avcı', 'Baş', 'Bulut', 'Candan', 'Çakır', 'Çetin', 'Duman', 'Eker', 'Gül',
  'Güneş', 'Karaca', 'Keskin', 'Koçak', 'Kara', 'Kaplan', 'Köse', 'Kuru', 'Oral', 'Orucu',
  'Parlak', 'Sari', 'Soylu', 'Tan', 'Turan', 'Uçar', 'Ünal', 'Varol', 'Yılmazer', 'Zengin',
  'Akıllı', 'Bağcı', 'Bilir', 'Ceylan', 'Çolak', 'Durmaz', 'Efe', 'Göksu', 'Işık', 'Kahraman',
  'Kuzu', 'Mercan', 'Oruç', 'Pek', 'Sezen', 'Taş', 'Uzun', 'Yüksel', 'Altıntaş', 'Başar',
  'Cengiz', 'Dalgıç', 'Elmas', 'Gürsoy', 'Hacı', 'Kabak', 'Lale', 'Mutlu', 'Narlı', 'Ok',
  'Pınar', 'Sağlam', 'Tok', 'Uysal', 'Yağmur', 'Zenger', 'Ateş', 'Bayrak', 'Canpolat', 'Derya',
  'Ergin', 'Fidanlı', 'Hafiz', 'Irmak', 'Kalkan', 'Metin', 'Nalbant', 'Ova', 'Peker', 'Reyhan',
  'Sevim', 'Tekin', 'Uygur', 'Yeni', 'Acar', 'Bingöl', 'Coplu', 'Dinler', 'Fırat', 'Gedik',
];

// ===================================
// Pozisyon Ağırlıkları (Stat Dağılımı)
// ===================================
type StatWeights = Record<StatName, number>;

const POSITION_WEIGHTS: Record<Position, StatWeights> = {
  [Position.GK]:  { speed: 0.8, shooting: 0.5, passing: 0.8, dribbling: 0.5, defense: 1.2, physical: 1.3, goalkeeping: 2.0 },
  [Position.CB]:  { speed: 0.8, shooting: 0.6, passing: 0.8, dribbling: 0.6, defense: 2.0, physical: 1.5, goalkeeping: 0.3 },
  [Position.LB]:  { speed: 1.5, shooting: 0.7, passing: 1.2, dribbling: 0.9, defense: 1.3, physical: 1.0, goalkeeping: 0.3 },
  [Position.RB]:  { speed: 1.5, shooting: 0.7, passing: 1.2, dribbling: 0.9, defense: 1.3, physical: 1.0, goalkeeping: 0.3 },
  [Position.CDM]: { speed: 0.9, shooting: 0.7, passing: 1.3, dribbling: 0.8, defense: 1.5, physical: 1.3, goalkeeping: 0.3 },
  [Position.CM]:  { speed: 1.0, shooting: 1.0, passing: 1.8, dribbling: 1.2, defense: 0.8, physical: 0.9, goalkeeping: 0.3 },
  [Position.CAM]: { speed: 1.1, shooting: 1.3, passing: 1.5, dribbling: 1.5, defense: 0.5, physical: 0.7, goalkeeping: 0.3 },
  [Position.LW]:  { speed: 1.8, shooting: 1.0, passing: 0.9, dribbling: 1.5, defense: 0.4, physical: 0.7, goalkeeping: 0.3 },
  [Position.RW]:  { speed: 1.8, shooting: 1.0, passing: 0.9, dribbling: 1.5, defense: 0.4, physical: 0.7, goalkeeping: 0.3 },
  [Position.ST]:  { speed: 1.3, shooting: 2.0, passing: 0.7, dribbling: 1.2, defense: 0.3, physical: 0.9, goalkeeping: 0.3 },
  [Position.WB]:  { speed: 1.5, shooting: 0.6, passing: 1.2, dribbling: 0.8, defense: 1.2, physical: 1.2, goalkeeping: 0.3 },
};

// ===================================
// Overall Hesaplama Ağırlıkları
// ===================================
type OverallWeights = Record<StatName, number>;

const OVERALL_WEIGHTS: Record<Position, OverallWeights> = {
  [Position.GK]:  { goalkeeping: 0.45, physical: 0.20, defense: 0.15, speed: 0.10, passing: 0.10, shooting: 0.00, dribbling: 0.00 },
  [Position.CB]:  { defense: 0.35, physical: 0.25, speed: 0.15, passing: 0.15, shooting: 0.10, dribbling: 0.00, goalkeeping: 0.00 },
  [Position.LB]:  { speed: 0.25, defense: 0.25, passing: 0.20, physical: 0.15, dribbling: 0.15, shooting: 0.00, goalkeeping: 0.00 },
  [Position.RB]:  { speed: 0.25, defense: 0.25, passing: 0.20, physical: 0.15, dribbling: 0.15, shooting: 0.00, goalkeeping: 0.00 },
  [Position.CDM]: { defense: 0.30, passing: 0.25, physical: 0.25, speed: 0.10, dribbling: 0.10, shooting: 0.00, goalkeeping: 0.00 },
  [Position.CM]:  { passing: 0.30, dribbling: 0.20, shooting: 0.15, defense: 0.15, physical: 0.10, speed: 0.10, goalkeeping: 0.00 },
  [Position.CAM]: { passing: 0.25, dribbling: 0.25, shooting: 0.25, speed: 0.15, physical: 0.10, defense: 0.00, goalkeeping: 0.00 },
  [Position.LW]:  { speed: 0.30, dribbling: 0.25, shooting: 0.20, passing: 0.15, physical: 0.10, defense: 0.00, goalkeeping: 0.00 },
  [Position.RW]:  { speed: 0.30, dribbling: 0.25, shooting: 0.20, passing: 0.15, physical: 0.10, defense: 0.00, goalkeeping: 0.00 },
  [Position.ST]:  { shooting: 0.35, speed: 0.20, dribbling: 0.20, physical: 0.15, passing: 0.10, defense: 0.00, goalkeeping: 0.00 },
  [Position.WB]:  { speed: 0.20, defense: 0.20, passing: 0.20, physical: 0.20, dribbling: 0.20, shooting: 0.00, goalkeeping: 0.00 },
};

// ===================================
// Yardımcı Fonksiyonlar
// ===================================

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

/** Yaş üretimi: 20-28 arası daha olası */
function generateAge(): number {
  const weights = [
    { range: [17, 19], weight: 0.15 },
    { range: [20, 24], weight: 0.35 },
    { range: [25, 28], weight: 0.30 },
    { range: [29, 31], weight: 0.13 },
    { range: [32, 33], weight: 0.07 },
  ];

  const rand = Math.random();
  let cumulative = 0;

  for (const w of weights) {
    cumulative += w.weight;
    if (rand <= cumulative) {
      return randomInt(w.range[0], w.range[1]);
    }
  }

  return randomInt(20, 28);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ===================================
// Ana Fonksiyonlar
// ===================================

export interface GeneratePlayerOptions {
  position: Position;
  minOvr?: number;
  maxOvr?: number;
  age?: number;
  excludeNames?: Set<string>;
}

export interface GeneratedPlayer {
  name: string;
  age: number;
  position: Position;
  speed: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defense: number;
  physical: number;
  goalkeeping: number;
  overall: number;
  marketValue: number;
  salary: number;
}

/**
 * Rastgele Türkçe isim üret.
 * excludeNames seti verilirse, aynı isimde oyuncu üretmez.
 */
function generateName(excludeNames?: Set<string>): string {
  let attempts = 0;
  while (attempts < 50) {
    const name = `${pickRandom(FIRST_NAMES)} ${pickRandom(LAST_NAMES)}`;
    if (!excludeNames || !excludeNames.has(name)) {
      return name;
    }
    attempts++;
  }
  // Fallback: numara ekle
  return `${pickRandom(FIRST_NAMES)} ${pickRandom(LAST_NAMES)} ${randomInt(1, 99)}`;
}

/**
 * Pozisyona göre ağırlıklı overall hesapla.
 */
export function calculateOverall(stats: Record<StatName, number>, position: Position): number {
  const weights = OVERALL_WEIGHTS[position];
  let overall = 0;

  for (const [stat, weight] of Object.entries(weights)) {
    overall += (stats[stat as StatName] || 0) * weight;
  }

  return Math.round(overall * 10) / 10;
}

/**
 * Piyasa değeri hesapla.
 */
export function calculateMarketValue(
  overall: number,
  age: number,
  form: number = 50,
): number {
  // Base: overall² x 15
  const base = Math.pow(overall, 2) * GAME_CONSTANTS.MARKET_VALUE_BASE_MULTIPLIER;

  // Yaş çarpanı
  let ageMultiplier: number;
  if (age <= 21) ageMultiplier = 1.4;
  else if (age <= 27) ageMultiplier = 1.0;
  else if (age <= 30) ageMultiplier = 0.7;
  else if (age <= 33) ageMultiplier = 0.4;
  else ageMultiplier = 0.2;

  // Form bonusu
  const formMultiplier = form / 50;

  return Math.round(base * ageMultiplier * formMultiplier);
}

/**
 * Haftalık maaş hesapla.
 */
export function calculateSalary(marketValue: number): number {
  return Math.round(marketValue * GAME_CONSTANTS.SALARY_MULTIPLIER);
}

/**
 * Tek bir futbolcu üret.
 */
export function generatePlayer(options: GeneratePlayerOptions): GeneratedPlayer {
  const {
    position,
    minOvr = GAME_CONSTANTS.STARTER_MIN_OVR,
    maxOvr = GAME_CONSTANTS.STARTER_MAX_OVR,
    age: fixedAge,
    excludeNames,
  } = options;

  const targetOverall = randomBetween(minOvr, maxOvr);
  const weights = POSITION_WEIGHTS[position];
  const age = fixedAge ?? generateAge();
  const name = generateName(excludeNames);

  // Stat üretimi: Hedef overall'a yaklaşacak şekilde
  const stats: Record<StatName, number> = {
    speed: 0,
    shooting: 0,
    passing: 0,
    dribbling: 0,
    defense: 0,
    physical: 0,
    goalkeeping: 0,
  };

  // Her stat için base değer üret, sonra ağırlık uygula
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  for (const [stat, weight] of Object.entries(weights)) {
    const normalizedWeight = weight / totalWeight;
    const baseValue = targetOverall + randomBetween(-10, 10);
    const weightedValue = baseValue * (0.6 + normalizedWeight * 2.5);
    stats[stat as StatName] = clamp(Math.round(weightedValue * 10) / 10, 1, 99);
  }

  // Overall hesapla
  const overall = calculateOverall(stats, position);

  // Hedef OVR'ye yaklaştır (iteratif)
  const diff = targetOverall - overall;
  if (Math.abs(diff) > 2) {
    const adjustFactor = diff * 0.5;
    for (const stat of Object.keys(stats) as StatName[]) {
      stats[stat] = clamp(
        Math.round((stats[stat] + adjustFactor * (weights[stat] / totalWeight)) * 10) / 10,
        1,
        99,
      );
    }
  }

  const finalOverall = calculateOverall(stats, position);
  const marketValue = calculateMarketValue(finalOverall, age);
  const salary = calculateSalary(marketValue);

  return {
    name,
    age,
    position,
    ...stats,
    overall: finalOverall,
    marketValue,
    salary,
  };
}

/**
 * Starter Pack: 18 futbolcu üret (1 yıldız oyuncu dahil).
 *
 * Kadro:
 * - 2 GK (1 starter)
 * - 2 CB (starter) + 1 yedek CB
 * - 1 LB (starter) + 1 RB (starter)
 * - 2 CM (starter) + 1 CDM (starter)
 * - 1 CAM (yedek)
 * - 1 LW (starter) + 1 RW (starter)
 * - 2 ST (1 starter, 1 yedek)
 * - 1 WB (yedek)
 * Toplam: 18 oyuncu, 11 starter
 */
export function generateStarterPack(): {
  players: (GeneratedPlayer & { isStarter: boolean; jerseyNumber: number })[];
} {
  const usedNames = new Set<string>();
  const players: (GeneratedPlayer & { isStarter: boolean; jerseyNumber: number })[] = [];

  const squad: { position: Position; isStarter: boolean }[] = [
    // GK
    { position: Position.GK, isStarter: true },
    { position: Position.GK, isStarter: false },
    // Defans
    { position: Position.CB, isStarter: true },
    { position: Position.CB, isStarter: true },
    { position: Position.CB, isStarter: false },
    { position: Position.LB, isStarter: true },
    { position: Position.RB, isStarter: true },
    // Orta saha
    { position: Position.CM, isStarter: true },
    { position: Position.CM, isStarter: true },
    { position: Position.CDM, isStarter: true },
    { position: Position.CAM, isStarter: false },
    // Hucum
    { position: Position.LW, isStarter: true },
    { position: Position.RW, isStarter: true },
    { position: Position.ST, isStarter: true },
    { position: Position.ST, isStarter: false },
    // Yedek
    { position: Position.WB, isStarter: false },
    // 16 oyuncu yukarıda, 2 daha ekliyoruz (toplam 18)
    { position: Position.CM, isStarter: false },
    { position: Position.CB, isStarter: false },
  ];

  // Yıldız oyuncu: Rastgele bir slot'u yüksek OVR ile üret
  const starIndex = randomInt(0, squad.length - 1);

  for (let i = 0; i < squad.length; i++) {
    const { position, isStarter } = squad[i];
    const isStar = i === starIndex;

    const player = generatePlayer({
      position,
      minOvr: isStar ? GAME_CONSTANTS.STAR_PLAYER_MIN_OVR : GAME_CONSTANTS.STARTER_MIN_OVR,
      maxOvr: isStar ? GAME_CONSTANTS.STAR_PLAYER_MAX_OVR : GAME_CONSTANTS.STARTER_MAX_OVR,
      excludeNames: usedNames,
    });

    usedNames.add(player.name);

    players.push({
      ...player,
      isStarter,
      jerseyNumber: i + 1, // 1-18
    });
  }

  return { players };
}
