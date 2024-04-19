// import { MongoClient, ObjectId } from "mongodb"
// // import { createAdapter } from "@socket.io/mongo-adapter"
// import { GameState, createEmptyGame } from "./model"

// const DB = "game"
// // const SOCKET_IO_EVENTS_COLLECTION = "socket.io-adapter-events"
// const GAMES_COLLECTION = "games"
// const GAME_STATE_ID = new ObjectId("000000000000000000000000")

// export interface MongoGameState extends GameState {
// 	_id: ObjectId
// 	version: number
// }

// export async function setupMongo() {
// 	// const mongoClient = new MongoClient(process.env.MONGO_URL || "mongodb://localhost/?replicaSet=rs0")
// 	const mongoClient = new MongoClient(process.env.MONGO_URL || "mongodb://localhost/")
// 	await mongoClient.connect()
	
// 	// try {
// 	// 	await mongoClient.db(DB).createCollection(SOCKET_IO_EVENTS_COLLECTION, {
// 	// 		capped: true,
// 	// 		size: 1e6
// 	// 	})
// 	// } catch (e) {
// 	// 	// collection already exists; ignore
// 	// }

// 	const db = mongoClient.db(DB)
// 	// const socketIoEventsCollection = db.collection(SOCKET_IO_EVENTS_COLLECTION)
// 	const gamesCollection = db.collection(GAMES_COLLECTION)
// 	try {
// 		await gamesCollection.insertOne({ _id: GAME_STATE_ID, version: 0, ...createEmptyGame(["player1", "player2"], 2, 2) })
// 	} catch (e) {
// 		// ignore
// 	}

// 	return {
// 		// socketIoEventsCollection,
// 		gamesCollection,
// 		// socketIoAdapter: createAdapter(socketIoEventsCollection),
// 		getGameState: async () => {
// 			return await gamesCollection.findOne({ _id: GAME_STATE_ID }) as unknown as MongoGameState
// 		},
// 		tryToUpdateGameState: async (newGameState: MongoGameState) => {
// 			const result = await gamesCollection.replaceOne(
// 				{ _id: GAME_STATE_ID, version: newGameState.version },
// 				{ ...newGameState, version: newGameState.version + 1 },
// 			)
// 			if (result.modifiedCount > 0) {
// 				++newGameState.version
// 				return true
// 			} else {
// 				return false
// 			}
// 		},
// 	}
// }


import { MongoClient } from 'mongodb'
import { Player } from './model'

// Connection URL
// const url = 'mongodb://127.0.0.1:27017' //changed this
const url = process.env.MONGO_URL || 'mongodb://db'
const client = new MongoClient(url)



async function main() {
  await client.connect()
  console.log('Connected successfully to MongoDB')

  const db = client.db("test")

  // set up unique index for upsert -- to make sure a customer cannot have more than one draft order
  db.collection("players").createIndex(
	{ id: 1 }, 
	{ unique: true }
  );
  db.collection("players").createIndex(
	{ email: 1 },
	{ unique: true, sparse: true } // sparse allows for null values
  );

  // add data
  // const players: Player[] = [
  //   {
  //     id: "1",
  //     username: "ellie",
  //     email: "ellie@test.com",
  //     gamesWon: 0,
  //     groups: [],
  //   },
  //   {
  //     id: "2",
  //     username: "tony",
  //     email: "tony@test.com",
  //     gamesWon: 0,
  //     groups: [],
  //   },
  // ]

  //console.log("inserting players", await db.collection("players").insertMany(players as any))


//   console.log("inserting customers", await db.collection("customers").insertMany(customers as any))
//   console.log("inserting operators", await db.collection("operators").insertMany(operators as any))
//   console.log("inserting ingredients", await db.collection("possibleIngredients").insertMany(possibleIngredients as any))

  process.exit(0)
}

main()