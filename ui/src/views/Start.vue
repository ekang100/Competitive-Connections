<template>
    <div class="home">
      <b-container>
        <b-row class="justify-content-md-center">
          <b-col cols="12" md="8">
            <h1 class="text-center mt-4 mb-4">Competitive Connections</h1>
            <b-card>
              <b-card-body v-if="isLoggedIn">
                <h2 class="text-center">Waiting for game to start...</h2>
              </b-card-body>
              <b-card-body v-else>
                <h2 class="text-center">You need to log in to play</h2>
              </b-card-body>
            </b-card>
          </b-col>
        </b-row>
      </b-container>
    </div>
  </template>
  
  
  <style scoped>
  .home {
    background-color: #f8f9fa;
    padding: 20px;
  }
  </style>
  
  
  
  <script setup lang="ts">
  import { io } from "socket.io-client"
  import { ref } from "vue"
  import { useRouter } from "vue-router";
  import { mockUser } from "../mockUser"

  const socket = io()
  const isAdmin = ref(false)
  const isLoggedIn = ref(false)
  
//   const board = ref(0)
//   const maxLives = ref(3)
//   const timeRemaining = ref(100);
//   const mode = ref("easy")
//   const randomizeBoard = ref(false)
  
  
  // const config = ref({ board: board.value, maxLives: maxLives.value, timeLimit: timeRemaining.value, mode: mode.value })
  //const config = computed(() => ({ board: board.value, randomizeBoard: randomizeBoard.value, maxLives: maxLives.value, timeRemaining: timeRemaining.value, mode: mode.value }))
  
  const router = useRouter()

  async function checkAdmin() {
      const user = await (await fetch("/api/user")).json()
      console.log("AHRIUHEAIURH", user)
      isAdmin.value = mockUser.roles.includes("admin")
  }
  
  socket.on("connect", checkAdmin)
  
  async function checkLoggedIn() {
      const user = await (await fetch("/api/user")).json()
      isLoggedIn.value = mockUser.username != null
  }
  
  socket.on("connect", checkLoggedIn)
  
  socket.on("redirect", () => {
      router.push('/0')
      socket.emit("new-game")
  })
  
  
  </script>