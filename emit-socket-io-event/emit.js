
//USE THE BELOW COMMAND

//1) this command is for socket emitting
//INDEX=1 URL=http://localhost:31000 EVENT='["action",{"playerIndex":1}]' npm start

//2) this command is to protect the api
// curl -X GET http://localhost:31000/api/game/players/count
//this will return 'unauthorized'

import { io } from 'socket.io-client'

const URL = process.env.URL
if (!URL) {
	console.error("missing URL environment variable")
	process.exit(1)
}

const EVENT = process.env.EVENT || `["action", {"playerIndex": 0}]`
const parsedEvent = JSON.parse(EVENT)

console.log("Connecting to " + URL)
const socket = io(URL, { transports: ['websocket'], timeout: 3000 })

socket.on('connect', () => {
	console.log('Connected to the server at', URL)

	// Emit a test event
	console.log("Emitting event", parsedEvent)
	// socket.emit("player-index", parseInt(process.env.INDEX))
	socket.emit(...parsedEvent)
})

socket.on('action', (data) => {
	console.log('Event received:', data)
})

socket.on('disconnect', (reason) => {
	console.error("Disconnected:", reason)
	process.exit(1)
})

socket.on('connect_error', (reason) => {
	console.error("Error:", reason)
	process.exit(1)
})
