
<template>


<link href="https://fonts.googleapis.com/css2?family=Abel&family=Nanum+Gothic+Coding&family=Space+Grotesk:wght@300&display=swap" rel="stylesheet">
  <div>
    <div v-if="phase === 'game-over'" style="text-align: center; margin-top: 30px;">
      <h2>Game Over</h2>
    </div>
    <div v-else-if="phase !== 'game-over'" style="text-align: center; margin-top: 10px;">
      <h2>Time Remaining: {{ timeRemaining }} seconds</h2>
    </div>
    <div id="messageContainer"></div>

    <div v-if = "playerIndex!='all' && playerLives[playerIndex]==0 && activePlayers.length>0">
        <h2> You ran out of lives! Wait for the game to finish since the following players are still playing:</h2>
        
        <div v-for="(playerName, playerIndex) in activePlayers" >
            {{ playerName }}
        </div>
      </div>

      <div v-for="(playerName, playerIndex) in listOfPlayerNames" :key="playerIndex" class="player-info">
  <div class="player-name">{{ playerName }}</div>
  <div class="player-details">
    <span class="player-lives">
      <i class="fa fa-heart" aria-hidden="true"></i> Lives: {{ playerLives[playerIndex] }}
    </span>
    <span class="player-categories">
      <i class="fa fa-list" aria-hidden="true"></i> Categories: {{ playersCategoriesNum[playerIndex] }}
    </span>
    <span class="guess-result">
      <i class="fa fa-list" aria-hidden="true"></i> Guess Result: {{ oneAway[playerIndex] }}
    </span>
  </div>
</div>
    <!-- <b-button class="mx-2 my-2" size="sm" @click="socket.emit('new-game')">New Game</b-button> -->
    <b-badge class="mr-2 mb-2">{{ phase }}</b-badge>
    <div class="board">
      <span
        v-for="(tile) in shuffledTiles"
        :key="tile.id"
        @click="playTile(tile.id)"
        class="tile"
        :style="getTileStyle(tile)"

      >
        <pre class="tile-text">{{ formatTile(tile) }}</pre>
        <div v-if="isCategoryMatched(tile.categoryNum)" class = "cat-text">
    {{ getCategoryDescription(tile.categoryNum) }}
</div>
      </span>
    </div>
    <b-button class="mx-2 my-2" size="sm" @click="shuffleBoard">Shuffle Board</b-button>
    <b-button class="mx-2 my-2" size="sm" @click="submitAction" :disabled="!canSubmit">Submit</b-button>
  </div>
</template>

<style scoped>


  h2,
    div,
    span,
    pre,
    button {
      font-family: "Nanum Gothic Coding", monospace;
        /* Adjust additional styles as needed */
    }
    
  .board {
    display: grid;
    grid-template-columns: repeat(4, 1fr); /* 4 columns */
    gap: 10px; /* Adjust gap as needed */
    justify-content: center;
    margin: 0 auto; /* Center the board horizontally */
    width: fit-content; /* Adjust the width according to the content */

  }
  
  .tile {
    display: inline-block;
    width: 100px; /* Adjust width as needed */
    height: 100px; /* Adjust height as needed */
    margin: 5px; /* Adjust margin as needed */
    border: 1px solid black; /* Add border for better visualization */
    cursor: pointer; /* Change cursor to pointer on hover */
  }

  .cat-text{
    text-align: center; font-weight: bold; font-size: 12px;
  }
  .player-info {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.tile-text{
  margin: auto; text-align: center;align-items: center; justify-content: center; display: flex;  padding-top: 40px;
}

.player-name {
  font-weight: bold;
  font-size: 16px;
}

.player-details {
  display: flex;
  justify-content: space-between;
  padding-top: 5px;
}

.player-lives, .player-categories, .guess-result {
  display: flex;
  align-items: center;
}

.player-lives i, .player-categories, .guess-result i {
  margin-right: 5px;
}


/* Define mobile styles */
@media (max-width: 375px) {
    /* Reduce the number of columns on mobile devices */
    .board {
      display: grid;
      grid-template-columns: repeat(4, 1fr); /* 4 columns */
      width: 90%; /* Set the board width to 90% to fit better on mobile screens */
        margin: 10px auto; /* Add margin for better spacing */
        justify-content: center;
    margin: 0 auto; /* Center the board horizontally */
    width: fit-content; /* Adjust the width according to the content */

    }
    
    .tile {
        width: 50px; /* Reduce width for smaller screens */
        height: 50px; /* Reduce height for smaller screens */
        margin: 2px; /* Adjust margin for smaller screens */
        display: flex; /* Enable Flexbox */
        flex-direction: column; /* Arrange the content vertically */
        align-items: center; /* Align items to the top */
        justify-content: center; /* Align content to the top */
    }
    
   /* Tile text adjustments */
   .tile-text {
        margin: 0; /* Remove margin */
        padding: 0; /* Remove padding */
        text-align: center; /* Center text within the tile */
        flex: 1; /* Allow text to grow and fill the tile */
        justify-content: center; /* Center the title text horizontally */
        /* padding-left: 10px; Add padding to the left side of the text */

    }

    /* Category text */
    .cat-text {
        text-align: center; /* Center the text */
        font-weight: bold; /* Keep text bold */
        font-size: 8px; /* Reduce the font size */
        margin-top: 2px; /* Add minimal margin at the top */
    }
/* 
      /* Add padding to the bottom of the text within the tile */
      /* .tile pre {
        padding-bottom: 30px; /* Adjust the value as needed }
         */
    


    /* Adjust the layout of player info for mobile devices */
    .player-info {
        flex-direction: column; /* Display player info in a single column */
        margin: 10px; /* Adjust margin for smaller screens */
    }

    /* Adjust font size for better readability on smaller screens */
    h2, div, span, pre, button {
        font-size: 10px; /* Reduce text size */
    }
}
</style>


<script setup lang="ts">
import { computed, ref, Ref } from 'vue'
import { io } from "socket.io-client"
import { Tile, formatTile, GamePhase, tileId, PuzzleCategory } from "../data.ts"
import { useRouter } from 'vue-router'; // Import useRouter for navigation
//import { almost } from "../../../server/model";
const router = useRouter(); // Initialize the router instance



const MAX_SELECTED_TILES = 4;

const socket = io()
const playerIndex: Ref<number | "all"> = ref("all")

const playerLives: Ref<number[]> = ref([]);
const listOfPlayerNames: Ref<String[]> = ref([])
const categories: Ref<PuzzleCategory[]> = ref([])
const playersCategoriesNum: Ref<number[]> = ref([]);

const tiles: Ref<Tile[]> = ref([])
// const currentTurnPlayerIndex = ref(-1)
const phase = ref("")
// const playCount = ref(-1)
const timeRemaining: Ref<number> = ref(0);
const board: Ref<number> = ref(0);
const mode: Ref<string> = ref("");
const randomizeBoard: Ref<boolean> = ref(false);
const oneAway: Ref<String[]> = ref([]);

// interface Props{
//   playerId?: string
// }

// const props = withDefaults(defineProps<Props>(), {
//   playerId: 'ellie'
// })

// const myTurn = computed(() => currentTurnPlayerIndex.value === playerIndex.value && phase.value !== "game-over")
socket.on("game-time", (remainingTime: number) => {
    timeRemaining.value = remainingTime;
});

socket.on("all-tiles", (allTiles: Tile[]) => {
  tiles.value = allTiles
})

socket.on("updated-tiles", (updatedTiles: Tile[]) => {
  applyUpdatedCards(updatedTiles)
})

//io.emit("game-state", gameState.playerNames, gameState.tilesById, gameState.playersCompleted, gameState.phase, gameState.playerLives, gameState.categoriesPlayersCompleted, gameState.timeRemaining, gameState.playerWinner, gameState.board, gameState.mode);
//}, 2000);

socket.on("game-state", (newPlayerIndex: number, playersLives: Record<number,number> , playerNames: String[], newPhase: GamePhase, puzzleCategories: PuzzleCategory[], categoriesPlayersCompleted:  Record<number, number>, newBoard: number, newMode: string, timeRemain:number, newRandomizeBoard:boolean, newOneAway:Record<number, string> ) => {
  if (newPlayerIndex != null) {
    playerIndex.value = newPlayerIndex
  }

  console.log('these are the player lives:', playersLives)
  console.log(newMode)
  listOfPlayerNames.value = playerNames
  // currentTurnPlayerIndex.value = newCurrentTurnPlayerIndex
  phase.value = newPhase
  playerLives.value = Object.values(playersLives);      // i think this is wrong
  categories.value = puzzleCategories
  playersCategoriesNum.value = Object.values(categoriesPlayersCompleted)
  timeRemaining.value = timeRemain;
  board.value = newBoard;
  mode.value = newMode;
  randomizeBoard.value = newRandomizeBoard;
  oneAway.value = Object.values(newOneAway);

  // playCount.value = newPlayCount
})

socket.on("game-state-specific", (playLives: Record<number,number>, newPhase:GamePhase, categoriesPlayersCompleted:  Record<number, number>, newOneAway: Record<number,string>) =>{
 if (newPhase === 'game-over'){
  router.push('/game-over');
 } 
  
  console.log('please work', playLives)
  console.log("New oneAway received:", newOneAway);
  phase.value = newPhase
  playerLives.value = Object.values(playLives);     
  playersCategoriesNum.value = Object.values(categoriesPlayersCompleted);
  oneAway.value = Object.values(newOneAway);
})


function doAction() {           
  return new Promise<Tile[]>((resolve) => {
    socket.emit("action", playerIndex.value)
    socket.once("update-tiles", (updatedTiles: Tile[]) => {
      resolve(updatedTiles);  // Pass the oneAway message to be used after promise resolution
    });
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
    console.log('selected tiles:', tileToSelect)

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
    //console.log('DID THE ACTION')
    //alert(oneAway.value);
  }
  else {
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

// const playerProgress = computed(() => {
//   return listOfPlayerNames.value.map((_, index) => {
//     const livesLeft = playerLives.value[index];
//     const categoriesCompleted = playersCategoriesNum.value[index];
    
//     if (phase.value === "game-over") {
//       if (livesLeft === 0 && categoriesCompleted < 4) {
//         return "failed";
//       } else if (categoriesCompleted >= 4) {
//         return "completed";
//       }
//     } else if (phase.value === "in-play") {
//       if (livesLeft > 0 && categoriesCompleted < 4) {
//         return "in progress";
//       }
//     }
    
//     return "";
//   });
// });

const getTileStyle = (tile: Tile) => {
  let backgroundColor = 'transparent';

  if (tile.selected) {
    backgroundColor = '#f0f0f0';
  } else if (tile.matched) {
    switch (tile.categoryNum) {
      case 1:
        backgroundColor = '#fbd400'; // Category ID 1
        break;
      case 2:
        backgroundColor = '#69e352'; // Category ID 2
        break;
      case 3:
        backgroundColor = '#5492ff'; // Category ID 3
        break;
      case 4:
        backgroundColor = '#df7bea'; // Category ID 4
        break;
    }
  }

  return {
    backgroundColor,
  };
};
</script>
