/* Landlord board and cards. Plain data, loaded before the game.

   LANDLORD.groups   Colour groups. color is the band colour, house is the cost of one house.
   LANDLORD.squares  The 40 squares in order from Start. t is the type:
                     start, street, station, utility, dip, post, tax, jail, dayoff, gotojail.
                     Streets have g (their group) and price. Stations and utilities have a price.
                     Tax squares have an amount. Street rents are worked out at the bottom:
                     [no houses, 1 house, 2, 3, 4 houses, hotel].
   LANDLORD.dip      Lucky Dip cards.
   LANDLORD.post     Post cards.
                     a is what the card does:
                       money    amount (negative to pay the bank)
                       each     amount from every other player (negative to pay each of them)
                       move     to a square, collecting at Start on the way
                       back     n spaces
                       nearest  the next station or utility (kind)
                       jail     straight to jail
                       free     get out of jail free, kept until used
                       repairs  house and hotel are the cost of each */
window.LANDLORD = (function () {
  const groups = {
    brown: { name: 'Brown', color: '#8a5a3c', house: 50 },
    sky: { name: 'Sky blue', color: '#5bb8ee', house: 50 },
    pink: { name: 'Pink', color: '#de4f9a', house: 100 },
    orange: { name: 'Orange', color: '#f08a1c', house: 100 },
    red: { name: 'Red', color: '#d63a33', house: 150 },
    yellow: { name: 'Yellow', color: '#f2c12e', house: 150 },
    green: { name: 'Green', color: '#2e9e5b', house: 200 },
    navy: { name: 'Navy', color: '#2b4fa3', house: 200 }
  };

  const squares = [
    { t: 'start', name: 'Start' },
    { t: 'street', name: 'Puddle Lane', g: 'brown', price: 50 },
    { t: 'post', name: 'Post' },
    { t: 'street', name: 'Bin Day Road', g: 'brown', price: 60 },
    { t: 'tax', name: 'Council Tax', amount: 150 },
    { t: 'station', name: 'Bus Station', price: 200 },
    { t: 'street', name: 'Chip Shop Row', g: 'sky', price: 90 },
    { t: 'dip', name: 'Lucky Dip' },
    { t: 'street', name: 'Launderette Lane', g: 'sky', price: 90 },
    { t: 'street', name: 'Corner Shop Street', g: 'sky', price: 110 },
    { t: 'jail', name: 'Jail' },
    { t: 'street', name: 'Allotment Lane', g: 'pink', price: 130 },
    { t: 'utility', name: 'Broadband Co', price: 150 },
    { t: 'street', name: 'Car Boot Close', g: 'pink', price: 130 },
    { t: 'street', name: 'Bingo Hall Road', g: 'pink', price: 150 },
    { t: 'station', name: 'Train Station', price: 200 },
    { t: 'street', name: 'Bandstand Place', g: 'orange', price: 170 },
    { t: 'post', name: 'Post' },
    { t: 'street', name: 'Market Square', g: 'orange', price: 170 },
    { t: 'street', name: 'Pier Road', g: 'orange', price: 190 },
    { t: 'dayoff', name: 'Day Off' },
    { t: 'street', name: 'Cinema Row', g: 'red', price: 210 },
    { t: 'dip', name: 'Lucky Dip' },
    { t: 'street', name: 'Clock Tower Way', g: 'red', price: 210 },
    { t: 'street', name: 'High Street', g: 'red', price: 230 },
    { t: 'station', name: 'Ferry Port', price: 200 },
    { t: 'street', name: 'Lido Lane', g: 'yellow', price: 250 },
    { t: 'street', name: 'Cricket Green', g: 'yellow', price: 250 },
    { t: 'utility', name: 'Water Board', price: 150 },
    { t: 'street', name: 'Museum Mile', g: 'yellow', price: 270 },
    { t: 'gotojail', name: 'Go to jail' },
    { t: 'street', name: 'Harbour View', g: 'green', price: 290 },
    { t: 'street', name: 'Botanic Gardens', g: 'green', price: 290 },
    { t: 'post', name: 'Post' },
    { t: 'street', name: 'Castle Hill', g: 'green', price: 310 },
    { t: 'station', name: 'Airport', price: 200 },
    { t: 'dip', name: 'Lucky Dip' },
    { t: 'street', name: 'Skyline Tower', g: 'navy', price: 340 },
    { t: 'tax', name: 'Parking Fine', amount: 75 },
    { t: 'street', name: 'The Mansions', g: 'navy', price: 380 }
  ];

  const dip = [
    { text: 'Advance to Start. Collect £200.', a: 'move', to: 0 },
    { text: 'Take a trip to the Airport. If you pass Start, collect £200.', a: 'move', to: 35 },
    { text: 'Go shopping on High Street. If you pass Start, collect £200.', a: 'move', to: 24 },
    { text: 'You have a viewing at The Mansions. Go there now.', a: 'move', to: 39 },
    { text: 'Head to Allotment Lane. If you pass Start, collect £200.', a: 'move', to: 11 },
    { text: 'Head to the nearest station. If someone owns it, pay them twice the rent.', a: 'nearest', kind: 'station' },
    { text: 'Head to the nearest station. If someone owns it, pay them twice the rent.', a: 'nearest', kind: 'station' },
    { text: 'Head to the nearest utility. If someone owns it, roll the dice and pay them ten times the total.', a: 'nearest', kind: 'utility' },
    { text: 'You forgot your keys. Go back 3 spaces.', a: 'back', n: 3 },
    { text: 'Go straight to jail. Do not pass Start.', a: 'jail' },
    { text: 'Get out of jail free. Keep this card until you need it.', a: 'free' },
    { text: 'You won the pub quiz. Collect £50.', a: 'money', amount: 50 },
    { text: 'Your side hustle took off. Collect £150.', a: 'money', amount: 150 },
    { text: 'Speeding fine. Pay £15.', a: 'money', amount: -15 },
    { text: 'Your houses need new boilers. Pay £25 for each house and £100 for each hotel.', a: 'repairs', house: 25, hotel: 100 },
    { text: 'You are hosting the street party. Pay each player £50.', a: 'each', amount: -50 }
  ];

  const post = [
    { text: 'Advance to Start. Collect £200.', a: 'move', to: 0 },
    { text: 'A council tax refund arrived. Collect £200.', a: 'money', amount: 200 },
    { text: 'It is your birthday. Collect £10 from every player.', a: 'each', amount: 10 },
    { text: 'You sold your old bike online. Collect £50.', a: 'money', amount: 50 },
    { text: 'You found £20 in an old coat. Keep it.', a: 'money', amount: 20 },
    { text: 'Your savings paid out. Collect £100.', a: 'money', amount: 100 },
    { text: 'A great aunt left you something. Collect £100.', a: 'money', amount: 100 },
    { text: 'Your band played a wedding. Collect £25.', a: 'money', amount: 25 },
    { text: 'Second place in the bake off. Collect £10.', a: 'money', amount: 10 },
    { text: 'The vet bill came in. Pay £100.', a: 'money', amount: -100 },
    { text: 'Gym membership renewal. Pay £50.', a: 'money', amount: -50 },
    { text: 'Dentist visit. Pay £50.', a: 'money', amount: -50 },
    { text: 'Roadworks outside your houses. Pay £40 for each house and £115 for each hotel.', a: 'repairs', house: 40, hotel: 115 },
    { text: 'Go straight to jail. Do not pass Start.', a: 'jail' },
    { text: 'Get out of jail free. Keep this card until you need it.', a: 'free' },
    { text: 'Your holiday fund came good. Collect £100.', a: 'money', amount: 100 }
  ];

  const r5 = x => Math.round(x / 5) * 5;
  squares.forEach(s => {
    if (s.t !== 'street') return;
    const base = Math.round(s.price * 0.08);
    s.rent = [base, r5(base * 5), r5(base * 15), r5(base * 40), r5(base * 50), r5(base * 65)];
  });

  return { groups, squares, dip, post };
})();
