export type HudState = {
  pickupCollected: boolean;
  showPrompt: boolean;
};

export type SceneOptions = {
  onHudUpdate?: (state: HudState) => void;
};
