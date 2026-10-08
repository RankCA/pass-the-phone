/* Farkle scoring. Change the numbers in RULES to play house rules.

   FARKLE.score(dice)    Points for a set of kept dice. Every die has to count,
                         so a set with a die that scores nothing returns 0.
   FARKLE.canScore(dice) True if a roll has at least one die worth keeping.
                         A roll with nothing to keep is a farkle.

   Scores: a 1 is 100, a 5 is 50. Three of a kind is 100 times the number,
   except three 1s which is 1000. Four of a kind 1000, five 2000, six 3000.
   A straight from 1 to 6 is 1500, three pairs 1500 (four of a kind and a pair
   counts as three pairs), two triples 2500. */
window.FARKLE = (function () {
  const RULES = { one: 100, five: 50, threeOnes: 1000, threeTimes: 100, four: 1000, fiveKind: 2000, six: 3000, straight: 1500, threePairs: 1500, twoTriples: 2500 };

  function counts(dice) {
    const c = [0, 0, 0, 0, 0, 0, 0];
    dice.forEach(v => { c[v]++; });
    return c;
  }
  // Best score that uses every die in c, or -1 when some die cannot score.
  function best(c) {
    let n = 0;
    for (let f = 1; f <= 6; f++) n += c[f];
    if (!n) return 0;
    let top = -1;
    if (n === 6) {
      let singles = 0, pairs = 0, triples = 0;
      for (let f = 1; f <= 6; f++) { if (c[f] === 1) singles++; if (c[f] === 2) pairs++; if (c[f] === 4) pairs += 2; if (c[f] === 3) triples++; }
      if (singles === 6) top = Math.max(top, RULES.straight);
      if (pairs === 3) top = Math.max(top, RULES.threePairs);
      if (triples === 2) top = Math.max(top, RULES.twoTriples);
    }
    for (let f = 1; f <= 6; f++) {
      for (let k = 3; k <= c[f]; k++) {
        const val = k === 3 ? (f === 1 ? RULES.threeOnes : f * RULES.threeTimes) : k === 4 ? RULES.four : k === 5 ? RULES.fiveKind : RULES.six;
        c[f] -= k;
        const rest = best(c);
        c[f] += k;
        if (rest >= 0) top = Math.max(top, val + rest);
      }
      if ((f === 1 || f === 5) && c[f] > 0) {
        c[f]--;
        const rest = best(c);
        c[f]++;
        if (rest >= 0) top = Math.max(top, (f === 1 ? RULES.one : RULES.five) + rest);
      }
    }
    return top;
  }
  function score(dice) {
    const r = best(counts(dice));
    return r > 0 ? r : 0;
  }
  function canScore(dice) {
    const c = counts(dice);
    if (c[1] || c[5]) return true;
    for (let f = 2; f <= 6; f++) if (c[f] >= 3) return true;
    return dice.length === 6 && score(dice) > 0;
  }
  return { RULES, score, canScore };
})();
