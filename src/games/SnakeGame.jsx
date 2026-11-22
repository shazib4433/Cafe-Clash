import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Crown,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  GAMES,
  getLeaderboard,
  submitScore,
  incrementSessionPlays,
  canPlayMore,
} from '../services/storage';
import { sound } from '../services/sound';
import GameOverModal from '../components/GameOverModal';

const GRID_SIZE = 16;

const DIRS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

function randomFreeCell(snake, exclude = []) {
  const occupied = new Set([
    ...snake.map((s) => `${s.x},${s.y}`),
    ...exclude.map((e) => `${e.x},${e.y}`),
  ]);
  const free = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!occupied.has(`${x},${y}`)) {
        free.push({ x, y });
      }
    }
  }
  if (free.length === 0) return null;
  return free[Math.floor(Math.random() * free.length)];
}

export default function SnakeGame({
  muted,
  onToggleMute,
  onExit,
  onOpenLeaderboard,
  onOpenVoucher,
}) {
  const canvasRef = useRef(null);
  const swipeStartRef = useRef(null);

  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState('ready'); // ready | playing | gameover
  const [submitResult, setSubmitResult] = useState(null);
  const [topTarget, setTopTarget] = useState(() => getLeaderboard('snake')[0]?.score || 0);
  const [playAllowed, setPlayAllowed] = useState(() => canPlayMore().allowed);

  const gameRef = useRef({
    phase: 'ready',
    score: 0,
    beansEaten: 0,
    snake: [
      { x: 7, y: 8 },
      { x: 6, y: 8 },
      { x: 5, y: 8 },
    ],
    dir: DIRS.RIGHT,
    dirQueue: [],
    food: { x: 11, y: 8 },
    bonus: null, // { x, y, expiresAt }
    submitted: false,
  });

  const resetRound = useCallback(() => {
    const startSnake = [
      { x: 7, y: 8 },
      { x: 6, y: 8 },
      { x: 5, y: 8 },
    ];
    gameRef.current = {
      phase: 'ready',
      score: 0,
      beansEaten: 0,
      snake: startSnake,
      dir: DIRS.RIGHT,
      dirQueue: [],
      food: randomFreeCell(startSnake) || { x: 11, y: 8 },
      bonus: null,
      submitted: false,
    };
    setScore(0);
    setPhase('ready');
    setSubmitResult(null);
    setTopTarget(getLeaderboard('snake')[0]?.score || 0);
    setPlayAllowed(canPlayMore().allowed);
  }, []);

  const triggerGameOver = useCallback(() => {
    const g = gameRef.current;
    if (g.submitted) return;
    g.phase = 'gameover';
    g.submitted = true;
    setPhase('gameover');
    const res = submitScore('snake', g.score);
    if (res.isNewRecord) {
      sound.play('win');
    } else {
      sound.play('gameover');
    }
    setSubmitResult(res);
    setTopTarget(getLeaderboard('snake')[0]?.score || 0);
    setPlayAllowed(canPlayMore().allowed);
  }, []);

  const queueDirection = useCallback((nextDir) => {
    const g = gameRef.current;
    if (g.phase === 'gameover') return;

    if (g.phase === 'ready') {
      if (!canPlayMore().allowed) {
        setPlayAllowed(false);
        return;
      }
      incrementSessionPlays();
      g.phase = 'playing';
      setPhase('playing');
    }

    const lastPlanned = g.dirQueue.length > 0 ? g.dirQueue[g.dirQueue.length - 1] : g.dir;
    const isOpposite = lastPlanned.x + nextDir.x === 0 && lastPlanned.y + nextDir.y === 0;
    const isSame = lastPlanned.x === nextDir.x && lastPlanned.y === nextDir.y;

    if (!isOpposite && !isSame && g.dirQueue.length < 2) {
      g.dirQueue.push(nextDir);
      sound.play('click');
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        queueDirection(DIRS.UP);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        queueDirection(DIRS.DOWN);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        queueDirection(DIRS.LEFT);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        queueDirection(DIRS.RIGHT);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [queueDirection]);

  // Game tick + Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const sizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(240, Math.floor(rect.width * dpr));
      canvas.height = Math.max(240, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    sizeCanvas();
    const ro = new ResizeObserver(sizeCanvas);
    ro.observe(canvas);

    let lastStep = 0;
    let rafId = 0;

    const stepGame = (now) => {
      const g = gameRef.current;
      if (g.phase !== 'playing') return;

      if (g.dirQueue.length > 0) {
        g.dir = g.dirQueue.shift();
      }

      const head = g.snake[0];
      const next = { x: head.x + g.dir.x, y: head.y + g.dir.y };

      // Wall collision
      if (next.x < 0 || next.x >= GRID_SIZE || next.y < 0 || next.y >= GRID_SIZE) {
        triggerGameOver();
        return;
      }

      const willEatFood = next.x === g.food.x && next.y === g.food.y;
      const willEatBonus = g.bonus && next.x === g.bonus.x && next.y === g.bonus.y;

      // Self collision (ignore tail tip if not growing)
      const bodyToCheck = willEatFood || willEatBonus ? g.snake : g.snake.slice(0, -1);
      if (bodyToCheck.some((seg) => seg.x === next.x && seg.y === next.y)) {
        triggerGameOver();
        return;
      }

      g.snake.unshift(next);

      if (willEatFood) {
        g.score += 10;
        g.beansEaten += 1;
        setScore(g.score);
        sound.play('eat');
        g.food = randomFreeCell(g.snake, g.bonus ? [g.bonus] : []) || g.food;

        if (g.beansEaten % 4 === 0 && !g.bonus) {
          const bonusSpot = randomFreeCell(g.snake, [g.food]);
          if (bonusSpot) {
            g.bonus = { ...bonusSpot, expiresAt: now + 8000 };
          }
        }
      } else if (willEatBonus) {
        g.score += 25;
        setScore(g.score);
        sound.play('bonus');
        g.bonus = null;
      } else {
        g.snake.pop();
      }

      if (g.bonus && now > g.bonus.expiresAt) {
        g.bonus = null;
      }
    };

    const draw = (now) => {
      const g = gameRef.current;
      const stepInterval = Math.max(95, 148 - Math.floor(g.score / 30) * 6);
      if (g.phase === 'playing' && now - lastStep >= stepInterval) {
        lastStep = now;
        stepGame(now);
      }

      const rect = canvas.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height);
      const cell = size / GRID_SIZE;

      // Subtle checkerboard latte floor
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          ctx.fillStyle = (x + y) % 2 === 0 ? '#FAF0E6' : '#F3E4D4';
          ctx.fillRect(x * cell, y * cell, cell + 0.5, cell + 0.5);
        }
      }

      // Draw Coffee Bean Food
      const fx = g.food.x * cell + cell / 2;
      const fy = g.food.y * cell + cell / 2;
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(-0.35);
      ctx.fillStyle = '#4E342E';
      ctx.beginPath();
      ctx.ellipse(0, 0, cell * 0.36, cell * 0.27, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#D7CCC8';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-cell * 0.22, 0);
      ctx.quadraticCurveTo(0, cell * 0.08, cell * 0.22, 0);
      ctx.stroke();
      ctx.restore();

      // Draw Bonus Croissant Pastry if active
      if (g.bonus) {
        const bx = g.bonus.x * cell + cell / 2;
        const by = g.bonus.y * cell + cell / 2;
        const pulse = 1 + Math.sin(now / 130) * 0.1;
        ctx.save();
        ctx.translate(bx, by);
        ctx.scale(pulse, pulse);
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(0, 0, cell * 0.36, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = `${Math.floor(cell * 0.55)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🥐', 0, 1);
        ctx.restore();
      }

      // Draw Snake
      for (let i = g.snake.length - 1; i >= 0; i--) {
        const seg = g.snake[i];
        const isHead = i === 0;
        const pad = isHead ? 1 : 2;
        const x = seg.x * cell + pad;
        const y = seg.y * cell + pad;
        const s = cell - pad * 2;

        ctx.fillStyle = isHead ? '#2C1A12' : i % 2 === 0 ? '#5D4037' : '#6D4C41';
        ctx.beginPath();
        ctx.roundRect(x, y, s, s, isHead ? 6 : 5);
        ctx.fill();

        if (isHead) {
          ctx.fillStyle = '#FDE68A';
          const cx = seg.x * cell + cell / 2;
          const cy = seg.y * cell + cell / 2;
          const eyeOffsetX = g.dir.x !== 0 ? g.dir.x * cell * 0.16 : cell * 0.18;
          const eyeOffsetY = g.dir.y !== 0 ? g.dir.y * cell * 0.16 : cell * 0.18;
          if (g.dir.x !== 0) {
            ctx.beginPath();
            ctx.arc(cx + eyeOffsetX, cy - cell * 0.17, 2.2, 0, Math.PI * 2);
            ctx.arc(cx + eyeOffsetX, cy + cell * 0.17, 2.2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(cx - cell * 0.17, cy + eyeOffsetY, 2.2, 0, Math.PI * 2);
            ctx.arc(cx + cell * 0.17, cy + eyeOffsetY, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [triggerGameOver]);

  const handlePointerDown = (e) => {
    swipeStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e) => {
    if (!swipeStartRef.current) return;
    const dx = e.clientX - swipeStartRef.current.x;
    const dy = e.clientY - swipeStartRef.current.y;
    swipeStartRef.current = null;
    if (Math.hypot(dx, dy) < 20) {
      if (phase === 'ready') queueDirection(DIRS.RIGHT);
      return;
    }
    if (Math.abs(dx) > Math.abs(dy)) {
      queueDirection(dx > 0 ? DIRS.RIGHT : DIRS.LEFT);
    } else {
      queueDirection(dy > 0 ? DIRS.DOWN : DIRS.UP);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#2C1A12] text-white overflow-hidden game-surface">
      {/* HUD */}
      <header className="shrink-0 flex items-center justify-between px-3 py-2.5 bg-[#2C1A12] border-b border-white/10">
        <button
          type="button"
          onClick={() => {
            sound.play('click');
            onExit();
          }}
          className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-2.5 py-1.5 text-xs font-bold text-white active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            {GAMES.snake.name}
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono-code text-xl font-bold leading-none">
              {score}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-200">
              <Crown className="w-3 h-3 text-amber-400" />
              #1: {topTarget}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? 'Unmute sound' : 'Mute sound'}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-amber-200 active:scale-95"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </header>

      {/* Canvas Board Area */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-3 py-2">
        <div
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className="relative w-full max-w-[356px] aspect-square max-h-full rounded-2xl overflow-hidden border-4 border-[#5D4037] shadow-xl game-surface"
        >
          <canvas ref={canvasRef} className="w-full h-full block game-surface" />

          {phase === 'ready' && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25 p-4 text-center">
              <div className="rounded-2xl bg-[#2C1A12]/90 px-4 py-3 border border-emerald-400/40 shadow-lg">
                <div className="text-2xl mb-1">🐍☕</div>
                <div className="font-display text-base font-bold text-emerald-300">
                  Swipe or Tap D-Pad to Start
                </div>
                <div className="text-[11px] text-white/85 mt-0.5">
                  Beans +10 • Croissants +25 • Win {GAMES.snake.prize}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Thumb-friendly On-Screen D-Pad */}
      <div className="shrink-0 bg-[#1B0F0A]/90 border-t border-white/10 px-4 pt-2 pb-3">
        <div className="mx-auto grid grid-cols-3 gap-2 max-w-[228px]">
          <div />
          <button
            type="button"
            aria-label="Move Up"
            onPointerDown={(e) => {
              e.preventDefault();
              queueDirection(DIRS.UP);
            }}
            className="flex h-12 items-center justify-center rounded-2xl bg-[#3E2723] border border-amber-400/25 text-amber-200 shadow-sm active:bg-amber-500 active:text-[#2C1A12]"
          >
            <ChevronUp className="w-7 h-7" />
          </button>
          <div />

          <button
            type="button"
            aria-label="Move Left"
            onPointerDown={(e) => {
              e.preventDefault();
              queueDirection(DIRS.LEFT);
            }}
            className="flex h-12 items-center justify-center rounded-2xl bg-[#3E2723] border border-amber-400/25 text-amber-200 shadow-sm active:bg-amber-500 active:text-[#2C1A12]"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
          <button
            type="button"
            aria-label="Move Down"
            onPointerDown={(e) => {
              e.preventDefault();
              queueDirection(DIRS.DOWN);
            }}
            className="flex h-12 items-center justify-center rounded-2xl bg-[#3E2723] border border-amber-400/25 text-amber-200 shadow-sm active:bg-amber-500 active:text-[#2C1A12]"
          >
            <ChevronDown className="w-7 h-7" />
          </button>
          <button
            type="button"
            aria-label="Move Right"
            onPointerDown={(e) => {
              e.preventDefault();
              queueDirection(DIRS.RIGHT);
            }}
            className="flex h-12 items-center justify-center rounded-2xl bg-[#3E2723] border border-amber-400/25 text-amber-200 shadow-sm active:bg-amber-500 active:text-[#2C1A12]"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        </div>
      </div>

      {phase === 'gameover' && submitResult && (
        <GameOverModal
          gameId="snake"
          score={score}
          result={submitResult}
          canPlayAgain={playAllowed}
          onPlayAgain={() => {
            sound.play('click');
            resetRound();
          }}
          onOpenLeaderboard={() => onOpenLeaderboard('snake')}
          onOpenVoucher={onOpenVoucher}
          onExit={onExit}
        />
      )}
    </div>
  );
}
