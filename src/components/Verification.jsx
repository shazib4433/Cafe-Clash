import React, { useState, useEffect } from 'react';
import {
  Coffee,
  Sparkles,
  Ticket,
  Lock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Utensils,
  QrCode,
  X,
  Copy,
  Check,
} from 'lucide-react';
import {
  GAMES,
  GAME_ORDER,
  getValidOrders,
  getSettings,
  verifyAndStartSession,
  formatINR,
} from '../services/storage';
import { sound } from '../services/sound';

export default function Verification({ initialTable, onVerified, onOpenAdmin }) {
  const settings = getSettings();
  const [table, setTable] = useState(initialTable || 4);
  const [playerName, setPlayerName] = useState('');
  const [orderId, setOrderId] = useState('');
  const [orderValue, setOrderValue] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [showQr, setShowQr] = useState(false);
  const [isCustomUrl, setIsCustomUrl] = useState(false);
  const [qrUrl, setQrUrl] = useState(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    return `${origin}/?table=${initialTable || 4}`;
  });
  const [copied, setCopied] = useState(false);
  const [qrError, setQrError] = useState(false);

  useEffect(() => {
    if (initialTable) {
      setTable(initialTable);
    }
  }, [initialTable]);

  useEffect(() => {
    if (!isCustomUrl && typeof window !== 'undefined') {
      setQrUrl(`${window.location.origin}/?table=${table}`);
      setQrError(false);
    }
  }, [table, isCustomUrl]);

  const handleCopyQrUrl = async () => {
    sound.play('click');
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback copy if clipboard permission is unavailable
      setCopied(false);
    }
  };

  // Auto-fill order amount when typing a known Order ID
  const handleOrderIdChange = (val) => {
    const upper = val.toUpperCase();
    setOrderId(upper);
    setFeedback(null);
    const orders = getValidOrders();
    const match = orders[upper.trim()];
    if (match) {
      setOrderValue(String(match.amount));
    }
  };

  const applyDemo = (demoType) => {
    sound.play('click');
    setFeedback(null);
    if (demoType === 'valid') {
      setOrderId('ORD-2026');
      setOrderValue('2450');
      if (!playerName.trim()) {
        setPlayerName('CafeGuest');
      }
    } else {
      setOrderId('ORD-101');
      setOrderValue('850');
      if (!playerName.trim()) {
        setPlayerName('CafeGuest');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sound.play('click');
    const result = verifyAndStartSession({
      table,
      playerName,
      orderId,
      orderValue,
    });

    if (!result.ok) {
      setFeedback(result);
      sound.play('gameover');
      return;
    }

    sound.play('win');
    onVerified(result.session);
  };

  const minAmount = Number(settings.minOrderAmount) || 2000;

  return (
    <div className="flex flex-col h-full bg-[#FDF8F2] text-[#2C1A12] overflow-hidden">
      {/* Scrollable main content */}
      <div className="flex-1 overflow-y-auto scroll-area px-4 pt-4 pb-6 space-y-4">
        {/* Hero Espresso Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2C1A12] via-[#3E2723] to-[#5D4037] p-5 text-[#FDF8F2] shadow-lg">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-amber-400/15 blur-xl" />
          <div className="absolute -left-4 -bottom-8 h-24 w-24 rounded-full bg-orange-500/15 blur-xl" />

          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-300/30 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-200 mb-2">
                <Sparkles className="w-3 h-3" />
                Table #{table} QR Arcade
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                CAFE CLASH
                <span className="text-2xl">☕</span>
              </h1>
              <p className="mt-1 text-xs text-amber-100/85 leading-relaxed">
                Verify your table order ({formatINR(minAmount)}+) to unlock 3 arcade games &amp; compete for free desserts!
              </p>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400/20 border border-amber-300/30 text-amber-300 shadow-sm">
                <Coffee className="w-5 h-5 stroke-[2.2]" />
              </div>
              <button
                type="button"
                onClick={() => {
                  sound.play('click');
                  setQrError(false);
                  setShowQr(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-extrabold text-[#2C1A12] shadow-md active:scale-95 transition-transform"
              >
                <QrCode className="w-3.5 h-3.5 stroke-[2.4]" />
                <span>Show QR</span>
              </button>
            </div>
          </div>

          {/* Today's Prize Teaser Strip */}
          <div className="relative mt-4 grid grid-cols-3 gap-1.5">
            {GAME_ORDER.map((id) => {
              const g = GAMES[id];
              return (
                <div
                  key={id}
                  className="rounded-xl bg-black/25 border border-white/10 px-2 py-1.5 text-center backdrop-blur-xs"
                >
                  <div className="text-base leading-none">{g.prizeEmoji}</div>
                  <div className="mt-1 text-[10px] font-semibold text-amber-200 truncate">
                    {g.prize}
                  </div>
                  <div className="text-[9px] text-white/65 truncate">{g.shortName} #1</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Demo Mode Strip */}
        <div className="rounded-2xl border border-amber-300/70 bg-amber-50/90 p-3 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <Ticket className="w-3.5 h-3.5 text-amber-600" />
              Quick Test — Demo Mode
            </span>
            <span className="text-[10px] font-medium text-amber-700">1-tap fill</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => applyDemo('valid')}
              className="flex flex-col items-start rounded-xl border border-emerald-300 bg-emerald-50 px-2.5 py-2 text-left active:scale-[0.98] transition-transform"
            >
              <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Demo Valid
              </span>
              <span className="font-mono-code text-[10px] text-emerald-700 mt-0.5">
                ORD-2026 • ₹2,450
              </span>
            </button>

            <button
              type="button"
              onClick={() => applyDemo('invalid')}
              className="flex flex-col items-start rounded-xl border border-rose-300 bg-rose-50 px-2.5 py-2 text-left active:scale-[0.98] transition-transform"
            >
              <span className="text-[11px] font-bold text-rose-900 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                Demo &lt; ₹2,000
              </span>
              <span className="font-mono-code text-[10px] text-rose-700 mt-0.5">
                ORD-101 • ₹850
              </span>
            </button>
          </div>
        </div>

        {/* Order Verification Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-[#E8D5C4] bg-white p-4 shadow-sm space-y-3.5"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#2C1A12]">
              Verify Your Table Order
            </h2>
            <span className="rounded-full bg-[#F5EBE0] px-2.5 py-0.5 text-[11px] font-semibold text-[#5D4037]">
              Min {formatINR(minAmount)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="col-span-1">
              <label
                htmlFor="table-select"
                className="block text-[11px] font-bold uppercase tracking-wide text-[#5D4037] mb-1"
              >
                Table #
              </label>
              <select
                id="table-select"
                value={table}
                onChange={(e) => setTable(Number(e.target.value))}
                className="w-full rounded-xl border border-[#E8D5C4] bg-[#FDF8F2] px-2.5 py-2.5 text-sm font-bold text-[#2C1A12] focus:border-amber-500 focus:outline-none"
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    Table {num}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label
                htmlFor="player-name"
                className="block text-[11px] font-bold uppercase tracking-wide text-[#5D4037] mb-1"
              >
                Player Nickname
              </label>
              <input
                id="player-name"
                type="text"
                maxLength={18}
                placeholder="e.g. Aarav / LatteKing"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  setFeedback(null);
                }}
                className="w-full rounded-xl border border-[#E8D5C4] bg-[#FDF8F2] px-3 py-2.5 text-sm font-semibold text-[#2C1A12] placeholder:text-[#9C7B68] focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label
                htmlFor="order-id"
                className="block text-[11px] font-bold uppercase tracking-wide text-[#5D4037] mb-1"
              >
                Order ID
              </label>
              <input
                id="order-id"
                type="text"
                placeholder="ORD-2026"
                value={orderId}
                onChange={(e) => handleOrderIdChange(e.target.value)}
                className="w-full rounded-xl border border-[#E8D5C4] bg-[#FDF8F2] px-3 py-2.5 font-mono-code text-sm font-bold uppercase text-[#2C1A12] placeholder:text-[#9C7B68] focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="order-value"
                className="block text-[11px] font-bold uppercase tracking-wide text-[#5D4037] mb-1"
              >
                Order Value (INR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#7A5B4B]">
                  ₹
                </span>
                <input
                  id="order-value"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="2450"
                  value={orderValue}
                  onChange={(e) => {
                    setOrderValue(e.target.value);
                    setFeedback(null);
                  }}
                  className="w-full rounded-xl border border-[#E8D5C4] bg-[#FDF8F2] pl-7 pr-3 py-2.5 font-mono-code text-sm font-bold text-[#2C1A12] placeholder:text-[#9C7B68] focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Inline Error / Below Minimum Feedback */}
          {feedback && (
            <div
              role="alert"
              className={`rounded-2xl border p-3 text-xs leading-relaxed ${feedback.reason === 'below_minimum'
                  ? 'border-amber-300 bg-amber-50 text-amber-950'
                  : 'border-rose-300 bg-rose-50 text-rose-950'
                }`}
            >
              <div className="flex items-start gap-2">
                {feedback.reason === 'below_minimum' ? (
                  <Utensils className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : feedback.reason === 'already_used' ? (
                  <Lock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">
                    {feedback.reason === 'below_minimum'
                      ? `Almost there! Add ${formatINR(feedback.deficit)} more to play`
                      : feedback.reason === 'already_used'
                        ? 'Order Already Active'
                        : 'Cannot Unlock Arcade'}
                  </p>
                  <p className="mt-0.5 opacity-90">{feedback.message}</p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#D97706] to-[#B45309] py-3.5 px-4 font-display text-base font-bold text-white shadow-md shadow-amber-900/20 active:scale-[0.98] transition-transform"
          >
            <span>Unlock Cafe Arcade</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Subtle Footer with Staff Portal Link */}
      <footer className="shrink-0 border-t border-[#E8D5C4] bg-[#F5EBE0]/80 px-4 py-2.5 flex items-center justify-between text-[11px] text-[#7A5B4B]">
        <span>1 Order ID = 1 Table Session</span>
        <button
          type="button"
          onClick={() => {
            sound.play('click');
            onOpenAdmin();
          }}
          className="inline-flex items-center gap-1 font-semibold text-[#5D4037] hover:text-[#2C1A12] underline underline-offset-2"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Staff Portal
        </button>
      </footer>

      {/* Scannable Table QR Modal */}
      {showQr && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-[360px] rounded-3xl bg-[#FDF8F2] text-[#2C1A12] shadow-2xl border-2 border-amber-400 overflow-hidden">
            <div className="flex items-center justify-between bg-[#2C1A12] px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-amber-400" />
                <h3 id="qr-modal-title" className="font-display text-base font-bold">
                  Table #{table} QR Code
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close QR modal"
                onClick={() => {
                  sound.play('click');
                  setShowQr(false);
                }}
                className="rounded-full bg-white/10 p-1.5 text-white/80 hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5">
              <div className="mx-auto flex flex-col items-center justify-center rounded-2xl border-2 border-[#E8D5C4] bg-white p-4 shadow-inner">
                {!qrError ? (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=12&color=2C1A12&bgcolor=FFFFFF&data=${encodeURIComponent(qrUrl)}`}
                    alt={`Scannable QR code for Table ${table}`}
                    onError={() => setQrError(true)}
                    className="h-48 w-48 rounded-lg object-contain"
                  />
                ) : (
                  <div className="flex h-48 w-48 flex-col items-center justify-center rounded-xl bg-[#FDF8F2] p-3 text-center text-xs text-[#6D4C41]">
                    <QrCode className="w-8 h-8 text-amber-600 mb-2" />
                    <span className="font-bold text-[#2C1A12]">QR image offline</span>
                    <span className="mt-1">Check internet access or copy the table link below.</span>
                  </div>
                )}
                <span className="mt-2 text-[11px] font-bold uppercase tracking-wider text-[#5D4037]">
                  Scan to open Cafe Clash • Table #{table}
                </span>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="qr-target-url"
                  className="block text-[10px] font-bold uppercase tracking-wider text-[#5D4037]"
                >
                  Target URL (editable for LAN / deployed link)
                </label>
                <div className="flex gap-1.5">
                  <input
                    id="qr-target-url"
                    type="url"
                    value={qrUrl}
                    onChange={(e) => {
                      setIsCustomUrl(true);
                      setQrUrl(e.target.value);
                      setQrError(false);
                    }}
                    className="min-w-0 flex-1 rounded-xl border border-[#E8D5C4] bg-white px-2.5 py-2 font-mono-code text-[11px] font-semibold text-[#2C1A12] focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyQrUrl}
                    className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-[#2C1A12] px-3 py-2 text-xs font-bold text-amber-200 active:scale-95"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {(qrUrl.includes('localhost') || qrUrl.includes('127.0.0.1')) && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-950">
                  <span className="font-bold">Phone scan tip:</span> Replace{' '}
                  <span className="font-mono-code font-bold">localhost</span> above with your
                  computer&apos;s Wi-Fi IP (e.g.{' '}
                  <span className="font-mono-code font-bold">
                    http://172.20.10.11:5173/?table={table}
                  </span>
                  ) so phones on the same Wi-Fi can open it.
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  sound.play('click');
                  setShowQr(false);
                }}
                className="w-full rounded-2xl bg-[#2C1A12] py-3 font-display text-sm font-bold text-white shadow-sm active:scale-[0.98]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
