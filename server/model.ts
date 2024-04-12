///////////// --> data model for connections
import * as puzzlesData from "../public/puzzles.json";

export interface Player{
  id: "gitlabUserId",
  username: "gitlabUsername",
  email: "userEmail",
  gamesWon: number,
  groups: ["competitive-connections-admin"]
}


export interface PuzzleCategory{
  id: number
  description: string;
  words: string[];
  color: string;
}
export interface Puzzle {
  id: string
  categories: PuzzleCategory[]
}

// export const CATEGORY = ["1", "2", "3", "4"]
export type tileId = string
export const allPuzzles: Puzzle[] = Object.entries(puzzlesData).map(([id, puzzle]) => ({
  id,
  categories: puzzle.categories,
}));

export interface Tile{
  id: tileId
  clue: string
  categoryNum: number //this gonna be the category that they are attributed to
  selected: boolean | null
  matched: boolean | null
  playerIndex: number | null
}


export function matchingPuzzle(selectedTiles: Tile[]): boolean {
  // Get the category number of the first selected tile
  const firstCategoryNum = selectedTiles[0].categoryNum;
  // Check if all selected tiles have the same category number
  for (let i = 1; i < selectedTiles.length; i++) {
    if (selectedTiles[i].categoryNum !== firstCategoryNum) {
      return false; // Return false if any tile has a different category number
    }
  }
  return true; // If all tiles have the same category number, return true
}



export type GamePhase = "pre-game" | "play" | "game-over"


export interface GameState {
  playerNames: string[];
  tilesById: Record<tileId, Tile>;
  playersCompleted: string[];
  phase: GamePhase;
  playerLives: Record<number, number>; // Track player lives, index to index
  categoriesPlayersCompleted: Record<number, number>; //tracks number of categories a player completed
  timeRemaining: number; // Time remaining in seconds
  playerWinner: string;
}

/**DOES THIS HAVE TO ONLY EXTRACT UNSELECTED TILES?
 * 
 * 
 * 
 * extracts the tiles that are currently in the given player's hand
 */
export function extractAllPlayerTiles(tilesById: Record<tileId, Tile>, playerIndex: number): Tile[] {
  return Object.values(tilesById).filter(({ playerIndex: x }) => x === playerIndex)
}

/**
 * @returns an array of the number of active and unmatched tiles on each player's board
 */
export function computerPlayerTilesLeft({ playerNames, tilesById }: GameState): number[] {
  const counts = playerNames.map(_ => 0);
  // Loop through all tiles and count active and unmatched tiles for each player
  Object.values(tilesById).forEach(tile => {
    if (tile.playerIndex !== null && !tile.matched) {
      counts[tile.playerIndex]++;
    }
  });

  return counts;
}


export function determineWinner(state: GameState) {
  if (state.phase === "pre-game") {
    return null
  }
  const playerIndex = computerPlayerTilesLeft(state).indexOf(0)
  return playerIndex === -1 ? null : playerIndex
}


// Function to get a random puzzle
let currentPuzzle: Puzzle | null
function getRandomPuzzle(): Puzzle | null {
  const randomIndex = Math.floor(Math.random() * 2);
  console.log(randomIndex)
  return allPuzzles[randomIndex];
}

// Function to print puzzle details
function printPuzzle(puzzle: Puzzle): void {
  console.log(`ID: ${puzzle.id}`);
  puzzle.categories.forEach((category) => {
    console.log(`  ${category.description}:`);
    category.words.forEach((word) => {
      console.log(`    ${word}`);
    });
  });
}



// /**
//  * creates an empty GameState in the initial-card-dealing state
//  */

// Modified createEmptyGame function

export function createEmptyGame(playerNames: string[]): GameState {
  // Get a random puzzle
  const randomPuzzle = getRandomPuzzle();
  currentPuzzle = randomPuzzle
  
  // If no puzzle is found, return null
  if (!randomPuzzle) {
    console.log('Puzzle not found!');
    return null;
  }

  // Initialize other game state properties
  const tilesById: Record<tileId, Tile> = {};
  const initialPlayerLives: Record<number, number> = {};
  const categoriesPlayersCompleted: Record<number, number> = {};
  // Initialize tiles based on puzzle categories and clues
  playerNames.forEach((_, playerIndex) => { // Use playerIndex instead of name
    initialPlayerLives[playerIndex] = 4; // Set initial lives to 4 for each player using playerIndex
    categoriesPlayersCompleted[playerIndex] = 0;
  });
  const tiles: Tile[] = [];
  
  // Iterate through each player
  playerNames.forEach((name, playerIndex) => {
    // Iterate through each category
    randomPuzzle.categories.forEach((category) => {
      // Iterate through each word in the category
      category.words.forEach((word, wordIndex) => {
        const tile: Tile = {
          id: `tile_${category.id}_${wordIndex}_${name}`, // Generate unique tile ID including player name
          categoryNum: category.id,
          selected: false,
          matched: false,
          playerIndex: playerIndex,
          clue: category.words[wordIndex], // Assign clue to the tile
        };
        tiles.push(tile);
        tilesById[tile.id] = tile;
      });
    });
  });

  // Create the game state
  const gameState: GameState = {
    playerNames,
    tilesById,
    playersCompleted: [],
    phase: "pre-game",
    playerLives: initialPlayerLives,
    categoriesPlayersCompleted,
    timeRemaining: 120,                 //this is hardcoded rn
    playerWinner: "",
  };

  // Print puzzle details
  printPuzzle(randomPuzzle);

  // Return the game state
  return gameState;
}

export function getCurrentPuzzle(): Puzzle{
  return currentPuzzle
}



export function formatTile(tile: Tile): string {
  return tile.clue
}


export function doAction(state: GameState, playerIndex: number): Tile[] {         //need to have a check for matched tiles
  if (state.phase === "game-over" || state.playerLives[playerIndex]==0) {
    // Game is already over
    return;
  }

console.log('checkpoint2')  
  // Assuming the player's action is to submit tiles
  const submittedTiles: Tile[] = [];

  // Collect submitted tiles
  Object.values(state.tilesById).forEach(tile => {
    if (tile.selected && !tile.matched && tile.playerIndex === playerIndex) {
      submittedTiles.push(tile);
    }
  });

  console.log('these are the tiles you submitted', submittedTiles)
  // Check if submitted tiles match the puzzle
  if (matchingPuzzle(submittedTiles)) {
    // Mark submitted tiles as matched and unselect them
    submittedTiles.forEach(tile => {
      tile.matched = true;
      tile.selected = false;
    });
                                                    //add else statement here to decrement lives

    // Decrease the number of categories remaining for the player
    state.categoriesPlayersCompleted[playerIndex]++;
    console.log('number of categories left:', state.categoriesPlayersCompleted[playerIndex])
  
    // Check if the player has matched all categories
    const allCategoriesMatched = Object.values(state.categoriesPlayersCompleted).every(count => count === state.playerNames.length);

    // If all categories matched for all players, end the game
    if (state.categoriesPlayersCompleted[playerIndex] == 4) {
      console.log('game is over!!!!!')
      state.phase = "game-over";
      state.playerWinner = state.playerNames[playerIndex]
    }
  }
  else if (state.playerLives[playerIndex]>0){
    state.playerLives[playerIndex]--;         
  }

  // Check for winner after each action
  const winner = determineWinner(state);
  console.log('this is your current winner:', winner)
  if (winner !== null) {
    // Set game phase to "game-over" if there is a winner
    state.phase = "game-over";
    return Object.values(state.tilesById);
  }

    return Object.values(state.tilesById);
}

/**
 * @returns only those cards that the given player has any "business" seeing
 */
export function filterTilesForPlayerPerspective(tiles: Tile[], playerIndex: number) {
  return tiles.filter(tile => tile.playerIndex == null || tile.playerIndex === playerIndex)
}

export function startGameTimer(gameState: GameState, timeSet: number) {
  // Define an interval that executes every second (1000 milliseconds)
  if(gameState.phase !== 'play'){
    gameState.timeRemaining = 0;
  }
  else{
  gameState.timeRemaining = timeSet
  
  const intervalId = setInterval(() => {
      // Decrease the remaining time by 1 second
      gameState.timeRemaining -= 1;

      // Check if the remaining time has reached 0 or below
      if (gameState.timeRemaining <= 0) {
          // Set the remaining time to 0
          gameState.timeRemaining = 0;

          // End the game if time runs out
          gameState.phase = "game-over";

          // Clear the interval since the game is over
          clearInterval(intervalId);
      }

      // Emit the remaining time
      console.log(`Time remaining: ${gameState.timeRemaining} seconds`);

  }, 1000); // Run the function every second
}
  // Return the interval ID in case you need to stop the timer later
  return;
}




// ////////////////////////////////////////////////////////////////////////////////////////////
// // data model for cards and game state

// export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
// export const SUITS = ["♦️", "♥️", "♣️", "♠️"]

// export type CardId = string
// export type LocationType = "unused" | "last-card-played" | "player-hand"

// export interface Card {
//   id: CardId
//   rank: typeof RANKS[number]
//   suit: typeof SUITS[number]
//   locationType: LocationType
//   playerIndex: number | null
//   positionInLocation: number | null
// }

// /**
//  * determines whether one can play a card given the last card played
//  */
// export function areCompatible(card: Card, lastCardPlayed: Card) {
//   return card.rank === lastCardPlayed.rank || card.suit === lastCardPlayed.suit
// }

// export type GamePhase = "initial-card-dealing" | "play" | "game-over"

// export interface GameState {
//   playerNames: string[]
//   cardsById: Record<CardId, Card>
//   currentTurnPlayerIndex: number
//   phase: GamePhase
//   playCount: number
// }

// /**
//  * @returns an array of the number of the cards in each player's hand
//  */
// export function computePlayerCardCounts({ playerNames, cardsById }: GameState) {
//   const counts = playerNames.map(_ => 0)
//   Object.values(cardsById).forEach(({ playerIndex }) => {
//     if (playerIndex != null) {
//       ++counts[playerIndex]
//     }
//   })
//   return counts
// }

// /**
//  * finds the last played card
//  */
// export function getLastPlayedCard(cardsById: Record<CardId, Card>) {
//   return Object.values(cardsById).find(c => c.locationType === "last-card-played") || null
// }

// /**
//  * extracts the cards that are currently in the given player's hand
//  */
//  export function extractPlayerCards(cardsById: Record<CardId, Card>, playerIndex: number): Card[] {
//   return Object.values(cardsById).filter(({ playerIndex: x }) => x === playerIndex)
// }

// /**
//  * determines if someone has won the game -- i.e., has no cards left in their hand
//  */
//  export function determineWinner(state: GameState) {
//   if (state.phase === "initial-card-dealing") {
//     return null
//   }
//   const playerIndex = computePlayerCardCounts(state).indexOf(0)
//   return playerIndex === -1 ? null : playerIndex
// }

// /**
//  * creates an empty GameState in the initial-card-dealing state
//  */
//  export function createEmptyGame(playerNames: string[], numberOfDecks = 5, rankLimit = Infinity): GameState {
//   const cardsById: Record<CardId, Card> = {}
//   let cardId = 0

//   for (let i = 0; i < numberOfDecks; i++) {
//     for (const suit of SUITS) {
//       for (const rank of RANKS.slice(0, rankLimit)) {
//         const card: Card = {
//           suit,
//           rank,
//           id: String(cardId++),
//           locationType: "unused",
//           playerIndex: null,
//           positionInLocation: null,
//         }
//         cardsById[card.id] = card
//       }
//     }
//   }

//   return {
//     playerNames,
//     cardsById,
//     currentTurnPlayerIndex: 0,
//     phase: "initial-card-dealing",
//     playCount: 0,
//   }
// }

// /**
//  * looks through the cards for a random card in the unused state -- 
//  * basically, equivalent to continuously shuffling the deck of discarded cards
//  */
// export function findNextCardToDraw(cardsById: Record<CardId, Card>): CardId | null {
//   const unplayedCardIds = Object.keys(cardsById).filter(cardId => cardsById[cardId].locationType === "unused")
//   if (unplayedCardIds.length === 0) {
//     return null
//   }
//   return unplayedCardIds[Math.floor(Math.random() * unplayedCardIds.length)]
// }

// ////////////////////////////////////////////////////////////////////////////////////////////
// // player actions

// export interface DrawCardAction {
//   action: "draw-card"
//   playerIndex: number
// }

// export interface PlayCardAction {
//   action: "play-card"
//   playerIndex: number
//   cardId: CardId
// }

// export type Action = DrawCardAction | PlayCardAction

// function moveToNextPlayer(state: GameState) {
//   state.currentTurnPlayerIndex = (state.currentTurnPlayerIndex + 1) % state.playerNames.length
// }

// function moveCardToPlayer({ currentTurnPlayerIndex, cardsById }: GameState, card: Card) {
//   // add to end position
//   const currentCardPositions = extractPlayerCards(cardsById, currentTurnPlayerIndex).map(x => x.positionInLocation)

//   // update state
//   card.locationType = "player-hand"
//   card.playerIndex = currentTurnPlayerIndex
//   card.positionInLocation = Math.max(-1, ...currentCardPositions) + 1
// }

// function moveCardToLastPlayed({ currentTurnPlayerIndex, cardsById }: GameState, card: Card) {
//   // change current last-card-played to unused
//   Object.values(cardsById).forEach(c => {
//     if (c.locationType === "last-card-played") {
//       c.locationType = "unused"
//     }
//   })

//   // update state
//   card.locationType = "last-card-played"
//   card.playerIndex = null
//   card.positionInLocation = null
// }

// /**
//  * updates the game state based on the given action
//  * @returns an array of cards that were updated, or an empty array if the action is disallowed
//  */
// export function doAction(state: GameState, action: Action): Card[] {
//   const changedCards: Card[] = []
//   if (state.phase === "game-over") {
//     // game over already
//     return []
//   }
//   if (action.playerIndex !== state.currentTurnPlayerIndex) {
//     // not your turn
//     return []
//   }

//   if (action.action === "draw-card") {
//     const cardId = findNextCardToDraw(state.cardsById)
//     if (cardId == null) {
//       return []
//     }
//     const card = state.cardsById[cardId]
//     moveCardToPlayer(state, card)
//     changedCards.push(card)
//   }

//   if (state.phase === "initial-card-dealing") {
//     if (action.action !== "draw-card") {
//       return []
//     }

//     const counts = computePlayerCardCounts(state)
//     if (Math.max(...counts) === Math.min(...counts) && counts[0] === 3) {
//       // we are done drawing player cards
//       // draw one card to be the last card played
//       const cardId = findNextCardToDraw(state.cardsById)
//       if (cardId == null) {
//         return []
//       }
//       const card = state.cardsById[cardId]
//       moveCardToLastPlayed(state, card)
//       changedCards.push(card)
//       state.phase = "play"
//     }
//     moveToNextPlayer(state)
//   } else if (action.action === "play-card") {
//     const card = state.cardsById[action.cardId]
//     if (card.playerIndex !== state.currentTurnPlayerIndex) {
//       // not your card
//       return []
//     }
//     const lastPlayedCard = getLastPlayedCard(state.cardsById)
//     if (lastPlayedCard == null) {
//       return []
//     }
//     if (!areCompatible(lastPlayedCard, card)) {
//       return []
//     }
//     changedCards.push(lastPlayedCard)
//     moveCardToLastPlayed(state, card)
//     changedCards.push(card)
//   }

//   if (state.phase === "play" && action.action !== "draw-card") {
//     moveToNextPlayer(state)
//   }

//   if (determineWinner(state) != null) {
//     state.phase = "game-over"
//   }

//   ++state.playCount

//   return changedCards
// }

// export function formatCard(card: Card, includeLocation = false) {
//   let paddedCardId = card.id
//   while (paddedCardId.length < 3) {
//     paddedCardId = " " + paddedCardId
//   }
//   return `[${paddedCardId}] ${card.rank}${card.suit}${(card.rank.length === 1 ? " " : "")}`
//     + (includeLocation
//       ? ` ${card.locationType} ${card.playerIndex ?? ""}`
//       : ""
//     )
// }

// export function printState({ playerNames, cardsById, currentTurnPlayerIndex, phase, playCount }: GameState) {
//   const lastPlayedCard = getLastPlayedCard(cardsById)
//   console.log(`#${playCount} ${phase} ${lastPlayedCard ? formatCard(lastPlayedCard) : ""}`)
//   playerNames.forEach((name, playerIndex) => {
//     const cards = extractPlayerCards(cardsById, playerIndex)
//     console.log(`${name}: ${cards.map(card => formatCard(card)).join(' ')} ${playerIndex === currentTurnPlayerIndex ? ' *TURN*' : ''}`)
//   })
// }

// /**
//  * @returns only those cards that the given player has any "business" seeing
//  */
// export function filterCardsForPlayerPerspective(cards: Card[], playerIndex: number) {
//   return cards.filter(card => card.playerIndex == null || card.playerIndex === playerIndex)
// }