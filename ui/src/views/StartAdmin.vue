<template>
  <div class="home">
    <b-container>
      <b-row class="justify-content-md-center">
        <b-col cols="12" md="8">
          <h1 class="text-center mt-4 mb-4">Competitive Connections</h1>
          <b-card no-body class="mb-3">
            <b-card-body v-if="isAdmin">
              <h2 class="text-center mb-3">Admin Controls</h2>
              <div class="d-flex flex-column align-items-center">
                <b-button @click="startGame" variant="success" class="mb-3">Start New Game</b-button>
                <b-button variant="info" v-b-modal.modal-1>Configure Game</b-button>
              </div>
              <b-modal id="modal-1" title="Configure Game" @show="getConfig" hide-footer centered>
                <b-overlay :show="busy">
                  <b-form @submit.stop.prevent="updateConfig(config)" class="my-3">
                    <b-form-group label="Choose board or randomize:" label-for="board-number">
                      <b-form-input type="number" id="board-number" v-model="board" :disabled="randomizeBoard" :min="0" :max="19" placeholder="Enter board number"></b-form-input>
                      <b-form-checkbox v-model="randomizeBoard" class="mt-2">Randomize Board</b-form-checkbox>
                    </b-form-group>
                    <b-form-group label="Lives:" label-for="lives">
                      <b-form-input type="number" id="lives" v-model="maxLives" min="1" max="10"></b-form-input>
                    </b-form-group>
                    <b-form-group label="Time Limit:" label-for="time">
                      <b-form-input type="number" id="time" v-model="timeRemaining" min="1" max="600"></b-form-input>
                    </b-form-group>
                    <b-form-group label="Mode:" label-for="mode">
                      <b-form-select id="mode" v-model="mode" :options="['easy', 'hard']"></b-form-select>
                    </b-form-group>
                    <b-button type="submit" variant="primary" block>Save</b-button>
                  </b-form>
                </b-overlay>
              </b-modal>
            </b-card-body>
            <b-card-body v-else-if="isLoggedIn">
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
import { computed, ref } from "vue"
import { useRouter } from "vue-router"
import { mockUser } from "../mockUser"
const socket = io()
const busy = ref(false)
const isAdmin = ref(false)
const isLoggedIn = ref(false)

const board = ref(0)
const maxLives = ref(3)
const timeRemaining = ref(100);
const mode = ref("easy")
const randomizeBoard = ref(false)
const router = useRouter()
 

//const props = defineProps<{ playerId: string }>()




// const config = ref({ board: board.value, maxLives: maxLives.value, timeLimit: timeRemaining.value, mode: mode.value })
const config = computed(() => ({ board: board.value, randomizeBoard: randomizeBoard.value, maxLives: maxLives.value, timeRemaining: timeRemaining.value, mode: mode.value }))

async function checkAdmin() {
   // const admin = await (await fetch("/api/admin")).json()

    

    if (mockUser.roles.includes("admin")) {
        isAdmin.value = true
    }
    else {
        isAdmin.value = false
        alert("You are not an admin")
    }
}

socket.on("connect", checkAdmin)

async function checkLoggedIn() {
  isLoggedIn.value = mockUser.username != null
}


socket.on("connect", checkLoggedIn)

socket.on("redirect", () => {
    router.push(`/1`)
    socket.emit("new-game")
})



async function startGame() {
    await new Promise<void>((resolve, reject) => {
    socket.emit("redirect")
    socket.once("redirect-reply",  (success: boolean) => {
        if (success) {
          resolve();
        } else {
          reject(new Error("Update redirect failed"));

        }
      })
    })
}



async function getConfig() {
  busy.value = true
  const config = await new Promise<{ board : number, randomizeBoard: boolean, maxLives : number, timeRemaining : number, mode : string }>((resolve) => {
    socket.emit("get-config")
    socket.once("get-config-reply", (config: { board : number, randomizeBoard: boolean, maxLives : number, timeRemaining : number, mode : string }) => {
      resolve(config)
    })
  })
  board.value = config.board
  randomizeBoard.value = config.randomizeBoard
  maxLives.value = config.maxLives
  timeRemaining.value = config.timeRemaining
  mode.value = config.mode
  busy.value = false
}

async function updateConfig(config: { board : number, randomizeBoard:boolean, maxLives : number, timeRemaining : number, mode : string }) {
  busy.value = true
  await new Promise<void>((resolve, reject) => {
    // socket.emit("update-config", config, () => {
    //   resolve()
    // })
    socket.emit("update-config", config)
    socket.once("update-config-reply",  (success: boolean) => {
        if (success) {
          resolve();
        } else {
          reject(new Error("Update config failed"));

        }
      })
  })
  busy.value = false
}


</script>