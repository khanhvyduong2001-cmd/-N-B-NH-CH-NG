export enum GameState {
  LOADING = 'LOADING',
  READY = 'READY',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface Item {
  id: number;
  x: number; // 0 to 1 (normalized width)
  y: number; // 0 to 1 (normalized height)
  speed: number;
  emoji: string;
  type: 'food' | 'bomb'; // Bomb functionality could be added later, simplified to food for now
  scoreValue: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

// Minimal type definitions for MediaPipe globals loaded via script tags
declare global {
  interface Window {
    FaceMesh: any;
    Camera: any;
  }
}

export const FOOD_ITEMS = ['🟩', '🍖', '🥓', '🥮'];
