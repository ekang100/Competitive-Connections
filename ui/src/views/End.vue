<template>
    <div class="end-container">
        <h2 style="text-align: center; margin-top: 30px;">Game Over</h2>
        <button class="return-button" @click="goToPreGame">Return Everyone to Menu</button>

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
        <div v-if="gamesWon == '1'">
  <p>You have won a total of <b>{{ gamesWon }}</b> game.</p>
</div>
<div v-else-if="gamesWon !== ''">
  <p>You have won a total of <b>{{ gamesWon }}</b> games.</p>
</div>
        <div class="player-list">
            <div v-for="(player, index) in listOfPlayerNames" :key="index" 
                :class="{ 'current-user': index === playerIndex }" 
                class="player-item">
                <span class="player-name">{{ player }}</span>
                <span class="player-info">(Categories completed: {{ playersCategoriesNum[index] }}, Lives left: {{ playerLives[index] }})</span>
            </div>
        </div>
        <div class="category-section">
            <h3 style="margin-top: 20px;">Puzzle Categories:</h3>
            <div class="categories-container">
                <ul v-for="category in categories" :key="category.id" :class="'category-' + category.id" class="category">
                    <strong>{{ category.description }}</strong>
                    <ul>
                        <li v-for="word in category.words" :key="word">{{ word }}</li>
                    </ul>
                </ul>
            </div>
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

.return-button {
    float: right; /* Aligns the button to the right side */
    margin: 10px 30px 10px 0; /* Add margins for spacing */
    padding: 10px 20px; /* Padding for a better button size */
    background-color: #4CAF50; /* Button background color */
    color: white; /* Button text color */
    border: none; /* No border */
    border-radius: 5px; /* Rounded corners */
    cursor: pointer; /* Pointer cursor on hover */
}

.category-section {
    margin-top: 20px;
}

.categories-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.category {
    list-style-type: none; /* Remove bullet points */
    margin: 0;
    padding: 0;
}

.category ul {
    list-style-type: none; /* Remove bullet points */
    margin: 0;
    padding: 0;
}

.category-1 {
    background-color: #fbd400; /* Category ID 1 */
}

.category-2 {
    background-color: #69e352; /* Category ID 2 */
}

.category-3 {
    background-color: #5492ff; /* Category ID 3 */
}

.category-4 {
    background-color: #df7bea; /* Category ID 4 */
}

@media (min-width: 800px) {
    .categories-container {
        flex-direction: row; /* Display categories side by side on larger screens */
        justify-content: center; /* Center the categories */
    }

    .category {
        margin: 0 20px; /* Add margin between categories */
    }
}
</style>
  
  <script setup lang="ts">
  import { ref, Ref } from 'vue';
  import { io} from "socket.io-client";
  import { useRouter } from 'vue-router';
  
  const socket = io();
  const finishedPlayer = ref("");
  const phase = ref("");

  import { GamePhase, PuzzleCategory } from "../data.ts"

  const playerIndex: Ref<number | "all"> = ref("all")

const playerLives: Ref<number[]> = ref([]);
const listOfPlayerNames: Ref<string[]> = ref([])
const categories: Ref<PuzzleCategory[]> = ref([])
const playersCategoriesNum: Ref<number[]> = ref([]);
const gamesWon: Ref<string> = ref("")
  
const router = useRouter(); // Initialize the Vue router

// onMounted(() => {
//     fetchGamesWon();
// });

function findWinner(): void {
    for (let i = 0; i < playersCategoriesNum.value.length; i++) {
    if (playersCategoriesNum.value[i] === 4) {
      finishedPlayer.value = listOfPlayerNames.value[i];
      break; // Break out of the loop once a winner is found
    }
  }
}

  
socket.on("game-state-specific", (playLives: Record<number,number>, newPhase:GamePhase, categoriesPlayersCompleted:  Record<number, number>) =>{
//   console.log('please work', playLives)
  phase.value = newPhase
  playerLives.value = Object.values(playLives);     
  playersCategoriesNum.value = Object.values(categoriesPlayersCompleted)
//   finishedPlayer.value = playerWin
//   console.log('this is the player that won:', finishedPlayer.value)
  // Check if there is a winner with 4 categories completed
  findWinner();

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
  fetchGamesWon();
})


socket.on("new-state", (changedState: string) => {
    phase.value = changedState
    if(phase.value === 'pre-game'){
        router.push('/')
    }
});

function goToPreGame() {
  // Send a socket message to update the game state to pre-game
  socket.emit('change-state', 'pre-game');
  
  // Navigate the user to the home page
}


// Function to fetch gamesWon data for the specified player
async function fetchGamesWon() {
    const playerName = typeof playerIndex.value === 'number' ? listOfPlayerNames.value[playerIndex.value] : null;

// Check if the index is a valid number or handle the "all" case
if (playerName) {
    // Player name is available, proceed with fetching gamesWon data
} else if (playerIndex.value === 'all') {
    // Handle the case when playerIndex is "all"
}
    try {
        // Send a request to the API to fetch the gamesWon data for the player
        const response = await fetch(`/api/${playerName}/gamesWon`);
        const data = await response.json();

        if (response.ok) {
            // Update the state variable with the gamesWon data
            gamesWon.value = data.gamesWon;
        } else {
            console.error('Error fetching gamesWon data:', data.error);
        }
    } catch (error) {
        console.error('Error fetching gamesWon data:', error);
    }
}

  </script>
  