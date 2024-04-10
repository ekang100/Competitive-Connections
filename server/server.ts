import { createServer } from "http"
import { Server } from "socket.io"
import { createEmptyGame, doAction, filterTilesForPlayerPerspective } from "./model"
import { Puzzle, PuzzleCategory, tileId, allPuzzles, Tile, getCurrentPuzzle } from "./model"
import express, { NextFunction, Request, Response } from 'express'
import bodyParser from 'body-parser'
import pino from 'pino'
import expressPinoLogger from 'express-pino-logger'
import { Collection, Db, MongoClient, ObjectId } from 'mongodb'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import { Issuer, Strategy, generators } from 'openid-client'
import passport from 'passport'
import { gitlab } from "./secrets"

// set up Mongo
const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017'
const client = new MongoClient(mongoUrl)
let db: Db

// set up Express
const app = express()
const server = createServer(app)
const port = parseInt(process.env.PORT) || 8228
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// set up Pino logging
const logger = pino({
  transport: {
    target: 'pino-pretty'
  }
})
app.use(expressPinoLogger({ logger }))

// set up CORS
// app.use(cors({
//   origin: "http://127.0.0.1:" + port,
//   credentials: true,
// }))

// set up session
const sessionMiddleware = session({
  secret: 'a just so-so secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },

  store: MongoStore.create({
    mongoUrl: 'mongodb://127.0.0.1:27017',
    ttl: 14 * 24 * 60 * 60 // 14 days
  })
})
app.use(sessionMiddleware)
declare module 'express-session' {
  export interface SessionData {
    credits?: number
  }
}

app.use(passport.initialize())
app.use(passport.session())
passport.serializeUser((user, done) => {
  console.log("serializeUser", user)
  done(null, user)
})
passport.deserializeUser((user, done) => {
  console.log("deserializeUser", user)
  done(null, user)
})

// set up Socket.IO
const io = new Server(server)

// convert a connect middleware to a Socket.IO middleware
const wrap = (middleware: any) => (socket: any, next: any) => middleware(socket.request, {}, next)
io.use(wrap(sessionMiddleware))



//////////////////
//here is where you load up the puzzle from puzzles.json

//            SOMETHING IS MESSING UP EVERYONCE INA WHILE: ID: 'DEFAULT' ???
// const randomIndex = Math.floor(Math.random() * allPuzzles.length);
// const randomPuzzleId = allPuzzles[randomIndex].id;
// const randomPuzzle = allPuzzles.find(puzzle => puzzle.id === randomPuzzleId);

// if (randomPuzzle) {
//   console.log(`ID: ${randomPuzzle.id}`);
//   randomPuzzle.categories.forEach((category) => {
//     console.log(`  ${category.description}:`);
//     category.words.forEach((word) => {
//       console.log(`    ${word}`);
//     });
//   });
// } else {
//   console.log('Puzzle not found!');
// }
////////////////////



// hard-coded game configuration
const playerUserIds = ["anthony.cui", "ek199"]
let gameState = createEmptyGame(playerUserIds)


function emitUpdatedTilesForPlayers(tiles: Tile[], newGame = false) {   
  gameState.playerNames.forEach((_, i) => {      
      let updatedCardsFromPlayerPerspective: Tile[];
      if (tiles && tiles.length > 0) {
          updatedCardsFromPlayerPerspective = filterTilesForPlayerPerspective(tiles, i);
          // if (newGame) {
          //   updatedCardsFromPlayerPerspective = updatedCardsFromPlayerPerspective.filter(card => card.locationType !== "unused")
          // }
      }
      console.log("emitting update for player", i, ":", updatedCardsFromPlayerPerspective);
      io.to(String(i)).emit(  
          newGame ? "all-tiles" : "updated-tiles", 
          updatedCardsFromPlayerPerspective,
      );
  });
}


io.on('connection', client => {
  const user = (client.request as any).session?.passport?.user
  logger.info("new socket connection for user " + JSON.stringify(user))
  if (!user) {
    client.disconnect()
    return
  }

  function emitGameState() {      
    client.emit(
      "game-state", 
      playerIndex,
      gameState.playerLives,
      gameState.playerNames,
        // gameState.currentTurnPlayerIndex,
      gameState.phase,
      getCurrentPuzzle().categories
      // gameState.playCount,
    )
  }
  
  console.log("New client")
  let playerIndex: number | "all" = playerUserIds.indexOf(user.preferred_username)
  if (playerIndex === -1) {
    playerIndex = "all"
  }
  client.join(String(playerIndex))
  
  if (typeof playerIndex === "number") {
    client.emit(
      "all-tiles", 
      filterTilesForPlayerPerspective(Object.values(gameState.tilesById), playerIndex)
    )
  } else {
    client.emit(
      "all-tiles", 
      Object.values(gameState.tilesById),    
    )
  }
  emitGameState()

  
  client.on("action", (playerIndex: Number) => {
    console.log(typeof playerIndex, 'playerIndex: ', playerIndex)
    if (typeof playerIndex === "number") {
      console.log('checkpoint 1')

      const updatedCards = doAction(gameState, playerIndex)
      emitUpdatedTilesForPlayers(updatedCards)
    } else {
      // no actions allowed from "all"
    }
    io.to("all").emit(
      "updated-tiles", 
      Object.values(gameState.tilesById),    
    )
    emitGameState()
  })

  client.on("selected-tile", (selectedTile: Tile) => {
    console.log("Selected tile:", selectedTile);
  
    // Update the selected tile in the game state
    const tileToUpdate = gameState.tilesById[selectedTile.id];
    if (tileToUpdate) {
      // Update the properties of the tile with the new values from the client
      tileToUpdate.selected = selectedTile.selected;
      // tileToUpdate.matched = selectedTile.matched;
      // tileToUpdate.playerIndex = selectedTile.playerIndex;
  
      // Emit the updated tile to the player who made the selection
      // client.emit("updated-tile", tileToUpdate);
  
      // Emit the updated tile to all players (including the player who made the selection)
      // io.emit("updated-tile", tileToUpdate);               //do i need this?
    } else {
      console.error("Tile not found in game state:", selectedTile.id);
      // Handle the case where the selected tile is not found in the game state
      // You may emit an error event or take appropriate action based on your application's logic
    }
  });

  client.on("new-game", () => {
    gameState = createEmptyGame(gameState.playerNames)
    gameState.phase = 'play'
    const updatedCards = Object.values(gameState.tilesById)
    emitUpdatedTilesForPlayers(updatedCards, true)
    io.to("all").emit(
      "all-tiles", 
      updatedCards,
    )
    emitGameState()
  })
})

// app routes
app.post(
  "/api/logout", 
  (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err)
      }
      res.redirect("/")
    })
  }
)

app.get("/api/user", (req, res) => {
  res.json(req.user || {})
})

// connect to Mongo
client.connect().then(() => {
  logger.info('connected successfully to MongoDB')
  db = client.db("test")
  // operators = db.collection('operators')
  // orders = db.collection('orders')
  // customers = db.collection('customers')

  Issuer.discover("https://coursework.cs.duke.edu/").then(issuer => {
    const client = new issuer.Client(gitlab)
  
    const params = {
      scope: 'openid profile email',
      nonce: generators.nonce(),
      redirect_uri: 'http://localhost:8221/login-callback',
      state: generators.state(),
    }
  
    function verify(tokenSet: any, userInfo: any, done: (error: any, user: any) => void) {
      console.log('userInfo', userInfo)
      console.log('tokenSet', tokenSet)
      return done(null, userInfo)
    }
  
    passport.use('oidc', new Strategy({ client, params }, verify))

    app.get(
      "/api/login", 
      passport.authenticate("oidc", { failureRedirect: "/api/login" }), 
      (req, res) => res.redirect("/")
    )
    
    app.get(
      "/login-callback",
      passport.authenticate("oidc", {
        successRedirect: "/",
        failureRedirect: "/api/login",
      })
    )    

    // start server
    server.listen(port)
    logger.info(`Game server listening on port ${port}`)
  })
})
