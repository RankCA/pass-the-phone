/* Yacht scoring, the classic rules. Five dice, twelve boxes, each box used once.

   YACHT.CATS            The twelve boxes in scorecard order: id, name and a short hint.
   YACHT.score(id, dice) Points that dice would score in that box.

   Ones to Sixes add up the dice showing that number. Full House (three of one number and
   two of another) scores the total of all five dice. Four of a Kind scores the total of the
   four matching dice. Little Straight (1 to 5) and Big Straight (2 to 6) score 30.
   Choice scores the total of all five dice. Yacht (all five the same) scores 50. */
window.YACHT = (function () {
  const CATS = [
    { id: 'ones', name: 'Ones', hint: 'Add up the 1s' },
    { id: 'twos', name: 'Twos', hint: 'Add up the 2s' },
    { id: 'threes', name: 'Threes', hint: 'Add up the 3s' },
    { id: 'fours', name: 'Fours', hint: 'Add up the 4s' },
    { id: 'fives', name: 'Fives', hint: 'Add up the 5s' },
    { id: 'sixes', name: 'Sixes', hint: 'Add up the 6s' },
    { id: 'full', name: 'Full House', hint: 'Three of one and two of another. Total of all dice' },
    { id: 'four', name: 'Four of a Kind', hint: 'Four the same. Total of those four' },
    { id: 'little', name: 'Little Straight', hint: '1, 2, 3, 4, 5 scores 30' },
    { id: 'big', name: 'Big Straight', hint: '2, 3, 4, 5, 6 scores 30' },
    { id: 'choice', name: 'Choice', hint: 'Total of all dice' },
    { id: 'yacht', name: 'Yacht', hint: 'All five the same scores 50' }
  ];
  const FACE = { ones: 1, twos: 2, threes: 3, fours: 4, fives: 5, sixes: 6 };
  function score(id, dice) {
    const c = [0, 0, 0, 0, 0, 0, 0];
    dice.forEach(v => { c[v]++; });
    const total = dice.reduce((a, b) => a + b, 0);
    if (FACE[id]) return c[FACE[id]] * FACE[id];
    const sorted = dice.slice().sort((a, b) => a - b).join('');
    switch (id) {
      case 'full': return c.includes(3) && c.includes(2) ? total : 0;
      case 'four': { const f = c.findIndex(n => n >= 4); return f > 0 ? f * 4 : 0; }
      case 'little': return sorted === '12345' ? 30 : 0;
      case 'big': return sorted === '23456' ? 30 : 0;
      case 'choice': return total;
      case 'yacht': return c.includes(5) ? 50 : 0;
    }
    return 0;
  }
  return { CATS, score };
})();
