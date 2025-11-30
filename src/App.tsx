import { useState, useEffect } from 'react';
import { Table } from './components/Table';
import { GameControls } from './components/GameControls';
import { Feedback } from './components/Feedback';
import { Glossary } from './components/Glossary';
import { generateScenario, evaluateAction, generatePostFlopScenario } from './logic/engine';
import { playCardSound, playWinSound, playErrorSound } from './logic/sounds';
import type { Scenario, EvaluationResult, GameAction, PlayerCount } from './logic/types';
import './App.css';

function App() {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showGlossary, setShowGlossary] = useState(false);
  const [playerCount, setPlayerCount] = useState<PlayerCount>(6);
  const [gameMode, setGameMode] = useState<'preflop' | 'postflop'>('preflop');

  useEffect(() => {
    startNewHand();
  }, [playerCount, gameMode]); // Restart when count or mode changes

  const startNewHand = () => {
    if (gameMode === 'preflop') {
      setScenario(generateScenario(playerCount));
    } else {
      setScenario(generatePostFlopScenario(playerCount));
    }
    setResult(null);
    playCardSound();
  };

  const handleAction = (action: GameAction) => {
    if (!scenario) return;

    const evalResult = evaluateAction(scenario, action);
    setResult(evalResult);

    if (evalResult.isCorrect) {
      setStreak(s => s + 1);
      setScore(s => ({ ...s, correct: s.correct + 1, total: s.total + 1 }));
      playWinSound();
    } else {
      setStreak(0);
      setScore(s => ({ ...s, total: s.total + 1 }));
      playErrorSound();
    }
  };

  if (!scenario) return <div className="loading">Loading...</div>;

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <div className="title">Poker Trainer</div>
          <button className="btn-help" onClick={() => setShowGlossary(true)}>?</button>

          <select
            className="player-select"
            value={playerCount}
            onChange={(e) => setPlayerCount(Number(e.target.value) as PlayerCount)}
          >
            <option value={2}>2-Max (HU)</option>
            <option value={6}>6-Max</option>
            <option value={9}>9-Max</option>
          </select>

          <select
            className="player-select"
            value={gameMode}
            onChange={(e) => setGameMode(e.target.value as 'preflop' | 'postflop')}
            style={{ marginLeft: '10px', borderColor: 'var(--color-accent)' }}
          >
            <option value="preflop">Pre-flop Trainer</option>
            <option value="postflop">Post-flop Defense</option>
          </select>
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
