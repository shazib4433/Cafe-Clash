import React, { useState, useEffect, useCallback } from 'react';
import Verification from './components/Verification';
import GameHub from './components/GameHub';
import Leaderboard from './components/Leaderboard';
import AdminPanel from './components/AdminPanel';
import VoucherModal from './components/VoucherModal';
import FlappyGame from './games/FlappyGame';
import SnakeGame from './games/SnakeGame';
import PuzzleGame from './games/PuzzleGame';
import { getActiveSession, clearActiveSession } from './services/storage';
import { sound } from './services/sound';

function parseTableFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const val = Number(params.get('table'));
    if (Number.isInteger(val) && val >= 1 && val <= 20) return val;
  } catch {
    // ignore
  }
  return 4;
}

function isAdminPath() {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return path === '/admin' || path.endsWith('/admin') || hash === '#admin';
}

export default function App() {
  const [initialTable] = useState(() => parseTableFromUrl());
  const [session, setSession] = useState(() => getActiveSession());
  const [view, setView] = useState(() => {
    if (isAdminPath()) return 'admin';
    return getActiveSession() ? 'hub' : 'verification';
  });
  const [activeGame, setActiveGame] = useState(null);
  const [leaderboardTab, setLeaderboardTab] = useState('flappy');
  const [muted, setMuted] = useState(() => sound.isMuted());
  const [voucherModal, setVoucherModal] = useState(null); // { voucher, celebrate }
  const [, setRefreshTick] = useState(0);

  useEffect(() => {
    const handlePopState = () => {
      if (isAdminPath()) {
        setView('admin');
      } else {
        const current = getActiveSession();
        setSession(current);
        setView(current ? 'hub' : 'verification');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openAdmin = useCallback(() => {
    try {
      if (!isAdminPath()) {
        window.history.pushState({}, '', '/admin');
      }
    } catch {
      // ignore
    }
    setView('admin');
  }, []);

  const exitAdmin = useCallback(() => {
    try {
      if (isAdminPath()) {
        window.history.pushState({}, '', '/');
      }
    } catch {
      // ignore
    }
    const current = getActiveSession();
    setSession(current);
    setView(current ? 'hub' : 'verification');
  }, []);

  const handleToggleMute = useCallback(() => {
    const nextMuted = sound.toggleMute();
    setMuted(nextMuted);
  }, []);

  const handleVerified = useCallback((newSession) => {
    setSession(newSession);
    setView('hub');
  }, []);

  const handleEndSession = useCallback(() => {
    clearActiveSession();
    setSession(null);
    setActiveGame(null);
    setView('verification');
  }, []);

  const handlePlayGame = useCallback((gameId) => {
    setActiveGame(gameId);
    setView('game');
  }, []);

  const handleOpenLeaderboard = useCallback((tabId = 'flappy') => {
    setLeaderboardTab(tabId);
    setActiveGame(null);
    setView('leaderboard');
  }, []);

  const handleOpenVoucher = useCallback((voucher, celebrate = true) => {
    setVoucherModal({ voucher, celebrate });
  }, []);

  const renderScreen = () => {
    if (view === 'admin') {
      return (
        <AdminPanel
          onBack={exitAdmin}
          onDataChanged={() => {
            setSession(getActiveSession());
            setRefreshTick((t) => t + 1);
          }}
        />
      );
    }

    if (!session || view === 'verification') {
      return (
        <Verification
          initialTable={initialTable}
          onVerified={handleVerified}
          onOpenAdmin={openAdmin}
        />
      );
    }

    if (view === 'game' && activeGame) {
      const commonProps = {
        muted,
        onToggleMute: handleToggleMute,
        onExit: () => {
          setSession(getActiveSession());
          setActiveGame(null);
          setView('hub');
        },
        onOpenLeaderboard: handleOpenLeaderboard,
        onOpenVoucher: (v) => handleOpenVoucher(v, true),
      };

      if (activeGame === 'flappy') return <FlappyGame {...commonProps} />;
      if (activeGame === 'snake') return <SnakeGame {...commonProps} />;
      if (activeGame === 'puzzle') return <PuzzleGame {...commonProps} />;
    }

    if (view === 'leaderboard') {
      return (
        <Leaderboard
          session={session}
          initialTab={leaderboardTab}
          onBackToHub={() => setView('hub')}
          onOpenAdmin={openAdmin}
        />
      );
    }

    return (
      <GameHub
        session={session}
        muted={muted}
        onToggleMute={handleToggleMute}
        onPlayGame={handlePlayGame}
        onOpenLeaderboard={handleOpenLeaderboard}
        onOpenVoucher={(v) => handleOpenVoucher(v, false)}
        onEndSession={handleEndSession}
        onOpenAdmin={openAdmin}
      />
    );
  };

  return (
    <div className="h-[100dvh] w-full bg-[#1B0F0A] flex items-center justify-center overflow-hidden">
      <div className="relative h-full w-full max-w-[430px] bg-[#FDF8F2] shadow-2xl overflow-hidden md:border-x md:border-amber-900/40">
        {renderScreen()}

        {voucherModal && (
          <VoucherModal
            voucher={voucherModal.voucher}
            celebrate={voucherModal.celebrate}
            onClose={() => setVoucherModal(null)}
          />
        )}
      </div>
    </div>
  );
}
