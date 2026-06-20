/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sparkles, LogOut, ShieldCheck, UserCheck } from 'lucide-react';
import { User } from '../types';
import { playTickSound } from '../utils/audio';

interface NavigationProps {
  currentUser: User | null;
  onLogin: () => void;
  onLogout: () => void;
  activeTab: 'user' | 'admin';
  setActiveTab: (tab: 'user' | 'admin') => void;
  onOpenProfile: () => void;
}

export default function Navigation({ 
  currentUser, 
  onLogin, 
  onLogout, 
  activeTab, 
  setActiveTab,
  onOpenProfile
}: NavigationProps) {
  return (
    <header id="app-header" className="sticky top-0 z-40 w-full border-b border-purple-950/40 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Simple & Elegant Logo with Purple-Red gradient design */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/10 to-red-500/10 border border-purple-500/20 shadow-[0_0_12px_rgba(168,85,247,0.15)] animate-pulse">
            <Sparkles className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <span className="font-display text-base font-extrabold tracking-tight text-white">
              Golden<span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 bg-clip-text text-transparent">Draw</span>
            </span>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-4">
          {currentUser && currentUser.isAuthenticated && (
            <div className="flex items-center rounded-lg bg-zinc-950 p-0.5 border border-purple-950/40">
              <button
                id="tab-user-btn"
                onClick={() => setActiveTab('user')}
                className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer ${
                  activeTab === 'user'
                    ? 'bg-gradient-to-r from-purple-900/40 to-red-900/20 text-white border border-purple-500/20 shadow-sm font-bold'
                    : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                }`}
              >
                <UserCheck className="h-3.5 w-3.5 text-purple-400" />
                User panel
              </button>
              
              {currentUser.isAdmin && (
                <button
                  id="tab-admin-btn"
                  onClick={() => setActiveTab('admin')}
                  className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-150 cursor-pointer ${
                    activeTab === 'admin'
                      ? 'bg-gradient-to-r from-purple-900/40 to-red-900/20 text-white border border-purple-500/20 shadow-sm font-bold'
                      : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-red-400" />
                  Admin panel
                </button>
              )}
            </div>
          )}

          {/* Account profile */}
          <div className="relative">
            {currentUser && currentUser.isAuthenticated ? (
              <div className="flex items-center gap-3">
                {/* Clickable Profile trigger wrapper */}
                <div 
                  id="profile-trigger-box"
                  onClick={() => {
                    playTickSound();
                    onOpenProfile();
                  }}
                  className="flex items-center gap-3 cursor-pointer hover:bg-white/[0.03] border border-purple-950/25 active:scale-98 transition duration-150 p-1 sm:px-2 sm:py-1 rounded-xl group"
                  title="Click to view history and profile options"
                >
                  {/* Gold Coins Badge */}
                  <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/10 via-yellow-450/5 to-amber-600/15 border border-amber-500/30 px-2 py-0.5 text-xs text-amber-300 font-extrabold shadow-[0_0_12px_rgba(234,179,8,0.1)] select-none">
                    <span className="text-sm select-none">🪙</span>
                    <span className="font-mono text-amber-300 text-sm">{currentUser.isAdmin ? '∞' : (currentUser.goldCoins ?? 0)}</span>
                    <span className="text-[9px] uppercase tracking-wider text-amber-505 font-sans hidden sm:inline">
                      {currentUser.isAdmin ? 'Unlimited' : 'Coins'}
                    </span>
                  </div>

                  <div className="hidden flex-col items-end sm:flex leading-none text-right">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-zinc-200 group-hover:text-purple-300 transition duration-150">{currentUser.name}</span>
                      {currentUser.isAdmin && (
                        <span className="rounded bg-red-500/10 px-1 py-0.5 text-[8px] font-mono font-medium text-red-400 border border-red-500/20">
                          Admin
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono mt-0.5">Click profile ⚙️</span>
                  </div>

                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-purple-800/40 shadow-[0_0_8px_rgba(168,85,247,0.2)] group-hover:border-purple-400 transition duration-150 overflow-hidden">
                    <img
                      src={currentUser.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(currentUser.name)}`}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full rounded-full object-cover scale-105"
                    />
                  </div>
                </div>

                <button
                  id="btn-logout"
                  onClick={onLogout}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition active:scale-95 cursor-pointer ml-1"
                  title="Sign Out"
                >
                  <LogOut className="h-4.5 w-4.5" />
                </button>
              </div>
            ) : (
              <button
                id="google-login-btn"
                onClick={onLogin}
                className="flex items-center gap-2 rounded-lg bg-zinc-950 px-3.5 py-2 text-xs font-semibold text-zinc-200 border border-purple-900/20 shadow-sm hover:bg-zinc-900 hover:border-purple-500/40 transition active:scale-95 duration-100 cursor-pointer"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google Sign In
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
