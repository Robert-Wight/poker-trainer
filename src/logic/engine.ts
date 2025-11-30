import type { EvaluationResult, GameAction, Hand, Position, Scenario, PlayerCount, OpponentType, BoardTexture, Card } from './types';
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
        playerCount,
        stage: 'preflop',
        board: []
    };
};

// --- Post-Flop Logic ---

const generateBoard = (texture: BoardTexture): Card[] => {
    // Simplified board generation for training specific textures
    // We'll just return hardcoded examples for now to ensure they match the texture perfectly.
    // In a real app, we'd generate random cards that fit the texture.

    if (texture === 'Dry') return parseHand('K72').concat([{ rank: '2', suit: 'c' } as any]).slice(0, 3).map((c, i) => ({ ...c, suit: ['s', 'h', 'c'][i] as any })); // Ks 7h 2c (Rainbow)
    if (texture === 'Wet') return parseHand('986').concat([{ rank: '6', suit: 's' } as any]).slice(0, 3).map((c, i) => ({ ...c, suit: ['s', 's', 'h'][i] as any })); // 9s 8s 6h (Two tone)
    if (texture === 'Paired') return parseHand('JJ4').concat([{ rank: '4', suit: 'd' } as any]).slice(0, 3).map((c, i) => ({ ...c, suit: ['s', 'h', 'd'][i] as any })); // Js Jh 4d
    if (texture === 'Monotone') return parseHand('AQ4').concat([{ rank: '4', suit: 'h' } as any]).slice(0, 3).map(c => ({ ...c, suit: 'h' })); // Ah Qh 4h

    return [];
};

export const generatePostFlopScenario = (playerCount: PlayerCount = 6): Scenario => {
    const villainTypes: OpponentType[] = ['Passive Station', 'Maniac', 'Nit', 'Passive Station', 'Passive Station']; // Weighted towards Passive
    const villainType = villainTypes[Math.floor(Math.random() * villainTypes.length)];

    const textures: BoardTexture[] = ['Dry', 'Wet', 'Paired', 'Monotone'];
    const texture = textures[Math.floor(Math.random() * textures.length)];
    const board = generateBoard(texture);

    // Hero Hand Generation based on Texture to create interesting spots
    // We want: Overpairs, TPTK, Sets, Draws
    let heroHand: Hand;

    const rand = Math.random();
    if (rand < 0.3) {
        // Overpair (AA/KK)
        heroHand = parseHand('AA');
    } else if (rand < 0.5) {
        // TPTK (e.g. AK on K-high board)
        // Need to match board.
        // If board is K-7-2, give AK.
        // If board is 9-8-6, give 9-T? No, TPTK.
        // Let's just force a specific scenario for simplicity of the prototype.
        // Actually, let's just use the 'Dry' board logic for now.
        heroHand = parseHand('AK');
    } else if (rand < 0.7) {
        // Set
        // If board K-7-2, give 77.
        heroHand = parseHand('77');
    } else {
        // Draw
        // If Wet (9s 8s 6h), give 7s 5s (Straight Flush Draw) or As 2s (Nut Flush Draw)
        heroHand = parseHand('7s5s'); // Combo Draw
    }

    // Adjust hand to match board if needed (simplified)
    // For this prototype, we'll just trust the user understands the "Scenario" might be slightly disjointed visually
    // if we don't perfectly match the board.
    // TODO: Make this robust.

    // Let's stick to one concrete scenario per texture for now to ensure quality.
    if (texture === 'Dry') { // K 7 2
        const hands = [
            { h: 'AA', d: 'Overpair' },
            { h: 'AK', d: 'Top Pair Top Kicker' },
            { h: '77', d: 'Middle Set' }
        ];
        const sel = hands[Math.floor(Math.random() * hands.length)];
        heroHand = parseHand(sel.h);
    } else if (texture === 'Wet') { // 9s 8s 6h
        const hands = [
            { h: 'AA', d: 'Overpair' }, // Dangerous here
            { h: '7s5s', d: 'Open Ended Straight Flush Draw' },
            { h: 'As2s', d: 'Nut Flush Draw' },
            { h: '99', d: 'Top Set' }
        ];
        const sel = hands[Math.floor(Math.random() * hands.length)];
        heroHand = parseHand(sel.h);
    }

    return {
        heroPosition: 'BTN', // Hero IP usually for these examples, or OOP? Report discusses both. Let's say IP for now.
        heroHand,
        limpers: 1,
        isStraddled: false,
        potSize: 20,
        stackSize: 100,
        description: `You are BTN. Villain (${villainType}) is in BB. Flop comes. Villain Checks, You Bet 10bb, Villain RAISES to 30bb.`,
        playerCount,
        stage: 'flop',
        board,
        villainType,
        villainAction: 'Check-Raise'
    };
};

export const evaluatePostFlopAction = (scenario: Scenario, action: GameAction): EvaluationResult => {
    const { villainType, heroHand } = scenario;

    // Heuristics from Report

    // 1. Passive Station / Nit Raise
    if (villainType === 'Passive Station' || villainType === 'Nit') {
        // Raise = Nuts (Set, Two Pair).
        // Hero Action: Fold One Pair (Overpair, TPTK).
        // Continue with Sets or Combo Draws.

        // Identify Hand Strength (Simplified)
        // We know what we generated.
        const isOverpair = heroHand[0].rank === 'A' && heroHand[1].rank === 'A'; // Rough check
        const isTPTK = heroHand[0].rank === 'A' && heroHand[1].rank === 'K';
        const isSet = heroHand[0].rank === '7' || heroHand[0].rank === '9'; // Based on our generation
        const isComboDraw = heroHand[0].suit === heroHand[1].suit && heroHand[0].rank === '7'; // 7s5s
        const isWeakDraw = heroHand[0].suit === heroHand[1].suit && heroHand[0].rank === 'A'; // As2s

        if (action.type === 'fold') {
            if (isOverpair || isTPTK || isWeakDraw) {
                return { isCorrect: true, feedback: `Correct. Against a ${villainType}, a raise represents extreme strength (Sets/Two Pair). Your hand is drawing dead or way behind.` };
            }
            return { isCorrect: false, feedback: "Incorrect. Your hand is too strong to fold here." };
        }

        if (action.type === 'raise') { // Shove
            if (isComboDraw) {
                return { isCorrect: true, feedback: "Correct! With a massive Combo Draw, shoving maximizes fold equity and realizes all your equity." };
            }
            if (isSet) {
                // On wet board, raise. On dry, call.
                // Simplified: Just call to keep them in? Or raise for value?
                // Report says: "On wet boards... 3-bet immediately".
                // Let's assume Wet for the Set example we have (99 on 986).
                return { isCorrect: true, feedback: "Correct. On a wet board, fast-play your sets to deny equity." };
            }
            return { isCorrect: false, feedback: "Incorrect. Do not bloat the pot with one pair against a Passive raiser." };
        }

        if (action.type === 'call') {
            if (isSet) return { isCorrect: true, feedback: "Correct. You have the nuts (or close to it)." };
            if (isComboDraw) return { isCorrect: false, feedback: "Incorrect. Shoving is better to generate fold equity." };
            return { isCorrect: false, feedback: `Incorrect. You are likely drawing dead against a ${villainType}'s raise. Fold.` };
        }
    }

    // 2. Maniac Raise
    if (villainType === 'Maniac') {
        // Raise = Wide Range (Bluffs, Draws, Top Pair).
        // Hero Action: Call (Calldown) or Raise (Value).

        if (action.type === 'fold') {
            return { isCorrect: false, feedback: "Incorrect. A Maniac's raising range is too wide to fold strong hands." };
        }
        if (action.type === 'call') {
            return { isCorrect: true, feedback: "Correct. 'Calldown' mode engaged. Let them bluff off their stack." };
        }
        if (action.type === 'raise') {
            return { isCorrect: true, feedback: "Correct. Isolating the Maniac with value is also good." };
        }
    }

    return { isCorrect: false, feedback: "Unknown scenario." };
};

export const evaluateAction = (scenario: Scenario, action: GameAction): EvaluationResult => {
    if (scenario.stage === 'flop') {
        return evaluatePostFlopAction(scenario, action);
    }

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
