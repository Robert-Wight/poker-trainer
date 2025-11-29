import React from 'react';
import type { Position, Scenario } from '../logic/types';
import { Card } from './Card';
import './Table.css';

interface TableProps {
    scenario: Scenario;
}

const POSITIONS: Position[] = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];

export const Table: React.FC<TableProps> = ({ scenario }) => {
    const { heroPosition, heroHand, limpers, isStraddled, potSize } = scenario;

    // Render all 6 seats
    return (
        <div className="poker-table">
            <div className="table-felt">
                <div className="pot-display">
                    <span className="label">Pot</span>
                    <span className="value">{potSize}bb</span>
                </div>

                {POSITIONS.map((pos) => {
                    const isHero = pos === heroPosition;
                    // Determine if this player is a limper/straddler
                    // We'll just use a simple heuristic for the UI:
                    // If isStraddled and pos is UTG -> Straddle
                    // Else if pos is before Hero and we have limpers remaining -> Limper

                    let role = '';

                    if (isStraddled && pos === 'UTG') {
                        role = 'Straddle';
                    } else if (!isHero) {
                        // Are they a limper?
                        // We have `limpers` count.
                        // Let's assume the players immediately to the right of Hero are the limpers?
                        // Or just random ones before?
                        // Let's just mark the first N players starting from UTG (or UTG+1 if straddle) as limpers.
                        const posIdx = POSITIONS.indexOf(pos);
                        const heroIdx = POSITIONS.indexOf(heroPosition);

                        // Check if this position acted before hero
                        if (posIdx < heroIdx) {
                            // It's a candidate.
                            // If straddle is on, UTG is taken.
                            if (isStraddled && pos === 'UTG') {
                                // Already handled
                            } else {
                                // It's a potential limper.
                                // We don't know exactly WHICH ones limped, but let's just say "Limper" for the visualization
                                // if the math works out.
                                // Actually, let's just not overthink it. The text description says "X limpers".
                                // We can just show generic "Player" and maybe chips if they are in the pot.
                                role = 'Player';
                            }
                        } else {
                            role = 'Player';
                        }
                    }

                    return (
                        <div key={pos} className={`seat seat-${pos} ${isHero ? 'hero' : ''}`}>
                            <div className="avatar">
                                {isHero ? 'HERO' : pos}
                            </div>
                            {isHero && (
                                <div className="hero-hand">
                                    <Card card={heroHand[0]} size="sm" />
                                    <Card card={heroHand[1]} size="sm" />
                                </div>
                            )}
                            {role === 'Straddle' && <div className="badge straddle">Straddle</div>}
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
