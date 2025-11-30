import React from 'react';
import type { Position, Scenario, PlayerCount } from '../logic/types';
import { Card } from './Card';
import './Table.css';

interface TableProps {
    scenario: Scenario;
}

const POSITIONS_BY_COUNT: Record<PlayerCount, Position[]> = {
    2: ['SB', 'BB'],
    6: ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'],
    9: ['UTG', 'UTG+1', 'UTG+2', 'MP', 'MP+1', 'CO', 'BTN', 'SB', 'BB']
};

const POSITION_DESCRIPTIONS: Record<Position, string> = {
    UTG: "Under the Gun: First to act. Must play a very tight range.",
    "UTG+1": "UTG+1: Early position. Still very tight.",
    "UTG+2": "UTG+2: Early position. Tight range.",
    MP: "Middle Position: Can open slightly wider than UTG.",
    "MP+1": "Middle Position: Getting closer to the button.",
    CO: "Cutoff: Late position. Prime spot to isolate and steal.",
    BTN: "Button: The best position. Acts last post-flop.",
    SB: "Small Blind: Worst position post-flop (acts first).",
    BB: "Big Blind: Closes pre-flop action. Great pot odds."
};

export const Table: React.FC<TableProps> = ({ scenario }) => {
    const { heroPosition, heroHand, limpers, isStraddled, potSize, playerCount, stage, board, villainType, villainAction } = scenario;

    const positions = POSITIONS_BY_COUNT[playerCount];

    // Determine active players (Hero + Limpers + Blinds)
    // This logic needs to be robust for different counts.
    // Simpler approach: Just mark Hero. We don't explicitly show "Limper" text on avatars,
    // we rely on the description text.

    return (
        <div className={`poker-table players-${playerCount}`}>
            <div className="table-felt">
                <div className="pot-display">
                    <span className="label">Pot</span>
                    <span className="value">{potSize}bb</span>
                </div>

                {stage === 'flop' && (
                    <div className="board-cards">
                        {board.map((card, i) => (
                            <Card key={i} card={card} size="md" />
                        ))}
                    </div>
                )}

                {positions.map((pos) => {
                    const isHero = pos === heroPosition;
                    // Determine if this player is a limper/straddler
                    // We'll just use a simple heuristic for the UI:
                    // If isStraddled and pos is UTG -> Straddle
                    // Else if pos is before Hero and we have limpers remaining -> Limper

                    let role = '';
                    let actionLabel = '';

                    if (stage === 'flop' && pos === 'BB') { // Hardcoded Villain pos for now
                        role = villainType || 'Villain';
                        actionLabel = villainAction || '';
                    } else if (isStraddled && pos === 'UTG') {
                        role = 'Straddle';
                    } else if (!isHero) {
                        // Just mark as generic player for now to avoid complex index logic
                        role = 'Player';
                    }

                    return (
                        <div key={pos} className={`seat seat-${pos} ${isHero ? 'hero' : ''}`}>
                            <div className="avatar">
                                {isHero ? 'HERO' : pos}
                            </div>

                            <div className="pos-tooltip">
                                <div className="tooltip-title">{pos}</div>
                                <div className="tooltip-desc">{POSITION_DESCRIPTIONS[pos]}</div>
                            </div>

                            {isHero && (
                                <div className="hero-hand">
                                    <Card card={heroHand[0]} size="sm" />
                                    <Card card={heroHand[1]} size="sm" />
                                </div>
                            )}
                            {role === 'Straddle' && <div className="badge straddle">Straddle</div>}
                            {stage === 'flop' && role && role !== 'Straddle' && role !== 'Player' && (
                                <div className="badge villain-type">
                                    {role}
                                    {actionLabel && <div className="action-label">{actionLabel}</div>}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="scenario-info">
                <div className="info-item">
                    <span className="label">Position</span>
                    <span className="value">{heroPosition}</span>
                </div>
                <div className="info-item">
                    <span className="label">Limpers</span>
                    <span className="value">{limpers}</span>
                </div>
                <div className="info-item">
                    <span className="label">Stack</span>
                    <span className="value">{isStraddled ? '50bb (Straddle)' : '100bb'}</span>
                </div>
            </div>
        </div>
    );
};
