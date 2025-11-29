# Poker Pre-flop Trainer ♠️♥️♣️♦️

> **Note**: This was built as a **weekend project** to explore React, PWA capabilities, and exploitative poker strategy implementation.

## Overview

The **Poker Pre-flop Trainer** is a Progressive Web App (PWA) designed to help players master exploitative strategies for "social" or "home" poker games. Unlike GTO (Game Theory Optimal) trainers that focus on balance, this tool focuses on **exploiting unbalanced opponents** in loose, multi-way environments.

It is based on the strategic concepts from the report *"The Asymmetric Advantage: Exploitative Protocols for Maximizing Yield in Recreational Poker Environments"*.

## Features

- **🎯 Scenario Training**: Generates random pre-flop spots (Position, Hand, Limpers, Straddles).
- **🧠 Exploitative Logic**: Evaluates your decisions based on specific heuristics:
  - **Iso-Raising**: "4-5bb + 1bb/limper" sizing rule.
  - **Over-Limping**: When to set-mine or play suited connectors multi-way.
  - **Straddle Adjustments**: How to play when effective stacks are halved.
- **📱 PWA Ready**: Installable on mobile devices with offline support.
- **🎨 Premium UI**: Dark mode aesthetic with gold accents.

## Tech Stack

- **Framework**: React + TypeScript
- **Build Tool**: Vite
- **PWA**: `vite-plugin-pwa`
- **Styling**: Vanilla CSS (CSS Variables)

## Getting Started

1.  **Clone the repo**
    ```bash
    git clone https://github.com/yourusername/poker-trainer.git
    ```
2.  **Install dependencies**
    ```bash
    npm install
    ```
3.  **Run locally**
    ```bash
    npm run dev
    ```

## Strategy Heuristics

The trainer enforces specific rules for social games:
- **Never Limp First**: Always raise or fold when first in.
- **Punish Limpers**: Raise large (4-5x) to isolate weak limpers.
- **Respect the Straddle**: Tighten up speculative hands when stacks are shallow (25-50bb).

## License

MIT
