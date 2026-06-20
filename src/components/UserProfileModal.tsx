/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Coins, 
  Trophy, 
  Users, 
  Copy, 
  Check, 
  Calendar, 
  AlertCircle, 
  Hourglass, 
  ArrowUpRight, 
  ArrowDownLeft, 
  User as UserIcon,
  Ticket as TicketIcon
} from 'lucide-react';
import { User, Ticket, PastWinner, CoinTransaction } from '../types';
import { playClickSound, playSuccessSound, playTickSound } from '../utils/audio';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  tickets: Ticket[];
  pastWinners: PastWinner[];
  coinTransactions: CoinTransaction[];
  onUpdateCoins: (amount: number, reason?: string) => void;
}

export default function UserProfileModal({
  isOpen,
  onClose,
  currentUser,
  tickets,
  pastWinners,
  coinTransactions,
  onUpdateCoins
}: UserProfileModalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'coins' | 'draws' | 'refer'>('coins');
  
  // Refer & Earn state
  const [friendCode, setFriendCode] = useState<string>('');
  const [referralSuccess, setReferralSuccess] = useState<string>('');
  const [referralError, setReferralError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [simulatedFriends, setSimulatedFriends] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  if (!isOpen || !currentUser) return null;

  const getReferralCode = (email: string) => {
    const cleanMail = email.split('@')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
    return `LOT-${cleanMail || 'REF'}`;
  };

  const myReferralCode = getReferralCode(currentUser.email || 'guest');
  const userBoughtTickets = tickets.filter(t => t.userEmail?.toLowerCase() === currentUser.email?.toLowerCase());

  const handleCopyCode = () => {
    navigator.clipboard.writeText(myReferralCode);
    setCopied(true);
    playClickSound();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateFriend = () => {
    setIsSimulating(true);
    playTickSound();
    
    const friendNames = [
      "Sourav Ganguly", "Rahul Dravid", "Sachin Tendulkar", "MS Dhoni",
      "Virat Kohli", "Rohit Sharma", "Jasprit Bumrah", "Hardik Pandya"
    ];
    const unusedNames = friendNames.filter(name => !simulatedFriends.includes(name));
    const chosenName = unusedNames.length > 0 
      ? unusedNames[Math.floor(Math.random() * unusedNames.length)]
      : `Referred Friend #${simulatedFriends.length + 1}`;

    setTimeout(() => {
      onUpdateCoins(15, `Referral Reward: Friend (${chosenName}) joined with your code`);
      setSimulatedFriends(prev => [...prev, chosenName]);
      setIsSimulating(false);
      setReferralSuccess(`Success! ${chosenName} joined using your code. You got +15 Coins!`);
      playSuccessSound();
      setTimeout(() => setReferralSuccess(''), 5000);
    }, 1200);
  };

  const handleRedeemCode = () => {
    const cleanCode = friendCode.trim().toUpperCase();
    if (!cleanCode) {
      setReferralError("Please enter a referral code or coupon.");
      return;
    }

    // List of premium Hot Coupons
    const hotCoupons: Record<string, { prize: number; msg: string }> = {
      'GOLDEN50': { prize: 50, msg: "🔥 Supercharged! Coupon GOLDEN50 redeemed! You received +50 Golden Coins." },
      'WELCOME15': { prize: 15, msg: "🎉 Welcome reward! Coupon WELCOME15 redeemed! You received +15 Golden Coins." },
      'SUPERCHARGE': { prize: 100, msg: "👑 Ultimate Boost! Coupon SUPERCHARGE redeemed! You received +100 Golden Coins." }
    };

    const redeemedList = JSON.parse(localStorage.getItem('redeemed_codes') || '[]');
    if (redeemedList.includes(cleanCode)) {
      setReferralError("Already redeemed this code!");
      return;
    }

    if (hotCoupons[cleanCode]) {
      const couponDetail = hotCoupons[cleanCode];
      playSuccessSound();
      onUpdateCoins(couponDetail.prize, `Promo Coupon: ${cleanCode} (+${couponDetail.prize} Coins)`);
      localStorage.setItem('redeemed_codes', JSON.stringify([...redeemedList, cleanCode]));
      setReferralSuccess(couponDetail.msg);
      setReferralError('');
      setFriendCode('');
      setTimeout(() => setReferralSuccess(''), 6000);
      return;
    }

    // If it's a referral code
    if (cleanCode === myReferralCode) {
      setReferralError("You cannot redeem your own referral code!");
      return;
    }

    if (!cleanCode.startsWith('LOT-')) {
      setReferralError("Code must start with LOT- or enter a verified hot coupon (e.g. GOLDEN50).");
      return;
    }

    playSuccessSound();
    onUpdateCoins(15, `Referral Code Redeemed: ${cleanCode} (+15 Coins)`);
    localStorage.setItem('redeemed_codes', JSON.stringify([...redeemedList, cleanCode]));
    setReferralSuccess(`Success! Redeemed code ${cleanCode} for +15 Gold Coins.`);
    setReferralError('');
    setFriendCode('');
    setTimeout(() => setReferralSuccess(''), 5000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop visual glassmorphism overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative w-full max-w-2xl rounded-2xl border border-purple-900/40 bg-zinc-950 p-5 sm:p-6 shadow-[0_0_50px_rgba(168,85,247,0.12)] overflow-hidden text-zinc-300 z-10 font-sans"
        >
          {/* Subtle decoration light bands */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-purple-500/10 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />

          {/* Modal Header */}
          <div className="flex items-start justify-between border-b border-purple-950/40 pb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-14 w-14 rounded-full border-2 border-purple-500 p-0.5 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                  <img
                    src={currentUser.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(currentUser.name)}`}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>
                {currentUser.isAdmin && (
                  <span className="absolute -bottom-1 -right-1 rounded bg-red-600 px-1 py-0.5 text-[8px] font-mono font-black text-white uppercase tracking-wider scale-90 border border-red-500 shadow-lg">
                    Admin
                  </span>
                )}
              </div>
              <div className="space-y-0.5">
                <h2 className="font-display text-base font-black text-white flex items-center gap-2">
                  <span>{currentUser.name}</span>
                </h2>
                <p className="text-xs text-zinc-400 font-mono tracking-wide">{currentUser.email}</p>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 font-bold">
                  <span>🪙 {currentUser.isAdmin ? 'Unlimited (Admin)' : `${currentUser.goldCoins ?? 0} Coins`}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                playClickSound();
                onClose();
              }}
              className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-900 hover:text-white transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center border-b border-purple-950/30 py-2 gap-1 overflow-x-auto scrollbar-none">
            <button
              onClick={() => {
                setActiveSubTab('coins');
                playClickSound();
              }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'coins'
                  ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
              }`}
            >
              <Coins className="h-3.5 w-3.5" />
              <span>Coin History</span>
            </button>
            <button
              onClick={() => {
                setActiveSubTab('draws');
                playClickSound();
              }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'draws'
                  ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
              }`}
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>Lottery Result History</span>
            </button>
            <button
              onClick={() => {
                setActiveSubTab('refer');
                playClickSound();
              }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === 'refer'
                  ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Refer & Earn</span>
            </button>
          </div>

          {/* Quick Premium Stats Bento Box Row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 p-3 rounded-2xl border border-purple-900/15 bg-black/45">
            {/* Stat 1: Coins */}
            <div className="text-center p-2 rounded-xl bg-zinc-950/80 border border-zinc-900/60 flex flex-col justify-center items-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block mb-0.5">Coins Balance</span>
              <div className="flex items-center gap-1">
                <span className="text-amber-400 text-xs">🪙</span>
                <span className="font-mono text-xs sm:text-sm font-black text-amber-400">{currentUser.isAdmin ? '∞' : (currentUser.goldCoins ?? 0)}</span>
              </div>
            </div>

            {/* Stat 2: Active Tickets */}
            <div className="text-center p-2 rounded-xl bg-zinc-950/80 border border-zinc-900/60 flex flex-col justify-center items-center shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block mb-0.5">Active Tickets</span>
              <div className="flex items-center gap-1">
                <span className="text-purple-400 text-xs">🎟️</span>
                <span className="font-mono text-xs sm:text-sm font-black text-purple-300">{userBoughtTickets.length} Nos</span>
              </div>
            </div>

            {/* Stat 3: Player VIP Rank */}
            {(() => {
              const count = userBoughtTickets.length;
              let rank = "Bronze Novice";
              let colorClass = "text-zinc-400 border-zinc-900 bg-zinc-950/40";
              if (count >= 1 && count <= 3) {
                rank = "Silver Elite";
                colorClass = "text-slate-300 border-slate-800 bg-slate-500/10 shadow-[0_0_10px_rgba(148,163,184,0.05)]";
              } else if (count >= 4 && count <= 8) {
                rank = "Gold Legend";
                colorClass = "text-amber-400 border-amber-500/15 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.08)]";
              } else if (count >= 9) {
                rank = "Diamond VIP 👑";
                colorClass = "text-purple-400 border-purple-500/20 bg-purple-500/15 font-bold shadow-[0_0_15px_rgba(168,85,247,0.15)] animate-pulse";
              }
              
              return (
                <div className={`text-center p-2 rounded-xl border flex flex-col justify-center items-center ${colorClass}`}>
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block mb-0.5">VIP Tier Rank</span>
                  <span className="text-[10px] uppercase font-black tracking-wide truncate max-w-full">{rank}</span>
                </div>
              );
            })()}
          </div>

          {/* Modal Tab Contents Container (Reduced height slightly for layout fit) */}
          <div className="py-4 h-[280px] overflow-y-auto pr-1">
            
            {/* 1. COIN HISTORY TAB */}
            {activeSubTab === 'coins' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-purple-400">Coins Ledger</h3>
                  <span className="text-[10px] text-zinc-500 font-mono">Real-time Cloud Log</span>
                </div>

                {coinTransactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-purple-950/20 rounded-xl bg-black/20">
                    <Coins className="h-8 w-8 text-zinc-700 mb-2 animate-bounce" />
                    <p className="text-xs text-zinc-500">No coin transactions detected</p>
                    <p className="text-[10px] text-zinc-600 mt-1">Book ticket numbers or invite friends to receive coins!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {coinTransactions.map((tx) => {
                      const isPositive = tx.amount > 0;
                      return (
                        <div 
                          key={tx.id} 
                          className="flex items-center justify-between p-3 rounded-xl border border-purple-955/10 bg-black/30 backdrop-blur-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg border ${
                              isPositive 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            }`}>
                              {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-zinc-200 leading-snug">{tx.reason}</p>
                              <p className="text-[10px] text-zinc-550 font-mono mt-0.5">
                                {new Date(tx.timestamp).toLocaleString(undefined, {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                })}
                              </p>
                            </div>
                          </div>
                          
                          <div className={`font-mono text-xs font-black ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPositive ? '+' : ''}{tx.amount} 🪙
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 2. LOTTERY DRAW RESULTS CHECKER TAB */}
            {activeSubTab === 'draws' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-purple-400">Past Winners & Results Check</h3>
                  <span className="text-[10px] text-zinc-500 font-mono">Drawn sequentially</span>
                </div>

                {pastWinners.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-purple-950/20 rounded-xl bg-black/20">
                    <Trophy className="h-8 w-8 text-zinc-700 mb-2" />
                    <p className="text-xs text-zinc-500">No lottery draws have taken place yet</p>
                    <p className="text-[10px] text-zinc-650 mt-1">Admin will release official lucky draw results soon.</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {pastWinners.map((pw) => {
                      // Filter tickets that match user email
                      const userTicketsInThisRound = userBoughtTickets.filter(ticket => {
                        // Match if ticket bought before or on draw day, but for verification let's check
                        // if any user ticket matches this winning number or was involved!
                        return ticket.status === 'approved';
                      });

                      // Check if user has exact win
                      const winningUserTickets = userTicketsInThisRound.filter(t => t.number === pw.winningNumber);
                      const hasExactWin = winningUserTickets.length > 0;

                      return (
                        <div 
                          key={pw.id} 
                          className="p-3.5 rounded-xl border border-purple-950/20 bg-black/40 space-y-3"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5 text-purple-500" />
                              <span className="text-xs font-semibold text-zinc-350">{pw.drawnAt}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Winning:</span>
                              <span className="font-mono text-xs font-black text-white bg-purple-950/60 border border-purple-500/20 px-2 py-0.5 rounded shadow-sm">
                                {pw.winningNumber}
                              </span>
                            </div>
                          </div>

                          {/* Verification checker box */}
                          <div className="rounded-lg bg-zinc-950 p-2.5 border border-zinc-900 text-left space-y-1.5 leading-none">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-zinc-400">
                              <span className="text-zinc-500 font-semibold flex items-center gap-1">
                                <TicketIcon className="h-3 w-3 text-purple-400" />
                                Your Tickets this drawing
                              </span>
                              <span className="font-mono text-zinc-405">{userTicketsInThisRound.length} Approved</span>
                            </div>

                            {userTicketsInThisRound.length === 0 ? (
                              <p className="text-[10px] text-zinc-600 italic">No tickets purchased for this drawing round</p>
                            ) : (
                              <div className="space-y-1.5 pt-1">
                                <div className="flex flex-wrap gap-1.5">
                                  {userTicketsInThisRound.map((ticket) => {
                                    const isTicketWinner = ticket.number === pw.winningNumber;
                                    return (
                                      <span 
                                        key={ticket.id} 
                                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded font-mono text-[10px] font-bold ${
                                          isTicketWinner 
                                            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-305' 
                                            : 'bg-zinc-900 border border-zinc-900 text-zinc-450'
                                        }`}
                                      >
                                        <span>🎟️ {ticket.number}</span>
                                        {isTicketWinner ? (
                                          <span className="text-[8px] bg-amber-500/20 text-amber-300 font-sans px-1 rounded uppercase tracking-wider font-extrabold animate-bounce">
                                            WINNER
                                          </span>
                                        ) : (
                                          <span className="text-[8px] text-zinc-650 font-sans font-medium uppercase font-semibold">
                                            No Match
                                          </span>
                                        )}
                                      </span>
                                    );
                                  })}
                                </div>
                                {hasExactWin && (
                                  <div className="pt-1 flex flex-col gap-1 text-amber-400 animate-pulse">
                                    <div className="flex items-center gap-1.5">
                                      <Trophy className="h-3.5 w-3.5" />
                                      <span className="text-[10px] font-black uppercase tracking-wider">
                                        JACKPOT HIT! Take a screenshot & email Support.
                                      </span>
                                    </div>
                                    <p className="text-[9px] font-mono text-zinc-400 pl-5">
                                      Support: <a href="mailto:goldendraw777@gmail.com" className="hover:underline text-amber-300">goldendraw777@gmail.com</a>
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 3. REFER & EARN / REPAIR & EARN TAB */}
            {activeSubTab === 'refer' && (
              <div className="space-y-5">
                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="text-xs font-black uppercase tracking-wider text-purple-400">Refer & Earn Station</h3>
                  <p className="text-[11px] text-zinc-400">
                    Invite users or redeem reference keys to claim coins instantly. 🪙 30 coins = 1 FREE Ticket!
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Share code block */}
                  <div className="rounded-xl border border-amber-500/10 bg-amber-500/[0.02] p-4 flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-amber-400">
                        <Users className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Your Referral Code</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-normal">
                        Give this to your friends. When they use it to verify, you instantly get <strong className="text-amber-300 font-bold">+15 coins</strong>.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-black/60 rounded-xl border border-amber-500/20 text-amber-300 font-mono text-sm font-bold py-2 px-3 text-center tracking-wider">
                        {myReferralCode}
                      </div>
                      <button
                        onClick={handleCopyCode}
                        className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 active:scale-95 transition cursor-pointer"
                        title="Copy Code"
                      >
                        {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="rounded-xl border border-amber-500/10 bg-amber-500/[0.02] p-4 flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-amber-400">
                        <Trophy className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Redeem Code</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-normal">
                        Enter a friend's referral key or coupon below to top up your balance with <strong className="text-amber-305 font-bold">+15 Coins</strong>.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={friendCode}
                          onChange={(e) => {
                            setFriendCode(e.target.value);
                            setReferralError('');
                            setReferralSuccess('');
                          }}
                          placeholder="e.g. LOT-ADIL"
                          className="flex-1 rounded-xl bg-black/60 border border-amber-500/20 px-3 py-2 font-mono text-xs uppercase text-amber-200 placeholder-zinc-700 tracking-wider focus:outline-none focus:border-amber-400"
                        />
                        <button
                          onClick={handleRedeemCode}
                          className="bg-amber-500 hover:bg-amber-400 text-zinc-955 font-black text-xs px-3 py-2 rounded-xl uppercase tracking-wider active:scale-95 transition cursor-pointer"
                        >
                          Verify
                        </button>
                      </div>

                      {referralError && (
                        <p className="text-[9px] text-rose-400 font-medium font-sans animate-fade-in">{referralError}</p>
                      )}
                      {referralSuccess && (
                        <p className="text-[9px] text-emerald-400 font-bold font-sans animate-pulse">{referralSuccess}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* System Hot Coupons Hint */}
                  <div className="p-4 rounded-xl border border-purple-500/10 bg-purple-500/[0.02] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-sans">
                    <div className="flex items-center gap-2">
                      <span className="text-sm select-none">🔥</span>
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-purple-400">Platform Promo Coupons</h4>
                        <p className="text-[9px] text-zinc-500 font-medium">Redeem these test codes to simulate instant coin top-ups!</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {['WELCOME15', 'GOLDEN50', 'SUPERCHARGE'].map((code) => (
                        <button
                          key={code}
                          onClick={() => {
                            setFriendCode(code);
                            playClickSound();
                          }}
                          className="font-mono text-[9px] font-bold text-amber-450 bg-zinc-950 border border-zinc-900 px-2.5 py-1 rounded-lg cursor-pointer hover:border-amber-400 hover:text-amber-300 transition duration-150 active:scale-95"
                          title="Click to paste coupon code"
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Referred friends history */}
                {simulatedFriends.length > 0 && (
                  <div className="rounded-xl bg-black/20 border border-amber-500/5 p-3.5 space-y-1.5 font-sans">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Simulated Invites ({simulatedFriends.length})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {simulatedFriends.map((name, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/5 border border-amber-500/10 text-[9px] font-mono text-amber-350 font-bold">
                          👤 {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          <div className="border-t border-purple-950/30 pt-4 text-center">
            <p className="text-[10px] text-zinc-500">
              Golden Draw member history is securely synced to your linked Google Account.
            </p>
            <p className="text-[10px] text-zinc-400 mt-1">
              Need Help? Contact VIP support: <a href="mailto:goldendraw777@gmail.com" className="text-purple-400 font-bold hover:underline">goldendraw777@gmail.com</a>
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
