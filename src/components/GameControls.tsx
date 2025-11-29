import React, { useState } from 'react';
import type { GameAction } from '../logic/types';
import { playChipSound } from '../logic/sounds';
import './GameControls.css';

interface GameControlsProps {
    onAction: (action: GameAction) => void;
    limpers: number;
    isStraddled: boolean;
}

export const GameControls: React.FC<GameControlsProps> = ({ onAction }) => {
    const [raiseAmount, setRaiseAmount] = useState(10); // Default start

    // Calculate recommended range for UI hints (optional, maybe hidden for difficulty?)
    // Let's just provide a slider and some quick buttons.

    const handleRaise = () => {
        playChipSound();
        onAction({ type: 'raise', amount: raiseAmount });
    };

    const handleAction = (type: 'fold' | 'call') => {
        playChipSound();
        onAction({ type });
    };

    return (
        <div className="game-controls">
            <div className="raise-controls">
                <input
                    type="range"
                    min="4"
                    max="30"
                    value={raiseAmount}
                    onChange={(e) => setRaiseAmount(Number(e.target.value))}
                    className="raise-slider"
                />
                <div className="raise-value">{raiseAmount}bb</div>
            </div>

            <div className="action-buttons">
                <button className="btn btn-fold" onClick={() => handleAction('fold')}>
                    Fold
                </button>

                <button className="btn btn-call" onClick={() => handleAction('call')}>
                    Call / Limp
                </button>

                <button className="btn btn-raise" onClick={handleRaise}>
                    Raise to {raiseAmount}bb
                </button>
            </div>
        </div>
    );
};
