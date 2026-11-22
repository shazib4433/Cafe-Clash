import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Crown,
  RotateCcw,
  Check,
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

const TILE_THEMES = {
  2: { emoji: '🫘', label: 'Bean', bg: 'bg-[#FFF8EE]', text: 'text-[#5D4037]' },
  4: { emoji: '☕', label: 'Espresso', bg: 'bg-[#F5E1C8]', text: 'text-[#3E2723]' },
  8: { emoji: '🥛', label: 'Macchiato', bg: 'bg-[#FCD34D]', text: 'text-[#451A03]' },
  16: { emoji: '🧋', label: 'Cappuc.', bg: 'bg-[#F59E0B]', text: 'text-white' },
  32: { emoji: '🍮', label: 'Latte', bg: 'bg-[#EA580C]', text: 'text-white' },
  64: { emoji: '🥐', label: 'Croissant', bg: 'bg-[#DC2626]', text: 'text-white' },
  128: { emoji: '🧁', label: 'Muffin', bg: 'bg-[#DB2777]', text: 'text-white' },
  256: { emoji: '🍫', label: 'Brownie', bg: 'bg-[#7C3AED]', text: 'text-white' },
  512: { emoji: '🧇', label: 'Waffle', bg: 'bg-[#059669]', text: 'text-white' },
  1024: { emoji: '🍰', label: 'Cake', bg: 'bg-[#2563EB]', text: 'text-white' },
  2048: { emoji: '🏆', label: 'Trophy', bg: 'bg-gradient-to-br from-amber-300 to-yellow-500', text: 'text-[#2C1A12]' },
};

function createEmptyGrid() {
  return Array.from({ length: 4 }, () => [0, 0, 0, 0]);
}

function addRandomTile(grid) {
  const empty = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return grid;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const next = grid.map((row) => [...row]);
  next[r][c] = Math.random() < 0.85 ? 2 : 4;
  return next;
}

function createInitialGrid() {
  return addRandomTile(addRandomTile(createEmptyGrid()));
}

function slideRowLeft(row) {
  const nonZero = row.filter((v) => v !== 0);
  const result = [];
  let gained = 0;
  let merged = false;

  for (let i = 0; i < nonZero.length; i++) {
    if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
      const val = nonZero[i] * 2;
      result.push(val);
      gained += val;
      merged = true;
      i += 1;
    } else {
      result.push(nonZero[i]);
    }
  }
  while (result.length < 4) result.push(0);
  return { row: result, gained, merged };
}

function rotateCW(grid) {
  const next = createEmptyGrid();
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      next[c][3 - r] = grid[r][c];
    }
  }
  return next;
}

function moveGrid(grid, direction) {
  // Rotate so desired direction becomes LEFT
  let rotations = 0;
  if (direction === 'UP') rotations = 3;
  else if (direction === 'RIGHT') rotations = 2;
  else if (direction === 'DOWN') rotations = 1;

  let working = grid.map((r) => [...r]);
  for (let i = 0; i < rotations; i++) working = rotateCW(working);

  let totalGained = 0;
  let anyMerged = false;
  const slid = working.map((row) => {
    const res = slideRowLeft(row);
    totalGained += res.gained;
    if (res.merged) anyMerged = true;
    return res.row;
  });

  // Rotate back
  let restored = slid;
  for (let i = 0; i < (4 - rotations) % 4; i++) restored = rotateCW(restored);

  let changed = false;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (restored[r][c] !== grid[r][c]) {
        changed = true;
        break;
      }
    }
  }

  return { grid: restored, gained: totalGained, changed, merged: anyMerged };
}

function hasMovesLeft(grid) {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const val = grid[r][c];
      if (val === 0) return true;
      if (r < 3 && grid[r + 1][c] === val) return true;
      if (c < 3 && grid[r][c + 1] === val) return true;
    }
  }
  return false;
}

export default function PuzzleGame({
  muted,
  onToggleMute,
  onExit,
  onOpenLeaderboard,
  onOpenVoucher,
}) {
  const [grid, setGrid] = useState(() => createInitialGrid());
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [started, setStarted] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [topTarget, setTopTarget] = useState(() => getLeaderboard('puzzle')[0]?.score || 0);
  const [playAllowed, setPlayAllowed] = useState(() => canPlayMore().allowed);

  const swipeRef = useRef(null);

  const finishAndSubmit = useCallback(
    (finalScore) => {
      if (submitResult) return;
      const res = submitScore('puzzle', finalScore);
      if (res.isNewRecord) {
        sound.play('win');
      } else {
        sound.play('gameover');
      }
      setSubmitResult(res);
      setTopTarget(getLeaderboard('puzzle')[0]?.score || 0);
      setPlayAllowed(canPlayMore().allowed);
    },
    [submitResult]
  );

  const resetRound = useCallback(() => {
    setGrid(createInitialGrid());
    setScore(0);
    setMoves(0);
    setStarted(false);
    setSubmitResult(null);
    setTopTarget(getLeaderboard('puzzle')[0]?.score || 0);
    setPlayAllowed(canPlayMore().allowed);
  }, []);

  const handleMove = useCallback(
    (direction) => {
      if (submitResult) return;
      if (!started && !canPlayMore().allowed) {
        setPlayAllowed(false);
        return;
      }

      const moved = moveGrid(grid, direction);
      if (!moved.changed) return;

      if (!started) {
        incrementSessionPlays();
        setStarted(true);
      }

      const nextGrid = addRandomTile(moved.grid);
      const nextScore = score + moved.gained;
      setGrid(nextGrid);
      setScore(nextScore);
      setMoves((m) => m + 1);

      if (moved.merged) {
        sound.play('merge');
      } else {
        sound.play('click');
      }

      const hit2048 = nextGrid.some((row) => row.some((v) => v >= 2048));
      if (hit2048 || !hasMovesLeft(nextGrid)) {
        finishAndSubmit(nextScore);
      }
    },
    [grid, score, started, submitResult, finishAndSubmit]
  );

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w') {
        e.preventDefault();
        handleMove('UP');
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        e.preventDefault();
        handleMove('DOWN');
      } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        e.preventDefault();
        handleMove('LEFT');
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        e.preventDefault();
        handleMove('RIGHT');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleMove]);

  const onPointerDown = (e) => {
    swipeRef.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e) => {
    if (!swipeRef.current) return;
    const dx = e.clientX - swipeRef.current.x;
    const dy = e.clientY - swipeRef.current.y;
    swipeRef.current = null;
    if (Math.hypot(dx, dy) < 22) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      handleMove(dx > 0 ? 'RIGHT' : 'LEFT');
    } else {
      handleMove(dy > 0 ? 'DOWN' : 'UP');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FDF8F2] text-[#2C1A12] overflow-hidden game-surface">
      {/* HUD */}
      <header className="shrink-0 flex items-center justify-between px-3 py-2.5 bg-[#2C1A12] text-white shadow-sm">
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
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-300">
            {GAMES.puzzle.name}
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

      {/* Sub-bar with Progression & Submit */}
      <div className="shrink-0 px-4 pt-2.5 pb-1 flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold text-[#6D4C41]">
          Moves: <span className="font-mono-code font-bold text-[#2C1A12]">{moves}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              sound.play('click');
              resetRound();
            }}
            className="inline-flex items-center gap-1 rounded-xl border border-[#E8D5C4] bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#5D4037] active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restart
          </button>
          <button
            type="button"
            disabled={score === 0}
            onClick={() => finishAndSubmit(score)}
            className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-bold text-white active:scale-95 ${
              score > 0 ? 'bg-amber-600 shadow-xs' : 'bg-[#C7B299] cursor-not-allowed'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            Submit Score
          </button>
        </div>
      </div>

      {/* Swipeable 4x4 Tile Board */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-4 py-2">
        <div
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          className="w-full max-w-[348px] aspect-square max-h-full rounded-3xl bg-[#5D4037] p-2.5 shadow-xl grid grid-cols-4 grid-rows-4 gap-2 game-surface"
        >
          {grid.map((row, rIdx) =>
            row.map((val, cIdx) => {
              const theme = TILE_THEMES[val] || {
                emoji: '🏆',
                label: String(val),
                bg: 'bg-amber-400',
                text: 'text-[#2C1A12]',
              };

              if (val === 0) {
                return (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    className="rounded-2xl bg-[#3E2723]/60"
                  />
                );
              }

              return (
                <div
                  key={`${rIdx}-${cIdx}-${val}`}
                  className={`animate-tile-pop rounded-2xl ${theme.bg} ${theme.text} flex flex-col items-center justify-center shadow-sm border border-black/5 select-none`}
                >
                  <span className="text-xl leading-none">{theme.emoji}</span>
                  <span className="font-mono-code text-xs font-extrabold leading-tight mt-0.5">
                    {val}
                  </span>
                  <span className="text-[9px] font-bold opacity-85 leading-none">
                    {theme.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Evolution Strip & Compact Controls */}
      <div className="shrink-0 px-4 pb-3 pt-1 space-y-2">
        <div className="rounded-xl bg-[#F5EBE0] px-2.5 py-1.5 text-center text-[10px] font-semibold text-[#5D4037]">
          Swipe board to merge: 🫘 → ☕ → 🥛 → 🧋 → 🍮 → 🥐 → 🍰 → 🏆
        </div>

        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            aria-label="Slide Left"
            onClick={() => handleMove('LEFT')}
            className="flex h-10 w-14 items-center justify-center rounded-xl bg-[#2C1A12] text-amber-200 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="Slide Up"
            onClick={() => handleMove('UP')}
            className="flex h-10 w-14 items-center justify-center rounded-xl bg-[#2C1A12] text-amber-200 active:scale-95"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="Slide Down"
            onClick={() => handleMove('DOWN')}
            className="flex h-10 w-14 items-center justify-center rounded-xl bg-[#2C1A12] text-amber-200 active:scale-95"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="Slide Right"
            onClick={() => handleMove('RIGHT')}
            className="flex h-10 w-14 items-center justify-center rounded-xl bg-[#2C1A12] text-amber-200 active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {submitResult && (
        <GameOverModal
          gameId="puzzle"
          score={score}
          result={submitResult}
          canPlayAgain={playAllowed}
          onPlayAgain={() => {
            sound.play('click');
            resetRound();
          }}
          onOpenLeaderboard={() => onOpenLeaderboard('puzzle')}
          onOpenVoucher={onOpenVoucher}
          onExit={onExit}
        />
      )}
    </div>
  );
}
