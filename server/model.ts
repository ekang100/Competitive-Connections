///////////// --> data model for connections
import * as puzzlesData from "../public/puzzles.json";


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
  playerLives: Record<string, number>; // Track player lives
  categoriesPlayersCompleted: Record<number, number>; //tracks number of categories a player completed
  timeRemaining: number; // Time remaining in seconds
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
function getRandomPuzzle(): Puzzle | null {
  const randomIndex = Math.floor(Math.random() * allPuzzles.length);
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


export function createEmptyGame(playerNames: string[]): GameState {
  const tilesById: Record<tileId, Tile> = {};
  const initialPlayerLives: Record<string, number> = {};
  const categoriesPlayersCompleted: Record<number, number> = {};

  // Initialize player lives and categories completed for each player
  playerNames.forEach(name => {
    initialPlayerLives[name] = 4; // Initialize each player with 3 lives
    categoriesPlayersCompleted[name] = 0; // Initialize categories completed for each player to 0
  });

  // Initialize tiles
  const numberOfTiles = playerNames.length * 16; // Adjust as needed
  const categoryNums = [1, 2, 3, 4]; // Example category numbers
  
  let tileid = 0

  for (let i = 0; i < numberOfTiles; i++) {
    const tile: Tile = {
      id: String(tileid++), // Generate unique ID for each tile
      clue: 
      categoryNum: categoryNums[i % categoryNums.length], // Assign category number cyclically
      selected: null,
      matched: null,
      playerIndex: null,
    };
    tilesById[tile.id] = tile;
  }

  return {
    playerNames,
    tilesById,
    playersCompleted: [],
    phase: "pre-game",
    playerLives: initialPlayerLives,
    categoriesPlayersCompleted,
    timeRemaining: 300, // 5 minutes initially
  };
}




////////////////////////////////////////////////////////////////////////////////////////////
// data model for cards and game state

export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
export const SUITS = ["♦️", "♥️", "♣️", "♠️"]

export type CardId = string
export type LocationType = "unused" | "last-card-played" | "player-hand"

export interface Card {
  id: CardId
  rank: typeof RANKS[number]
  suit: typeof SUITS[number]
  locationType: LocationType
  playerIndex: number | null
  positionInLocation: number | null
}

/**
 * determines whether one can play a card given the last card played
 */
export function areCompatible(card: Card, lastCardPlayed: Card) {
  return card.rank === lastCardPlayed.rank || card.suit === lastCardPlayed.suit
}




// export type GamePhase = "initial-card-dealing" | "play" | "game-over"

// export interface GameState {
//   playerNames: string[]
//   cardsById: Record<CardId, Card>
//   currentTurnPlayerIndex: number
//   phase: GamePhase
//   playCount: number
// }

/**
 * @returns an array of the number of the cards in each player's hand
 */
export function computePlayerCardCounts({ playerNames, cardsById }: GameState) {
  const counts = playerNames.map(_ => 0)
  Object.values(cardsById).forEach(({ playerIndex }) => {
    if (playerIndex != null) {
      ++counts[playerIndex]
    }
  })
  return counts
}

/**
 * finds the last played card
 */
export function getLastPlayedCard(cardsById: Record<CardId, Card>) {
  return Object.values(cardsById).find(c => c.locationType === "last-card-played") || null
}

/**
 * extracts the cards that are currently in the given player's hand
 */
 export function extractPlayerCards(cardsById: Record<CardId, Card>, playerIndex: number): Card[] {
  return Object.values(cardsById).filter(({ playerIndex: x }) => x === playerIndex)
}

/**
 * determines if someone has won the game -- i.e., has no cards left in their hand
 */
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

/**
 * looks through the cards for a random card in the unused state -- 
 * basically, equivalent to continuously shuffling the deck of discarded cards
 */
export function findNextCardToDraw(cardsById: Record<CardId, Card>): CardId | null {
  const unplayedCardIds = Object.keys(cardsById).filter(cardId => cardsById[cardId].locationType === "unused")
  if (unplayedCardIds.length === 0) {
    return null
  }
  return unplayedCardIds[Math.floor(Math.random() * unplayedCardIds.length)]
}

////////////////////////////////////////////////////////////////////////////////////////////
// player actions

export interface DrawCardAction {
  action: "draw-card"
  playerIndex: number
}

export interface PlayCardAction {
  action: "play-card"
  playerIndex: number
  cardId: CardId
}

export type Action = DrawCardAction | PlayCardAction

function moveToNextPlayer(state: GameState) {
  state.currentTurnPlayerIndex = (state.currentTurnPlayerIndex + 1) % state.playerNames.length
}

function moveCardToPlayer({ currentTurnPlayerIndex, cardsById }: GameState, card: Card) {
  // add to end position
  const currentCardPositions = extractPlayerCards(cardsById, currentTurnPlayerIndex).map(x => x.positionInLocation)

  // update state
  card.locationType = "player-hand"
  card.playerIndex = currentTurnPlayerIndex
  card.positionInLocation = Math.max(-1, ...currentCardPositions) + 1
}

function moveCardToLastPlayed({ currentTurnPlayerIndex, cardsById }: GameState, card: Card) {
  // change current last-card-played to unused
  Object.values(cardsById).forEach(c => {
    if (c.locationType === "last-card-played") {
      c.locationType = "unused"
    }
  })

  // update state
  card.locationType = "last-card-played"
  card.playerIndex = null
  card.positionInLocation = null
}

/**
 * updates the game state based on the given action
 * @returns an array of cards that were updated, or an empty array if the action is disallowed
 */
export function doAction(state: GameState, action: Action): Card[] {
  const changedCards: Card[] = []
  if (state.phase === "game-over") {
    // game over already
    return []
  }
  if (action.playerIndex !== state.currentTurnPlayerIndex) {
    // not your turn
    return []
  }

  if (action.action === "draw-card") {
    const cardId = findNextCardToDraw(state.cardsById)
    if (cardId == null) {
      return []
    }
    const card = state.cardsById[cardId]
    moveCardToPlayer(state, card)
    changedCards.push(card)
  }

  if (state.phase === "initial-card-dealing") {
    if (action.action !== "draw-card") {
      return []
    }

    const counts = computePlayerCardCounts(state)
    if (Math.max(...counts) === Math.min(...counts) && counts[0] === 3) {
      // we are done drawing player cards
      // draw one card to be the last card played
      const cardId = findNextCardToDraw(state.cardsById)
      if (cardId == null) {
        return []
      }
      const card = state.cardsById[cardId]
      moveCardToLastPlayed(state, card)
      changedCards.push(card)
      state.phase = "play"
    }
    moveToNextPlayer(state)
  } else if (action.action === "play-card") {
    const card = state.cardsById[action.cardId]
    if (card.playerIndex !== state.currentTurnPlayerIndex) {
      // not your card
      return []
    }
    const lastPlayedCard = getLastPlayedCard(state.cardsById)
    if (lastPlayedCard == null) {
      return []
    }
    if (!areCompatible(lastPlayedCard, card)) {
      return []
    }
    changedCards.push(lastPlayedCard)
    moveCardToLastPlayed(state, card)
    changedCards.push(card)
  }

  if (state.phase === "play" && action.action !== "draw-card") {
    moveToNextPlayer(state)
  }

  if (determineWinner(state) != null) {
    state.phase = "game-over"
  }

  ++state.playCount

  return changedCards
}

export function formatCard(card: Card, includeLocation = false) {
  let paddedCardId = card.id
  while (paddedCardId.length < 3) {
    paddedCardId = " " + paddedCardId
  }
  return `[${paddedCardId}] ${card.rank}${card.suit}${(card.rank.length === 1 ? " " : "")}`
    + (includeLocation
      ? ` ${card.locationType} ${card.playerIndex ?? ""}`
      : ""
    )
}

export function printState({ playerNames, cardsById, currentTurnPlayerIndex, phase, playCount }: GameState) {
  const lastPlayedCard = getLastPlayedCard(cardsById)
  console.log(`#${playCount} ${phase} ${lastPlayedCard ? formatCard(lastPlayedCard) : ""}`)
  playerNames.forEach((name, playerIndex) => {
    const cards = extractPlayerCards(cardsById, playerIndex)
    console.log(`${name}: ${cards.map(card => formatCard(card)).join(' ')} ${playerIndex === currentTurnPlayerIndex ? ' *TURN*' : ''}`)
  })
}

/**
 * @returns only those cards that the given player has any "business" seeing
 */
export function filterCardsForPlayerPerspective(cards: Card[], playerIndex: number) {
  return cards.filter(card => card.playerIndex == null || card.playerIndex === playerIndex)
}