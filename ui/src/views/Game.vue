<template>
  <div>
    <b-button class="mx-2 my-2" size="sm" @click="socket.emit('new-game')">New Game</b-button>
    <!-- <b-badge class="mr-2 mb-2" :variant="myTurn ? 'primary' : 'secondary'">turn: {{ currentTurnPlayerIndex }}</b-badge> -->
    <b-badge class="mr-2 mb-2">{{ phase }}</b-badge>
    <div
      v-for="tile in tiles"
      :key="tile.id"
      @click="playTile(tile.id)"
    >
      <pre>{{ formatTile(tile) }}</pre>
    </div>
    <!-- <b-button class="mx-2 my-2" size="sm" @click="drawCard" :disabled="!myTurn">Draw Card</b-button> -->
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, Ref } from 'vue'
import { io } from "socket.io-client"
import { Tile, formatTile, GamePhase, tileId } from "../../../server/model"


const socket = io()
const playerIndex: Ref<number | "all"> = ref("all")

const tiles: Ref<Tile[]> = ref([])
const currentTurnPlayerIndex = ref(-1)
const phase = ref("")
// const playCount = ref(-1)

const myTurn = computed(() => currentTurnPlayerIndex.value === playerIndex.value && phase.value !== "game-over")

socket.on("all-tiles", (allTiles: Tile[]) => {
  tiles.value = allTiles
})

socket.on("updated-tiles", (updatedTiles: Tile[]) => {
  applyUpdatedCards(updatedTiles)
})

socket.on("game-state", (newPlayerIndex: number, newPhase: GamePhase) => {
  if (newPlayerIndex != null) {
    playerIndex.value = newPlayerIndex
  }
  // currentTurnPlayerIndex.value = newCurrentTurnPlayerIndex
  phase.value = newPhase
  // playCount.value = newPlayCount
})

function doAction() {              
  return new Promise<Tile[]>((resolve, reject) => {
    socket.emit("action", playerIndex)
    socket.once("updated-tiles", (updatedCards: Tile[]) => {
      resolve(updatedCards)
    })
  })
}

// async function drawCard() {
//   if (typeof playerIndex.value === "number") {
//     const updatedCards = await doAction({ action: "draw-card", playerIndex: playerIndex.value })
//     if (updatedCards.length === 0) {
//       alert("didn't work")
//     }
//   }
// }

async function playTile(TileId: tileId) {           //fix this
  if (typeof playerIndex.value === "number") {
    const updatedCards = await doAction()
    if (updatedCards.length === 0) {
      alert("didn't work")
    }
  }
}

async function applyUpdatedCards(updatedCards: Tile[]) {        //fix this too
  for (const x of updatedCards) {
    const existingCard = tiles.value.find(y => x.id === y.id)
    if (existingCard) {
      Object.assign(existingCard, x)
    } else {
      tiles.value.push(x)
    }
  }
}
</script>