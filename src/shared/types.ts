// ===================================
// ⚽ Football Manager — Temel Tipler
// ===================================

// --- Pozisyon ---
export enum Position {
  GK = 'GK',
  CB = 'CB',
  LB = 'LB',
  RB = 'RB',
  CDM = 'CDM',
  CM = 'CM',
  CAM = 'CAM',
  LW = 'LW',
  RW = 'RW',
  ST = 'ST',
  WB = 'WB',
}

// --- Formasyon ---
export enum Formation {
  F442 = 'F442',
  F433 = 'F433',
  F352 = 'F352',
  F532 = 'F532',
  F451 = 'F451',
  F343 = 'F343',
}

// --- Taktik ---
export enum Tactic {
  ATTACK = 'ATTACK',
  BALANCED = 'BALANCED',
  DEFENSIVE = 'DEFENSIVE',
  ALL_OUT_ATTACK = 'ALL_OUT_ATTACK',
}

// --- Maç Olay Tipleri ---
export enum MatchEventType {
  GOAL = 'GOAL',
  SHOT = 'SHOT',
  FOUL = 'FOUL',
  YELLOW_CARD = 'YELLOW_CARD',
  RED_CARD = 'RED_CARD',
  INJURY = 'INJURY',
  CORNER = 'CORNER',
  PENALTY = 'PENALTY',
  SUBSTITUTION = 'SUBSTITUTION',
}

// --- Maç Durumu ---
export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

// --- Lig Tipi ---
export enum LeagueType {
  A_LEAGUE = 'A_LEAGUE',
  B_LEAGUE = 'B_LEAGUE',
}

// --- Transfer Durumu ---
export enum TransferStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

// --- Sezon Durumu ---
export enum SeasonStatus {
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED',
  TRANSFER_WINDOW = 'TRANSFER_WINDOW',
}

// --- İşlem Tipleri ---
export enum TransactionType {
  MATCH_WIN = 'MATCH_WIN',
  MATCH_DRAW = 'MATCH_DRAW',
  MATCH_LOSS = 'MATCH_LOSS',
  SALARY = 'SALARY',
  TRAINING = 'TRAINING',
  TRANSFER_BUY = 'TRANSFER_BUY',
  TRANSFER_SELL = 'TRANSFER_SELL',
  DAILY_REWARD = 'DAILY_REWARD',
  LEVEL_UP = 'LEVEL_UP',
  SEASON_PRIZE = 'SEASON_PRIZE',
  STADIUM = 'STADIUM',
  MEDICAL = 'MEDICAL',
  COACH = 'COACH',
}

// --- Antrenman Tipi ---
export enum TrainingType {
  FITNESS_CAMP = 'FITNESS_CAMP',
  TECHNICAL = 'TECHNICAL',
  PHYSICAL = 'PHYSICAL',
  INTENSE_CAMP = 'INTENSE_CAMP',
  ELITE_CAMP = 'ELITE_CAMP',
}

// --- Antrenör Seviyesi ---
export enum CoachTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
}

// ===================================
// Oyuncu Stat Isimleri
// ===================================
export type StatName =
  | 'speed'
  | 'shooting'
  | 'passing'
  | 'dribbling'
  | 'defense'
  | 'physical'
  | 'goalkeeping';

export const ALL_STATS: StatName[] = [
  'speed',
  'shooting',
  'passing',
  'dribbling',
  'defense',
  'physical',
  'goalkeeping',
];

// ===================================
// Maç Motoru Tipleri
// ===================================
export interface MatchTeamPlayer {
  id: number;
  name: string;
  position: Position;
  isStarter: boolean;
  speed: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defense: number;
  physical: number;
  goalkeeping: number;
  overall: number;
  morale: number;
  form: number;
  fitness: number;
}

export interface MatchTeam {
  id: number;
  name: string;
  formation: Formation;
  tactic: Tactic;
  players: MatchTeamPlayer[];
  stadiumLevel: number;
  stadiumMaintained: boolean;
}

export interface MatchEvent {
  tick: number;
  minute: number;
  type: MatchEventType;
  teamId?: number;
  playerId?: number;
  secondPlayerId?: number;
  detail?: Record<string, unknown>;
  commentary?: string;
}

export interface MatchResult {
  matchId: number;
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  stats: MatchStats;
  manOfTheMatch?: { playerId: number; name: string; rating: number };
}

export interface MatchStats {
  possession: { home: number; away: number };
  shots: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  fouls: { home: number; away: number };
  corners: { home: number; away: number };
  yellowCards: { home: number; away: number };
  redCards: { home: number; away: number };
  passes: { home: number; away: number };
}

// ===================================
// Formasyon Pozisyon Haritası
// ===================================
export const FORMATION_POSITIONS: Record<Formation, Position[]> = {
  [Formation.F442]: [
    Position.GK,
    Position.LB, Position.CB, Position.CB, Position.RB,
    Position.LW, Position.CM, Position.CM, Position.RW,
    Position.ST, Position.ST,
  ],
  [Formation.F433]: [
    Position.GK,
    Position.LB, Position.CB, Position.CB, Position.RB,
    Position.CM, Position.CDM, Position.CM,
    Position.LW, Position.ST, Position.RW,
  ],
  [Formation.F352]: [
    Position.GK,
    Position.CB, Position.CB, Position.CB,
    Position.WB, Position.CM, Position.CDM, Position.CM, Position.WB,
    Position.ST, Position.ST,
  ],
  [Formation.F532]: [
    Position.GK,
    Position.WB, Position.CB, Position.CB, Position.CB, Position.WB,
    Position.CM, Position.CDM, Position.CM,
    Position.ST, Position.ST,
  ],
  [Formation.F451]: [
    Position.GK,
    Position.LB, Position.CB, Position.CB, Position.RB,
    Position.LW, Position.CM, Position.CAM, Position.CM, Position.RW,
    Position.ST,
  ],
  [Formation.F343]: [
    Position.GK,
    Position.CB, Position.CB, Position.CB,
    Position.WB, Position.CM, Position.CM, Position.WB,
    Position.LW, Position.ST, Position.RW,
  ],
};

// ===================================
// Oyun Sabitleri
// ===================================
export const GAME_CONSTANTS = {
  // Ekonomi
  STARTING_COINS: 50000,
  MATCH_WIN_REWARD: 5000,
  MATCH_DRAW_REWARD: 2000,
  MATCH_LOSS_REWARD: 500,
  DAILY_REWARD: 1000,
  STADIUM_MAINTENANCE_COST: 5000,
  NEW_PLAYER_EXTRA_LOSS_REWARD: 2000,

  // Oyuncu
  STARTER_PACK_SIZE: 18,
  MAX_SQUAD_SIZE: 25,
  MIN_SQUAD_SIZE: 11,
  STARTER_MIN_OVR: 45,
  STARTER_MAX_OVR: 60,
  STAR_PLAYER_MIN_OVR: 65,
  STAR_PLAYER_MAX_OVR: 70,

  // Koruma
  NEW_PLAYER_PROTECTION_DAYS: 14,
  NEW_PLAYER_TRANSFER_BLOCK_DAYS: 7,
  NEW_PLAYER_MAX_OVR_DIFF: 10,

  // Transfer
  MIN_TRANSFER_PRICE_RATIO: 0.5,
  STRONG_TO_WEAK_TAX: 0.5,
  MAX_DAILY_TRANSFERS_BETWEEN_USERS: 1,
  TRANSFER_EXPIRY_HOURS: 24,

  // Antrenman
  SALARY_MULTIPLIER: 0.02,
  MARKET_VALUE_BASE_MULTIPLIER: 15,

  // Sezon
  SEASON_WEEKS: 8,
  LEAGUE_WEEKS: 7,
  TRANSFER_WINDOW_WEEKS: 1,
  MATCHES_PER_WEEK: 2,
  MATCH_START_HOUR: 20,
  MATCH_INTERVAL_MINUTES: 5,

  // Maç
  TICKS_PER_MATCH: 60,
  EVENT_CHANCE_PER_TICK: 0.35,
  HOME_ADVANTAGE_BONUS: 0.05,

  // XP
  XP_MATCH_PLAY: 100,
  XP_MATCH_WIN: 200,
  XP_MATCH_DRAW: 100,
  XP_GOAL: 50,
  XP_CLEAN_SHEET: 150,
  XP_TRAINING: 50,
  XP_DAILY_LOGIN: 25,
  XP_TRANSFER: 75,
  XP_TUTORIAL: 500,

  // Seviye
  LEVEL_UP_COIN_MULTIPLIER: 5000,

  // Sezon Ödülleri
  SEASON_PRIZES: {
    A_LEAGUE: { 1: 100000, 2: 60000, 3: 35000, default: 10000 },
    B_LEAGUE: { 1: 50000, 2: 30000, 3: 20000, default: 5000 },
  },

  // Antrenman Maliyetleri
  TRAINING_COSTS: {
    FITNESS_CAMP: 500,
    TECHNICAL: 2000,
    PHYSICAL: 2000,
    INTENSE_CAMP: 5000,
    ELITE_CAMP: 10000,
  },

  // Antrenör Maliyetleri
  COACH_COSTS: {
    BRONZE: 10000,
    SILVER: 25000,
    GOLD: 50000,
  },
} as const;
