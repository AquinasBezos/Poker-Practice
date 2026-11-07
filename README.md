# poker dojo

A client-side poker trainer in a bright, glossy **Frutiger Metro** style. Built with React + Vite + Tailwind CSS, routed with `HashRouter`, and deployable as static files to GitHub Pages.

## What's inside

**Tutorial Dojo**

| module | what you practise |
| --- | --- |
| Outs & the Rule of 2 and 4 | Count the cards that put you ahead of a shown hand, then estimate your hit chance. Reveals the out cards, the rule-of-thumb figure, the exact probability and your true equity. |
| Pot Odds & Bet Sizing | Call/fold decisions with a draw on the turn, plus MDF and required-equity quizzes. Includes an interactive "pot odds machine" calculator. |
| Speed Hand Recognition | One board, three hands, five seconds. Pick the strongest hand; one miss ends the run. |
| All-In or Fold | Short-stack survival (3 lives, 7-second timer). Shove or fold from UTG–SB at 3–15bb, checked against a simplified push chart shown as a 13×13 matrix. |

**Practice Arena**: a 6-max No-Limit Hold'em table (blinds 5/10, 100bb stacks, automatic rebuys) against five bots:

| bot | style |
| --- | --- |
| Ice | Nit: tight and passive, folds to pressure |
| Blaze | Maniac: raises constantly, big bluffs |
| Sticky | Calling station: calls far too much |
| Fin | Shark: solid tight-aggressive regular |
| Pixel | Rookie: loose, limps and chases draws |

- **Real-time grading**: every decision is graded A+ to F from hand strength, position, pot odds and equity against each opponent's estimated range.
- **Coach's Notes**: a C, D or F opens a pop-up that explains the mistake with numbers (price, required equity, your equity, outs). Tap any badge in the report card to reread it.
- **Trainer Wheels HUD** (toggle): live equity against a random hand, against N random hands and against the opponents' likely ranges; exact improving outs with next-card and by-river odds; and the current pot odds.
- **Range Analysis**: 13×13 heatmaps of your *perceived* range and each opponent's *likely* range, narrowed by every bet, call and check.

Keyboard: `F` fold · `C` check/call · `R` bet/raise · `Space`/`N` next hand.

## Run it locally

Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

Other scripts:

```bash
npm run build         # production build into dist/
npm run preview       # serve the production build locally
npm run test:engine   # evaluator, outs, side pots + 1,500 simulated hands (chip conservation)
npm run gen:preflop   # regenerate src/poker/preflopData.js (Monte Carlo preflop equities)
```

## Deploy to GitHub Pages

1. Create a GitHub repository and push this project to it.
2. Run:
   ```bash
   npm run deploy
   ```
   This builds the app and publishes `dist/` to a `gh-pages` branch (using the `gh-pages` package).
3. In the repository on GitHub, open **Settings → Pages** and set the source to the **`gh-pages`** branch, root folder.
4. The site appears at `https://<your-user>.github.io/<repo-name>/`.

### Base path

`vite.config.js` defaults to `base: './'`, so every asset path is relative and the build works under any repository name. Routing uses `HashRouter` (`/#/arena`), so deep links never 404 on GitHub Pages.

If you'd rather pin an absolute base, set `VITE_BASE` when building:

```bash
VITE_BASE=/poker-dojo/ npm run deploy
```

On Windows PowerShell: `$env:VITE_BASE="/poker-dojo/"; npm run deploy`.

## Project layout

```
src/
  poker/        pure game logic (no React)
    cards.js        deck, parsing, shuffling
    evaluator.js    5–7 card hand evaluator + hand names
    equity.js       Monte Carlo equity vs random hands / weighted ranges, exact enumeration
    outs.js         outs, draw detection, Rule of 2 & 4, hit probabilities
    handClasses.js  the 169 starting-hand classes (13x13 matrix)
    preflopData.js  generated preflop equities (see scripts/gen-preflop.mjs)
    ranges.js       hand rankings, range model and range updates per action
    game.js         6-max table engine (blinds, betting rounds, side pots, showdown)
    bots.js         bot decision logic per archetype
    profiles.js     archetype parameters
    grading.js      A+..F grading and coach explanations
    pushfold.js     push/fold chart
  store/        Zustand stores (settings + high scores persisted; arena state)
  components/   PlayingCard, PokerTable, BettingSlider, FeedbackBadge, GelBar,
                RangeMatrix, HudPanel, CoachModal, Avatar, Layout, ui primitives
  pages/        Home, TutorialHub, Arena, tutorials/*
scripts/        preflop data generator and engine tests
```

## Notes on the maths

- Preflop rankings come from Monte Carlo all-in equity: vs one random hand, vs three random hands, and vs a typical calling range (top 20%). Opening ranges blend the last two; push/fold uses equity-when-called, because fold equity is the same for every hand.
- Opponent ranges start as "any two cards" and are reweighted after each action using the bot's archetype and each hand class's strength on the current board (including draws).
- The push/fold chart and opening ranges are simplified teaching approximations, not solver output.
