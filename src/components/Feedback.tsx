import React from 'react';
import type { EvaluationResult } from '../logic/types';
import './Feedback.css';

interface FeedbackProps {
    result: EvaluationResult;
    onNext: () => void;
}

export const Feedback: React.FC<FeedbackProps> = ({ result, onNext }) => {
    const { isCorrect, feedback, citation } = result;

    return (
        <div className="feedback-overlay">
            <div className={`feedback-card ${isCorrect ? 'correct' : 'incorrect'}`}>
                <div className="feedback-header">
                    {isCorrect ? '✅ Correct' : '❌ Incorrect'}
                </div>

                <div className="feedback-body">
                    <p className="feedback-text">{feedback}</p>

                    {citation && (
                        <div className="citation-box">
                            <span className="citation-label">Report Strategy:</span>
                            <p className="citation-text">"{citation}"</p>
                        </div>
                    )}
                </div>

                <button className="btn-next" onClick={onNext} autoFocus>
                    Next Hand
                </button>
            </div>
        </div>
    );
};
