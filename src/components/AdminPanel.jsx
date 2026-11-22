import React, { useState } from 'react';
import {
  ShieldCheck,
  ArrowLeft,
  Crown,
  CheckCircle2,
  Plus,
  Trash2,
  Unlock,
  RotateCcw,
  Lock,
  Ticket,
  Settings,
  Receipt,
} from 'lucide-react';
import {
  GAMES,
  GAME_ORDER,
  getAllLeaderboards,
  getVouchers,
  redeemVoucher,
  getValidOrders,
  addValidOrder,
  removeValidOrder,
  getLockedOrders,
  unlockOrder,
  getSettings,
  updateSettings,
  resetDailyData,
  formatINR,
  formatTimestamp,
} from '../services/storage';
import { sound } from '../services/sound';

export default function AdminPanel({ onBack, onDataChanged }) {
  const settings = getSettings();
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [activeTab, setActiveTab] = useState('winners');
  const [, setTick] = useState(0);

  // Add order form state
  const [newOrderId, setNewOrderId] = useState('');
  const [newOrderAmount, setNewOrderAmount] = useState('');
  const [newOrderTable, setNewOrderTable] = useState('5');
  const [confirmReset, setConfirmReset] = useState(false);

  const refresh = () => {
    setTick((t) => t + 1);
    if (onDataChanged) onDataChanged();
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pin === (settings.adminPin || '1234')) {
      sound.play('win');
      setUnlocked(true);
      setPinError('');
    } else {
      sound.play('gameover');
      setPinError('Incorrect PIN. Default staff PIN is 1234.');
    }
  };

  const handleKeyPress = (digit) => {
    sound.play('click');
    setPinError('');
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      if (next.length === 4 && next === (settings.adminPin || '1234')) {
        sound.play('win');
        setUnlocked(true);
      }
    }
  };

  const handleAddOrder = (e) => {
    e.preventDefault();
    if (!newOrderId.trim() || !newOrderAmount) return;
    sound.play('point');
    addValidOrder({
      orderId: newOrderId,
      amount: Number(newOrderAmount),
      table: Number(newOrderTable) || 1,
      note: 'Added by Staff',
    });
    setNewOrderId('');
    setNewOrderAmount('');
    refresh();
  };

  if (!unlocked) {
    return (
      <div className="flex flex-col h-full bg-[#2C1A12] text-white">
        <header className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <span className="font-display text-sm font-bold text-amber-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Cafe Staff Portal
          </span>
          <div className="w-14" />
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-full max-w-[320px] rounded-3xl bg-[#3E2723] border border-white/10 p-6 text-center shadow-xl">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-[#2C1A12]">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="font-display text-xl font-bold">Staff PIN Required</h1>
            <p className="text-xs text-amber-100/75 mt-1">
              Enter 4-digit PIN (default: <span className="font-mono-code font-bold text-amber-300">1234</span>)
            </p>

            <form onSubmit={handlePinSubmit} className="mt-4 space-y-3">
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ''));
                  setPinError('');
                }}
                placeholder="••••"
                aria-label="Staff PIN"
                className="w-full rounded-2xl bg-[#2C1A12] border border-amber-400/40 py-3 text-center font-mono-code text-2xl tracking-[0.5em] text-amber-200 focus:border-amber-400 focus:outline-none"
              />

              {pinError && (
                <p className="text-xs font-semibold text-rose-300">{pinError}</p>
              )}

              {/* Touch Keypad */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Clear', '0', 'Go'].map(
                  (key) => {
                    if (key === 'Clear') {
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setPin('');
                            setPinError('');
                          }}
                          className="rounded-xl bg-white/10 py-2.5 text-xs font-bold text-amber-100 active:scale-95"
                        >
                          Clear
                        </button>
                      );
                    }
                    if (key === 'Go') {
                      return (
                        <button
                          key={key}
                          type="submit"
                          className="rounded-xl bg-amber-400 py-2.5 text-xs font-extrabold text-[#2C1A12] active:scale-95"
                        >
                          Unlock
                        </button>
                      );
                    }
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleKeyPress(key)}
                        className="rounded-xl bg-[#2C1A12] py-2.5 font-mono-code text-base font-bold text-white border border-white/10 active:scale-95"
                      >
                        {key}
                      </button>
                    );
                  }
                )}
              </div>
            </form>
          </div>
        </main>
      </div>
    );
  }

  const boards = getAllLeaderboards();
  const vouchers = getVouchers();
  const validOrders = Object.values(getValidOrders());
  const lockedOrders = getLockedOrders();
  const currentSettings = getSettings();

  return (
    <div className="flex flex-col h-full bg-[#FDF8F2] text-[#2C1A12] overflow-hidden">
      <header className="shrink-0 bg-[#2C1A12] text-white px-4 py-3 shadow-md">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-2.5 py-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            App
          </button>
          <h1 className="font-display text-base font-bold text-amber-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Cafe Staff Admin
          </h1>
          <button
            type="button"
            onClick={() => {
              setUnlocked(false);
              setPin('');
            }}
            className="text-[11px] font-semibold text-white/75 hover:text-white"
          >
            Lock
          </button>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5 rounded-2xl bg-black/25 p-1">
          {[
            { id: 'winners', label: 'Winners', icon: Ticket },
            { id: 'orders', label: 'Orders', icon: Receipt },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  sound.play('click');
                  setActiveTab(tab.id);
                }}
                className={`flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-bold ${
                  active ? 'bg-amber-400 text-[#2C1A12]' : 'text-amber-100/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto scroll-area p-4 space-y-4">
        {activeTab === 'winners' && (
          <>
            <section className="space-y-2">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#5D4037]">
                Current #1 Leaders
              </h2>
              <div className="space-y-2">
                {GAME_ORDER.map((id) => {
                  const g = GAMES[id];
                  const top = boards[id]?.[0];
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between rounded-2xl border border-[#E8D5C4] bg-white p-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{g.prizeEmoji}</span>
                        <div>
                          <div className="text-xs font-bold text-[#2C1A12]">
                            {g.name} • <span className="text-amber-700">{g.prize}</span>
                          </div>
                          <div className="text-[11px] text-[#6D4C41]">
                            {top
                              ? `${top.playerName} (Table #${top.table}) — Score ${top.score}`
                              : 'No entries yet'}
                          </div>
                        </div>
                      </div>
                      <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#5D4037]">
                Issued Dessert Vouchers ({vouchers.length})
              </h2>
              {vouchers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#D6C1AE] bg-white p-5 text-center text-xs text-[#7A5B4B]">
                  No dessert vouchers issued yet. When a verified guest beats #1, their voucher appears here for staff redemption.
                </div>
              ) : (
                <div className="space-y-2">
                  {vouchers.map((v) => (
                    <div
                      key={v.code}
                      className={`rounded-2xl border p-3 ${
                        v.redeemed
                          ? 'border-emerald-200 bg-emerald-50/70'
                          : 'border-amber-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-mono-code text-sm font-bold text-[#2C1A12]">
                            {v.code}
                          </div>
                          <div className="text-xs font-bold text-amber-800">
                            {v.prizeEmoji} {v.prize} ({v.gameName})
                          </div>
                          <div className="text-[11px] text-[#6D4C41] mt-0.5">
                            {v.playerName} • Table #{v.table} • {v.orderId} • {formatTimestamp(v.issuedAt)}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            sound.play('click');
                            redeemVoucher(v.code);
                            refresh();
                          }}
                          className={`shrink-0 inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold ${
                            v.redeemed
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#2C1A12] text-amber-300'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {v.redeemed ? 'Redeemed' : 'Mark Redeemed'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === 'orders' && (
          <>
            {/* Add Order ID Form */}
            <form
              onSubmit={handleAddOrder}
              className="rounded-2xl border border-[#E8D5C4] bg-white p-3.5 space-y-2.5"
            >
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#5D4037]">
                Add POS Order ID
              </h2>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="ORD-3050"
                  value={newOrderId}
                  onChange={(e) => setNewOrderId(e.target.value.toUpperCase())}
                  className="col-span-1 rounded-xl border border-[#E8D5C4] bg-[#FDF8F2] px-2.5 py-2 font-mono-code text-xs font-bold uppercase"
                />
                <input
                  type="number"
                  placeholder="₹ Amount"
                  value={newOrderAmount}
                  onChange={(e) => setNewOrderAmount(e.target.value)}
                  className="col-span-1 rounded-xl border border-[#E8D5C4] bg-[#FDF8F2] px-2.5 py-2 font-mono-code text-xs font-bold"
                />
                <input
                  type="number"
                  min="1"
                  max="20"
                  placeholder="Table"
                  value={newOrderTable}
                  onChange={(e) => setNewOrderTable(e.target.value)}
                  className="col-span-1 rounded-xl border border-[#E8D5C4] bg-[#FDF8F2] px-2.5 py-2 text-xs font-bold"
                />
              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2C1A12] py-2.5 text-xs font-bold text-white active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                Add Valid Order
              </button>
            </form>

            {/* Valid Orders List */}
            <section className="space-y-2">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#5D4037]">
                Registered Orders ({validOrders.length})
              </h2>
              <div className="space-y-2">
                {validOrders.map((ord) => {
                  const lock = lockedOrders[ord.orderId];
                  const eligible = ord.amount >= currentSettings.minOrderAmount;
                  return (
                    <div
                      key={ord.orderId}
                      className="flex items-center justify-between rounded-2xl border border-[#E8D5C4] bg-white p-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-code text-sm font-bold">
                            {ord.orderId}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              eligible
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {formatINR(ord.amount)}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#6D4C41] mt-0.5">
                          Table #{ord.table} • {ord.note}
                          {lock && ` • Locked by ${lock.playerName}`}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {lock && (
                          <button
                            type="button"
                            onClick={() => {
                              sound.play('click');
                              unlockOrder(ord.orderId);
                              refresh();
                            }}
                            title="Unlock session"
                            className="rounded-lg bg-amber-100 p-1.5 text-amber-900"
                          >
                            <Unlock className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            sound.play('click');
                            removeValidOrder(ord.orderId);
                            refresh();
                          }}
                          title="Delete order"
                          className="rounded-lg bg-rose-50 p-1.5 text-rose-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#E8D5C4] bg-white p-4 space-y-3">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#5D4037]">
                Arcade Rules
              </h2>

              <div>
                <label className="block text-xs font-bold text-[#2C1A12] mb-1">
                  Minimum Order Value (INR)
                </label>
                <input
                  type="number"
                  value={currentSettings.minOrderAmount}
                  onChange={(e) => {
                    updateSettings({ minOrderAmount: Math.max(0, Number(e.target.value) || 0) });
                    refresh();
                  }}
                  className="w-full rounded-xl border border-[#E8D5C4] bg-[#FDF8F2] px-3 py-2 font-mono-code text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C1A12] mb-1">
                  Plays Per Order Session
                </label>
                <select
                  value={currentSettings.maxPlaysPerSession}
                  onChange={(e) => {
                    updateSettings({ maxPlaysPerSession: Number(e.target.value) });
                    refresh();
                  }}
                  className="w-full rounded-xl border border-[#E8D5C4] bg-[#FDF8F2] px-3 py-2 text-sm font-bold"
                >
                  <option value={0}>Unlimited Plays (Default)</option>
                  <option value={3}>3 Plays per Order</option>
                  <option value={5}>5 Plays per Order</option>
                  <option value={10}>10 Plays per Order</option>
                </select>
              </div>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 space-y-2.5">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-rose-900">
                Daily Reset
              </h2>
              <p className="text-xs text-rose-800 leading-relaxed">
                Clears today&apos;s vouchers, locked table sessions, and resets leaderboards back to fresh daily defaults.
              </p>

              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white active:scale-[0.98]"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Daily Leaderboards
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="rounded-xl border border-rose-300 bg-white py-2 text-xs font-bold text-rose-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.play('win');
                      resetDailyData();
                      setConfirmReset(false);
                      refresh();
                    }}
                    className="rounded-xl bg-rose-700 py-2 text-xs font-bold text-white"
                  >
                    Confirm Reset
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
