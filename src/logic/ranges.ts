import type { Rank, Suit, Card } from './types';

export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

// Helper to get rank index
const getRankIndex = (r: Rank): number => RANKS.indexOf(r);

// Helper to parse a hand string like "AhKs" to a Card pair
export const parseHand = (handStr: string): [Card, Card] => {
    if (handStr.length !== 4) throw new Error(`Invalid hand string: ${handStr}`);
    const r1 = handStr[0] as Rank;
    const s1 = handStr[1] as Suit;
    const r2 = handStr[2] as Rank;
    const s2 = handStr[3] as Suit;
    return [{ rank: r1, suit: s1 }, { rank: r2, suit: s2 }];
};

// Helper to check if a hand matches a range string
// Range strings: "QQ+", "AKs", "AJo+", "22-77", "T9s"
export const isHandInRange = (hand: [Card, Card], rangeStr: string): boolean => {
    const [c1, c2] = hand;
    // Sort cards by rank (high first) to normalize
    const i1 = getRankIndex(c1.rank);
    const i2 = getRankIndex(c2.rank);
    const high = i1 >= i2 ? c1 : c2;
    const low = i1 >= i2 ? c2 : c1;
    const highIdx = Math.max(i1, i2);
    // const lowIdx = Math.min(i1, i2);

    const isSuited = c1.suit === c2.suit;
    const isPair = c1.rank === c2.rank;

    // Normalize hand notation
    const handNotation = isPair
        ? `${high.rank}${low.rank}`
        : `${high.rank}${low.rank}${isSuited ? 's' : 'o'}`;

    // 1. Exact match (e.g. "AKs")
    if (rangeStr === handNotation) return true;

    // 2. Plus notation (e.g. "QQ+", "AJo+")
    if (rangeStr.endsWith('+')) {
        const base = rangeStr.slice(0, -1);
        if (isPair) {
            // "QQ+" -> QQ, KK, AA
            if (base.length !== 2) return false; // Invalid for pairs
            const baseRank = base[0] as Rank;
            const baseIdx = getRankIndex(baseRank);
            return isPair && highIdx >= baseIdx;
        } else {
            // "AJo+" -> AJo, AQo, AKo (Same high card, lower card increases)
            // "KQs+" -> KQs, KAs? No, usually means KQs, AKs? 
            // Actually standard notation "AJo+" means AJ, AQ, AK (offsuit).
            // "KQs" usually doesn't use + unless it means "KQs, AQs"? 
            // Let's stick to the report's specific ranges which are mostly specific or simple.
            // Report says: "QQ+, JJ, TT" (Pairs), "AK, AQ, AJ, KQ" (Top Pair), "88, 99", "KQs, QJs, JTs", "A5s, 89s"
            // "22-77", "45s-78s", "A2s-A9s"

            // Let's handle the specific types in the report manually or via simple expansion.
            // For "AJo+", base is "AJo". High rank must match A, low rank must be >= J.
            const baseHigh = base[0] as Rank;
            const baseLow = base[1] as Rank;
            const baseSuffix = base[2]; // 's' or 'o'

            if (high.rank !== baseHigh) return false;
            if (isSuited && baseSuffix === 'o') return false;
            if (!isSuited && baseSuffix === 's') return false;

            return getRankIndex(low.rank) >= getRankIndex(baseLow);
        }
    }

    // 3. Dash notation (e.g. "22-77", "45s-78s")
    if (rangeStr.includes('-')) {
        const [start, end] = rangeStr.split('-');
        if (isPair) {
            // "22-77"
            const startRank = start[0] as Rank;
            const endRank = end[0] as Rank;
            const startIdx = getRankIndex(startRank);
            const endIdx = getRankIndex(endRank);
            return isPair && highIdx >= startIdx && highIdx <= endIdx;
        } else {
            // "45s-78s" -> 45s, 56s, 67s, 78s (Connectors)
            // "A2s-A9s" -> A2s...A9s (Suited Aces)
            const startHigh = start[0] as Rank;
            const startLow = start[1] as Rank;
            const suffix = start.slice(2); // 's' or 'o'

            const endHigh = end[0] as Rank;
            const endLow = end[1] as Rank;

            if (isSuited && suffix === 'o') return false;
            if (!isSuited && suffix === 's') return false;

            // Case 1: Suited Aces (A2s-A9s) - High card constant
            if (startHigh === endHigh && startHigh === high.rank) {
                const sLow = getRankIndex(startLow);
                const eLow = getRankIndex(endLow);
                const currLow = getRankIndex(low.rank);
                return currLow >= sLow && currLow <= eLow;
            }

            // Case 2: Connectors (45s-78s) - Gap constant
            // 45s (gap 1), 78s (gap 1).
            const gap = getRankIndex(high.rank) - getRankIndex(low.rank);
            const startGap = getRankIndex(startHigh as Rank) - getRankIndex(startLow as Rank);
            if (gap !== startGap) return false;

            const sLow = getRankIndex(startLow);
            const eLow = getRankIndex(endLow);
            const currLow = getRankIndex(low.rank);
            return currLow >= sLow && currLow <= eLow;
        }
    }

    return false;
};

export const RANGES = {
    ISOLATION_VALUE: ["QQ+", "JJ", "TT", "AK", "AQ", "AJ", "KQ"], // Premium + Strong Top
    ISOLATION_MEDIUM: ["88", "99"],
    ISOLATION_SUITED_BROADWAY: ["KQs", "QJs", "JTs"],
    ISOLATION_SPECULATIVE: ["A5s", "89s"], // Position dependent

    OVERLIMP_SMALL_PAIR: ["22-77"],
    OVERLIMP_SUITED_CONNECTOR: ["45s-78s"],
    OVERLIMP_NUT_FLUSH: ["A2s-A9s"],
};

export const getAllPlayableHands = (): string[] => {
    // Flatten all ranges for scenario generation
    return [
        ...RANGES.ISOLATION_VALUE,
        ...RANGES.ISOLATION_MEDIUM,
        ...RANGES.ISOLATION_SUITED_BROADWAY,
        ...RANGES.ISOLATION_SPECULATIVE,
        ...RANGES.OVERLIMP_SMALL_PAIR,
        ...RANGES.OVERLIMP_SUITED_CONNECTOR,
        ...RANGES.OVERLIMP_NUT_FLUSH
    ];
};
