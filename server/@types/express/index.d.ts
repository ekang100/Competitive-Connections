export {}

declare global {
  namespace Express {
    interface User {
      preferred_username: string;
      roles?: string[];
      email?: string;
      gamesWon?: number;
      id?: string;

    }
  }
}
