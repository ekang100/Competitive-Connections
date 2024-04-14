<template>
    <div class="home">
        <h1>Competitive Connections</h1>
        <div v-if="isAdmin">
            <h2>Admin Controls</h2>
            <!-- Admin controls for starting a new game and configuring settings -->
            <button @click="startGame">Start New Game</button>
            <div>
                <label>Game Settings:</label>
                <!-- Input fields for configuring game settings -->
                <!-- Example: -->
                <!-- <input type="text" v-model="gameSettings.name" placeholder="Game Name"> -->
                <!-- <input type="number" v-model="gameSettings.maxPlayers" placeholder="Max Players"> -->
                <b-button class="mr-2 mb-2" size="sm" v-b-modal.modal-1>Configure Game</b-button>
                <b-modal id="modal-1" title="Configure Game" @show="getConfig" ok-only="true" ok-title="Close" data-backdrop="static">
                <b-overlay :show="busy" rounded="sm">
                    <b-form @submit.stop.prevent="updateConfig(config)">
                    <b-form-group label="Choose board:" label-for="board">
                        <b-form-input number id="decks" type="number" v-model="board" :min="0" :max="1"></b-form-input>
                    </b-form-group>

                    <b-form-group label="Lives:" label-for="lives">
                        <b-form-input number id="rank" type="number" v-model="maxLives" :min="1" :max="10"></b-form-input>
                    </b-form-group>

                    <b-form-group label="Time Limit:" label-for="time">
                        <b-form-input number id="rank" type="number" v-model="timeRemaining" :min="1" :max="600"></b-form-input>
                    </b-form-group>

                    <b-form-group label="Mode:" label-for="mode">
                        <b-form-select string id="mode" type="string" v-model="mode" :options="['easy', 'hard']"></b-form-select>
                    </b-form-group>

                    <b-button type="submit" variant="primary">Save</b-button>
                    </b-form>
                </b-overlay>
                </b-modal>
            </div>
        </div>
        <div v-else-if="isLoggedIn">
            <h2>Waiting...</h2>
        </div>
        <div v-else>
            <h2>You need to log in to play</h2>
        </div>
    </div>
</template>

<script setup lang="ts">
import { io } from "socket.io-client"
import { Ref, computed, ref } from "vue"
const socket = io()
const busy = ref(false)
const isAdmin = ref(false)
const isLoggedIn = ref(false)

const board = ref(1)
const maxLives = ref(3)
const timeRemaining = ref(100);
const mode = ref("easy")

// const config = ref({ board: board.value, maxLives: maxLives.value, timeLimit: timeRemaining.value, mode: mode.value })
const config = computed(() => ({ board: board.value, maxLives: maxLives.value, timeRemaining: timeRemaining.value, mode: mode.value }))

async function checkAdmin() {
    const user = await (await fetch("/api/user")).json()
    isAdmin.value = user.groups.includes("competitive-connections-admin")
}

socket.on("connect", checkAdmin)

async function checkLoggedIn() {
    const user = await (await fetch("/api/user")).json()
    isLoggedIn.value = user.name != null
}

socket.on("connect", checkLoggedIn)

socket.on("redirect", (url: string) => {
    window.location.href = url
    socket.emit("new-game")
})

async function startGame() {
    await new Promise<void>((resolve, reject) => {
    socket.emit("redirect", "/0")
    socket.once("redirect-reply",  (success: boolean) => {
        if (success) {
          resolve();
        } else {
          reject(new Error("Update config failed"));

        }
      })
    })
}

async function getConfig() {
  busy.value = true
  const config = await new Promise<{ board : number, maxLives : number, timeRemaining : number, mode : string }>((resolve, reject) => {
    socket.emit("get-config")
    socket.once("get-config-reply", (config: { board : number, maxLives : number, timeRemaining : number, mode : string }) => {
      resolve(config)
    })
  })
  board.value = config.board
  maxLives.value = config.maxLives
  timeRemaining.value = config.timeRemaining
  mode.value = config.mode
  busy.value = false
}

async function updateConfig(config: { board : number, maxLives : number, timeRemaining : number, mode : string }) {
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

<style scoped>
/* Add your custom styles here */
</style>