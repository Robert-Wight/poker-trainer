import React from 'react';
import type { Card as CardType, Suit } from '../logic/types';
import './Card.css';

interface CardProps {
    card: CardType;
    size?: 'sm' | 'md' | 'lg';
}

const suitSymbols: Record<Suit, string> = {
    h: '♥',
    d: '♦',
    c: '♣',
    s: '♠',
};

const suitColors: Record<Suit, string> = {
    h: '#e74c3c', // Red
    d: '#3498db', // Blue (Four color deck style for readability)
    c: '#2ecc71', // Green
    s: '#404040', // Dark Charcoal (Better visibility than light gray)
};

export const Card: React.FC<CardProps> = ({ card, size = 'md' }) => {
    const color = suitColors[card.suit];

    const displayRank = card.rank === 'T' ? '10' : card.rank;

    return (
        <div className={`poker-card size-${size}`} style={{ color }}>
            <div className="rank top">{displayRank}</div>
            <div className="suit">{suitSymbols[card.suit]}</div>
            <div className="rank bottom">{displayRank}</div>
        </div>
    );
};
