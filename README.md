# Pass the Phone

Party games for one phone and a room full of people. Open the site on one phone, pick a game and pass it around.

## Games

| Game | Players | How the phone is used |
| --- | --- | --- |
| Fast Money | 2 to 8 | A host reads survey questions while everyone else wears headphones, then reveals the board. |
| Impostor | 3 to 12 | Everyone reads a secret word except the impostor. One-word clues, then a vote. |
| Tune In | 2 to 12 | One player sees a hidden target on a dial and gives a clue. The rest turn the dial. |
| Short Fuse | 2 to 12 | Say a word that fits the prompt, then hand off the bomb before it blows. |
| Forehead | 2 or more | Hold the phone on your forehead. Tilt down when you guess it, up to pass. |
| Doodle Chain | 3 to 12 | Draw the prompt, guess the drawing, draw the guess. Then watch the whole chain. |
| Copycats | 3 to 10 | Everyone writes a one-word clue for the guesser. Matching clues cancel out. |
| Most Likely To | 3 to 12 | Point on three or pass the phone for a secret vote. Ends with a yearbook of titles. |

Player names are shared. Add them once on the home page and every game starts with them. Names, scores and settings stay in the browser on that phone.

## Run it locally

No build step and no dependencies. Serve the folder with any static server:

```bash
python3 tools/serve.py 8802
```

Then open http://localhost:8802.

## Publish with GitHub Pages

In the repository settings, open Pages, set the source to "Deploy from a branch", pick `main` and the `/ (root)` folder, and save. The site appears at `https://<user>.github.io/pass-the-phone/` after a minute.

## Layout

- `index.html` is the home page with the game grid and the shared player list.
- `shared/party.js` holds helpers every game uses: storage, the player list, sounds, the screen wake lock and confetti.
- Each game lives in its own folder with an `index.html` and a data file of questions, words or prompts.
- `tools/make_icons.py` redraws the app icons. `tools/serve.py` is a local server with caching turned off.

To add questions or words, edit the data file in that game's folder. Each file explains its format at the top.
