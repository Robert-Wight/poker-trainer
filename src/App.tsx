import { useState, useEffect } from 'react';
import { Table } from './components/Table';
import { GameControls } from './components/GameControls';
import { Feedback } from './components/Feedback';
import { Glossary } from './components/Glossary';
import { generateScenario, evaluateAction } from './logic/engine';
import type { Scenario, EvaluationResult, GameAction } from './logic/types';
import './App.css';

function App() {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showGlossary, setShowGlossary] = useState(false);

  useEffect(() => {
    startNewHand();
  }, []);

  const startNewHand = () => {
    setScenario(generateScenario());
    setResult(null);
  };

  const handleAction = (action: GameAction) => {
    if (!scenario) return;

    const evalResult = evaluateAction(scenario, action);
    setResult(evalResult);

    if (evalResult.isCorrect) {
      setStreak(s => s + 1);
      setScore(s => ({ ...s, correct: s.correct + 1, total: s.total + 1 }));
    } else {
      setStreak(0);
      setScore(s => ({ ...s, total: s.total + 1 }));
    }
  };

  if (!scenario) return <div className="loading">Loading...</div>;

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <div className="title">Poker Trainer</div>
          <button className="btn-help" onClick={() => setShowGlossary(true)}>?</button>
        </div>
        <div className="stats">
          <div className="stat-item">
            <span className="label">Streak</span>
            <span className="value text-gold">{streak}</span>
          </div>
          <div className="stat-item">
            <span className="label">Accuracy</span>
            <span className="value">
              {score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
            </span>
          </div>
        </div>
      </header>

      <main className="game-area">
        <div className="scenario-description">
          {scenario.description}
        </div>

        <Table scenario={scenario} />

        <GameControls
          onAction={handleAction}
          limpers={scenario.limpers}
          isStraddled={scenario.isStraddled}
        />
      </main>

      {result && (
        <Feedback result={result} onNext={startNewHand} />
      )}

      {showGlossary && (
        <Glossary onClose={() => setShowGlossary(false)} />
      )}
    </div>
  );
}

export default App;
