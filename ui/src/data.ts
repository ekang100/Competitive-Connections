export interface Player{
  id: "gitlabUserId",
  username: "gitlabUsername",
  email: "userEmail",
  gamesWon: number,
  groups: ["competitive-connections-admin"]
}


export interface PuzzleCategory{
  id: number
  description: string;
  words: string[];
  color: string;
}
export interface Puzzle {
  id: string
  categories: PuzzleCategory[]
}

// export const CATEGORY = ["1", "2", "3", "4"]
export type tileId = string
// export const allPuzzles: Puzzle[] = Object.entries(puzzlesData).map(([id, puzzle]) => ({
//   id,
//   categories: puzzle.categories,
// }));

export interface Tile{
  id: tileId
  clue: string
  categoryNum: number //this gonna be the category that they are attributed to
  selected: boolean | null
  matched: boolean | null
  playerIndex: number | null
}

export type GamePhase = "pre-game" | "play" | "game-over"


export interface GameState {
  playerNames: string[];
  tilesById: Record<tileId, Tile>;
  playersCompleted: string[];
  phase: GamePhase;
  playerLives: Record<number, number>; // Track player lives, index to index
  categoriesPlayersCompleted: Record<number, number>; //tracks number of categories a player completed
  timeRemaining: number; // Time remaining in seconds
  playerWinner: string;
}


export function formatTile(tile: Tile): string {
  return tile.clue
}

export interface Res {
  tiles: Tile[]
  message: string
}