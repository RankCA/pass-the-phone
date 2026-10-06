// Secret words for Impostor, grouped by category.
// Each entry is a pair of similar words. Classic mode uses one of them as the secret word.
// Undercover mode gives the crew one word and the impostor the other.
window.IMPOSTOR_WORDS = {
  "Food and drink": [
    ["Pancakes", "Waffles"], ["Coffee", "Tea"], ["Ice cream", "Popsicle"], ["Ketchup", "Mustard"],
    ["Cupcake", "Muffin"], ["Donut", "Bagel"], ["Apple", "Pear"], ["Lemon", "Lime"],
    ["Hot dog", "Hamburger"], ["Popcorn", "Chips"], ["Cereal", "Oatmeal"], ["Milkshake", "Smoothie"],
    ["Taco", "Burrito"], ["Cookie", "Brownie"], ["Strawberry", "Cherry"], ["French fries", "Onion rings"],
    ["Soup", "Stew"], ["Chocolate", "Candy"], ["Spaghetti", "Noodles"], ["Pizza", "Lasagna"],
    ["Honey", "Maple syrup"], ["Toast", "Sandwich"], ["Watermelon", "Pineapple"], ["Lemonade", "Orange juice"],
    ["Cheese", "Butter"], ["Sushi", "Dumplings"], ["Hot chocolate", "Warm milk"], ["Birthday cake", "Pie"]
  ],
  "Animals": [
    ["Cat", "Dog"], ["Lion", "Tiger"], ["Horse", "Donkey"], ["Dolphin", "Shark"],
    ["Frog", "Toad"], ["Rabbit", "Hamster"], ["Bee", "Wasp"], ["Crocodile", "Lizard"],
    ["Owl", "Eagle"], ["Penguin", "Seal"], ["Monkey", "Gorilla"], ["Elephant", "Hippo"],
    ["Wolf", "Fox"], ["Butterfly", "Moth"], ["Spider", "Ant"], ["Duck", "Goose"],
    ["Cow", "Sheep"], ["Giraffe", "Zebra"], ["Bear", "Panda"], ["Parrot", "Pigeon"],
    ["Mouse", "Rat"], ["Snake", "Worm"], ["Turtle", "Snail"], ["Chicken", "Turkey"],
    ["Kangaroo", "Koala"], ["Camel", "Llama"], ["Whale", "Octopus"], ["Squirrel", "Raccoon"]
  ],
  "Places": [
    ["Beach", "Swimming pool"], ["Library", "Bookstore"], ["Hospital", "Pharmacy"], ["Zoo", "Farm"],
    ["Airport", "Train station"], ["School", "Office"], ["Mall", "Supermarket"], ["Hotel", "Campsite"],
    ["Movie theater", "Arcade"], ["Restaurant", "Cafe"], ["Bakery", "Ice cream shop"], ["Castle", "Haunted house"],
    ["Amusement park", "Water park"], ["Bank", "Post office"], ["Jungle", "Forest"], ["Mountain", "Volcano"],
    ["Kitchen", "Bathroom"], ["Hair salon", "Nail salon"], ["Gas station", "Car wash"], ["Playground", "Park"],
    ["Space station", "Submarine"], ["Igloo", "Tent"], ["Museum", "Art gallery"], ["Prison", "Police station"],
    ["Stadium", "Racetrack"], ["Bedroom", "Living room"], ["Garage", "Basement"], ["Desert", "Island"]
  ],
  "Around the house": [
    ["Fork", "Spoon"], ["Pen", "Pencil"], ["Chair", "Couch"], ["Pillow", "Blanket"],
    ["Umbrella", "Raincoat"], ["Glasses", "Sunglasses"], ["Watch", "Clock"], ["Toothbrush", "Hairbrush"],
    ["Lamp", "Candle"], ["Mirror", "Window"], ["TV remote", "Game controller"], ["Fridge", "Freezer"],
    ["Oven", "Microwave"], ["Sink", "Bathtub"], ["Bed", "Hammock"], ["Shampoo", "Soap"],
    ["Scissors", "Knife"], ["Backpack", "Suitcase"], ["Broom", "Vacuum"], ["Laptop", "Tablet"],
    ["Stairs", "Elevator"], ["Plate", "Bowl"], ["Mug", "Glass"], ["Key", "Lock"],
    ["Toilet paper", "Paper towel"], ["Trash can", "Recycling bin"], ["Doorbell", "Alarm clock"], ["Flashlight", "Lighter"]
  ],
  "Jobs": [
    ["Doctor", "Nurse"], ["Chef", "Baker"], ["Pilot", "Astronaut"], ["Teacher", "Librarian"],
    ["Firefighter", "Police officer"], ["Dentist", "Vet"], ["Farmer", "Gardener"], ["Singer", "Dancer"],
    ["Painter", "Photographer"], ["Waiter", "Cashier"], ["Mail carrier", "Delivery driver"], ["Plumber", "Electrician"],
    ["Judge", "Lawyer"], ["Actor", "Comedian"], ["Mechanic", "Taxi driver"], ["Scientist", "Inventor"],
    ["Builder", "Carpenter"], ["Hairdresser", "Makeup artist"], ["Clown", "Magician"], ["Pirate", "Sailor"],
    ["Coach", "Referee"], ["Zookeeper", "Park ranger"], ["YouTuber", "TV host"], ["Detective", "Spy"],
    ["Lifeguard", "Swim teacher"], ["Soldier", "Security guard"]
  ],
  "Sports and games": [
    ["Soccer", "Basketball"], ["Tennis", "Badminton"], ["Skiing", "Snowboarding"], ["Swimming", "Surfing"],
    ["Running", "Cycling"], ["Bowling", "Golf"], ["Chess", "Checkers"], ["Baseball", "Cricket"],
    ["Boxing", "Wrestling"], ["Volleyball", "Dodgeball"], ["Skateboarding", "Roller skating"], ["Ice hockey", "Figure skating"],
    ["Darts", "Archery"], ["Hide and seek", "Tag"], ["Video games", "Board games"], ["Fishing", "Sailing"],
    ["Hiking", "Camping"], ["Rugby", "American football"], ["Gymnastics", "Dancing"], ["Ping pong", "Air hockey"],
    ["Puzzles", "Crosswords"], ["Trampoline", "Bouncy castle"], ["Paintball", "Laser tag"], ["Karate", "Yoga"],
    ["Monopoly", "Uno"], ["Karaoke", "Dance party"]
  ],
  "Occasions": [
    ["Birthday party", "Wedding"], ["Halloween", "Costume party"], ["Concert", "Festival"], ["Sleepover", "Camping trip"],
    ["Graduation", "Prom"], ["Picnic", "Barbecue"], ["Road trip", "Cruise"], ["First day of school", "First day at work"],
    ["Valentine's Day", "Anniversary"], ["Movie night", "Game night"], ["Job interview", "First date"], ["Christmas", "Thanksgiving"],
    ["Easter egg hunt", "Treasure hunt"], ["Talent show", "School play"], ["Field trip", "Vacation"], ["Snow day", "Sick day"],
    ["Fire drill", "Power outage"], ["New Year's Eve", "Fireworks show"], ["Baby shower", "Housewarming party"], ["Family reunion", "Holiday dinner"],
    ["Garage sale", "Bake sale"], ["Sports game", "Parade"]
  ],
  "Getting around": [
    ["Bus", "Train"], ["Bike", "Scooter"], ["Boat", "Submarine"], ["Helicopter", "Airplane"],
    ["Taxi", "Limo"], ["Skateboard", "Rollerblades"], ["Car", "Truck"], ["Motorcycle", "Moped"],
    ["Rocket", "Hot air balloon"], ["Canoe", "Kayak"], ["Tractor", "Bulldozer"], ["Ambulance", "Fire truck"],
    ["Elevator", "Escalator"], ["Horse", "Camel"], ["Cruise ship", "Ferry"], ["Sled", "Skis"],
    ["Wheelchair", "Stroller"], ["Jet ski", "Speedboat"], ["Subway", "Tram"], ["Golf cart", "Go-kart"],
    ["Spaceship", "UFO"], ["Pirate ship", "Sailboat"]
  ],
  "Clothes": [
    ["Sneakers", "Boots"], ["Jeans", "Shorts"], ["Scarf", "Gloves"], ["Pajamas", "Bathrobe"],
    ["Dress", "Skirt"], ["Hat", "Helmet"], ["Baseball cap", "Beanie"], ["Hoodie", "Sweater"],
    ["Socks", "Slippers"], ["Swimsuit", "Wetsuit"], ["Tie", "Bow tie"], ["Raincoat", "Poncho"],
    ["Sandals", "Flip flops"], ["Belt", "Suspenders"], ["Crown", "Tiara"], ["Necklace", "Bracelet"],
    ["Suit", "Tuxedo"], ["Costume", "Uniform"], ["Earrings", "Ring"], ["Apron", "Lab coat"],
    ["Mittens", "Earmuffs"], ["T-shirt", "Tank top"]
  ],
  "Nature and weather": [
    ["Rain", "Snow"], ["Sun", "Moon"], ["Thunder", "Lightning"], ["River", "Lake"],
    ["Mountain", "Hill"], ["Rainbow", "Sunset"], ["Tree", "Bush"], ["Cloud", "Fog"],
    ["Tornado", "Hurricane"], ["Waterfall", "Fountain"], ["Cave", "Tunnel"], ["Star", "Planet"],
    ["Volcano", "Earthquake"], ["Leaf", "Flower"], ["Rock", "Seashell"], ["Icicle", "Snowflake"],
    ["Puddle", "Pond"], ["Sand", "Mud"], ["Wind", "Storm"], ["Cactus", "Palm tree"],
    ["Ocean wave", "Waterslide"], ["Campfire", "Fireplace"]
  ],
  "Characters": [
    ["Vampire", "Zombie"], ["Pirate", "Ninja"], ["Robot", "Alien"], ["Mermaid", "Fairy"],
    ["Dragon", "Dinosaur"], ["Ghost", "Witch"], ["Wizard", "Knight"], ["Princess", "Queen"],
    ["Unicorn", "Horse"], ["Superman", "Batman"], ["Spider-Man", "Iron Man"], ["Mickey Mouse", "Donald Duck"],
    ["Cinderella", "Snow White"], ["Mario", "Luigi"], ["Elsa", "Rapunzel"], ["Santa Claus", "Tooth Fairy"],
    ["Easter Bunny", "Leprechaun"], ["Shrek", "Hulk"], ["Pikachu", "Sonic"], ["Werewolf", "Bigfoot"],
    ["Superhero", "Villain"], ["Caveman", "Viking"], ["Snowman", "Gingerbread man"], ["Genie", "Fairy godmother"]
  ],
  "School": [
    ["Homework", "Test"], ["Teacher", "Principal"], ["Backpack", "Lunchbox"], ["Recess", "Lunch break"],
    ["Pencil", "Crayon"], ["Ruler", "Calculator"], ["Classroom", "School gym"], ["Notebook", "Textbook"],
    ["Glue", "Tape"], ["Whiteboard", "Chalkboard"], ["School bus", "Carpool"], ["Report card", "Diploma"],
    ["Field trip", "Science fair"], ["Locker", "Desk"], ["Math", "Science"], ["History", "Geography"],
    ["Art class", "Music class"], ["Spelling bee", "Pop quiz"], ["Summer break", "Weekend"], ["Eraser", "Pencil sharpener"]
  ]
};
