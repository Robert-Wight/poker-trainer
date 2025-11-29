export type Suit = 'h' | 'd' | 'c' | 's';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
    rank: Rank;
    suit: Suit;
}

export type Hand = [Card, Card];

export type Position = 'UTG' | 'UTG+1' | 'UTG+2' | 'MP' | 'MP+1' | 'CO' | 'BTN' | 'SB' | 'BB';

export interface HandRange {
    name: string;
    hands: string[]; // e.g., "AA", "AKs", "T9o"
    description: string;
}

export type ActionType = 'fold' | 'check' | 'call' | 'raise';

export interface GameAction {
    type: ActionType;
    amount?: number; // in BB
}

export type PlayerCount = 2 | 6 | 9;

export interface Scenario {
    heroPosition: Position;
    heroHand: Hand;
    limpers: number;
    isStraddled: boolean;
    potSize: number; // in BB
    stackSize: number; // in BB
    description: string;
    playerCount: PlayerCount;
}

export interface EvaluationResult {
    isCorrect: boolean;
    feedback: string;
    citation?: string; // Quote from the report
}
