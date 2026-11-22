const PREFIX = 'cafe_clash_v1_';

const KEYS = {
  VALID_ORDERS: `${PREFIX}valid_orders`,
  LEADERBOARDS: `${PREFIX}leaderboards`,
  LOCKED_ORDERS: `${PREFIX}locked_orders`,
  ACTIVE_SESSION: `${PREFIX}active_session`,
  VOUCHERS: `${PREFIX}vouchers`,
  SETTINGS: `${PREFIX}settings`,
};

export const GAMES = {
  flappy: {
    id: 'flappy',
    name: 'Cafe Flappy',
    shortName: 'Flappy',
    emoji: '☕',
    prize: 'Hot Fudge Brownie',
    prizeEmoji: '🍫',
    tagline: 'Tap to soar through espresso pipes',
    controlsHint: 'Tap anywhere to flap',
    accentBg: 'from-amber-500 to-orange-600',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  snake: {
    id: 'snake',
    name: 'Espresso Snake',
    shortName: 'Snake',
    emoji: '🐍',
    prize: 'Artisan Gelato',
    prizeEmoji: '🍨',
    tagline: 'Collect roasted beans & warm pastries',
    controlsHint: 'Swipe or use on-screen D-pad',
    accentBg: 'from-emerald-500 to-teal-700',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  puzzle: {
    id: 'puzzle',
    name: '2048 Cafe',
    shortName: '2048 Cafe',
    emoji: '🥐',
    prize: 'Belgian Waffle',
    prizeEmoji: '🧇',
    tagline: 'Merge cafe treats to Golden Trophy',
    controlsHint: 'Swipe tiles to merge',
    accentBg: 'from-rose-500 to-amber-600',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
  },
};

export const GAME_ORDER = ['flappy', 'snake', 'puzzle'];

const DEFAULT_SETTINGS = {
  minOrderAmount: 2000,
  maxPlaysPerSession: 0, // 0 = unlimited during active table session
  adminPin: '1234',
};

const SEED_ORDERS = {
  'ORD-2026': {
    orderId: 'ORD-2026',
    amount: 2450,
    table: 4,
    note: 'Demo Valid Order',
  },
  'ORD-2027': {
    orderId: 'ORD-2027',
    amount: 3100,
    table: 7,
    note: 'Walk-in Table 7',
  },
  'ORD-2028': {
    orderId: 'ORD-2028',
    amount: 2150,
    table: 2,
    note: 'Walk-in Table 2',
  },
  'ORD-101': {
    orderId: 'ORD-101',
    amount: 850,
    table: 1,
    note: 'Demo Below ₹2,000',
  },
};

function createSeedLeaderboards() {
  const now = Date.now();
  return {
    flappy: [
      {
        id: 'seed-f-1',
        playerName: 'Aarav',
        table: 5,
        orderId: 'ORD-1901',
        score: 6,
        timestamp: now - 1000 * 60 * 48,
      },
      {
        id: 'seed-f-2',
        playerName: 'Meera',
        table: 2,
        orderId: 'ORD-1898',
        score: 4,
        timestamp: now - 1000 * 60 * 92,
      },
      {
        id: 'seed-f-3',
        playerName: 'Kabir',
        table: 8,
        orderId: 'ORD-1884',
        score: 2,
        timestamp: now - 1000 * 60 * 145,
      },
    ],
    snake: [
      {
        id: 'seed-s-1',
        playerName: 'Ananya',
        table: 3,
        orderId: 'ORD-1904',
        score: 40,
        timestamp: now - 1000 * 60 * 35,
      },
      {
        id: 'seed-s-2',
        playerName: 'Rohan',
        table: 6,
        orderId: 'ORD-1890',
        score: 30,
        timestamp: now - 1000 * 60 * 78,
      },
      {
        id: 'seed-s-3',
        playerName: 'Diya',
        table: 1,
        orderId: 'ORD-1872',
        score: 20,
        timestamp: now - 1000 * 60 * 130,
      },
    ],
    puzzle: [
      {
        id: 'seed-p-1',
        playerName: 'Vivaan',
        table: 9,
        orderId: 'ORD-1909',
        score: 120,
        timestamp: now - 1000 * 60 * 24,
      },
      {
        id: 'seed-p-2',
        playerName: 'Sanya',
        table: 4,
        orderId: 'ORD-1895',
        score: 88,
        timestamp: now - 1000 * 60 * 64,
      },
      {
        id: 'seed-p-3',
        playerName: 'Ishaan',
        table: 7,
        orderId: 'ORD-1881',
        score: 52,
        timestamp: now - 1000 * 60 * 115,
      },
    ],
  };
}

function readJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

function ensureSeeded() {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(KEYS.VALID_ORDERS) === null) {
    writeJSON(KEYS.VALID_ORDERS, SEED_ORDERS);
  }
  if (window.localStorage.getItem(KEYS.LEADERBOARDS) === null) {
    writeJSON(KEYS.LEADERBOARDS, createSeedLeaderboards());
  }
  if (window.localStorage.getItem(KEYS.LOCKED_ORDERS) === null) {
    writeJSON(KEYS.LOCKED_ORDERS, {});
  }
  if (window.localStorage.getItem(KEYS.VOUCHERS) === null) {
    writeJSON(KEYS.VOUCHERS, []);
  }
  if (window.localStorage.getItem(KEYS.SETTINGS) === null) {
    writeJSON(KEYS.SETTINGS, DEFAULT_SETTINGS);
  }
}

ensureSeeded();

export function formatINR(amount) {
  const num = Number(amount) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
}

export function formatTimestamp(ts) {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

export function getSettings() {
  ensureSeeded();
  return { ...DEFAULT_SETTINGS, ...readJSON(KEYS.SETTINGS, DEFAULT_SETTINGS) };
}

export function updateSettings(partial) {
  const next = { ...getSettings(), ...partial };
  writeJSON(KEYS.SETTINGS, next);
  return next;
}

export function getValidOrders() {
  ensureSeeded();
  return readJSON(KEYS.VALID_ORDERS, { ...SEED_ORDERS });
}

export function addValidOrder({ orderId, amount, table = 1, note = '' }) {
  const normalizedId = String(orderId || '').trim().toUpperCase();
  if (!normalizedId) return null;
  const orders = getValidOrders();
  const entry = {
    orderId: normalizedId,
    amount: Math.max(0, Number(amount) || 0),
    table: Math.max(1, Number(table) || 1),
    note: String(note || '').trim() || 'Added by Staff',
  };
  orders[normalizedId] = entry;
  writeJSON(KEYS.VALID_ORDERS, orders);
  return entry;
}

export function removeValidOrder(orderId) {
  const normalizedId = String(orderId || '').trim().toUpperCase();
  const orders = getValidOrders();
  delete orders[normalizedId];
  writeJSON(KEYS.VALID_ORDERS, orders);
}

export function getLockedOrders() {
  ensureSeeded();
  return readJSON(KEYS.LOCKED_ORDERS, {});
}

export function unlockOrder(orderId) {
  const normalizedId = String(orderId || '').trim().toUpperCase();
  const locked = getLockedOrders();
  delete locked[normalizedId];
  writeJSON(KEYS.LOCKED_ORDERS, locked);

  const active = getActiveSession();
  if (active && active.orderId === normalizedId) {
    clearActiveSession();
  }
}

export function getActiveSession() {
  ensureSeeded();
  return readJSON(KEYS.ACTIVE_SESSION, null);
}

export function clearActiveSession() {
  try {
    window.localStorage.removeItem(KEYS.ACTIVE_SESSION);
  } catch {
    // ignore
  }
}

export function verifyAndStartSession({ table, playerName, orderId, orderValue }) {
  ensureSeeded();
  const settings = getSettings();
  const minAmount = Number(settings.minOrderAmount) || 2000;
  const cleanName = String(playerName || '').trim();
  const normalizedId = String(orderId || '').trim().toUpperCase();
  const tableNum = Math.max(1, Number(table) || 1);

  if (!cleanName) {
    return {
      ok: false,
      reason: 'missing_name',
      message: 'Please enter a player nickname for the leaderboard.',
    };
  }

  if (!normalizedId) {
    return {
      ok: false,
      reason: 'missing_order',
      message: 'Please enter your Order ID from the cafe receipt.',
    };
  }

  const orders = getValidOrders();
  const validOrder = orders[normalizedId];
  if (!validOrder) {
    return {
      ok: false,
      reason: 'not_found',
      message: `Order "${normalizedId}" was not found in today's cafe POS. Try ORD-2026 in Demo Mode or ask a server.`,
    };
  }

  const typedAmount = Number(orderValue);
  const posAmount = Number(validOrder.amount);
  const effectiveAmount = posAmount;

  if (Number.isFinite(typedAmount) && typedAmount > 0 && typedAmount !== posAmount) {
    // Verify against POS truth when user typed a mismatched number
    if (typedAmount < minAmount && posAmount < minAmount) {
      const deficit = minAmount - posAmount;
      return {
        ok: false,
        reason: 'below_minimum',
        amount: posAmount,
        deficit,
        message: `Order ${normalizedId} is ${formatINR(posAmount)}. Add ${formatINR(deficit)} more to your order to unlock free dessert games!`,
      };
    }
    if (typedAmount >= minAmount && posAmount < minAmount) {
      const deficit = minAmount - posAmount;
      return {
        ok: false,
        reason: 'below_minimum',
        amount: posAmount,
        deficit,
        message: `POS shows ${normalizedId} is ${formatINR(posAmount)}. Add ${formatINR(deficit)} more to reach the ${formatINR(minAmount)} minimum.`,
      };
    }
  }

  if (effectiveAmount < minAmount) {
    const deficit = minAmount - effectiveAmount;
    return {
      ok: false,
      reason: 'below_minimum',
      amount: effectiveAmount,
      deficit,
      message: `Order ${normalizedId} is ${formatINR(effectiveAmount)}. Order ${formatINR(deficit)} more to unlock free dessert games!`,
    };
  }

  const locked = getLockedOrders();
  const existingLock = locked[normalizedId];
  const currentSession = getActiveSession();

  if (existingLock && (!currentSession || currentSession.sessionId !== existingLock.sessionId)) {
    return {
      ok: false,
      reason: 'already_used',
      lockedBy: existingLock.playerName,
      table: existingLock.table,
      message: `Order ${normalizedId} is already locked to ${existingLock.playerName} (Table ${existingLock.table}). Ask staff to unlock if needed.`,
    };
  }

  const session = {
    sessionId: existingLock?.sessionId || `SES-${Date.now().toString(36).toUpperCase()}`,
    orderId: normalizedId,
    playerName: cleanName.slice(0, 18),
    table: tableNum,
    orderValue: effectiveAmount,
    startedAt: existingLock?.lockedAt || Date.now(),
    playsUsed: existingLock?.playsUsed || 0,
  };

  locked[normalizedId] = {
    sessionId: session.sessionId,
    playerName: session.playerName,
    table: session.table,
    orderValue: session.orderValue,
    lockedAt: session.startedAt,
    playsUsed: session.playsUsed,
  };

  writeJSON(KEYS.LOCKED_ORDERS, locked);
  writeJSON(KEYS.ACTIVE_SESSION, session);
  return { ok: true, session };
}

export function canPlayMore() {
  const session = getActiveSession();
  if (!session) return { allowed: false, remaining: 0, limit: 0 };
  const settings = getSettings();
  const limit = Number(settings.maxPlaysPerSession) || 0;
  if (limit <= 0) return { allowed: true, remaining: Infinity, limit: 0 };
  const used = Number(session.playsUsed) || 0;
  const remaining = Math.max(0, limit - used);
  return { allowed: remaining > 0, remaining, limit };
}

export function incrementSessionPlays() {
  const session = getActiveSession();
  if (!session) return null;
  const updated = {
    ...session,
    playsUsed: (Number(session.playsUsed) || 0) + 1,
  };
  writeJSON(KEYS.ACTIVE_SESSION, updated);

  const locked = getLockedOrders();
  if (locked[session.orderId]) {
    locked[session.orderId].playsUsed = updated.playsUsed;
    writeJSON(KEYS.LOCKED_ORDERS, locked);
  }
  return updated;
}

export function getAllLeaderboards() {
  ensureSeeded();
  const data = readJSON(KEYS.LEADERBOARDS, createSeedLeaderboards());
  const normalized = {};
  for (const id of GAME_ORDER) {
    const list = Array.isArray(data[id]) ? data[id] : [];
    normalized[id] = [...list].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.timestamp || 0) - (b.timestamp || 0);
    });
  }
  return normalized;
}

export function getLeaderboard(gameId) {
  return getAllLeaderboards()[gameId] || [];
}

function generateVoucherCode(gameId) {
  const prefix = gameId === 'flappy' ? 'BRW' : gameId === 'snake' ? 'GEL' : 'WAF';
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CC-${prefix}-${rand}`;
}

export function getVouchers() {
  ensureSeeded();
  const vouchers = readJSON(KEYS.VOUCHERS, []);
  return [...vouchers].sort((a, b) => (b.issuedAt || 0) - (a.issuedAt || 0));
}

export function redeemVoucher(code) {
  const vouchers = getVouchers();
  const idx = vouchers.findIndex((v) => v.code === code);
  if (idx === -1) return null;
  vouchers[idx] = {
    ...vouchers[idx],
    redeemed: !vouchers[idx].redeemed,
    redeemedAt: !vouchers[idx].redeemed ? Date.now() : null,
  };
  writeJSON(KEYS.VOUCHERS, vouchers);
  return vouchers[idx];
}

export function submitScore(gameId, rawScore) {
  ensureSeeded();
  const session = getActiveSession();
  const score = Math.max(0, Math.floor(Number(rawScore) || 0));
  const boards = getAllLeaderboards();
  const list = [...(boards[gameId] || [])];
  const prevTop = list.length > 0 ? list[0].score : 0;
  const isNewRecord = score > prevTop && score > 0;

  const entry = {
    id: `sc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    playerName: session?.playerName || 'Guest',
    table: session?.table || 1,
    orderId: session?.orderId || 'GUEST',
    score,
    timestamp: Date.now(),
  };

  let rank = list.length + 1;
  if (score > 0) {
    list.push(entry);
    list.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.timestamp || 0) - (b.timestamp || 0);
    });
    boards[gameId] = list.slice(0, 25);
    writeJSON(KEYS.LEADERBOARDS, boards);
    rank = boards[gameId].findIndex((item) => item.id === entry.id) + 1;
  }

  let voucher = null;
  if (isNewRecord && session) {
    const game = GAMES[gameId];
    voucher = {
      code: generateVoucherCode(gameId),
      gameId,
      gameName: game.name,
      prize: game.prize,
      prizeEmoji: game.prizeEmoji,
      playerName: session.playerName,
      table: session.table,
      orderId: session.orderId,
      score,
      issuedAt: Date.now(),
      redeemed: false,
      redeemedAt: null,
    };
    const vouchers = getVouchers();
    vouchers.unshift(voucher);
    writeJSON(KEYS.VOUCHERS, vouchers);
  }

  return { entry, isNewRecord, rank, voucher, prevTop };
}

export function resetDailyData() {
  writeJSON(KEYS.LEADERBOARDS, createSeedLeaderboards());
  writeJSON(KEYS.LOCKED_ORDERS, {});
  writeJSON(KEYS.VOUCHERS, []);
  clearActiveSession();
}
