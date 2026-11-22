import React from 'react';
import { Crown, RotateCcw, Trophy, Home, Sparkles } from 'lucide-react';
import { GAMES } from '../services/storage';

export default function GameOverModal({
  gameId,
  score,
  result,
  canPlayAgain = true,
  onPlayAgain,
  onOpenLeaderboard,
  onOpenVoucher,
  onExit,
  subtitle,
}) {
  const game = GAMES[gameId];
  if (!result) return null;

  const { isNewRecord, rank, voucher, prevTop } = result;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-[360px] rounded-3xl bg-[#FDF8F2] text-[#2C1A12] shadow-2xl border border-[#E8D5C4] overflow-hidden">
        <div
          className={`px-5 py-4 text-center text-white ${
            isNewRecord
              ? 'bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700'
              : 'bg-gradient-to-br from-[#2C1A12] to-[#4E342E]'
          }`}
        >
          <div className="text-3xl mb-1">{isNewRecord ? '👑' : game.emoji}</div>
          <h3 className="font-display text-2xl font-bold">
            {isNewRecord ? 'New #1 High Score!' : 'Round Complete!'}
          </h3>
          <p className="text-xs text-white/85 mt-0.5">
            {subtitle || game.name}
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Score Card */}
          <div className="grid grid-cols-2 gap-2.5 text-center">
            <div className="rounded-2xl bg-[#F5EBE0] p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#7A5B4B]">
                Your Score
              </div>
              <div className="font-mono-code text-2xl font-bold text-[#2C1A12] mt-0.5">
                {score}
              </div>
            </div>
            <div className="rounded-2xl bg-[#F5EBE0] p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#7A5B4B]">
                {score > 0 ? 'Live Rank' : 'Target #1'}
              </div>
              <div className="font-mono-code text-2xl font-bold text-amber-700 mt-0.5">
                {score > 0 ? `#${rank}` : prevTop}
              </div>
            </div>
          </div>

          {isNewRecord && voucher ? (
            <button
              type="button"
              onClick={() => onOpenVoucher(voucher)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 py-3 px-4 font-display text-sm font-bold text-white shadow-md animate-badge-pulse active:scale-[0.98]"
            >
              <Crown className="w-4 h-4" />
              <span>Claim Free {game.prize} Voucher</span>
              <Sparkles className="w-4 h-4" />
            </button>
          ) : (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-center text-xs text-amber-900">
              {score > 0
                ? `Score submitted to live leaderboard! Beat ${Math.max(prevTop, score)} to win a free ${game.prize}.`
                : `Score at least 1 point to post to the leaderboard and chase ${prevTop}!`}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {canPlayAgain ? (
              <button
                type="button"
                onClick={onPlayAgain}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#2C1A12] py-3 font-display text-sm font-bold text-white shadow-sm active:scale-[0.98]"
              >
                <RotateCcw className="w-4 h-4" />
                Play Again
              </button>
            ) : (
              <div className="rounded-xl bg-rose-50 border border-rose-200 py-2 px-3 text-center text-xs font-semibold text-rose-800">
                Session play limit reached
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onOpenLeaderboard}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E8D5C4] bg-white py-2.5 text-xs font-bold text-[#2C1A12] active:scale-[0.98]"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-600" />
                Leaderboard
              </button>
              <button
                type="button"
                onClick={onExit}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E8D5C4] bg-white py-2.5 text-xs font-bold text-[#5D4037] active:scale-[0.98]"
              >
                <Home className="w-3.5 h-3.5" />
                Arcade Hub
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
