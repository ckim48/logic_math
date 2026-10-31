# Logic Grid Lab

A simple web app (React + Firebase) that helps students solve logic grid puzzles with systematic reasoning.

- **Problem set:** ten problems in a fixed order (tutorial, then Easy, Medium, Hard), each unlocked by solving the one before. Each is written as a word problem and proven to have exactly one solution.
- **Hint:** finds the simplest next deduction from *your* grid and explains it in words and math. Wrong marks are flagged first.
- **Check:** shows which marks are wrong.
- **Solution steps:** replays the full solution one deduction at a time, from clue translation through proof by contradiction.
- **Accounts:** email/password sign-up and log-in. Signed-in progress saves to Firestore (`users/{uid}/progress/{puzzleId}`); without an account it saves in the browser.

```bash
npm install
npm run dev        # start the app
npm run verify     # check that puzzles are correct and unique
```

## Firebase setup (project `practiceapp-88669`)

1. Console → **Authentication** → Get started → Sign-in method → enable **Email/Password**.
2. Deploy the security rules (each user can only access their own data), and optionally host the app:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
npm run build && firebase deploy --only hosting
```

The live app is on Vercel (project `logic-grid-lab`): https://logic-grid-lab.vercel.app. Redeploy with `npx vercel deploy --prod`.

Never put the service-account (admin SDK) JSON key in this project or in client code.

## Code

- `src/App.jsx`: nav bar and hash routes (`#/`, `#/learn`, `#/solve/<id>`, `#/account`)
- `src/pages/`: Home, Learn (the seven rules as formulas), Solve (worksheet, hint, solver, solution space), Account
- `src/Grid.jsx`: the logic grid
- `src/Tex.jsx`: KaTeX formula rendering
- `src/store.js`: Firebase / localStorage saving
- `src/lib/space.js`: solution-space bound |S| ≤ ∏ perm(M_c)
- `src/lib/engine.js`: grid state and the seven deduction rules
- `src/lib/explain.js`: step explanations
- `src/lib/problems.js`: the ten-problem sequence and unlocking
- `src/lib/generator.js`: puzzle generator (runs in a Web Worker)
