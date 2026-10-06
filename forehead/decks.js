// Word decks for Forehead. Every word should be guessable from clues or acting.
window.FOREHEAD_DECKS = [
  { id: "animals", name: "Animals", color: "#ffd23f", words: [
    "Dog", "Cat", "Elephant", "Giraffe", "Lion", "Tiger", "Monkey", "Kangaroo", "Penguin", "Dolphin",
    "Shark", "Whale", "Octopus", "Crab", "Snake", "Frog", "Turtle", "Rabbit", "Horse", "Cow",
    "Pig", "Sheep", "Goat", "Chicken", "Duck", "Owl", "Eagle", "Parrot", "Flamingo", "Peacock",
    "Bat", "Bear", "Panda", "Koala", "Sloth", "Zebra", "Hippo", "Rhino", "Crocodile", "Camel",
    "Llama", "Squirrel", "Hedgehog", "Skunk", "Raccoon", "Fox", "Wolf", "Deer", "Moose", "Mouse",
    "Hamster", "Bee", "Butterfly", "Spider", "Ant", "Snail", "Ladybug", "Jellyfish", "Seal", "Polar bear",
    "Gorilla", "Chameleon", "Lobster", "Starfish", "Swan", "Pigeon", "Turkey", "Goldfish", "Cheetah", "Ostrich"
  ]},
  { id: "food", name: "Food and drink", color: "#ff9f1c", words: [
    "Pizza", "Spaghetti", "Hamburger", "Hot dog", "Taco", "Sushi", "Pancakes", "Waffles", "Cereal", "Popcorn",
    "Ice cream", "Chocolate", "Cookie", "Donut", "Cupcake", "Birthday cake", "Banana", "Apple", "Watermelon", "Pineapple",
    "Strawberry", "Grapes", "Lemon", "Coconut", "Carrot", "Broccoli", "Corn on the cob", "Potato chips", "French fries", "Cheese",
    "Toast", "Eggs", "Bacon", "Sandwich", "Soup", "Salad", "Peanut butter", "Honey", "Milk", "Coffee",
    "Hot chocolate", "Lemonade", "Milkshake", "Pickle", "Ketchup", "Noodles", "Burrito", "Nachos", "Pretzel", "Marshmallow",
    "Cotton candy", "Lollipop", "Bubble gum", "Fried chicken", "Meatballs", "Mac and cheese", "Grilled cheese", "Apple pie", "Brownie", "Bagel",
    "Popsicle", "Avocado", "Mushroom", "Onion", "Garlic", "Chili pepper", "Orange juice", "Smoothie", "Fortune cookie", "Gingerbread man"
  ]},
  { id: "act", name: "Act it out", color: "#3ddc97", words: [
    "Brushing teeth", "Taking a selfie", "Riding a bike", "Swimming", "Playing guitar", "Playing piano", "Driving a car", "Flying a kite", "Walking a dog", "Doing yoga",
    "Lifting weights", "Jumping rope", "Sleeping", "Snoring", "Sneezing", "Yawning", "Crying", "Eating spaghetti", "Drinking through a straw", "Blowing bubbles",
    "Bowling", "Playing golf", "Shooting a basketball", "Kicking a ball", "Skiing", "Surfing", "Skateboarding", "Ice skating", "Fishing", "Climbing a ladder",
    "Painting a wall", "Mowing the lawn", "Vacuuming", "Washing dishes", "Flipping pancakes", "Chopping onions", "Hula hooping", "Juggling", "Rowing a boat", "Riding a horse",
    "Building a snowman", "Throwing a snowball", "Opening a present", "Blowing out candles", "Walking on the moon", "Being a robot", "Zombie walk", "Flying like a superhero", "Karate chop", "Boxing",
    "Typing on a laptop", "Texting", "Taking a shower", "Putting on makeup", "Shaving", "Tying shoelaces", "Walking in high heels", "Riding a rollercoaster", "Sword fighting", "Archery",
    "Hammering a nail", "Playing drums", "Conducting an orchestra", "Singing opera", "Walking a tightrope", "Swatting a fly", "Stepping on a Lego", "Milking a cow", "Changing a diaper", "Doing a magic trick"
  ]},
  { id: "jobs", name: "Jobs", color: "#5ec8ff", words: [
    "Doctor", "Nurse", "Teacher", "Firefighter", "Police officer", "Chef", "Pilot", "Astronaut", "Farmer", "Dentist",
    "Vet", "Mail carrier", "Plumber", "Electrician", "Mechanic", "Hairdresser", "Barber", "Waiter", "Cashier", "Lifeguard",
    "Clown", "Magician", "Singer", "Dancer", "Actor", "Painter", "Photographer", "Scientist", "Detective", "Judge",
    "Lawyer", "Soldier", "Sailor", "Pirate", "Cowboy", "Zookeeper", "Librarian", "Taxi driver", "Bus driver", "Builder",
    "Carpenter", "Gardener", "Baker", "Fisherman", "Janitor", "Lumberjack", "DJ", "Referee", "Coach", "News reporter",
    "Weather forecaster", "Tour guide", "Babysitter", "Delivery driver", "YouTuber", "Personal trainer", "Surgeon", "Spy", "Ice cream seller", "Mime"
  ]},
  { id: "characters", name: "Famous characters", color: "#ff6fb5", words: [
    "Santa Claus", "Mickey Mouse", "SpongeBob", "Spider-Man", "Batman", "Superman", "Wonder Woman", "Hulk", "Iron Man", "Elsa",
    "Olaf", "Shrek", "Mario", "Pikachu", "Harry Potter", "Cinderella", "Snow White", "Rapunzel", "Little Mermaid", "Moana",
    "Simba", "Nemo", "Buzz Lightyear", "Woody", "Winnie the Pooh", "Garfield", "Scooby-Doo", "Bugs Bunny", "Homer Simpson", "Barbie",
    "Peter Pan", "Tinker Bell", "Pinocchio", "Tooth Fairy", "Easter Bunny", "Frankenstein", "Dracula", "Robin Hood", "Sherlock Holmes", "King Kong",
    "Godzilla", "Darth Vader", "Yoda", "Sonic", "Kermit the Frog", "Elmo", "Cookie Monster", "The Grinch", "Rudolph", "Humpty Dumpty",
    "Little Red Riding Hood", "Goldilocks", "Aladdin", "Genie", "Stitch", "Peppa Pig", "Minions", "Captain America", "Dory", "Willy Wonka"
  ]},
  { id: "house", name: "Around the house", color: "#c6ff3d", words: [
    "Toothbrush", "Fridge", "Microwave", "Toaster", "Couch", "Bed", "Pillow", "Blanket", "Lamp", "TV",
    "Remote control", "Vacuum cleaner", "Washing machine", "Bathtub", "Shower", "Toilet", "Mirror", "Alarm clock", "Doorbell", "Mailbox",
    "Stairs", "Window", "Curtains", "Fireplace", "Chair", "Bookshelf", "Kettle", "Frying pan", "Fork", "Chopsticks",
    "Mug", "Trash can", "Broom", "Mop", "Iron", "Hair dryer", "Umbrella", "Keys", "Light switch", "Smoke alarm",
    "Garden hose", "Lawn mower", "Laptop", "Phone charger", "Headphones", "Ceiling fan", "Calendar", "Scissors", "Sticky notes", "Teddy bear",
    "Candle", "Houseplant", "Dishwasher", "Oven", "Coat hanger", "Ironing board", "Bunk bed", "Doormat", "Rubber duck", "Night light"
  ]},
  { id: "sports", name: "Sports and hobbies", color: "#ff5a5f", words: [
    "Soccer", "Basketball", "Tennis", "Golf", "Swimming", "Bowling", "Skiing", "Surfing", "Skateboarding", "Boxing",
    "Karate", "Yoga", "Baseball", "Volleyball", "Ping pong", "Ice hockey", "Figure skating", "Gymnastics", "Marathon", "Cycling",
    "Fishing", "Camping", "Hiking", "Rock climbing", "Horse riding", "Chess", "Video games", "Knitting", "Painting", "Baking",
    "Gardening", "Photography", "Karaoke", "Dancing", "Juggling", "Puzzles", "Bird watching", "Scuba diving", "Kayaking", "Archery",
    "Darts", "Badminton", "Wrestling", "Sumo wrestling", "Cheerleading", "Ballet", "Trampoline", "Frisbee", "Snowboarding", "Bungee jumping"
  ]},
  { id: "places", name: "Places", color: "#9b8cff", words: [
    "Beach", "Zoo", "Airport", "Hospital", "Library", "School", "Supermarket", "Movie theater", "Restaurant", "Bakery",
    "Farm", "Castle", "Museum", "Park", "Playground", "Swimming pool", "Gym", "Hotel", "Campsite", "Amusement park",
    "Water park", "Space station", "Desert", "Jungle", "North Pole", "Volcano", "Island", "Cave", "Waterfall", "Mountain top",
    "Igloo", "Haunted house", "Pirate ship", "Train station", "Gas station", "Car wash", "Bank", "Post office", "Fire station", "Prison",
    "Stadium", "Bowling alley", "Ice rink", "Hair salon", "Pet store", "Toy store", "Aquarium", "Circus", "Lighthouse", "Treehouse",
    "Elevator", "Dentist's office", "Ski resort", "Bus stop", "Pizza place"
  ]},
  { id: "kids", name: "Easy words", color: "#ffffff", words: [
    "Dog", "Cat", "Ball", "Sun", "Moon", "Car", "Train", "Apple", "Banana", "Pizza",
    "Ice cream", "Fish", "Bird", "Duck", "Frog", "Snake", "Bee", "Flower", "Tree", "House",
    "Bed", "Shoe", "Hat", "Book", "Teddy bear", "Rainbow", "Snowman", "Robot", "Dinosaur", "Monkey",
    "Elephant", "Lion", "Bunny", "Cow", "Pig", "Horse", "Butterfly", "Spider", "Princess", "Pirate",
    "Dragon", "Superhero", "Ghost", "Clown", "Doctor", "Firefighter", "Airplane", "Rocket", "Boat", "Bike",
    "Balloon", "Cake", "Cookie", "Candy", "Toothbrush", "Bath", "Swing", "Slide", "Castle", "Crown"
  ]}
];
