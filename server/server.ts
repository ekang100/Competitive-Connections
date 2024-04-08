import http from "http"
import { Server } from "socket.io"
import { Action, createEmptyGame, doAction, filterCardsForPlayerPerspective, Card } from "./model"

import {Puzzle, PuzzleCategory, tileId, allPuzzles, Tile} from "./model"



const server = http.createServer()
const io = new Server(server)
const port = 8101

//here is where you load up the puzzle from puzzles.json

//            SOMETHING IS MESSING UP EVERYONCE INA WHILE: ID: 'DEFAULT' ???
const randomIndex = Math.floor(Math.random() * allPuzzles.length);
const randomPuzzleId = allPuzzles[randomIndex].id;
const randomPuzzle = allPuzzles.find(puzzle => puzzle.id === randomPuzzleId);

if (randomPuzzle) {
  console.log(`ID: ${randomPuzzle.id}`);
  randomPuzzle.categories.forEach((category) => {
    console.log(`  ${category.description}:`);
    category.words.forEach((word) => {
      console.log(`    ${word}`);
    });
  });
} else {
  console.log('Puzzle not found!');
}



let gameState = createEmptyGame(["player1", "player2"], 2, 2)

function emitUpdatedCardsForPlayers(cards: Card[], newGame = false) {
  gameState.playerNames.forEach((_, i) => {
    let updatedCardsFromPlayerPerspective = filterCardsForPlayerPerspective(cards, i)
    if (newGame) {
      updatedCardsFromPlayerPerspective = updatedCardsFromPlayerPerspective.filter(card => card.locationType !== "unused")
    }
    console.log("emitting update for player", i, ":", updatedCardsFromPlayerPerspective)
    io.to(String(i)).emit(
      newGame ? "all-cards" : "updated-cards", 
      updatedCardsFromPlayerPerspective,
    )
  })
}

io.on('connection', client => {
  function emitGameState() {
    client.emit(
      "game-state", 
      gameState.currentTurnPlayerIndex,
      gameState.phase,
      gameState.playCount,
    )
  }
  
  console.log("New client")
  let playerIndex: number | null | "all" = null
  client.on('player-index', n => {
    playerIndex = n
    console.log("playerIndex set", n)
    client.join(String(n))
    if (typeof playerIndex === "number") {
      client.emit(
        "all-cards", 
        filterCardsForPlayerPerspective(Object.values(gameState.cardsById), playerIndex).filter(card => card.locationType !== "unused"),
      )
    } else {
      client.emit(
        "all-cards", 
        Object.values(gameState.cardsById),    
      )
    }
    emitGameState()
  })

  client.on("action", (action: Action) => {
    if (typeof playerIndex === "number") {
      const updatedCards = doAction(gameState, { ...action, playerIndex })
      emitUpdatedCardsForPlayers(updatedCards)
    } else {
      // no actions allowed from "all"
    }
    io.to("all").emit(
      "updated-cards", 
      Object.values(gameState.cardsById),    
    )
    io.emit(
      "game-state", 
      gameState.currentTurnPlayerIndex,
      gameState.phase,
      gameState.playCount,
    )
  })

  client.on("new-game", () => {
    gameState = createEmptyGame(gameState.playerNames, 2, 2)
    const updatedCards = Object.values(gameState.cardsById)
    emitUpdatedCardsForPlayers(updatedCards, true)
    io.to("all").emit(
      "all-cards", 
      updatedCards,
    )
    io.emit(
      "game-state", 
      gameState.currentTurnPlayerIndex,
      gameState.phase,
      gameState.playCount,
    )
  })
})
server.listen(port)
console.log(`Game server listening on port ${port}`)
