import React, { useState } from 'react';
import type { EvaluationResult } from '../logic/types';
import { RangeChart } from './RangeChart';
import './Feedback.css';

interface FeedbackProps {
    result: EvaluationResult;
    onNext: () => void;
}

export const Feedback: React.FC<FeedbackProps> = ({ result, onNext }) => {
    const [showRanges, setShowRanges] = useState(false);
    const { isCorrect, feedback, citation } = result;

    return (
        <div className="feedback-overlay">
            {showRanges && <RangeChart onClose={() => setShowRanges(false)} />}

            <div className={`feedback-card ${isCorrect ? 'correct' : 'incorrect'}`}>
                <div className="icon">
                    {isCorrect ? '✓' : '✗'}
                </div>

                <div className="feedback-body">
                    <p className="feedback-text">{feedback}</p>

                    {citation && (
                        <div className="citation">
                            "{citation}"
                        </div>
                    )}
                </div>

                <div className="feedback-actions">
                    <button className="btn-range" onClick={() => setShowRanges(true)}>
                        View Ranges
                    </button>
                    <button className="btn-next" onClick={onNext}>
                        Next Hand →
                    </button>
                </div>
            </div>
        </div>
    );
};
