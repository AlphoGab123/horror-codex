export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const PLAYER_SPEED = 200;
export const FLASHLIGHT_RADIUS = 140;

export const WALLS = [
  { x: GAME_WIDTH / 2, y: 40, width: GAME_WIDTH - 100, height: 24 },
  { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 40, width: GAME_WIDTH - 100, height: 24 },
  { x: 60, y: GAME_HEIGHT / 2, width: 24, height: GAME_HEIGHT - 120 },
  { x: GAME_WIDTH - 60, y: GAME_HEIGHT / 2, width: 24, height: GAME_HEIGHT - 120 },
  { x: GAME_WIDTH / 2 - 80, y: GAME_HEIGHT / 2, width: 200, height: 20 },
  { x: GAME_WIDTH / 2 + 200, y: GAME_HEIGHT / 2 - 60, width: 24, height: 180 },
];
