# Pass the Phone

Party games for one phone and a room full of people. Open the site on one phone, pick a game and pass it around.

Some games also play online, with each player on their own phone. See [Online play](#online-play).

## Games

| Game | Players | How it works |
| --- | --- | --- |
| Fast Money | 2 to 8 | A host reads survey questions while everyone else wears headphones, then reveals the board. |
| Landlord | 2 to 6 | Buy streets, build houses and collect rent. The phone is the board, the bank and the dice, and the game saves as you go. |
| Flock | 3 to 16 | Everyone answers the same question in secret. The most popular answer scores, and a lone answer earns the black sheep. Plays online too. |
| Shade Hunt | 3 to 10 | One player sees a secret colour and gives a one-word clue. Everyone hunts for it on a grid of 240 shades. |
| Liar's Dice | 2 to 6 | Peek at your own dice, then bid on what is under every cup. Raise the bid or call liar. Plays online too. |
| Farkle | 1 to 10 | Roll six dice, keep what scores and push your luck. Scoring rules live in `farkle/scoring.js`. |
| Spy Grid | 4 or more | Two teams, 25 words and one secret key. Clue givers link their team's words with one word. Avoid the trap. |
| Inside Job | 4 to 12 | Find the secret word with yes or no questions, then catch the player who knew it all along. Plays online too. |
| Mole | 5 to 10 | A crew plans five jobs while hidden moles try to wreck them. Votes and sabotage happen in secret on the phone. Plays online too. |
| Close Call | 3 to 8 | Everyone guesses a number in secret, then bets on whose guess is closest without going over. |
| Two of a Kind | 3 to 12 | Fill in the blank with one word. Match exactly one other player for 3 points, or more players for 1. Plays online too. |
| Quick Sketch | 4 or more | Teams take turns drawing the secret word on the phone while their team races the clock to guess it. |
| Punchline | 3 to 10 | Everyone finishes a funny prompt in secret, and a rotating judge picks a favourite without knowing who wrote it. |
| Snake Pit | 3 to 6 | Hide gems and a snake in a secret pile, then bid on how many gems you can dig up without finding a snake. |
| Yacht | 1 to 6 | The classic dice game. Roll five dice up to three times, then fill one of twelve boxes. Scoring lives in `yacht/rules.js`. |
| Dots and Boxes | 2 to 4 | Take turns joining two dots. Close a box and it is yours, and you go again. Plays online too. |
| Four in a Row | 2 | Take turns dropping discs. Line up four across, down or diagonally to win. Plays online too. |
| Sea Battle | 2 | Hide your fleet, then take turns firing at each other's. The phone keeps each fleet secret. Plays online too. |
| Mancala | 2 | The ancient game of sowing seeds, played with Kalah rules. Plays online too. |
| Impostor | 3 to 12 | Everyone reads a secret word except the impostor. One-word clues, then a vote. Plays online too. |
| Werewolf | 5 to 16 | The phone deals secret roles and reads the night out loud, so nobody has to sit out as narrator. Plays online too. |
| Tune In | 2 to 12 | One player sees a hidden target on a dial and gives a clue. The rest turn the dial. |
| Short Fuse | 2 to 12 | Say a word that fits the prompt, then hand off the bomb before it blows. |
| Brain Freeze | 1 to 12 | Name three things in five seconds while a ring drains away. |
| Forehead | 2 or more | Hold the phone on your forehead. Tilt down when you guess it, up to pass. |
| Don't Say It | 4 or more | Describe the word for your team without saying any of the five banned words. |
| Doodle Chain | 3 to 12 | Draw the prompt, guess the drawing, draw the guess. Then watch the whole chain. |
| Fishbowl | 4 or more | Fill a bowl with names, then describe them, use one word, and act them out. |
| Copycats | 3 to 10 | Everyone writes a one-word clue for the guesser. Matching clues cancel out. |
| Most Likely To | 3 to 12 | Point on three or pass the phone for a secret vote. Ends with a yearbook of titles. Plays online too. |
| Hot Takes | 3 to 12 | Everyone secretly agrees or disagrees. The player in the hot seat guesses how many agreed. Plays online too. |
| Where Are We? | 3 to 12 | Everyone knows the secret place and their role there, except the spy. Plays online too. |
| Odd One Out | 3 to 12 | Everyone answers the same question at once, except one player who got a different one. Plays online too. |
| Art Fraud | 4 to 10 | Everyone adds one line to a drawing of the secret word. One artist is faking it. |
| Two Truths | 3 to 10 | Everyone writes two truths and a lie. The phone shuffles them and the room hunts for the lies. |
| Fake Facts | 3 to 8 | Write a fake answer to a strange true fact, then try to spot the real one. |
| Story Chain | 2 to 12 | Write a story one sentence at a time, seeing only the line before yours. |
| Letter Rush | 1 to 12 | Roll a letter and fill every category before time runs out. Needs paper. |
| Mind Meld | 2 to 6 | Everyone types a word, then hunts for the word that links them until you all match. Plays online too. |
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

## Online play

Four in a Row, Flock, Impostor, Most Likely To, Two of a Kind, Hot Takes, Odd One Out, Mind Meld, Werewolf, Where Are We?, Inside Job, Mole, Liar's Dice, Sea Battle, Dots and Boxes and Mancala can also be played online. Each player uses their own phone, and the one-phone version of every game works exactly as before, with no account.

- A player taps "Make an online game" on a game's setup screen and gets a five letter code. Friends open the link, or type the code on the Online page (`online/`).
- Players start as guests with just a name. A guest can add an email later to keep their account, and their friends, on any phone. Sign-in uses a six digit code sent by email, so there are no passwords.
- Friends swap six letter friend codes on the Online page. After that they can invite each other into a game's waiting room.
- The host's browser runs the game. Other players send their moves to the host, and the host saves the game after each change. If the host drops out, another player can take over and carry on from the last save.

The backend is a free Supabase project (`dmfduvttrdyzkmrulbyp`, London). Everything it needs is in `supabase/migrations/`: the tables, the row level security that limits what each player can read, the database functions that do every write, and scheduled jobs that tidy up old games and guest accounts and keep the free project awake. The page only holds the publishable key, which is meant to be public. Row level security and the functions decide what each player can do.

Settings that live in the Supabase dashboard:

1. Authentication, Sign In / Providers: allow anonymous sign-ins and manual linking.
2. Authentication, URL Configuration: site URL `https://rankca.github.io/pass-the-phone/`.
3. Authentication, Emails, Templates: the Magic Link, Confirm signup and Change Email Address emails show `{{ .Token }}`, the six digit code.
4. Authentication, Emails, SMTP Settings: Supabase's built-in email only reaches members of the Supabase team, so email codes need your own SMTP provider before other people can use them. Guests do not need email.

To try online play on your own computer, open the local server in two tabs and add `&as=2` to the second tab's address. Each number gets its own guest account, but only on `localhost`.

To add online play to another game, pass `Online.room()` a description of the game. The comment at the top of `shared/online.js` lists what it needs, and the three online games are working examples.

## Layout

- `index.html` is the home page with the game grid, the filters and the shared player list.
- `shared/party.js` holds helpers every game uses: storage, the player list, sounds, timers, hold-to-reveal cards, spoken narration, answer matching, the screen wake lock and confetti.
- `shared/base.css` is the base stylesheet for the newer games. Each game sets its own colors and fonts on top.
- `shared/online.js` runs online play: accounts, waiting rooms and the host loop. It only loads the Supabase library when a page goes online.
- `online/` is the Online page: join with a code, invites, friends and your account.
- `supabase/migrations/` holds the database schema for online play.
- Each game lives in its own folder with an `index.html` and, where it needs one, a data file of questions, words or prompts.
- `tools/make_icons.py` redraws the app icons. `tools/serve.py` is a local server with caching turned off. `tools/stamp.py` adds version tags to script and stylesheet links.

To add questions or words, edit the data file in that game's folder. Each file explains its format at the top.
