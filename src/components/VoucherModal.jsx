import React, { useMemo } from 'react';
import { Crown, CheckCircle2, Clock, X, Ticket } from 'lucide-react';
import { formatTimestamp } from '../services/storage';

const CONFETTI_COLORS = ['#F59E0B', '#EC4899', '#10B981', '#FDE68A', '#F97316', '#FFFFFF'];

export default function VoucherModal({ voucher, celebrate = false, onClose }) {
  const confettiPieces = useMemo(() => {
    if (!celebrate) return [];
    return Array.from({ length: 34 }, (_, i) => ({
      id: i,
      left: `${(i * 29) % 100}%`,
      delay: `${((i * 7) % 12) * 0.08}s`,
      duration: `${2.2 + ((i * 5) % 10) * 0.14}s`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 6 + (i % 6),
    }));
  }, [celebrate]);

  if (!voucher) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      {/* Confetti overlay */}
      {celebrate && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-40">
          {confettiPieces.map((p) => (
            <span
              key={p.id}
              className="animate-confetti absolute top-0 rounded-xs"
              style={{
                left: p.left,
                width: `${p.size}px`,
                height: `${p.size * 1.4}px`,
                backgroundColor: p.color,
                '--fall-delay': p.delay,
                '--fall-duration': p.duration,
              }}
            />
          ))}
        </div>
      )}

      {/* Voucher Card */}
      <div className="relative z-50 w-full max-w-[380px] rounded-3xl bg-[#FDF8F2] text-[#2C1A12] shadow-2xl overflow-hidden border-2 border-amber-400">
        {/* Top Header */}
        <div className="relative bg-gradient-to-br from-[#2C1A12] via-[#3E2723] to-[#5D4037] px-5 pt-5 pb-6 text-center text-white">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close voucher"
            className="absolute right-3 top-3 rounded-full bg-white/10 p-1.5 text-white/80 hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-[#2C1A12] shadow-lg animate-badge-pulse">
            <Crown className="w-6 h-6" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-300">
            {celebrate ? 'New #1 High Score!' : 'Cafe Clash Winner'}
          </p>
          <h2 className="font-display text-2xl font-bold mt-0.5">
            FREE {voucher.prize} {voucher.prizeEmoji}
          </h2>
          <p className="text-xs text-amber-100/80 mt-1">
            #1 Champion in {voucher.gameName} • Score {voucher.score}
          </p>
        </div>

        {/* Perforated Divider */}
        <div className="relative flex items-center justify-between bg-[#FDF8F2] px-4">
          <div className="-ml-7 h-6 w-6 rounded-full bg-black/75" />
          <div className="w-full border-t-2 border-dashed border-[#D6C1AE] my-2" />
          <div className="-mr-7 h-6 w-6 rounded-full bg-black/75" />
        </div>

        {/* Voucher Body */}
        <div className="px-5 pb-5 pt-2 space-y-3">
          <div className="rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50/90 p-3 text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-800 flex items-center justify-center gap-1">
              <Ticket className="w-3.5 h-3.5" />
              Redemption Code
            </div>
            <div className="font-mono-code text-2xl font-bold tracking-wider text-[#2C1A12] mt-1">
              {voucher.code}
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide border bg-white">
              {voucher.redeemed ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Redeemed</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-amber-800">Ready to Claim</span>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs rounded-2xl bg-[#F5EBE0] p-3">
            <div>
              <span className="block text-[10px] font-semibold uppercase text-[#7A5B4B]">Player</span>
              <span className="font-bold text-[#2C1A12]">{voucher.playerName}</span>
            </div>
            <div>
              <span className="block text-[10px] font-semibold uppercase text-[#7A5B4B]">Table</span>
              <span className="font-bold text-[#2C1A12]">Table #{voucher.table}</span>
            </div>
            <div>
              <span className="block text-[10px] font-semibold uppercase text-[#7A5B4B]">Order ID</span>
              <span className="font-mono-code font-bold text-[#2C1A12]">{voucher.orderId}</span>
            </div>
            <div>
              <span className="block text-[10px] font-semibold uppercase text-[#7A5B4B]">Issued At</span>
              <span className="font-bold text-[#2C1A12]">{formatTimestamp(voucher.issuedAt)}</span>
            </div>
          </div>

          <p className="text-center text-xs font-medium text-[#5D4037]">
            Show this voucher screen to your cafe server to claim your free dessert!
          </p>

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-[#2C1A12] py-3 font-display text-sm font-bold text-white shadow-md active:scale-[0.98] transition-transform"
          >
            Back to Cafe Clash
          </button>
        </div>
      </div>
    </div>
  );
}
