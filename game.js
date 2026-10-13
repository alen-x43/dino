/**
 * CHROMA DINO RUNNER
 * Pure Vanilla JavaScript Game Engine
 * High-DPI Canvas, Synthesized Web Audio, Particle FX & Multi-Theme Support
 */

(function () {
  'use strict';

  /* ==========================================================================
     AUDIO SYNTHESIZER (Web Audio API - Zero External Assets)
     ========================================================================== */
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.isMuted = localStorage.getItem('chroma_dino_muted') === 'true';
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      localStorage.setItem('chroma_dino_muted', this.isMuted);
      return this.isMuted;
    }

    playJump() {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    }

    playDuck() {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    }

    playMilestone() {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Tone 1
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.12);

      // Tone 2
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12); // A5
      gain2.gain.setValueAtTime(0.25, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.32);
    }

    playDeath() {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Low crunch osc
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.3);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.32);
    }

    playClick() {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(700, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    }
  }

  /* ==========================================================================
     PARTICLE SYSTEM
     ========================================================================== */
  class Particle {
    constructor(x, y, vx, vy, size, color, life, gravity = 0.2) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.size = size;
      this.color = color;
      this.life = life;
      this.maxLife = life;
      this.gravity = gravity;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += this.gravity;
      this.life--;
    }

    draw(ctx) {
      const alpha = Math.max(0, this.life / this.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.size, this.size);
      ctx.restore();
    }
  }

  /* ==========================================================================
     DINO PLAYER
     ========================================================================== */
  class Dino {
    constructor(game) {
      this.game = game;
      this.groundY = 285;
      this.x = 70;
      this.y = this.groundY;
      this.vy = 0;
      this.gravity = 0.72;
      this.jumpForce = -13.6;

      // Normal Stand Dimensions
      this.standWidth = 44;
      this.standHeight = 48;

      // Duck Dimensions
      this.duckWidth = 56;
      this.duckHeight = 28;

      this.width = this.standWidth;
      this.height = this.standHeight;

      // State Flags
      this.isGrounded = true;
      this.isDucking = false;
      this.isJumping = false;
      this.jumpHoldFrames = 0;
      this.maxJumpHold = 8;

      // Animation
      this.legFrame = 0;
      this.animTimer = 0;
      this.blinkTimer = 0;
      this.isBlinking = false;
    }

    reset() {
      this.y = this.groundY;
      this.vy = 0;
      this.isGrounded = true;
      this.isDucking = false;
      this.isJumping = false;
      this.width = this.standWidth;
      this.height = this.standHeight;
      this.legFrame = 0;
      this.animTimer = 0;
      this.jumpHoldFrames = 0;
    }

    jump() {
      if (this.isGrounded && !this.isDucking) {
        this.vy = this.jumpForce;
        this.isGrounded = false;
        this.isJumping = true;
        this.jumpHoldFrames = 0;
        this.game.sound.playJump();
        this.game.stats.jumps++;

        // Spawn jump dust puff
        this.game.spawnDust(this.x + 10, this.groundY + this.standHeight, 5);
      }
    }

    startDuck() {
      if (!this.isDucking) {
        this.isDucking = true;
        if (!this.isGrounded) {
          // Fast Fall mechanic!
          this.vy = Math.max(this.vy, 8.5);
        } else {
          this.game.sound.playDuck();
        }
      }
    }

    stopDuck() {
      this.isDucking = false;
    }

    update() {
      // Variable jump height when space is held
      if (this.isJumping && this.game.keys.jump && this.jumpHoldFrames < this.maxJumpHold) {
        this.vy -= 0.38; // Prolong initial ascent
        this.jumpHoldFrames++;
      } else {
        this.isJumping = false;
      }

      // Fast fall when pressing down
      if (this.game.keys.duck && !this.isGrounded) {
        this.vy += 0.85;
      }

      // Physics integration
      this.vy += this.gravity;
      this.y += this.vy;

      // Adjust dimensions depending on ducking
      if (this.isDucking && this.isGrounded) {
        this.width = this.duckWidth;
        this.height = this.duckHeight;
      } else {
        this.width = this.standWidth;
        this.height = this.standHeight;
      }

      // Ground collision
      const currentTargetY = this.groundY + (this.standHeight - this.height);
      if (this.y >= currentTargetY) {
        if (!this.isGrounded) {
          // Landing puff
          this.game.spawnDust(this.x + 15, currentTargetY + this.height, 6);
        }
        this.y = currentTargetY;
        this.vy = 0;
        this.isGrounded = true;
      } else {
        this.isGrounded = false;
      }

      // Footstep running dust puffs
      if (this.isGrounded && !this.isDucking && this.game.isPlaying) {
        if (Math.random() < 0.2) {
          this.game.spawnDust(this.x + 2, this.groundY + this.standHeight, 1);
        }
      }

      // Running animation cycle
      this.animTimer += this.game.speed * 0.08;
      if (this.animTimer >= 1) {
        this.animTimer = 0;
        this.legFrame = (this.legFrame + 1) % 2;
      }

      // Blinking animation
      this.blinkTimer++;
      if (this.blinkTimer > 180 && Math.random() < 0.05) {
        this.isBlinking = true;
        if (this.blinkTimer > 195) {
          this.isBlinking = false;
          this.blinkTimer = 0;
        }
      }
    }

    getHitbox() {
      // Generous, fair bounding box with 4px inner padding
      const padX = 6;
      const padY = 4;
      return {
        x: this.x + padX,
        y: this.y + padY,
        width: this.width - padX * 2,
        height: this.height - padY * 2
      };
    }

    draw(ctx, color) {
      ctx.save();
      ctx.fillStyle = color;

      const px = Math.round(this.x);
      const py = Math.round(this.y);

      if (this.game.isGameOver) {
        this.drawDead(ctx, px, py);
      } else if (this.isDucking && this.isGrounded) {
        this.drawDuck(ctx, px, py);
      } else {
        this.drawStand(ctx, px, py);
      }

      ctx.restore();
    }

    drawStand(ctx, x, y) {
      // Head & Snout
      ctx.fillRect(x + 22, y, 16, 12);
      ctx.fillRect(x + 36, y + 2, 8, 10);
      ctx.fillRect(x + 24, y + 12, 18, 4);

      // Eye
      if (!this.isBlinking) {
        ctx.fillStyle = this.game.themeColors.canvasBg;
        ctx.fillRect(x + 26, y + 3, 3, 3);
        ctx.fillStyle = this.game.themeColors.dino;
      }

      // Neck & Chest
      ctx.fillRect(x + 18, y + 10, 8, 14);

      // Main Torso / Body
      ctx.fillRect(x + 10, y + 18, 20, 18);
      ctx.fillRect(x + 6, y + 22, 6, 12);

      // Tail
      ctx.fillRect(x, y + 22, 6, 6);
      ctx.fillRect(x + 2, y + 20, 6, 4);

      // Tiny Arms
      ctx.fillRect(x + 28, y + 22, 6, 3);
      ctx.fillRect(x + 32, y + 25, 2, 4);

      // Legs / Feet
      if (!this.isGrounded) {
        // Jumping legs tucked
        ctx.fillRect(x + 12, y + 36, 4, 8);
        ctx.fillRect(x + 16, y + 42, 4, 2);
        ctx.fillRect(x + 20, y + 36, 4, 6);
      } else if (this.legFrame === 0) {
        // Left foot forward
        ctx.fillRect(x + 12, y + 36, 4, 8);
        ctx.fillRect(x + 12, y + 44, 6, 4);

        // Right foot backward
        ctx.fillRect(x + 22, y + 36, 4, 6);
        ctx.fillRect(x + 24, y + 40, 4, 4);
      } else {
        // Left foot backward
        ctx.fillRect(x + 12, y + 36, 4, 6);
        ctx.fillRect(x + 14, y + 40, 4, 4);

        // Right foot forward
        ctx.fillRect(x + 22, y + 36, 4, 8);
        ctx.fillRect(x + 22, y + 44, 6, 4);
      }
    }

    drawDuck(ctx, x, y) {
      // Elongated body
      ctx.fillRect(x + 8, y + 8, 32, 14);
      // Head extended low
      ctx.fillRect(x + 40, y + 6, 14, 10);
      ctx.fillRect(x + 48, y + 10, 8, 8);

      // Eye
      ctx.fillStyle = this.game.themeColors.canvasBg;
      ctx.fillRect(x + 44, y + 8, 3, 3);
      ctx.fillStyle = this.game.themeColors.dino;

      // Tail
      ctx.fillRect(x, y + 12, 8, 6);

      // Low Arms
      ctx.fillRect(x + 36, y + 16, 6, 3);

      // Ducking Legs
      if (this.legFrame === 0) {
        ctx.fillRect(x + 16, y + 22, 4, 6);
        ctx.fillRect(x + 16, y + 26, 6, 2);
        ctx.fillRect(x + 28, y + 22, 4, 4);
      } else {
        ctx.fillRect(x + 16, y + 22, 4, 4);
        ctx.fillRect(x + 28, y + 22, 4, 6);
        ctx.fillRect(x + 28, y + 26, 6, 2);
      }
    }

    drawDead(ctx, x, y) {
      this.drawStand(ctx, x, y);
      // Replace Eye with X
      ctx.fillStyle = this.game.themeColors.obstacle;
      ctx.fillRect(x + 25, y + 2, 2, 2);
      ctx.fillRect(x + 29, y + 2, 2, 2);
      ctx.fillRect(x + 27, y + 4, 2, 2);
      ctx.fillRect(x + 25, y + 6, 2, 2);
      ctx.fillRect(x + 29, y + 6, 2, 2);
    }
  }

  /* ==========================================================================
     OBSTACLES: CACTI & PTERODACTYLS
     ========================================================================== */
  class Obstacle {
    constructor(game, type, x) {
      this.game = game;
      this.type = type; // 'cactus_small', 'cactus_tall', 'cactus_double', 'pterodactyl'
      this.x = x;
      this.markedForRemoval = false;

      // Configure dimensions and heights
      if (this.type === 'cactus_small') {
        this.width = 20;
        this.height = 42;
        this.y = 285 + (48 - this.height);
      } else if (this.type === 'cactus_tall') {
        this.width = 24;
        this.height = 56;
        this.y = 285 + (48 - this.height);
      } else if (this.type === 'cactus_double') {
        this.width = 38;
        this.height = 46;
        this.y = 285 + (48 - this.height);
      } else if (this.type === 'pterodactyl') {
        this.width = 46;
        this.height = 32;
        // 3 heights: low (must jump), mid (must duck!), high (safe overhead)
        const heights = [
          285 + 48 - 40,   // Low (jump)
          285 + 48 - 66,   // Mid (duck!)
          285 + 48 - 98    // High (safe)
        ];
        this.y = heights[Math.floor(Math.random() * heights.length)];
        this.wingFrame = 0;
        this.wingTimer = 0;
      }
    }

    update() {
      this.x -= this.game.speed;

      if (this.type === 'pterodactyl') {
        // Wing flap cycle
        this.wingTimer += 0.14;
        if (this.wingTimer >= 1) {
          this.wingTimer = 0;
          this.wingFrame = (this.wingFrame + 1) % 2;
        }
      }

      if (this.x + this.width < -50) {
        this.markedForRemoval = true;
      }
    }

    getHitbox() {
      // Fair padding so near-misses don't feel cheap
      const pad = 4;
      return {
        x: this.x + pad,
        y: this.y + pad,
        width: this.width - pad * 2,
        height: this.height - pad * 2
      };
    }

    draw(ctx, color) {
      ctx.save();
      ctx.fillStyle = color;
      const x = Math.round(this.x);
      const y = Math.round(this.y);

      if (this.type === 'cactus_small') {
        this.drawCactusSingle(ctx, x, y, this.width, this.height);
      } else if (this.type === 'cactus_tall') {
        this.drawCactusSingle(ctx, x, y, this.width, this.height);
      } else if (this.type === 'cactus_double') {
        this.drawCactusSingle(ctx, x, y, 18, this.height);
        this.drawCactusSingle(ctx, x + 18, y + 6, 18, this.height - 6);
      } else if (this.type === 'pterodactyl') {
        this.drawPterodactyl(ctx, x, y);
      }

      ctx.restore();
    }

    drawCactusSingle(ctx, x, y, w, h) {
      // Stem
      const stemW = 8;
      const stemX = x + Math.floor((w - stemW) / 2);
      ctx.fillRect(stemX, y, stemW, h);

      // Left branch
      ctx.fillRect(x, y + 12, 6, 12);
      ctx.fillRect(x, y + 20, stemX - x, 6);

      // Right branch
      const rightX = stemX + stemW;
      ctx.fillRect(x + w - 6, y + 8, 6, 14);
      ctx.fillRect(rightX, y + 16, x + w - rightX, 6);
    }

    drawPterodactyl(ctx, x, y) {
      // Body & Beak
      ctx.fillRect(x + 12, y + 12, 22, 8);
      ctx.fillRect(x, y + 10, 14, 5); // Long beak
      ctx.fillRect(x + 32, y + 10, 6, 5); // Tail

      // Eye
      ctx.fillStyle = this.game.themeColors.canvasBg;
      ctx.fillRect(x + 8, y + 11, 2, 2);
      ctx.fillStyle = this.game.themeColors.obstacle;

      // Wings
      if (this.wingFrame === 0) {
        // Wings Up
        ctx.fillRect(x + 16, y, 10, 12);
        ctx.fillRect(x + 20, y - 4, 6, 6);
      } else {
        // Wings Down
        ctx.fillRect(x + 16, y + 18, 10, 12);
        ctx.fillRect(x + 20, y + 26, 6, 6);
      }
    }
  }

  /* ==========================================================================
     ENVIRONMENT: GROUND, CLOUDS, STARS, CELESTIAL BODY
     ========================================================================== */
  class Environment {
    constructor(game) {
      this.game = game;
      this.groundX = 0;
      this.groundY = 285 + 46;

      // Clouds
      this.clouds = [
        { x: 120, y: 50, speed: 0.6, width: 64, height: 18 },
        { x: 420, y: 80, speed: 0.45, width: 80, height: 22 },
        { x: 780, y: 40, speed: 0.55, width: 70, height: 20 }
      ];

      // Starfield for neon / night themes
      this.stars = [];
      for (let i = 0; i < 35; i++) {
        this.stars.push({
          x: Math.random() * 960,
          y: Math.random() * 200,
          size: Math.random() > 0.8 ? 2 : 1,
          alpha: 0.2 + Math.random() * 0.7,
          blinkSpeed: 0.02 + Math.random() * 0.04
        });
      }

      // Ground bumps/pebbles
      this.pebbles = [];
      for (let i = 0; i < 40; i++) {
        this.pebbles.push({
          x: Math.random() * 960,
          y: this.groundY + 4 + Math.random() * 12,
          length: 3 + Math.floor(Math.random() * 6)
        });
      }
    }

    update() {
      // Parallax Clouds
      this.clouds.forEach(c => {
        c.x -= c.speed * (this.game.isPlaying ? 1 : 0.4);
        if (c.x + c.width < -50) {
          c.x = 960 + Math.random() * 120;
          c.y = 35 + Math.random() * 70;
        }
      });

      // Ground scroll
      if (this.game.isPlaying) {
        this.groundX = (this.groundX - this.game.speed) % 32;

        this.pebbles.forEach(p => {
          p.x -= this.game.speed;
          if (p.x < -20) {
            p.x = 960 + Math.random() * 40;
          }
        });
      }

      // Stars twinkle
      this.stars.forEach(s => {
        s.alpha += Math.sin(Date.now() * s.blinkSpeed) * 0.015;
        if (s.alpha < 0.15) s.alpha = 0.15;
        if (s.alpha > 0.95) s.alpha = 0.95;
      });
    }

    draw(ctx, groundColor, cloudColor) {
      // Draw Stars (only on dark themes)
      if (this.game.currentTheme !== 'classic') {
        ctx.save();
        this.stars.forEach(s => {
          ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
          ctx.fillRect(s.x, s.y, s.size, s.size);
        });
        ctx.restore();
      }

      // Parallax Moon / Sun
      this.drawCelestialBody(ctx);

      // Clouds
      ctx.save();
      ctx.fillStyle = cloudColor;
      this.clouds.forEach(c => {
        this.drawCloud(ctx, Math.round(c.x), Math.round(c.y), c.width, c.height);
      });
      ctx.restore();

      // Ground Baseline
      ctx.save();
      ctx.strokeStyle = groundColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, this.groundY);
      ctx.lineTo(960, this.groundY);
      ctx.stroke();

      // Dashes & pebbles
      ctx.fillStyle = groundColor;
      this.pebbles.forEach(p => {
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.length, 2);
      });
      ctx.restore();
    }

    drawCloud(ctx, x, y, w, h) {
      ctx.beginPath();
      ctx.arc(x + 16, y + h - 10, 10, 0, Math.PI * 2);
      ctx.arc(x + 32, y + 8, 14, 0, Math.PI * 2);
      ctx.arc(x + 48, y + h - 10, 12, 0, Math.PI * 2);
      ctx.rect(x + 16, y + h - 8, 36, 8);
      ctx.fill();
    }

    drawCelestialBody(ctx) {
      const cx = 820;
      const cy = 60;
      const radius = 24;

      ctx.save();
      if (this.game.currentTheme === 'classic') {
        // Minimal subtle sun ring
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Glowing Neon Moon
        const glow = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 2.2);
        glow.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
        glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  /* ==========================================================================
     CORE GAME MANAGER
     ========================================================================== */
  class ChromaDinoGame {
    constructor() {
      // Elements
      this.canvas = document.getElementById('dino-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.body = document.body;

      // Overlays
      this.startOverlay = document.getElementById('start-overlay');
      this.pauseOverlay = document.getElementById('pause-overlay');
      this.gameoverOverlay = document.getElementById('gameover-overlay');
      this.startBtn = document.getElementById('start-trigger-btn');
      this.resumeBtn = document.getElementById('resume-btn');
      this.restartBtn = document.getElementById('restart-btn');

      // Buttons & Inputs
      this.soundBtn = document.getElementById('sound-btn');
      this.soundIconOn = document.getElementById('sound-icon-on');
      this.soundIconOff = document.getElementById('sound-icon-off');
      this.pauseBtn = document.getElementById('pause-btn');
      this.pauseIcon = document.getElementById('pause-icon');
      this.playIcon = document.getElementById('play-icon');
      this.themeSelect = document.getElementById('theme-select');

      // Touch Buttons
      this.touchJumpBtn = document.getElementById('touch-jump-btn');
      this.touchDuckBtn = document.getElementById('touch-duck-btn');

      // HUD Stats
      this.scoreEl = document.getElementById('current-score');
      this.highScoreEl = document.getElementById('high-score');
      this.speedMeterEl = document.getElementById('speed-meter');
      this.finalScoreEl = document.getElementById('final-score');
      this.finalBestEl = document.getElementById('final-best');
      this.finalJumpsEl = document.getElementById('final-jumps');
      this.finalTimeEl = document.getElementById('final-time');
      this.newRecordAlert = document.getElementById('new-record-alert');

      // Audio Engine
      this.sound = new SoundEngine();

      // State
      this.isPlaying = false;
      this.isPaused = false;
      this.isGameOver = false;

      // Physics & Progression
      this.baseSpeed = 7.0;
      this.speed = this.baseSpeed;
      this.maxSpeed = 16.5;
      this.score = 0;
      this.highScore = parseInt(localStorage.getItem('chroma_dino_high_score') || '0', 10);
      this.lastMilestone = 0;

      // Time & Run Stats
      this.startTime = 0;
      this.elapsedSeconds = 0;
      this.stats = { jumps: 0, ducks: 0 };

      // Screen Shake
      this.shakeIntensity = 0;

      // Keys Tracking
      this.keys = { jump: false, duck: false };

      // Entities
      this.dino = new Dino(this);
      this.env = new Environment(this);
      this.obstacles = [];
      this.particles = [];
      this.obstacleTimer = 0;
      this.minObstacleGap = 90;

      // Resolution & Theme
      this.currentTheme = this.themeSelect.value || 'cyberpunk';
      this.themeColors = {};

      this.init();
    }

    init() {
      this.setupCanvasDPI();
      this.updateThemeColors();
      this.updateSoundIcon();
      this.updateHUD();

      // Event Listeners
      window.addEventListener('resize', () => this.setupCanvasDPI());
      this.bindInputs();

      // Start RAF render loop
      requestAnimationFrame(this.loop.bind(this));
    }

    setupCanvasDPI() {
      // 960x340 virtual coordinate space
      const virtualW = 960;
      const virtualH = 340;
      const dpr = window.devicePixelRatio || 1;

      this.canvas.width = virtualW * dpr;
      this.canvas.height = virtualH * dpr;

      this.ctx.resetTransform?.();
      this.ctx.scale(dpr, dpr);
    }

    updateThemeColors() {
      const styles = getComputedStyle(this.body);
      this.themeColors = {
        canvasBg: styles.getPropertyValue('--canvas-bg').trim() || '#090417',
        dino: styles.getPropertyValue('--dino-color').trim() || '#00f0ff',
        obstacle: styles.getPropertyValue('--obstacle-color').trim() || '#ff007f',
        ground: styles.getPropertyValue('--ground-color').trim() || '#2b1754',
        cloud: styles.getPropertyValue('--cloud-color').trim() || 'rgba(255, 255, 255, 0.15)',
        accent: styles.getPropertyValue('--primary-accent').trim() || '#00f0ff'
      };
    }

    bindInputs() {
      // Theme change
      this.themeSelect.addEventListener('change', e => {
        this.currentTheme = e.target.value;
        this.body.setAttribute('data-theme', this.currentTheme);
        this.updateThemeColors();
        this.sound.playClick();
      });

      // Sound mute toggle
      this.soundBtn.addEventListener('click', () => {
        this.sound.toggleMute();
        this.updateSoundIcon();
      });

      // Pause toggle
      this.pauseBtn.addEventListener('click', () => {
        this.togglePause();
      });

      // CTA Buttons
      this.startBtn.addEventListener('click', () => this.startGame());
      this.resumeBtn.addEventListener('click', () => this.togglePause());
      this.restartBtn.addEventListener('click', () => this.restartGame());

      // Keyboard Listeners
      window.addEventListener('keydown', e => {
        // Prevent default browser scrolling on Space / Arrow keys
        if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
          e.preventDefault();
        }

        if (e.code === 'Space' || e.code === 'ArrowUp') {
          if (!this.isPlaying && !this.isGameOver) {
            this.startGame();
            return;
          }
          if (this.isGameOver) {
            this.restartGame();
            return;
          }
          if (this.isPaused) {
            this.togglePause();
            return;
          }
          this.keys.jump = true;
          this.dino.jump();
        }

        if (e.code === 'ArrowDown') {
          if (this.isPlaying && !this.isPaused) {
            this.keys.duck = true;
            this.dino.startDuck();
          }
        }

        if (e.code === 'KeyP') {
          this.togglePause();
        }

        if (e.code === 'KeyM') {
          this.sound.toggleMute();
          this.updateSoundIcon();
        }

        if (e.code === 'KeyR' && this.isGameOver) {
          this.restartGame();
        }
      });

      window.addEventListener('keyup', e => {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
          this.keys.jump = false;
        }
        if (e.code === 'ArrowDown') {
          this.keys.duck = false;
          this.dino.stopDuck();
        }
      });

      // Canvas Click & Touch
      this.canvas.addEventListener('pointerdown', e => {
        if (!this.isPlaying && !this.isGameOver) {
          this.startGame();
          return;
        }
        if (this.isGameOver) {
          this.restartGame();
          return;
        }
        if (this.isPlaying && !this.isPaused) {
          this.dino.jump();
        }
      });

      // Touch Buttons
      this.touchJumpBtn.addEventListener('touchstart', e => {
        e.preventDefault();
        if (!this.isPlaying && !this.isGameOver) {
          this.startGame();
        } else if (this.isGameOver) {
          this.restartGame();
        } else {
          this.keys.jump = true;
          this.dino.jump();
        }
      });
      this.touchJumpBtn.addEventListener('touchend', e => {
        e.preventDefault();
        this.keys.jump = false;
      });

      this.touchDuckBtn.addEventListener('touchstart', e => {
        e.preventDefault();
        this.keys.duck = true;
        this.dino.startDuck();
      });
      this.touchDuckBtn.addEventListener('touchend', e => {
        e.preventDefault();
        this.keys.duck = false;
        this.dino.stopDuck();
      });
    }

    updateSoundIcon() {
      if (this.sound.isMuted) {
        this.soundIconOn.classList.add('hidden');
        this.soundIconOff.classList.remove('hidden');
      } else {
        this.soundIconOn.classList.remove('hidden');
        this.soundIconOff.classList.add('hidden');
      }
    }

    startGame() {
      this.sound.playClick();
      this.startOverlay.classList.remove('active');
      this.gameoverOverlay.classList.remove('active');
      this.pauseOverlay.classList.remove('active');
      this.resetGameState();
      this.isPlaying = true;
      this.dino.jump();
    }

    restartGame() {
      this.sound.playClick();
      this.gameoverOverlay.classList.remove('active');
      this.resetGameState();
      this.isPlaying = true;
      this.dino.jump();
    }

    togglePause() {
      if (!this.isPlaying || this.isGameOver) return;
      this.isPaused = !this.isPaused;
      this.sound.playClick();

      if (this.isPaused) {
        this.pauseOverlay.classList.add('active');
        this.pauseIcon.classList.add('hidden');
        this.playIcon.classList.remove('hidden');
      } else {
        this.pauseOverlay.classList.remove('active');
        this.pauseIcon.classList.remove('hidden');
        this.playIcon.classList.add('hidden');
      }
    }

    resetGameState() {
      this.isPlaying = false;
      this.isPaused = false;
      this.isGameOver = false;
      this.speed = this.baseSpeed;
      this.score = 0;
      this.lastMilestone = 0;
      this.obstacles = [];
      this.particles = [];
      this.obstacleTimer = 70; // buffer before first obstacle
      this.dino.reset();
      this.stats = { jumps: 0, ducks: 0 };
      this.startTime = Date.now();
      this.elapsedSeconds = 0;
      this.shakeIntensity = 0;
      this.updateHUD();
    }

    triggerGameOver() {
      this.isPlaying = false;
      this.isGameOver = true;
      this.sound.playDeath();

      // Screen Shake
      this.shakeIntensity = 14;

      // Spawn crash debris explosion
      for (let i = 0; i < 28; i++) {
        const angle = Math.random() * Math.PI * 2;
        const vel = 2 + Math.random() * 6;
        this.particles.push(
          new Particle(
            this.dino.x + 20,
            this.dino.y + 20,
            Math.cos(angle) * vel,
            Math.sin(angle) * vel,
            3 + Math.random() * 3,
            Math.random() > 0.5 ? this.themeColors.dino : this.themeColors.obstacle,
            35 + Math.random() * 20,
            0.25
          )
        );
      }

      // Check High Score
      const isNewRecord = this.score > this.highScore;
      if (isNewRecord) {
        this.highScore = this.score;
        localStorage.setItem('chroma_dino_high_score', this.highScore);
      }

      // Populate results modal
      this.finalScoreEl.textContent = this.formatScore(this.score);
      this.finalBestEl.textContent = this.formatScore(this.highScore);
      this.finalJumpsEl.textContent = this.stats.jumps;
      const mins = Math.floor(this.elapsedSeconds / 60);
      const secs = this.elapsedSeconds % 60;
      this.finalTimeEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      if (isNewRecord && this.score > 50) {
        this.newRecordAlert.classList.remove('hidden');
      } else {
        this.newRecordAlert.classList.add('hidden');
      }

      // Show GameOver Overlay after short delay
      setTimeout(() => {
        this.gameoverOverlay.classList.add('active');
      }, 350);
    }

    spawnObstacle() {
      // Types allowed based on score
      const types = ['cactus_small', 'cactus_tall', 'cactus_double'];
      if (this.score >= 120) {
        types.push('pterodactyl');
      }

      const randomType = types[Math.floor(Math.random() * types.length)];
      this.obstacles.push(new Obstacle(this, randomType, 980));

      // Calculate next randomized spawn gap based on speed
      const speedFactor = this.speed / this.baseSpeed;
      const baseGap = 55 / speedFactor;
      this.obstacleTimer = baseGap + Math.random() * (45 / speedFactor);
    }

    spawnDust(x, y, count = 3) {
      for (let i = 0; i < count; i++) {
        this.particles.push(
          new Particle(
            x,
            y,
            -1.5 - Math.random() * 2.5,
            -0.5 - Math.random() * 1.5,
            2 + Math.random() * 2,
            this.themeColors.accent,
            18 + Math.random() * 10,
            0.05
          )
        );
      }
    }

    spawnMilestoneCelebration() {
      // Golden confetti burst from top
      for (let i = 0; i < 35; i++) {
        this.particles.push(
          new Particle(
            Math.random() * 960,
            0,
            (Math.random() - 0.5) * 4,
            1 + Math.random() * 4,
            3 + Math.random() * 3,
            Math.random() > 0.5 ? '#ffd700' : this.themeColors.accent,
            60 + Math.random() * 30,
            0.08
          )
        );
      }
    }

    checkCollision(box1, box2) {
      return (
        box1.x < box2.x + box2.width &&
        box1.x + box1.width > box2.x &&
        box1.y < box2.y + box2.height &&
        box1.y + box1.height > box2.y
      );
    }

    formatScore(num) {
      return String(Math.floor(num)).padStart(5, '0');
    }

    updateHUD() {
      this.scoreEl.textContent = this.formatScore(this.score);
      this.highScoreEl.textContent = this.formatScore(this.highScore);
      const speedMultiplier = (this.speed / this.baseSpeed).toFixed(1);
      this.speedMeterEl.textContent = `${speedMultiplier}x`;
    }

    /* Main Engine Loop */
    loop() {
      if (this.isPlaying && !this.isPaused) {
        this.update();
      }

      this.render();

      requestAnimationFrame(this.loop.bind(this));
    }

    update() {
      // Elapsed survival time
      this.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);

      // Score tick & Speed ramp
      this.score += 0.15;
      if (this.speed < this.maxSpeed) {
        this.speed += 0.0016;
      }

      // Milestone celebration (every 100 score points)
      const currentMilestone = Math.floor(this.score / 100);
      if (currentMilestone > this.lastMilestone) {
        this.lastMilestone = currentMilestone;
        this.sound.playMilestone();
        this.spawnMilestoneCelebration();

        // Flash score text
        this.scoreEl.style.color = '#ffd700';
        setTimeout(() => {
          this.scoreEl.style.color = '';
        }, 500);
      }

      this.updateHUD();

      // Update Player & Environment
      this.dino.update();
      this.env.update();

      // Obstacle Spawning
      this.obstacleTimer--;
      if (this.obstacleTimer <= 0) {
        this.spawnObstacle();
      }

      // Update & check collisions with obstacles
      const dinoBox = this.dino.getHitbox();
      for (let i = 0; i < this.obstacles.length; i++) {
        const obs = this.obstacles[i];
        obs.update();

        if (this.checkCollision(dinoBox, obs.getHitbox())) {
          this.triggerGameOver();
          break;
        }
      }

      // Clean up off-screen obstacles
      this.obstacles = this.obstacles.filter(o => !o.markedForRemoval);

      // Update particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.update();
        if (p.life <= 0) {
          this.particles.splice(i, 1);
        }
      }
    }

    render() {
      const ctx = this.ctx;

      // Handle screen shake on crash
      ctx.save();
      if (this.shakeIntensity > 0) {
        const sx = (Math.random() - 0.5) * this.shakeIntensity;
        const sy = (Math.random() - 0.5) * this.shakeIntensity;
        ctx.translate(sx, sy);
        this.shakeIntensity *= 0.88;
        if (this.shakeIntensity < 0.2) this.shakeIntensity = 0;
      }

      // Clear Canvas
      ctx.fillStyle = this.themeColors.canvasBg;
      ctx.fillRect(0, 0, 960, 340);

      // Draw Environment
      this.env.draw(ctx, this.themeColors.ground, this.themeColors.cloud);

      // Draw Obstacles
      this.obstacles.forEach(obs => obs.draw(ctx, this.themeColors.obstacle));

      // Draw Particles
      this.particles.forEach(p => p.draw(ctx));

      // Draw Dino
      this.dino.draw(ctx, this.themeColors.dino);

      ctx.restore();
    }
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => new ChromaDinoGame());
  } else {
    new ChromaDinoGame();
  }
})();
