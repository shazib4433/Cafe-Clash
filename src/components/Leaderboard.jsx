import React, { useState } from 'react';
import { Crown, Trophy, Gamepad2, ArrowLeft, ShieldCheck } from 'lucide-react';
import {
  GAMES,
  GAME_ORDER,
  getAllLeaderboards,
  formatTimestamp,
} from '../services/storage';
import { sound } from '../services/sound';

export default function Leaderboard({
  session,
  initialTab = 'flappy',
  onBackToHub,
  onOpenAdmin,
}) {
  const [activeTab, setActiveTab] = useState(
    GAME_ORDER.includes(initialTab) ? initialTab : 'flappy'
  );
  const boards = getAllLeaderboards();
  const currentGame = GAMES[activeTab];
  const entries = boards[activeTab] || [];

  return (
    <div className="flex flex-col h-full bg-[#FDF8F2] text-[#2C1A12] overflow-hidden">
      {/* Header */}
      <header className="shrink-0 bg-[#2C1A12] text-white px-4 py-3 shadow-md">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              sound.play('click');
              onBackToHub();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Arcade
          </button>
          <h1 className="font-display text-lg font-bold flex items-center gap-1.5">
            <Trophy className="w-5 h-5 text-amber-400" />
            Live Leaderboards
          </h1>
          <div className="w-16 text-right text-[11px] text-amber-200 font-semibold">
            {session ? `T#${session.table}` : ''}
          </div>
        </div>

        {/* Game Switcher Tabs */}
        <div className="mt-3 grid grid-cols-3 gap-1.5 rounded-2xl bg-black/25 p-1">
          {GAME_ORDER.map((id) => {
            const g = GAMES[id];
            const isSelected = id === activeTab;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  sound.play('click');
                  setActiveTab(id);
                }}
                className={`rounded-xl py-2 px-1 text-center text-xs font-bold transition-colors ${
                  isSelected
                    ? 'bg-amber-400 text-[#2C1A12] shadow-xs'
                    : 'text-amber-100/80 hover:text-white'
                }`}
              >
                <span className="mr-1">{g.emoji}</span>
                {g.shortName}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scroll-area px-4 py-3.5 space-y-3">
        {/* Selected Game Prize Banner */}
        <div
          className={`rounded-2xl bg-gradient-to-r ${currentGame.accentBg} p-3.5 text-white shadow-sm flex items-center justify-between`}
        >
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/85">
              #1 {currentGame.name} Prize
            </div>
            <div className="font-display text-lg font-bold mt-0.5">
              Free {currentGame.prize} {currentGame.prizeEmoji}
            </div>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-2xl">
            {currentGame.prizeEmoji}
          </div>
        </div>

        {/* Column Header */}
        <div className="grid grid-cols-12 px-3 text-[10px] font-bold uppercase tracking-wider text-[#7A5B4B]">
          <div className="col-span-2">Rank</div>
          <div className="col-span-5">Player</div>
          <div className="col-span-2 text-center">Table</div>
          <div className="col-span-3 text-right">Score</div>
        </div>

        {/* Ranked Rows */}
        {entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D6C1AE] bg-white p-6 text-center text-xs text-[#7A5B4B]">
            No scores recorded yet today. Play {currentGame.name} to claim #1!
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((row, idx) => {
              const rank = idx + 1;
              const isWinner = rank === 1;
              const isCurrentUser =
                session && row.orderId === session.orderId && row.playerName === session.playerName;

              return (
                <div
                  key={row.id}
                  className={`grid grid-cols-12 items-center rounded-2xl border px-3 py-2.5 transition-all ${
                    isWinner
                      ? 'border-amber-400 bg-gradient-to-r from-amber-50 via-yellow-50 to-white shadow-xs'
                      : isCurrentUser
                        ? 'border-emerald-300 bg-emerald-50/70'
                        : 'border-[#E8D5C4] bg-white'
                  }`}
                >
                  <div className="col-span-2 flex items-center gap-1">
                    {isWinner ? (
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-[#2C1A12] shadow-xs">
                        <Crown className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="font-mono-code text-xs font-bold text-[#7A5B4B] pl-1.5">
                        #{rank}
                      </span>
                    )}
                  </div>

                  <div className="col-span-5 min-w-0 pr-1">
                    <div className="flex items-center gap-1">
                      <span className="truncate text-sm font-bold text-[#2C1A12]">
                        {row.playerName}
                      </span>
                      {isCurrentUser && (
                        <span className="rounded bg-emerald-600 px-1 py-0.5 text-[9px] font-bold text-white">
                          YOU
                        </span>
                      )}
                    </div>
                    {isWinner ? (
                      <span className="inline-block rounded-full bg-amber-200/80 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-950 mt-0.5">
                        Free Dessert Winner
                      </span>
                    ) : (
                      <span className="block text-[10px] text-[#8D6E63]">
                        {formatTimestamp(row.timestamp)}
                      </span>
                    )}
                  </div>

                  <div className="col-span-2 text-center">
                    <span className="rounded-lg bg-[#F5EBE0] px-2 py-0.5 text-[11px] font-bold text-[#5D4037]">
                      T{row.table}
                    </span>
                  </div>

                  <div className="col-span-3 text-right">
                    <div className="font-mono-code text-base font-bold text-[#2C1A12]">
                      {row.score}
                    </div>
                    {isWinner && (
                      <div className="text-[9px] text-[#8D6E63]">
                        {formatTimestamp(row.timestamp)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-2 pb-2 text-center">
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
          onClick={() => {
            sound.play('click');
            onBackToHub();
          }}
          className="flex flex-col items-center justify-center py-1 text-[#7A5B4B] hover:text-[#2C1A12]"
        >
          <Gamepad2 className="w-5 h-5" />
          <span className="text-[11px] font-semibold mt-0.5">Arcade</span>
        </button>
        <button
          type="button"
          className="flex flex-col items-center justify-center py-1 text-[#2C1A12]"
        >
          <Trophy className="w-5 h-5 text-amber-600" />
          <span className="text-[11px] font-bold mt-0.5">Leaderboard</span>
        </button>
      </nav>
    </div>
  );
}
