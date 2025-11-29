import React from 'react';
import './Glossary.css';

interface GlossaryProps {
    onClose: () => void;
}

const TERMS = [
    {
        term: "Iso-Raise (Isolation Raise)",
        definition: "Raising pre-flop to force a heads-up pot against a weak player (limper), preventing others from seeing a cheap flop."
    },
    {
        term: "Limp / Over-Limp",
        definition: "Calling the Big Blind instead of raising. 'Over-limping' is calling after another player has already limped. Generally weak, but useful for 'set-mining' in social games."
    },
    {
        term: "Straddle",
        definition: "A voluntary blind bet made by the player to the left of the Big Blind (UTG). It doubles the stakes and halves the effective stack size in Big Blinds."
    },
    {
        term: "Effective Stack",
        definition: "The smallest stack size among the active players. This dictates how much money can be wagered. A Straddle effectively cuts this in half."
    },
    {
        term: "Implied Odds",
        definition: "The ratio of the potential money you can win on future streets to the cost of calling now. Crucial for playing small pairs and suited connectors."
    },
    {
        term: "Value Bet",
        definition: "Betting when you believe you have the best hand, hoping a worse hand calls. In social games, size these large against 'Calling Stations'."
    },
    {
        term: "Capped Range",
        definition: "A range of hands that likely does not contain the strongest possible hands (e.g., a player who limps rarely has AA or KK)."
    },
    {
        term: "Position",
        definition: "Your seat relative to the dealer. Acting last (Button/CO) is a massive advantage as you see everyone else's actions first."
    }
];

export const Glossary: React.FC<GlossaryProps> = ({ onClose }) => {
    return (
        <div className="glossary-overlay" onClick={onClose}>
            <div className="glossary-card" onClick={e => e.stopPropagation()}>
                <div className="glossary-header">
                    <h2>Poker Terms</h2>
                    <button className="btn-close" onClick={onClose}>&times;</button>
                </div>
                <div className="glossary-list">
                    {TERMS.map((item, index) => (
                        <div key={index} className="glossary-item">
                            <span className="term">{item.term}</span>
                            <p className="definition">{item.definition}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
