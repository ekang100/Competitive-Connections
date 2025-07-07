import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import { v4 as uuidv4 } from 'uuid'

dotenv.config()

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

app.use(cors())
app.use(express.json())

// 🧪 TEMP MOCK AUTH (for no-login MVP)
app.use((req, _res, next) => {
  req.user = {
    id: uuidv4(),
    preferred_username: `guest_${Math.floor(Math.random() * 10000)}`
  }
  next()
})

/**
 * In-memory data (no DB)
 */
const rooms: Record<string, any> = {} // each room contains game state
const playerToRoom: Record<string, string> = {} // track what room player is in

// 🧠 Socket game logic
io.on('connection', (socket) => {
  console.log(`⚡️ Socket connected: ${socket.id}`)

  socket.on('createRoom', ({ username }) => {
    const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase()
    rooms[roomCode] = {
      players: [{ id: socket.id, username }],
      board: generateBoard(), // placeholder function
      started: false,
    }
    playerToRoom[socket.id] = roomCode
    socket.join(roomCode)
    io.to(socket.id).emit('roomCreated', { roomCode, board: rooms[roomCode].board })
  })

  socket.on('joinRoom', ({ roomCode, username }) => {
    if (!rooms[roomCode]) {
      io.to(socket.id).emit('error', 'Room not found')
      return
    }

    if (rooms[roomCode].players.length >= 2) {
      io.to(socket.id).emit('error', 'Room full')
      return
    }

    rooms[roomCode].players.push({ id: socket.id, username })
    playerToRoom[socket.id] = roomCode
    socket.join(roomCode)

    // Notify both players
    io.to(roomCode).emit('playerJoined', {
      players: rooms[roomCode].players,
      board: rooms[roomCode].board,
    })
  })

  socket.on('submitGroup', ({ group, username }) => {
    const roomCode = playerToRoom[socket.id]
    if (!roomCode) return
    const room = rooms[roomCode]
    // Basic validation - just broadcast for now
    io.to(roomCode).emit('groupSubmitted', { group, by: username })
  })

  socket.on('disconnect', () => {
    const roomCode = playerToRoom[socket.id]
    if (roomCode) {
      const room = rooms[roomCode]
      room.players = room.players.filter((p: any) => p.id !== socket.id)
      if (room.players.length === 0) delete rooms[roomCode]
      else io.to(roomCode).emit('playerLeft', socket.id)
      delete playerToRoom[socket.id]
    }
    console.log(`❌ I love you cookie but the Socket disconnected: ${socket.id}`)
  })
})

// ✨ Dummy board generator
function generateBoard() {
  return [
    'Apple', 'Banana', 'Cherry', 'Date',
    'Blue', 'Red', 'Green', 'Yellow',
    'Dog', 'Cat', 'Horse', 'Mouse',
    'Violin', 'Piano', 'Drums', 'Flute'
  ].sort(() => Math.random() - 0.5)
}

app.get('/', (_req, res) => {
  res.send('Server is running!')
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`)
})
