<template>
  <div>
    <b-button class="mx-2 my-2" size="sm" @click="socket.emit('new-game')">New Game</b-button>
    <b-badge class="mr-2 mb-2">{{ phase }}</b-badge>
    <div class="board">
      <span
        v-for="tile in tiles"
        :key="tile.id"
        @click="playTile(tile.id)"
        class="tile"
        :style="{
          backgroundColor: tile.selected ? '#f0f0f0' : tile.matched ? 'blue' : 'transparent'
        }"
      >
        <pre style="margin: auto; text-align: center;align-items: center; justify-content: center; display: flex;  padding-top: 40px; ">{{ formatTile(tile) }}</pre>
      </span>
    </div>
    <b-button class="mx-2 my-2" size="sm" @click="submitAction" :disabled="!canSubmit">Submit</b-button>
  </div>
</template>

<style scoped>
  .board {
    display: grid;
    grid-template-columns: repeat(4, 1fr); /* 4 columns */
    gap: 5px; /* Adjust gap as needed */
    justify-content: center;
  }
  
  .tile {
    display: block;
    width: 50px; /* Adjust width as needed */
    height: 50px; /* Adjust height as needed */
    border: 1px solid black; /* Add border for better visualization */
    cursor: pointer; /* Change cursor to pointer on hover */
  }
</style>

<style scoped>
  .tile {
    display: inline-block;
    width: 100px; /* Adjust width as needed */
    height: 100px; /* Adjust height as needed */
    margin: 5px; /* Adjust margin as needed */
    border: 1px solid black; /* Add border for better visualization */
    cursor: pointer; /* Change cursor to pointer on hover */
  }
</style>

<script setup lang="ts">
import { computed, onMounted, ref, Ref } from 'vue'
import { io } from "socket.io-client"
import { Tile, formatTile, GamePhase, tileId } from "../../../server/model"

const MAX_SELECTED_TILES = 4;

const socket = io()
const playerIndex: Ref<number | "all"> = ref("all")

const tiles: Ref<Tile[]> = ref([])
// const currentTurnPlayerIndex = ref(-1)
const phase = ref("")
// const playCount = ref(-1)

// const myTurn = computed(() => currentTurnPlayerIndex.value === playerIndex.value && phase.value !== "game-over")

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
    socket.emit("action", playerIndex.value)
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

async function playTile(TileId: tileId) {

  
  if (typeof playerIndex.value === "number") {
    // Count the number of currently selected tiles


    const tileToSelect = tiles.value.find(tile => tile.id === TileId);

        // Check if tileToSelect is undefined
    if (!tileToSelect) {
      console.error("Tile not found");
      return;
    }

    const selectedTilesCount = tiles.value.filter(tile => tile.selected).length;
    if(tileToSelect.selected && !tileToSelect.matched){
      tileToSelect.selected=false;
      socket.emit("selected-tile",tileToSelect)
    }
    else if (selectedTilesCount >= MAX_SELECTED_TILES) {
      alert("You can only select up to 4 tiles.");
      return;
    }
    else if (!tileToSelect.matched) {
      if (tileToSelect) {
        tileToSelect.selected = true;
        socket.emit("selected-tile",tileToSelect)
      }
  
    }


    // const updatedCards = await doAction()
    // if (updatedCards.length === 0) {
    //   alert("didn't work")
    // }
  }
}

async function applyUpdatedCards(updatedCards: Tile[]) {
  for (const x of updatedCards) {
    const existingCard = tiles.value.find(y => x.id === y.id)
    if (existingCard) {
      Object.assign(existingCard, x)
    } else {
      tiles.value.push(x)
    }
  }
}


const canSubmit = computed(() => {
  const selectedTilesCount = tiles.value.filter(tile => tile.selected).length;
  return selectedTilesCount === MAX_SELECTED_TILES;
});

function submitAction() {
  if (canSubmit.value) {
    doAction();
  } else {
    alert("Please select exactly 4 tiles.");
  }
}
</script>
