/* ---------- XP Values ---------- */

export const XP_TASK_COMPLETE = 10;
export const XP_SUBSKILL_COMPLETE = 50;
export const XP_SKILL_ARCHIVE = 200;

/* ---------- Level Thresholds ---------- */

/**
 * XP thresholds for each level.
 * Level 0 = 0-99 XP
 * Level 1 = 100-299 XP
 * Level 2 = 300-599 XP
 * etc.
 */
export const LEVEL_THRESHOLDS = [
  0, // Level 0
  100, // Level 1
  300, // Level 2
  600, // Level 3
  1000, // Level 4
  1500, // Level 5
  2200, // Level 6
  3000, // Level 7
  4000, // Level 8
  5500, // Level 9
  7500, // Level 10
  10000, // Level 11
  13000, // Level 12
  17000, // Level 13
  22000, // Level 14
  28000, // Level 15
  35000, // Level 16
  43000, // Level 17
  52000, // Level 18
  62000, // Level 19
  75000, // Level 20
] as const;

export const MAX_LEVEL = LEVEL_THRESHOLDS.length - 1;

/* ---------- Level Calculations ---------- */

/**
 * Calculate the user's level based on their total XP.
 */
export function calculateLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      return i;
    }
  }
  return 0;
}

/**
 * Get XP progress information for the current level.
 */
export function getLevelProgress(xp: number): {
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  currentLevelXp: number;
  progress: number;
} {
  const level = calculateLevel(xp);
  const xpForCurrentLevel = LEVEL_THRESHOLDS[level] ?? 0;
  const xpForNextLevel =
    level >= MAX_LEVEL
      ? LEVEL_THRESHOLDS[MAX_LEVEL]
      : (LEVEL_THRESHOLDS[level + 1] ?? LEVEL_THRESHOLDS[MAX_LEVEL]);

  const currentLevelXp = xp - xpForCurrentLevel;
  const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;

  const progress =
    level >= MAX_LEVEL
      ? 100
      : Math.min(100, Math.round((currentLevelXp / xpNeededForNext) * 100));

  return {
    level,
    xpForCurrentLevel,
    xpForNextLevel,
    currentLevelXp,
    progress,
  };
}

/* ---------- Level Names (optional) ---------- */

export const LEVEL_NAMES = [
  'Novice',
  'Apprentice',
  'Journeyman',
  'Adept',
  'Expert',
  'Veteran',
  'Master',
  'Grandmaster',
  'Legend',
  'Mythic',
  'Transcendent',
] as const;

export function getLevelName(level: number): string {
  if (level >= LEVEL_NAMES.length) {
    return `${LEVEL_NAMES[LEVEL_NAMES.length - 1]} ${level - LEVEL_NAMES.length + 2}`;
  }
  return LEVEL_NAMES[level] ?? 'Novice';
}
