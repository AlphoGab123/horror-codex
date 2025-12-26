import Phaser from 'phaser';
import { FLASHLIGHT_RADIUS, GAME_HEIGHT, GAME_WIDTH, PLAYER_SPEED, WALLS } from './constants';
import type { HudState, SceneOptions } from './types';

type PlayerBody = Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

export class MainScene extends Phaser.Scene {
  private opts: SceneOptions;
  private player!: PlayerBody;
  private keys!: Phaser.Types.Input.Keyboard.CursorKeys & { E: Phaser.Input.Keyboard.Key };
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private pickup!: Phaser.GameObjects.Rectangle;
  private promptText!: Phaser.GameObjects.Text;
  private hudState: HudState = { pickupCollected: false, showPrompt: false };
  private overlay!: Phaser.GameObjects.Graphics;
  private maskGraphic!: Phaser.GameObjects.Graphics;
  private ambientStarted = false;

  constructor(opts: SceneOptions = {}) {
    super('MainScene');
    this.opts = opts;
  }

  preload() {
    this.load.scenePlugin({
      key: 'PhaserArcadePhysics',
      url: Phaser.Physics.Arcade,
      sceneKey: 'physics',
    });
  }

  create() {
    this.cameras.main.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x050505).setOrigin(0);

    this.createPlayer();
    this.createWalls();
    this.createPickup();
    this.createFlashlightMask();

    this.keys = this.input.keyboard.addKeys({
      up: 'W',
      down: 'S',
      left: 'A',
      right: 'D',
      E: 'E',
    }) as typeof this.keys;

    this.input.keyboard.on('keydown', () => this.startAmbient());
    this.input.on('pointerdown', () => this.startAmbient());

    this.scale.on('resize', (gameSize) => {
      const { width, height } = gameSize;
      this.cameras.main.setSize(width, height);
      this.overlay.setSize(width, height);
    });

    this.updateHud();
  }

  private createPlayer() {
    this.player = this.physics.add
      .sprite(GAME_WIDTH / 2 - 150, GAME_HEIGHT / 2 + 60, '')
      .setSize(24, 28)
      .setDisplaySize(24, 28)
      .setOrigin(0.5)
      .setTint(0xf5f5f5);
    this.player.body.setCollideWorldBounds(true);
  }

  private createWalls() {
    this.walls = this.physics.add.staticGroup();
    WALLS.forEach((wall) => {
      const rect = this.add.rectangle(wall.x, wall.y, wall.width, wall.height, 0x111111).setOrigin(0.5);
      this.physics.add.existing(rect, true);
      this.walls.add(rect);
    });
    this.physics.add.collider(this.player, this.walls);
  }

  private createPickup() {
    this.pickup = this.add.rectangle(GAME_WIDTH / 2 + 120, GAME_HEIGHT / 2 + 40, 18, 18, 0x9cff4a);
    this.pickup.setStrokeStyle(1, 0x1a1a1a, 0.9);

    this.promptText = this.add
      .text(this.pickup.x, this.pickup.y - 26, 'Press E', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#d4ffd2',
        backgroundColor: '#0c0c0c',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5)
      .setVisible(false);
  }

  private createFlashlightMask() {
    this.overlay = this.add.graphics();
    this.maskGraphic = this.add.graphics();
    this.overlay.setDepth(10);
    const mask = this.maskGraphic.createGeometryMask();
    mask.invertAlpha = true;
    this.overlay.setMask(mask);
  }

  private startAmbient() {
    if (this.ambientStarted) return;
    this.ambientStarted = true;
    const ctx = this.sound.context;
    if (!ctx) return;
    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * 0.15;
    }
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 520;
    const gain = ctx.createGain();
    gain.gain.value = 0.08;
    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.loop = true;
    noise.start();

    const tone = ctx.createOscillator();
    tone.type = 'sawtooth';
    tone.frequency.value = 64;
    const toneGain = ctx.createGain();
    toneGain.gain.value = 0.012;
    tone.connect(toneGain).connect(ctx.destination);
    tone.start();

    this.events.on('shutdown', () => {
      noise.stop();
      tone.stop();
    });
  }

  update(time: number, delta: number) {
    this.handleMovement(delta);
    this.handlePickup();
    this.updateFlashlight();
    this.promptText.setPosition(this.pickup.x, this.pickup.y - 22 + Math.sin(time / 250) * 2);
  }

  private handleMovement(delta: number) {
    const vx = Number(this.keys.right.isDown) - Number(this.keys.left.isDown);
    const vy = Number(this.keys.down.isDown) - Number(this.keys.up.isDown);
    const len = Math.hypot(vx, vy) || 1;
    this.player.body.setVelocity((vx / len) * PLAYER_SPEED, (vy / len) * PLAYER_SPEED);
    if (!vx && !vy) {
      this.player.body.setVelocity(0);
    }
  }

  private handlePickup() {
    if (this.hudState.pickupCollected) return;
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.pickup.x, this.pickup.y);
    const near = dist < 36;
    this.hudState.showPrompt = near;
    this.promptText.setVisible(near);
    if (near && this.keys.E.isDown) {
      this.hudState.pickupCollected = true;
      this.pickup.setFillStyle(0x3a3a3a);
      this.promptText.setVisible(false);
    }
    this.updateHud();
  }

  private updateHud() {
    this.opts.onHudUpdate?.({ ...this.hudState });
  }

  private updateFlashlight() {
    const lightRadius = FLASHLIGHT_RADIUS;
    this.overlay.clear();
    this.overlay.fillStyle(0x000000, 0.9);
    this.overlay.fillRect(0, 0, this.scale.width, this.scale.height);

    this.maskGraphic.clear();
    const gradientSteps = 3;
    for (let i = 0; i < gradientSteps; i += 1) {
      const radius = lightRadius - i * 18;
      const alpha = 1 - i * 0.25;
      this.maskGraphic.fillStyle(0xffffff, alpha);
      this.maskGraphic.fillCircle(this.player.x, this.player.y, radius);
    }
  }
}
