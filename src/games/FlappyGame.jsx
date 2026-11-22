import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, Volume2, VolumeX, Crown } from 'lucide-react';
import {
  GAMES,
  getLeaderboard,
  submitScore,
  incrementSessionPlays,
  canPlayMore,
} from '../services/storage';
import { sound } from '../services/sound';
import GameOverModal from '../components/GameOverModal';

export default function FlappyGame({
  muted,
  onToggleMute,
  onExit,
  onOpenLeaderboard,
  onOpenVoucher,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState('ready'); // ready | playing | gameover
  const [submitResult, setSubmitResult] = useState(null);
  const [topTarget, setTopTarget] = useState(() => getLeaderboard('flappy')[0]?.score || 0);
  const [playAllowed, setPlayAllowed] = useState(() => canPlayMore().allowed);

  const stateRef = useRef({
    phase: 'ready',
    score: 0,
    width: 360,
    height: 580,
    birdY: 260,
    birdVy: 0,
    birdX: 96,
    pipes: [],
    particles: [],
    groundOffset: 0,
    spawnTimer: 0,
    lastTime: 0,
    submitted: false,
  });

  const resetRound = useCallback(() => {
    const s = stateRef.current;
    s.phase = 'ready';
    s.score = 0;
    s.birdY = s.height * 0.44;
    s.birdVy = 0;
    s.pipes = [];
    s.particles = [];
    s.spawnTimer = 0.4;
    s.submitted = false;
    setScore(0);
    setPhase('ready');
    setSubmitResult(null);
    setTopTarget(getLeaderboard('flappy')[0]?.score || 0);
    setPlayAllowed(canPlayMore().allowed);
  }, []);

  const triggerGameOver = useCallback(() => {
    const s = stateRef.current;
    if (s.submitted) return;
    s.phase = 'gameover';
    s.submitted = true;
    setPhase('gameover');
    const res = submitScore('flappy', s.score);
    if (res.isNewRecord) {
      sound.play('win');
    } else {
      sound.play('gameover');
    }
    setSubmitResult(res);
    setTopTarget(getLeaderboard('flappy')[0]?.score || 0);
    setPlayAllowed(canPlayMore().allowed);
  }, []);

  const flap = useCallback(() => {
    const s = stateRef.current;
    if (s.phase === 'gameover') return;
    if (s.phase === 'ready') {
      if (!canPlayMore().allowed) {
        setPlayAllowed(false);
        return;
      }
      incrementSessionPlays();
      s.phase = 'playing';
      setPhase('playing');
    }
    s.birdVy = -395;
    sound.play('flap');

    // Steam puff particles
    for (let i = 0; i < 4; i++) {
      s.particles.push({
        x: s.birdX - 10 + (Math.random() - 0.5) * 8,
        y: s.birdY + 6 + (Math.random() - 0.5) * 8,
        vx: -40 - Math.random() * 45,
        vy: 15 + Math.random() * 35,
        r: 3 + Math.random() * 3,
        life: 0.45,
        maxLife: 0.45,
      });
    }
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [flap]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext('2d');

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(280, Math.floor(rect.width * dpr));
      canvas.height = Math.max(360, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stateRef.current.width = rect.width;
      stateRef.current.height = rect.height;
      stateRef.current.birdX = Math.max(76, rect.width * 0.27);
      if (stateRef.current.phase === 'ready') {
        stateRef.current.birdY = rect.height * 0.44;
      }
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);

    let rafId = 0;
    const PIPE_WIDTH = 58;
    const PIPE_GAP = 162;
    const FLOOR_HEIGHT = 64;
    const BIRD_RADIUS = 16;

    const drawRoundRect = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.fill();
    };

    const loop = (now) => {
      const s = stateRef.current;
      if (!s.lastTime) s.lastTime = now;
      const dt = Math.min(0.035, (now - s.lastTime) / 1000);
      s.lastTime = now;

      const W = s.width;
      const H = s.height;
      const playableH = H - FLOOR_HEIGHT;

      // Update physics
      if (s.phase === 'ready') {
        s.birdY = playableH * 0.46 + Math.sin(now / 260) * 8;
        s.groundOffset = (s.groundOffset + 100 * dt) % 40;
      } else if (s.phase === 'playing') {
        s.groundOffset = (s.groundOffset + 155 * dt) % 40;
        s.birdVy += 1160 * dt;
        s.birdY += s.birdVy * dt;

        // Spawn pipes
        s.spawnTimer -= dt;
        if (s.spawnTimer <= 0) {
          s.spawnTimer = 1.65;
          const minTop = 58;
          const maxTop = Math.max(minTop + 40, playableH - PIPE_GAP - 58);
          const topHeight = minTop + Math.random() * (maxTop - minTop);
          s.pipes.push({
            x: W + 20,
            topHeight,
            passed: false,
          });
        }

        // Move pipes and check collisions
        for (let i = s.pipes.length - 1; i >= 0; i--) {
          const p = s.pipes[i];
          p.x -= 155 * dt;

          if (!p.passed && p.x + PIPE_WIDTH < s.birdX) {
            p.passed = true;
            s.score += 1;
            setScore(s.score);
            sound.play('point');
          }

          // Collision check
          const withinX =
            s.birdX + BIRD_RADIUS - 3 > p.x && s.birdX - BIRD_RADIUS + 3 < p.x + PIPE_WIDTH;
          if (withinX) {
            if (
              s.birdY - BIRD_RADIUS + 3 < p.topHeight ||
              s.birdY + BIRD_RADIUS - 3 > p.topHeight + PIPE_GAP
            ) {
              triggerGameOver();
            }
          }

          if (p.x + PIPE_WIDTH < -30) {
            s.pipes.splice(i, 1);
          }
        }

        // Ceiling / floor check
        if (s.birdY - BIRD_RADIUS < 0) {
          s.birdY = BIRD_RADIUS;
          s.birdVy = 0;
        }
        if (s.birdY + BIRD_RADIUS >= playableH) {
          s.birdY = playableH - BIRD_RADIUS;
          triggerGameOver();
        }
      }

      // Update steam particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const pt = s.particles[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.life -= dt;
        if (pt.life <= 0) s.particles.splice(i, 1);
      }

      // Draw warm cafe wall gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, playableH);
      bgGrad.addColorStop(0, '#FFF4E6');
      bgGrad.addColorStop(0.6, '#F7E5D2');
      bgGrad.addColorStop(1, '#EAD0B8');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, playableH);

      // Subtle cafe arch stripes in background
      ctx.fillStyle = 'rgba(139, 90, 43, 0.06)';
      for (let x = 24; x < W; x += 90) {
        ctx.beginPath();
        ctx.arc(x, playableH * 0.25, 22, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw espresso pipes
      for (const p of s.pipes) {
        // Metallic bronze/espresso gradient
        const pipeGrad = ctx.createLinearGradient(p.x, 0, p.x + PIPE_WIDTH, 0);
        pipeGrad.addColorStop(0, '#4E342E');
        pipeGrad.addColorStop(0.35, '#8D6E63');
        pipeGrad.addColorStop(0.7, '#5D4037');
        pipeGrad.addColorStop(1, '#3E2723');

        // Top pipe
        ctx.fillStyle = pipeGrad;
        drawRoundRect(p.x, -4, PIPE_WIDTH, p.topHeight + 4, 6);
        // Portafilter cap on top pipe
        ctx.fillStyle = '#D97706';
        drawRoundRect(p.x - 5, p.topHeight - 20, PIPE_WIDTH + 10, 20, 6);
        ctx.fillStyle = '#FDE68A';
        ctx.fillRect(p.x + 2, p.topHeight - 16, 6, 12);

        // Bottom pipe
        const bottomY = p.topHeight + PIPE_GAP;
        ctx.fillStyle = pipeGrad;
        drawRoundRect(p.x, bottomY, PIPE_WIDTH, playableH - bottomY + 4, 6);
        // Portafilter cap on bottom pipe
        ctx.fillStyle = '#D97706';
        drawRoundRect(p.x - 5, bottomY, PIPE_WIDTH + 10, 20, 6);
        ctx.fillStyle = '#FDE68A';
        ctx.fillRect(p.x + 2, bottomY + 4, 6, 12);
      }

      // Draw steam particles
      for (const pt of s.particles) {
        const alpha = Math.max(0, pt.life / pt.maxLife) * 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw flying coffee cup character
      ctx.save();
      ctx.translate(s.birdX, s.birdY);
      const tilt = Math.max(-0.5, Math.min(0.85, s.birdVy / 520));
      ctx.rotate(tilt);

      // Wing
      ctx.fillStyle = '#FDE68A';
      ctx.beginPath();
      ctx.ellipse(-6, 3, 10, 6, -0.3 + Math.sin(now / 70) * 0.25, 0, Math.PI * 2);
      ctx.fill();

      // Cup body
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#3E2723';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(-15, -12, 28, 24, [4, 4, 12, 12]);
      ctx.fill();
      ctx.stroke();

      // Handle
      ctx.beginPath();
      ctx.arc(-16, 0, 5.5, Math.PI * 0.5, Math.PI * 1.5);
      ctx.stroke();

      // Espresso crema top
      ctx.fillStyle = '#6D4C41';
      ctx.beginPath();
      ctx.ellipse(-1, -11, 13, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cute eyes
      ctx.fillStyle = '#2C1A12';
      ctx.beginPath();
      ctx.arc(5, -2, 2.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(10, 1, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Wooden cafe counter floor
      ctx.fillStyle = '#3E2723';
      ctx.fillRect(0, playableH, W, FLOOR_HEIGHT);
      ctx.fillStyle = '#D97706';
      ctx.fillRect(0, playableH, W, 6);

      // Scrolling chevron pattern on counter edge
      ctx.fillStyle = '#5D4037';
      for (let x = -40 + (40 - s.groundOffset); x < W + 40; x += 40) {
        ctx.fillRect(x, playableH + 14, 20, 8);
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [triggerGameOver]);

  return (
    <div className="flex flex-col h-full bg-[#2C1A12] text-white overflow-hidden game-surface">
      {/* Compact Game HUD */}
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
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
            {GAMES.flappy.name}
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

      {/* Canvas Arena */}
      <div
        ref={containerRef}
        onPointerDown={(e) => {
          e.preventDefault();
          flap();
        }}
        className="relative flex-1 w-full overflow-hidden cursor-pointer game-surface"
      >
        <canvas ref={canvasRef} className="block w-full h-full game-surface" />

        {/* Ready Overlay */}
        {phase === 'ready' && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <div className="rounded-3xl bg-[#2C1A12]/85 backdrop-blur-xs px-5 py-4 border border-amber-400/40 shadow-xl">
              <div className="text-3xl mb-1">☕</div>
              <h2 className="font-display text-xl font-bold text-amber-200">
                Tap Anywhere to Flap!
              </h2>
              <p className="text-xs text-white/85 mt-1">
                Beat score <span className="font-mono-code font-bold text-amber-300">{topTarget}</span> to win a free{' '}
                {GAMES.flappy.prize} {GAMES.flappy.prizeEmoji}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Game Over / Score Submission Modal */}
      {phase === 'gameover' && submitResult && (
        <GameOverModal
          gameId="flappy"
          score={score}
          result={submitResult}
          canPlayAgain={playAllowed}
          onPlayAgain={() => {
            sound.play('click');
            resetRound();
          }}
          onOpenLeaderboard={() => onOpenLeaderboard('flappy')}
          onOpenVoucher={onOpenVoucher}
          onExit={onExit}
        />
      )}
    </div>
  );
}
