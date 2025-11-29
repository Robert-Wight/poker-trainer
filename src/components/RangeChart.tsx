import React from 'react';
import { RANKS, RANGES, isHandInRange } from '../logic/ranges';
import './RangeChart.css';

interface RangeChartProps {
    onClose: () => void;
}

export const RangeChart: React.FC<RangeChartProps> = ({ onClose }) => {
    // Helper to determine the action for a specific hand notation (e.g., "AKs")
    const getHandAction = (handStr: string): 'raise' | 'limp' | 'fold' => {
        // We need to convert the string notation (e.g. "AKs") into a Hand object 
        // that our isHandInRange function accepts.
        // But isHandInRange expects a Hand object with {rank, suit}.
        // The grid cells represent generic hands (e.g. "AKs"), not specific suits.
        // We can create a "dummy" hand for the check.

        // Parse rank chars
        const r1 = handStr[0];
        const r2 = handStr[1];
        const type = handStr.length === 3 ? handStr[2] : ''; // 's' or 'o' or empty for pairs

        // This is tricky because Hand is [Card, Card].
        const card1 = { rank: r1 as any, suit: 's' as any };
        const card2 = { rank: r2 as any, suit: (type === 's' || r1 === r2 && type === '') ? 's' : 'h' as any };

        // Wait, pairs in the grid are just "AA". 
        // If it's a pair, we need distinct suits for the dummy object.
        if (r1 === r2) {
            card2.suit = 'h';
        }

        const hand = [card1, card2] as any; // Cast to avoid strict typing issues with dummy data

        // Check Raise Ranges
        const raiseRanges = [
            ...RANGES.ISOLATION_VALUE,
            ...RANGES.ISOLATION_MEDIUM,
            ...RANGES.ISOLATION_SUITED_BROADWAY,
            ...RANGES.ISOLATION_SPECULATIVE
        ];
        if (raiseRanges.some(r => isHandInRange(hand, r))) return 'raise';

        // Check Limp Ranges
        const limpRanges = [
            ...RANGES.OVERLIMP_SMALL_PAIR,
            ...RANGES.OVERLIMP_SUITED_CONNECTOR,
            ...RANGES.OVERLIMP_NUT_FLUSH
        ];
        if (limpRanges.some(r => isHandInRange(hand, r))) return 'limp';

        return 'fold';
    };

    const renderGrid = () => {
        const grid = [];
        for (let i = 0; i < RANKS.length; i++) {
            const row = [];
            for (let j = 0; j < RANKS.length; j++) {
                const r1 = RANKS[RANKS.length - 1 - i]; // Top is A (index 12)
                const r2 = RANKS[RANKS.length - 1 - j]; // Left is A

                let label = "";
                let type = ""; // 'pair', 'suited', 'offsuit'

                if (i === j) {
                    label = `${r1}${r2}`;
                    type = 'pair';
                } else if (i < j) {
                    // Upper triangle: Suited
                    label = `${r2}${r1}s`;
                    type = 'suited';
                } else {
                    // Lower triangle: Offsuit
                    label = `${r1}${r2}o`;
                    type = 'offsuit';
                }

                const action = getHandAction(label);

                row.push(
                    <div key={`${i}-${j}`} className={`grid-cell ${action} ${type}`}>
                        {label}
                    </div>
                );
            }
            grid.push(<div key={i} className="grid-row">{row}</div>);
        }
        return grid;
    };

    return (
        <div className="range-chart-overlay" onClick={onClose}>
            <div className="range-chart-container" onClick={e => e.stopPropagation()}>
                <div className="chart-header">
                    <h3>Strategy Ranges</h3>
                    <button className="btn-close" onClick={onClose}>&times;</button>
                </div>

                <div className="chart-legend">
                    <div className="legend-item"><span className="swatch raise"></span> Iso-Raise</div>
                    <div className="legend-item"><span className="swatch limp"></span> Over-Limp</div>
                    <div className="legend-item"><span className="swatch fold"></span> Fold</div>
                </div>

                <div className="range-grid">
                    {renderGrid()}
                </div>

                <div className="chart-note">
                    * Ranges assume a standard loose-passive table. Adjust tighter if opponents are aggressive.
                </div>
            </div>
        </div>
    );
};
