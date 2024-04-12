<template>
    <div class="end-container">
        <h2 style="text-align: center; margin-top: 30px;">Game Over</h2>
        <div v-if="finishedPlayer">
            <div class="winner-section">
                <h3 style="color: gold; font-size: 24px;">🏆 Winner: {{ finishedPlayer }} 🏆</h3>
            </div>
        </div>
        <div v-else>
            <div class="winner-section">
                <h3 style="color: red; font-size: 24px;">No one won this game.</h3>
            </div>
        </div>
        <div class="player-list">
            <div v-for="(player, index) in listOfPlayerNames" :key="index" 
                :class="{ 'current-user': index === playerIndex }" 
                class="player-item">
                <!-- <span class="player-rank">#{index + 1}</span> -->
                <span class="player-name">{{ player }}</span>
                <span class="player-info">(Categories completed: {{ playersCategoriesNum[index] }}, Lives left: {{ playerLives[index] }})</span>
            </div>
        </div>
        <div class="category-section">
            <h3 style="margin-top: 20px;">Puzzle Categories:</h3>
            <ul>
                <li v-for="category in categories" :key="category.id">
                    <strong>{{ category.description }}</strong>
                    <ul>
                        <li v-for="word in category.words" :key="word">{{ word }}</li>
                    </ul>
                </li>
            </ul>
        </div>
    </div>
</template>
  
  <style scoped>
  .end-container {
    text-align: center;
    margin-top: 30px;
  }
  
  .player-list {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 20px;
  }
  
  .player-item {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
    margin-bottom: 5px;
    border: 1px solid #ccc;
    border-radius: 5px;
    width: 60%; /* Adjust width as needed */
  }
  
  .player-rank {
    font-weight: bold;
    margin-right: 10px;
  }
  
  .player-name {
    font-size: 16px;
    font-weight: bold;
    margin-right: 10px;

  }
  </style>
  
  <script setup lang="ts">
  import { onMounted, ref, Ref } from 'vue';
  import { io} from "socket.io-client";
  
  const socket = io();
  const finishedPlayer = ref("");
  const phase = ref("");

  import { Tile, formatTile, GamePhase, tileId, PuzzleCategory } from "../../../server/model"

  const playerIndex: Ref<number | "all"> = ref("all")

const playerLives: Ref<number[]> = ref([]);
const listOfPlayerNames: Ref<string[]> = ref([])
const categories: Ref<PuzzleCategory[]> = ref([])
const playersCategoriesNum: Ref<number[]> = ref([]);
  
  
socket.on("game-state-specific", (playLives: Record<number,number>, newPhase:GamePhase, categoriesPlayersCompleted:  Record<number, number>, playerWin: string) =>{
//   console.log('please work', playLives)
  phase.value = newPhase
  playerLives.value = Object.values(playLives);     
  playersCategoriesNum.value = Object.values(categoriesPlayersCompleted)
//   finishedPlayer.value = playerWin
//   console.log('this is the player that won:', finishedPlayer.value)
  // Check if there is a winner with 4 categories completed
  for (let i = 0; i < playersCategoriesNum.value.length; i++) {
    if (playersCategoriesNum.value[i] === 4) {
      finishedPlayer.value = listOfPlayerNames.value[i];
      break; // Break out of the loop once a winner is found
    }
  }
})


socket.on("game-state", (newPlayerIndex: number, playersLives: Record<number,number> , playerNames: string[], newPhase: GamePhase, puzzleCategories: PuzzleCategory[], categoriesPlayersCompleted:  Record<number, number> ) => {
  if (newPlayerIndex != null) {
    playerIndex.value = newPlayerIndex
  }

  console.log('these are the player lives:', playersLives)
  listOfPlayerNames.value = playerNames
  // currentTurnPlayerIndex.value = newCurrentTurnPlayerIndex
  phase.value = newPhase
  playerLives.value = Object.values(playersLives);      // i think this is wrong
  categories.value = puzzleCategories
  playersCategoriesNum.value = Object.values(categoriesPlayersCompleted)
  // playCount.value = newPlayCount
})

  </script>
  