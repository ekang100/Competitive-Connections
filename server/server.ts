import { createServer } from "http"
import { Server } from "socket.io"
import {createEmptyGame, determineWinner, doAction, filterTilesForPlayerPerspective, getCurrentPuzzle } from "./model"
import { Puzzle, PuzzleCategory, tileId, allPuzzles, Tile, Config, startGameTimer, Player } from "./model"
import express, { NextFunction, Request, Response } from 'express'
import bodyParser from 'body-parser'
import pino from 'pino'
import expressPinoLogger from 'express-pino-logger'
import { Collection, Db, MongoClient, ObjectId } from 'mongodb'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import { Issuer, Strategy, generators } from 'openid-client'
import passport from 'passport'
import { Strategy as CustomStrategy } from 'passport-custom'
import { gitlab } from "./secrets"
import { emit } from "process"

// set up Mongo
// const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017'
const mongoUrl = process.env.MONGO_URL || 'mongodb://db'      //changed

const client = new MongoClient(mongoUrl)
let db: Db
let players: Collection<Player>

const HOST = process.env.HOST || 'localhost'
const OPERATOR_GROUP_ID = "competitive-connections-admin"
const DISABLE_SECURITY = process.env.DISABLE_SECURITY

const passportStrategies = [
  ...(DISABLE_SECURITY ? ["disable-security"] : []),
  "oidc",
]


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
    mongoUrl:  'mongodb://db',             //edited this
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
passport.deserializeUser((user: any, done) => {
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

export function checkRole(requiredRoles: string[]) {
  return function (req: Request, res: Response, next: NextFunction) {
    const roles = req.user?.roles || [];
    const hasRequiredRole = roles.some((role: string) => requiredRoles.includes(role));
    console.log("hasRequiredRole", hasRequiredRole)
    if (hasRequiredRole) {
      next(); // User has one of the required roles, proceed
    } else {
      console.log("hasRequiredRole2", hasRequiredRole)

      res.status(403).json({ message: "Access denied: Insufficient permissions" });
    }
  };
}




// hard-coded game configuration
const playerUserIds = ["anthony.cui", "ek199"]
let currentConfig: Config = {
  board: 1,
  randomizeBoard: false,
  maxLives: 3,
  timeRemaining: 100,
  mode: "easy",
}
let gameState = createEmptyGame(playerUserIds, currentConfig.board, currentConfig.randomizeBoard, currentConfig.maxLives, currentConfig.timeRemaining, currentConfig.mode)
// let timeSet: number = currentConfig.timeLimt


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


async function updateGamesWon(winnerId: number) {
  const playerWinName = gameState.playerNames[winnerId]
  console.log('abc this is the playerwinnername ',playerWinName)
  try {
    // Update the `gamesWon` field in the `players` collection for the winner
    const result = await db.collection('players').updateOne(
      { username: playerWinName },
      { $inc: { gamesWon: 1 } }
    );
    if (result.modifiedCount > 0) {
      console.log(`Successfully updated gamesWon for player ${winnerId}`);
    } else {
      console.log(`No updates were made for player ${winnerId}`);
    }
  } catch (error) {
    console.error(`Error updating gamesWon for player ${winnerId}:`, error);
  }
}

io.on('connection', client => {
  console.log('is this working')
  const user = (client.request as any).session?.passport?.user
  logger.info("new socket connection for user " + JSON.stringify(user))
  // if(user === undefined){
  //   console.log('testing')
  // }


  if (!user) {
    console.log('xyz')
    client.disconnect()
    return
  }

  
// io.emit("game-state", playerIndex, gameState.playerLives, gameState.playerNames, gameState.phase, getCurrentPuzzle().categories, gameState.categoriesPlayersCompleted, gameState.timeRemaining, gameState.board, gameState.mode, gameState.timeRemaining);
  function emitGameState() {      
    client.emit(
      "game-state", 
      playerIndex,
      gameState.playerLives,
      gameState.playerNames,
        // gameState.currentTurnPlayerIndex,
      gameState.phase,
      getCurrentPuzzle().categories,
      gameState.categoriesPlayersCompleted,
      currentConfig.board,
      currentConfig.mode, 
      gameState.timeRemaining,
      currentConfig.randomizeBoard,
      gameState.oneAway,
      // gameState.playCount,
      //can add here the list of players who won already since its in game state
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

      const response = doAction(gameState, playerIndex)
      if(gameState.phase === "game-over"){
        console.log('emmm')
        updateGamesWon(playerIndex)
      }
      emitUpdatedTilesForPlayers(response)
    } else {
      // no actions allowed from "all"
    }
    io.to("all").emit(
       "updated-tiles", 
       Object.values(gameState.tilesById),    
     )
    // io.to("all").emit(
    //   "action-done",
    // )
    // io.to("all").emit(
    //   "action-response",
    //   { updatedTiles: Object.values(gameState.tilesById), oneAway: gameState.oneAway }
    // )
    emitGameState()

    io.emit(
      "game-state-specific",
       gameState.playerLives,
       gameState.phase,
       gameState.categoriesPlayersCompleted,
       gameState.oneAway
    )
  })

  client.on("selected-tile", (selectedTile: Tile) => {      //maybe test player logic here
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

  client.on("change-state", (changedState: string) => {
    console.log(changedState)
    io.emit(
"new-state",
changedState
  )});

  client.on("new-game", () => {
    gameState = createEmptyGame(gameState.playerNames, currentConfig.board, currentConfig.randomizeBoard,  currentConfig.maxLives, currentConfig.timeRemaining, currentConfig.mode)
    gameState.phase = 'play'
    const updatedCards = Object.values(gameState.tilesById)
    emitUpdatedTilesForPlayers(updatedCards, true)
    startGameTimer(gameState, currentConfig.timeRemaining)
    io.to("all").emit(
      "all-tiles", 
      updatedCards,
    )
    io.emit(
      "game-state-specific",
       gameState.playerLives,
       gameState.phase,
       gameState.categoriesPlayersCompleted,
       gameState.oneAway
    )  
    io.emit('game-time', gameState.timeRemaining);
    
     // Emit the remaining game time every second to all connected clients
     const emitGameTime = setInterval(() => {
      io.emit('game-time', gameState.timeRemaining);

      // If the game is over, clear the interval
      if (gameState.phase === "game-over") {
          clearInterval(emitGameTime);
          io.emit('game-state-specific', gameState.playerLives, gameState.phase, gameState.categoriesPlayersCompleted, gameState.oneAway
        )
      }
  }, 1000);

  })

  client.on("get-config", () => {
    client.emit("get-config-reply", currentConfig)
  })

  // playerNames: string[];
  // tilesById: Record<tileId, Tile>;
  // playersCompleted: string[];
  // phase: GamePhase;
  // playerLives: Record<number, number>; // Track player lives, index to index
  // categoriesPlayersCompleted: Record<number, number>; //tracks number of categories a player completed
  // timeRemaining: number; // Time remaining in seconds
  // playerWinner: string;

  client.on("update-config", (newConfig: Partial<Config>) => {
    if (newConfig.maxLives <= 10 &&
       newConfig.maxLives >= 1 &&
        newConfig.timeRemaining > 0 &&
        newConfig.board <= 19 &&
        newConfig.mode === "easy" || newConfig.mode === "hard"
          )
          {
            setTimeout(() => {
                //currentConfig = { ...currentConfig, ...newConfig };
                currentConfig.board = newConfig.board;
                currentConfig.maxLives = newConfig.maxLives;
                currentConfig.timeRemaining = newConfig.timeRemaining;
                currentConfig.mode = newConfig.mode;
                currentConfig.randomizeBoard = newConfig.randomizeBoard;
                console.log("new config:", currentConfig)
                client.emit("update-config-reply", true);
                gameState = createEmptyGame(gameState.playerNames, currentConfig.board, currentConfig.randomizeBoard, currentConfig.maxLives, currentConfig.timeRemaining, currentConfig.mode);
                const updatedTiles = Object.values(gameState.tilesById);
                emitUpdatedTilesForPlayers(updatedTiles, true);
                io.to("all").emit("all-tiles", updatedTiles);
                // ocket.on("game-state", (newPlayerIndex: number, playersLives: Record<number,number> , playerNames: String[], newPhase: GamePhase, puzzleCategories: PuzzleCategory[], categoriesPlayersCompleted:  Record<number, number>, newBoard: number, newMode: string, timeRemain:number ) => {
                io.emit("game-state", playerIndex, gameState.playerLives, gameState.playerNames, gameState.phase, getCurrentPuzzle().categories, gameState.categoriesPlayersCompleted, gameState.board, gameState.mode, gameState.timeRemaining, gameState.randomizeBoard, gameState.oneAway);
            }, 2000);
        } else {
            client.emit("update-config-reply", false);
        }
  })

  client.on("redirect", (url: string) => {
    checkRole(["admin"])
    io.emit("redirect", url)
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

app.get(
  "/api/login", 
  passport.authenticate(passportStrategies, { failureRedirect: "/api/login" }), 
  (req, res) => res.redirect("/")
)

app.get('/login-callback', passport.authenticate(passportStrategies, {
  successReturnToOrRedirect: '/',
  failureRedirect: '/',
}))

app.get('/admin', checkRole(["admin"]), (req, res) => {
  res.send("admin page")
})

app.get("/api/admin", checkRole(["customer"]), async (req, res) => {
  if(req.user == undefined){
    console.log('user is undefined')
  }
  else{
    console.log('no user is found')
  }
  res.json(req.user || {})
})

app.get("/api/player", checkRole(["player"]), async (req, res) => {
  if(req.user == undefined){
    console.log('user is undefined')
  }
  else{
    console.log('no user is found')
  }
  res.json(req.user || {})
})



app.get("/api/user", (req, res) => {
  if(req.user == undefined){
    console.log('user is undefined')
  }
  else{
    console.log('no user is found')
  }
  res.json(req.user || {})
})

app.get('/api/game/players/count', async (req, res) => {
  const collection = db.collection('players');

  try {
    const playersCount = await collection.countDocuments();
    res.json({ playersCount });
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch player count' });
  }
});

app.get('/api/:player/gamesWon', async (req, res) => {
  const collection = db.collection('players');
  const playerName = req.params.player; // Get the player name from the URL parameter
  try {
      // Find the player in the collection based on the name
      const player = await collection.findOne({ username: playerName });

      if (player) {
          // If the player is found, return their gamesWon data
          res.json({ gamesWon: player.gamesWon });
      } else {
          // If the player is not found, return a 404 error
          res.status(404).json({ error: 'Player not found' });
      }
  } catch (error) {
      // Handle any errors that occur during the query
      res.status(500).json({ error: 'Unable to fetch gamesWon data' });
  }
});


// connect to Mongo
client.connect().then(async () => {
  logger.info('connected successfully to MongoDB')
  db = client.db("test")
  players = db.collection("players")

  passport.use("disable-security", new CustomStrategy((req, done) => {
    if (req.query.key !== DISABLE_SECURITY) {
      console.log("you must supply ?key=" + DISABLE_SECURITY + " to log in via DISABLE_SECURITY")
      done(null, false)
    } else {
      // add player to the database
      const player = {
        id: req.query.user,
        username: req.query.user,
        email: req.query.email,
        gamesWon: 0,
        roles: [].concat(req.query.role)
      }
      db.collection("players").updateOne(
        { _id: player.id },
        { $set: player },
        { upsert: true }
      ).then(() => done(null, { name: req.query.user, preferred_username: req.query.user, roles: [].concat(req.query.role), email: req.query.email, id: req.query.user}))
        .catch(error => done(error, null))  
    }
  }))


  {
    const issuer = await Issuer.discover("https://coursework.cs.duke.edu/")
    const client = new issuer.Client(gitlab)

    const params = {
      scope: 'openid profile email',
      nonce: generators.nonce(),
      redirect_uri: `http://localhost:31000/login-callback`,
      state: generators.state(),

      // this forces a fresh login screen every time
      prompt: "login",
    }

    async function verify(tokenSet: any, userInfo: any, done: (error: any, user: any) => void) {
      // Log the userInfo and tokenSet for debugging
      console.log('userInfo', userInfo);
      console.log('tokenSet', tokenSet);
      console.log('groups', userInfo.groups);
      const groups = userInfo.groups;
      userInfo.roles = userInfo.groups.includes(OPERATOR_GROUP_ID) ? ["admin"] : ["player"]

      const player = {
        id: userInfo.sub,
        username: userInfo.preferred_username || userInfo.nickname,
        email: userInfo.email,
        gamesWon: 0,
        roles: userInfo.roles // Store the groups in the database as part of the player's record
      };

      db.collection("players").updateOne(
        { _id: player.id },
        { $set: player },
        { upsert: true }
      ).then(() => done(null, userInfo))
        .catch(error => done(error, null));
    

      // userInfo.roles = userInfo.groups.includes(OPERATOR_GROUP_ID) ? ["admin"] : ["player"]
      //return done(null, userInfo)

    }

    passport.use('oidc', new Strategy({ client, params }, verify))

  }

  server.listen(port, () => {
    logger.info(`listening on http://localhost:${port}`)
  })
})
