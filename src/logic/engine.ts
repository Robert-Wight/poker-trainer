import type { EvaluationResult, GameAction, Hand, Position, Scenario, PlayerCount } from './types';
import { RANGES, isHandInRange, parseHand, RANKS } from './ranges';

// Helper to generate a random hand
const generateRandomHand = (): Hand => {
    const suits = ['h', 'd', 'c', 's'] as const;
    const r1 = RANKS[Math.floor(Math.random() * RANKS.length)];
    const r2 = RANKS[Math.floor(Math.random() * RANKS.length)];
    const s1 = suits[Math.floor(Math.random() * suits.length)];
    const s2 = suits[Math.floor(Math.random() * suits.length)];

    // Ensure distinct cards
    if (r1 === r2 && s1 === s2) return generateRandomHand();

    return parseHand(`${r1}${s1}${r2}${s2}`);
};

// Helper to generate a playable hand (weighted for training)
// 50% chance of playable hand, 50% random garbage (to train folding)
const generateScenarioHand = (): Hand => {
    if (Math.random() > 0.5) {
        // Pick a random range
        const allRanges = Object.values(RANGES).flat();
        const rangeStr = allRanges[Math.floor(Math.random() * allRanges.length)];

        // Generate a hand that fits this range
        // This is tricky to do inversely without a generator.
        // For now, let's just brute force: generate random hands until one fits.
        // Since ranges are broad enough, this shouldn't take long.
        let attempts = 0;
        while (attempts < 100) {
            const h = generateRandomHand();
            if (isHandInRange(h, rangeStr)) return h;
            attempts++;
        }
    }
    return generateRandomHand();
};

export const generateScenario = (playerCount: PlayerCount = 6): Scenario => {
    let positions: Position[] = [];

    if (playerCount === 2) {
        positions = ['SB', 'BB'];
    } else if (playerCount === 6) {
        positions = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];
    } else {
        positions = ['UTG', 'UTG+1', 'UTG+2', 'MP', 'MP+1', 'CO', 'BTN', 'SB', 'BB'];
    }

    const heroPosition = positions[Math.floor(Math.random() * positions.length)];

    // Max limpers logic
    // Heads up (2 players): Max 1 limper (the SB/BTN)
    // 6-max: Max 3 limpers
    // 9-max: Max 5 limpers
    const maxLimpers = playerCount === 2 ? 1 : (playerCount === 6 ? 3 : 5);

    // In Heads Up, if Hero is SB, there are 0 limpers before them (they are first).
    // If Hero is BB, SB can limp.
    let limpers = 0;
    if (playerCount === 2) {
        if (heroPosition === 'BB') {
            limpers = Math.random() > 0.5 ? 1 : 0; // 50% chance SB limps
        } else {
            limpers = 0; // Hero is SB, first to act
        }
    } else {
        limpers = Math.floor(Math.random() * (maxLimpers + 1));
        if (limpers === 0 && Math.random() > 0.2) limpers = 1; // Bias towards having action
    }

    // Straddle logic (only for > 2 players usually, but some HU games allow it. Let's disable for HU for simplicity)
    const isStraddled = playerCount > 2 && Math.random() > 0.7;

    // Adjust stack size based on straddle (halved effective stack)
    // const baseStack = 100; // 100bb deep standard (Unused)
    const stackSize = isStraddled ? 50 : 100; // Effective stack halves if straddled

    return {
        heroPosition,
        heroHand: generateScenarioHand(),
        limpers,
        isStraddled,
        potSize: 1.5 + limpers + (isStraddled ? 2 : 0), // SB+BB + limpers + straddle
        stackSize,
        description: `You are ${heroPosition}. There are ${limpers} limpers before you.${isStraddled ? ' UTG has Straddled.' : ''}`,
        playerCount
    };
};

export const evaluateAction = (scenario: Scenario, action: GameAction): EvaluationResult => {
    const { heroHand, limpers, isStraddled, heroPosition } = scenario;

    // 1. Check for Isolation Raise
    const isIsoValue = RANGES.ISOLATION_VALUE.some(r => isHandInRange(heroHand, r));
    const isIsoMedium = RANGES.ISOLATION_MEDIUM.some(r => isHandInRange(heroHand, r));
    const isIsoSuited = RANGES.ISOLATION_SUITED_BROADWAY.some(r => isHandInRange(heroHand, r));
    const isIsoSpec = RANGES.ISOLATION_SPECULATIVE.some(r => isHandInRange(heroHand, r));

    const isLatePos = ['CO', 'BTN'].includes(heroPosition);

    // Determine if we should raise
    let shouldRaise = false;
    let raiseReason = "";

    if (isIsoValue) {
        shouldRaise = true;
        raiseReason = limpers > 0
            ? "Premium Pairs and Strong Top-Pair Hands (AK, AQ, AJ, KQ) must isolate limpers for value."
            : "Premium Hands (AK, AQ, AJ, KQ) should Open Raise for value.";
    } else if (isIsoMedium) {
        shouldRaise = true;
        if (limpers === 0) {
            raiseReason = "Medium Pairs (88, 99) are strong enough to Open Raise for value.";
        } else {
            raiseReason = limpers > 1
                ? "Medium Pairs (88, 99) should be raised to thin the field and build a pot for when you hit a set."
                : "Medium Pairs (88, 99) are strong enough to isolate a single limper and create set-mining potential.";
        }
    } else if (isIsoSuited) {
        shouldRaise = true;
        raiseReason = limpers > 0
            ? "Suited Broadways (KQs, QJs, JTs) have excellent playability and retain equity when called."
            : "Suited Broadways (KQs, QJs, JTs) are strong enough to Open Raise.";
    } else if (isIsoSpec && isLatePos) {
        shouldRaise = true;
        raiseReason = limpers > 0
            ? "Speculative hands (A5s, 89s) can isolate from late position (CO, BTN) to utilize positional advantage."
            : "Speculative hands (A5s, 89s) are good candidates to Open Raise from late position to steal the blinds.";
    }

    // 2. Check for Over-Limp
    const isLimpSmallPair = RANGES.OVERLIMP_SMALL_PAIR.some(r => isHandInRange(heroHand, r));
    const isLimpConnector = RANGES.OVERLIMP_SUITED_CONNECTOR.some(r => isHandInRange(heroHand, r));
    const isLimpFlush = RANGES.OVERLIMP_NUT_FLUSH.some(r => isHandInRange(heroHand, r));

    let shouldLimp = false;
    let limpReason = "";

    if (isStraddled) {
        // Straddle Logic: Speculative hands devalued.
        if (isLimpSmallPair || isLimpConnector) {
            shouldLimp = false; // Fold these in straddled pots usually, or play very carefully. Report says "Speculative Hands Devalued... Implied odds cut in half."
            // Actually, report says "Speculative Hands Devalued... There is less money behind to win".
            // So we should probably Fold these or play very tight.
            // Let's say Fold for simplicity of training the "Devalued" concept.
            limpReason = "With a Straddle (25bb effective), speculative hands like small pairs and connectors lose value due to reduced implied odds.";
        } else if (isLimpFlush) {
            // A2s-A9s. Report doesn't explicitly say fold, but implies speculative is bad.
            // But A-high flush is strong.
            // Let's stick to the "Devalued" heuristic for all speculative hands.
            shouldLimp = false;
            limpReason = "Straddle reduces implied odds, devaluing speculative flush draws.";
        }
    } else {
        // Normal Deep Stack
        if (isLimpSmallPair) {
            shouldLimp = true;
            limpReason = "Small Pocket Pairs (22-77) are ideal for over-limping to set-mine cheaply.";
        } else if (isLimpConnector) {
            shouldLimp = true;
            limpReason = "Low Suited Connectors (45s-78s) want multi-way pots. Raising isolates against dominating ranges.";
        } else if (isLimpFlush) {
            shouldLimp = true;
            limpReason = "Weak Suited Aces (A2s-A9s) are powerful in multi-way pots for nut-flush potential but dangerous to raise.";
        }
    }

    // 3. Evaluate User Action
    if (action.type === 'raise') {
        if (!shouldRaise) {
            // Did we raise when we should have limped?
            if (shouldLimp) {
                return { isCorrect: false, feedback: "Incorrect. " + limpReason + " Raising bloats the pot and isolates you against stronger ranges." };
            }
            return { isCorrect: false, feedback: "Incorrect. This hand is not strong enough to isolate. You should Fold." };
        }

        // Check Sizing
        // Formula: 4bb to 5bb + 1bb per limper + 1bb for OOP.
        const isOOP = ['SB', 'BB'].includes(heroPosition); // Rough OOP definition
        const minBase = 4;
        const maxBase = 5;
        const limperAdd = limpers;
        const oopAdd = isOOP ? 1 : 0;

        const minSize = minBase + limperAdd + oopAdd;
        const maxSize = maxBase + limperAdd + oopAdd;

        if (action.amount && (action.amount < minSize || action.amount > maxSize + 2)) { // Allow a little buffer
            return {
                isCorrect: false,
                feedback: `Right move, wrong size. Report Formula: 4-5bb + 1bb/limper + 1bb OOP. Target: ${minSize}-${maxSize}bb. You bet ${action.amount}bb.`,
                citation: "Iso-Raise Formula: 4bb to 5bb + 1bb per limper + 1bb for being out of position."
            };
        }

        return { isCorrect: true, feedback: "Correct! " + raiseReason };
    }

    if (action.type === 'call') {
        if (shouldRaise) {
            return { isCorrect: false, feedback: "Incorrect. " + raiseReason + " Limping lets opponents see a cheap flop." };
        }
        if (shouldLimp) {
            return { isCorrect: true, feedback: "Correct! " + limpReason };
        }
        return { isCorrect: false, feedback: "Incorrect. This hand is too weak to play. You should Fold." };
    }

    if (action.type === 'fold') {
        if (shouldRaise) {
            return { isCorrect: false, feedback: "Incorrect. You missed a value isolation opportunity. " + raiseReason };
        }
        if (shouldLimp) {
            return { isCorrect: false, feedback: "Incorrect. You missed a profitable over-limp spot. " + limpReason };
        }
        return { isCorrect: true, feedback: "Correct. Trash hand, trash it." };
    }

    return { isCorrect: false, feedback: "Unknown action." };
};
