import React from 'react';
import {
  Crown,
  Play,
  Volume2,
  VolumeX,
  LogOut,
  Trophy,
  Gamepad2,
  Ticket,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  GAMES,
  GAME_ORDER,
  getAllLeaderboards,
  getVouchers,
  canPlayMore,
} from '../services/storage';
import { sound } from '../services/sound';

export default function GameHub({
  session,
  muted,
  onToggleMute,
  onPlayGame,
  onOpenLeaderboard,
  onOpenVoucher,
  onEndSession,
  onOpenAdmin,
}) {
  const boards = getAllLeaderboards();
  const playStatus = canPlayMore();
  const sessionVouchers = getVouchers().filter(
    (v) => v.orderId === session.orderId
  );
  const latestVoucher = sessionVouchers[0] || null;

  return (
    <div className="flex flex-col h-full bg-[#FDF8F2] text-[#2C1A12] overflow-hidden">
      {/* Sticky Customer Header */}
      <header className="shrink-0 bg-[#2C1A12] text-white px-4 py-3 shadow-md">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-base font-bold truncate">
                {session.playerName}
              </span>
              <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold text-[#2C1A12]">
                Table #{session.table}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-amber-100/80 mt-0.5">
              <span className="font-mono-code">{session.orderId}</span>
              <span>•</span>
              <span>
                {playStatus.limit > 0
                  ? `${playStatus.remaining}/${playStatus.limit} plays left`
                  : 'Unlimited Plays'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? 'Unmute sound' : 'Mute sound'}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-amber-200 active:scale-95"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                sound.play('click');
                onEndSession();
              }}
              aria-label="End table session"
              title="Switch Order / End Session"
              className="flex h-9 items-center gap-1 rounded-xl bg-white/10 px-2.5 text-[11px] font-semibold text-white/90 active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </header>

      {/* Scrollable Hub Body */}
      <main className="flex-1 overflow-y-auto scroll-area px-4 py-3.5 space-y-3.5">
        {/* Active Voucher Pill if player holds #1 */}
        {latestVoucher && (
          <button
            type="button"
            onClick={() => {
              sound.play('click');
              onOpenVoucher(latestVoucher);
            }}
            className="w-full flex items-center justify-between rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 px-4 py-2.5 text-[#2C1A12] shadow-sm border border-amber-500 active:scale-[0.99]"
          >
            <div className="flex items-center gap-2 text-left">
              <Ticket className="w-5 h-5 text-amber-900 shrink-0" />
              <div>
                <div className="text-xs font-extrabold">
                  Free {latestVoucher.prize} Voucher Unlocked!
                </div>
                <div className="font-mono-code text-[10px] font-semibold text-amber-950/80">
                  Code: {latestVoucher.code} • Tap to show waiter
                </div>
              </div>
            </div>
            <span className="rounded-lg bg-[#2C1A12] px-2 py-1 text-[10px] font-bold text-amber-200">
              View
            </span>
          </button>
        )}

        {/* Today's Dessert Rewards Banner */}
        <section className="rounded-2xl bg-gradient-to-r from-[#3E2723] to-[#5D4037] p-3.5 text-white shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Today&apos;s #1 Free Dessert Prizes
            </h2>
            <span className="text-[10px] text-amber-100/75">Top rank wins!</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {GAME_ORDER.map((id) => {
              const g = GAMES[id];
              return (
                <div
                  key={id}
                  className="rounded-xl bg-black/25 border border-white/10 p-2 text-center"
                >
                  <div className="text-xl leading-none">{g.prizeEmoji}</div>
                  <div className="mt-1 text-[11px] font-bold text-white leading-tight">
                    {g.prize}
                  </div>
                  <div className="mt-0.5 text-[10px] text-amber-200/85 truncate">
                    {g.name}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Game Cards */}
        <section className="space-y-3">
          {GAME_ORDER.map((id) => {
            const game = GAMES[id];
            const topEntry = boards[id]?.[0];
            const topScore = topEntry ? topEntry.score : 0;

            return (
              <div
                key={id}
                className="rounded-3xl border border-[#E8D5C4] bg-white p-3.5 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${game.accentBg} text-3xl shadow-sm`}
                  >
                    {game.emoji}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-display text-lg font-bold text-[#2C1A12] leading-tight">
                        {game.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${game.badgeColor}`}
                      >
                        {game.prizeEmoji} {game.prize}
                      </span>
                    </div>
                    <p className="text-xs text-[#6D4C41] mt-0.5">{game.tagline}</p>
                    <p className="text-[10px] font-semibold text-[#8D6E63] mt-0.5">
                      Controls: {game.controlsHint}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-[#FDF8F2] border border-[#EFE2D4] px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-[#7A5B4B]">
                        #1 Score to Beat
                      </div>
                      <div className="text-xs font-bold text-[#2C1A12] truncate">
                        <span className="font-mono-code text-sm text-amber-700 mr-1.5">
                          {topScore}
                        </span>
                        {topEntry ? `by ${topEntry.playerName} (T${topEntry.table})` : 'Be first!'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!playStatus.allowed}
                    onClick={() => {
                      sound.play('click');
                      onPlayGame(id);
                    }}
                    className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 font-display text-xs font-bold text-white shadow-sm transition-transform ${
                      playStatus.allowed
                        ? 'bg-[#2C1A12] active:scale-95'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    {playStatus.allowed ? 'Play Now' : 'Limit Hit'}
                  </button>
                </div>
              </div>
            );
          })}
        </section>

        {/* Subtle Staff Link */}
        <div className="pt-1 pb-2 text-center">
          <button
            type="button"
            onClick={() => {
              sound.play('click');
              onOpenAdmin();
            }}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8D6E63] hover:text-[#2C1A12]"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Cafe Staff / Admin Portal
          </button>
        </div>
      </main>

      {/* Bottom Tab Navigation */}
      <nav className="shrink-0 grid grid-cols-2 border-t border-[#E8D5C4] bg-white px-3 py-1.5">
        <button
          type="button"
          className="flex flex-col items-center justify-center py-1 text-[#2C1A12]"
        >
          <Gamepad2 className="w-5 h-5 text-amber-600" />
          <span className="text-[11px] font-bold mt-0.5">Arcade</span>
        </button>
        <button
          type="button"
          onClick={() => {
            sound.play('click');
            onOpenLeaderboard('flappy');
          }}
          className="flex flex-col items-center justify-center py-1 text-[#7A5B4B] hover:text-[#2C1A12]"
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[11px] font-semibold mt-0.5">Leaderboard</span>
        </button>
      </nav>
    </div>
  );
}
