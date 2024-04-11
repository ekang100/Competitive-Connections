
<template>
  <div>
    <div v-if="phase === 'game-over'" style="text-align: center; margin-top: 30px;">
      <h2>Game Over</h2>
    </div>
    <div v-if = "playerIndex!='all' && playerLives[playerIndex]==0 && activePlayers.length>0">
        <h2> You ran out of lives! Wait for the game to finish since the following players are still cooking:</h2>
        
        <div v-for="(playerName, playerIndex) in activePlayers" >
            {{ playerName }}
        </div>
      </div>


    <div v-for="(playerName, playerIndex) in listOfPlayerNames" :key="playerIndex">
      Player {{ playerName }} Lives: {{ playerLives[playerIndex] }}
    </div>
    <b-button class="mx-2 my-2" size="sm" @click="socket.emit('new-game')">New Game</b-button>
    <b-badge class="mr-2 mb-2">{{ phase }}</b-badge>
    <div class="board">
      <span
        v-for="(tile, index) in shuffledTiles"
        :key="tile.id"
        @click="playTile(tile.id)"
        class="tile"
        :style="{
          backgroundColor: tile.selected ? '#f0f0f0' : tile.matched ? 'blue' : 'transparent'
        }"
      >
        <pre style="margin: auto; text-align: center;align-items: center; justify-content: center; display: flex;  padding-top: 40px; ">{{ formatTile(tile) }}</pre>
        <div v-if="isCategoryMatched(tile.categoryNum)">
          Category: {{ getCategoryDescription(tile.categoryNum) }}
        </div>
      </span>
    </div>
    <b-button class="mx-2 my-2" size="sm" @click="shuffleBoard">Shuffle Board</b-button>
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
import { Tile, formatTile, GamePhase, tileId, PuzzleCategory } from "../../../server/model"

const MAX_SELECTED_TILES = 4;

const socket = io()
const playerIndex: Ref<number | "all"> = ref("all")

const playerLives: Ref<number[]> = ref([]);
const listOfPlayerNames: Ref<String[]> = ref([])
const categories: Ref<PuzzleCategory[]> = ref([])


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

socket.on("game-state", (newPlayerIndex: number, playersLives: Record<number,number> , playerNames: String[], newPhase: GamePhase, puzzleCategories: PuzzleCategory[] ) => {
  if (newPlayerIndex != null) {
    playerIndex.value = newPlayerIndex
  }

  console.log('these are the player lives:', playersLives)
  listOfPlayerNames.value = playerNames
  // currentTurnPlayerIndex.value = newCurrentTurnPlayerIndex
  phase.value = newPhase
  playerLives.value = Object.values(playersLives);      // i think this is wrong
  categories.value = puzzleCategories
  // playCount.value = newPlayCount
})

socket.on("game-state-specific", (playLives: Record<number,number>, newPhase:GamePhase) =>{
  console.log('please work', playLives)
  phase.value = newPhase
  playerLives.value = Object.values(playLives);      // i think this is wrong
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

async function applyUpdatedCards(updatedCards: Tile[]) {          //the problem is here i think!!!!
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

const shuffledTiles = computed(() => {
  // Create a copy of the tiles array
  const copiedTiles = [...tiles.value];
  // Shuffle the copied array
  for (let i = copiedTiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copiedTiles[i], copiedTiles[j]] = [copiedTiles[j], copiedTiles[i]];
  }
  return copiedTiles;
});

function shuffleBoard() {
  // Randomly shuffle the tiles
  tiles.value = shuffle(tiles.value);
}

function shuffle(array: any[]) {
  let currentIndex = array.length, randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}


const getCategoryDescription = (categoryNum: number) => {
  const category = categories.value.find(cat => cat.id === categoryNum);
  return category ? category.description : '';
}

const isCategoryMatched = (categoryNum: number) => {
  return tiles.value.some(tile => tile.categoryNum === categoryNum && tile.matched);
}


const activePlayers = computed(() => {
  return listOfPlayerNames.value.filter((_, index) => playerLives.value[index] > 0);
});


</script>
