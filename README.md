# Pass the Phone

Party games for one phone and a room full of people. Open the site on one phone, pick a game and pass it around.

## Games

| Game | Players | How it works |
| --- | --- | --- |
| Fast Money | 2 to 8 | A host reads survey questions while everyone else wears headphones, then reveals the board. |
| Landlord | 2 to 6 | Buy streets, build houses and collect rent. The phone is the board, the bank and the dice, and the game saves as you go. |
| Flock | 3 to 16 | Everyone answers the same question in secret. The most popular answer scores, and a lone answer earns the black sheep. |
| Shade Hunt | 3 to 10 | One player sees a secret colour and gives a one-word clue. Everyone hunts for it on a grid of 240 shades. |
| Liar's Dice | 2 to 6 | Peek at your own dice, then bid on what is under every cup. Raise the bid or call liar. |
| Farkle | 1 to 10 | Roll six dice, keep what scores and push your luck. Scoring rules live in `farkle/scoring.js`. |
| Impostor | 3 to 12 | Everyone reads a secret word except the impostor. One-word clues, then a vote. |
| Werewolf | 5 to 16 | The phone deals secret roles and reads the night out loud, so nobody has to sit out as narrator. |
| Tune In | 2 to 12 | One player sees a hidden target on a dial and gives a clue. The rest turn the dial. |
| Short Fuse | 2 to 12 | Say a word that fits the prompt, then hand off the bomb before it blows. |
| Brain Freeze | 1 to 12 | Name three things in five seconds while a ring drains away. |
| Forehead | 2 or more | Hold the phone on your forehead. Tilt down when you guess it, up to pass. |
| Don't Say It | 4 or more | Describe the word for your team without saying any of the five banned words. |
| Doodle Chain | 3 to 12 | Draw the prompt, guess the drawing, draw the guess. Then watch the whole chain. |
| Fishbowl | 4 or more | Fill a bowl with names, then describe them, use one word, and act them out. |
| Copycats | 3 to 10 | Everyone writes a one-word clue for the guesser. Matching clues cancel out. |
| Most Likely To | 3 to 12 | Point on three or pass the phone for a secret vote. Ends with a yearbook of titles. |
| Hot Takes | 3 to 12 | Everyone secretly agrees or disagrees. The player in the hot seat guesses how many agreed. |
| Where Are We? | 3 to 12 | Everyone knows the secret place and their role there, except the spy. |
| Odd One Out | 3 to 12 | Everyone answers the same question at once, except one player who got a different one. |
| Art Fraud | 4 to 10 | Everyone adds one line to a drawing of the secret word. One artist is faking it. |
| Two Truths | 3 to 10 | Everyone writes two truths and a lie. The phone shuffles them and the room hunts for the lies. |
| Fake Facts | 3 to 8 | Write a fake answer to a strange true fact, then try to spot the real one. |
| Story Chain | 2 to 12 | Write a story one sentence at a time, seeing only the line before yours. |
| Letter Rush | 1 to 12 | Roll a letter and fill every category before time runs out. Needs paper. |
| Mind Meld | 2 to 6 | Everyone types a word, then hunts for the word that links them until you all match. |
| Tap Duel | 2 | Two players, one phone flat between you. Quick draw, tug of war, color clash and snap. |
| Echo | 1 to 8 | Repeat the pattern of lights and tones, add one more, and pass it on. |
| Snowman | 1 or more | Guess the word one letter at a time before the snowman melts. |

Player names are shared. Add them once on the home page and every game starts with them. Names, scores and settings stay in the browser on that phone.

## Run it locally

No build step and no dependencies. Serve the folder with any static server:

```bash
python3 tools/serve.py 8802
```

Then open http://localhost:8802.

## Publish with GitHub Pages

In the repository settings, open Pages, set the source to "Deploy from a branch", pick `main` and the `/ (root)` folder, and save. The site appears at `https://<user>.github.io/pass-the-phone/` after a minute.

GitHub Pages lets browsers keep each file for 10 minutes. After you change any `.js` or `.css` file, run this before you push:

```bash
python3 tools/stamp.py
```

It adds a version tag to every script and stylesheet link, so a phone never mixes a new page with an old copy of a shared file.

## Layout

- `index.html` is the home page with the game grid, the filters and the shared player list.
- `shared/party.js` holds helpers every game uses: storage, the player list, sounds, timers, hold-to-reveal cards, spoken narration, answer matching, the screen wake lock and confetti.
- `shared/base.css` is the base stylesheet for the newer games. Each game sets its own colors and fonts on top.
- Each game lives in its own folder with an `index.html` and, where it needs one, a data file of questions, words or prompts.
- `tools/make_icons.py` redraws the app icons. `tools/serve.py` is a local server with caching turned off. `tools/stamp.py` adds version tags to script and stylesheet links.

To add questions or words, edit the data file in that game's folder. Each file explains its format at the top.
