/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { User, Ticket, DrawState, PastWinner, CoinTransaction } from './types';
import Navigation from './components/Navigation';
import LiveDrawDisplay from './components/LiveDrawDisplay';
import TicketSelector from './components/TicketSelector';
import UserTickets from './components/UserTickets';
import AdminPanel from './components/AdminPanel';
import PastWinners from './components/PastWinners';
import UserProfileModal from './components/UserProfileModal';
import { Lock } from 'lucide-react';

import { auth, db, loginWithGoogle, logoutUser } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  query, 
  orderBy, 
  increment,
  getDocs,
  where,
  deleteDoc
} from 'firebase/firestore';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [drawState, setDrawState] = useState<DrawState>({
    winningNumber: '???',
    isRolling: false,
    lastDrawnAt: null
  });
  const [pastWinners, setPastWinners] = useState<PastWinner[]>([]);
  const [activeTab, setActiveTab] = useState<'user' | 'admin'>('user');
  const [accounts, setAccounts] = useState<User[]>([]);
  const [coinTransactions, setCoinTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // 1. Authenticate with Google / Firebase Sync
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeUser = onSnapshot(userRef, async (docSnap) => {
          const isAdminUser = firebaseUser.uid === '5su9L3gQochvbkXI72GoHoddhjF2';
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            setCurrentUser({
              email: firebaseUser.email || '',
              name: data.name || firebaseUser.displayName || 'Guest',
              photoURL: data.photoURL || firebaseUser.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(firebaseUser.displayName || 'Guest')}`,
              isAuthenticated: true,
              isAdmin: isAdminUser,
              goldCoins: data.goldCoins ?? 0
            });
          } else {
            // Write new user document
            const newUserProfile = {
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'Guest',
              photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(firebaseUser.displayName || 'Guest')}`,
              isAdmin: isAdminUser,
              goldCoins: 0
            };
            await setDoc(userRef, newUserProfile);
            setCurrentUser({
              ...newUserProfile,
              isAuthenticated: true
            });
          }
          setLoading(false);
        }, (err) => {
          console.error("User profile sync error:", err);
          setLoading(false);
        });
        return () => unsubscribeUser();
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Real-time Tickets List
  useEffect(() => {
    const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Ticket[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          number: data.number,
          userEmail: data.userEmail,
          userName: data.userName,
          userAvatar: data.userAvatar,
          paymentMethod: data.paymentMethod,
          paymentId: data.paymentId,
          txnId: data.txnId,
          status: data.status,
          createdAt: data.createdAt
        });
      });
      setTickets(list);
    });
    return () => unsubscribe();
  }, []);

  // 3. Sync Draw State in real-time
  useEffect(() => {
    const docRef = doc(db, 'drawState', 'current');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDrawState({
          winningNumber: data.winningNumber || '???',
          isRolling: data.isRolling || false,
          lastDrawnAt: data.lastDrawnAt || null
        });
      } else {
        setDoc(docRef, {
          winningNumber: '???',
          isRolling: false,
          lastDrawnAt: null
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // 4. Real-time Past Winners
  useEffect(() => {
    const q = query(collection(db, 'pastWinners'), orderBy('drawnAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: PastWinner[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          winningNumber: data.winningNumber,
          drawnAt: data.drawnAt
        });
      });
      setPastWinners(list);
    });
    return () => unsubscribe();
  }, []);

  // 5. Real-time Users Accounts (for Admin Dashboard)
  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: User[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          email: data.email,
          name: data.name,
          photoURL: data.photoURL,
          isAuthenticated: true,
          isAdmin: data.isAdmin || false,
          goldCoins: data.goldCoins ?? 0
        });
      });
      setAccounts(list);
    });
    return () => unsubscribe();
  }, []);

  // 6. Real-time Coin Transactions List (specific to the logged-in user)
  useEffect(() => {
    if (!currentUser?.email) {
      setCoinTransactions([]);
      return;
    }
    const q = query(
      collection(db, 'coinTransactions'),
      where('userEmail', '==', currentUser.email.toLowerCase())
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: CoinTransaction[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          userEmail: data.userEmail,
          amount: data.amount,
          reason: data.reason,
          timestamp: data.timestamp
        });
      });
      // Sort client-side in descending order of timestamp to avoid requiring an index
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setCoinTransactions(list);
    }, (err) => {
      console.error("Coin transactions load error:", err);
    });

    return () => unsubscribe();
  }, [currentUser?.email]);

  // Auth Functions
  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setActiveTab('user');
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateCoins = async (amount: number, reason: string = 'Referral Reward') => {
    const uid = auth.currentUser?.uid;
    const email = auth.currentUser?.email;
    if (uid && email) {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        goldCoins: increment(amount)
      });
      // Admin bypasses (not writing to database or maybe writing anyway, wait, user gets the coins so log it)
      await addDoc(collection(db, 'coinTransactions'), {
        userEmail: email.toLowerCase(),
        amount: amount,
        reason: reason,
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleGiveCoins = async (userEmail: string, amount: number) => {
    if (auth.currentUser?.uid !== '5su9L3gQochvbkXI72GoHoddhjF2') {
      console.error("Access Denied: You do not have permission to execute this administrative operation.");
      return;
    }
    const q = query(collection(db, 'users'), where('email', '==', userEmail.toLowerCase()));
    const snap = await getDocs(q);
    snap.forEach(async (docSnap) => {
      await updateDoc(docSnap.ref, {
        goldCoins: increment(amount)
      });
      // Log coin transaction
      await addDoc(collection(db, 'coinTransactions'), {
        userEmail: userEmail.toLowerCase(),
        amount: amount,
        reason: amount > 0 ? `Admin Badge Reward (${amount} Coins)` : `Admin Deduction (${amount} Coins)`,
        timestamp: new Date().toISOString()
      });
    });
  };

  // Ticketing Operations
  const handleAddTicket = async (newTicket: Omit<Ticket, 'id' | 'createdAt' | 'status'>) => {
    // Client-side authentication checks: user can only make ticket for themselves.
    const isCurrentUser = auth.currentUser?.email?.toLowerCase() === newTicket.userEmail.toLowerCase();
    const isAdmin = auth.currentUser?.uid === '5su9L3gQochvbkXI72GoHoddhjF2';
    
    if (!isCurrentUser && !isAdmin) {
      console.error("Security Restriction: Ticket reservation email must match authenticated user account identity.");
      return;
    }

    const isGoldCoins = newTicket.paymentMethod === 'Gold Coins';
    const item = {
      number: newTicket.number,
      userEmail: newTicket.userEmail,
      userName: newTicket.userName,
      userAvatar: newTicket.userAvatar,
      paymentMethod: newTicket.paymentMethod,
      paymentId: newTicket.paymentId,
      txnId: newTicket.txnId,
      status: isGoldCoins ? 'approved' : 'pending',
      createdAt: new Date().toISOString()
    };
    
    await addDoc(collection(db, 'tickets'), item);

    if (isGoldCoins) {
      const uid = auth.currentUser?.uid;
      const email = auth.currentUser?.email;
      if (uid && !isAdmin) {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
          goldCoins: increment(-30)
        });
        if (email) {
          // Log coin transaction for ticket redeem
          await addDoc(collection(db, 'coinTransactions'), {
            userEmail: email.toLowerCase(),
            amount: -30,
            reason: `Reserved Free Ticket #${newTicket.number}`,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: 'approved' | 'declined') => {
    if (auth.currentUser?.uid !== '5su9L3gQochvbkXI72GoHoddhjF2') {
      console.error("Access Denied: Administrative action rejected.");
      return;
    }
    const ticketRef = doc(db, 'tickets', ticketId);
    await updateDoc(ticketRef, { status });
  };

  // Lucky Draw Trigger Coordinator
  const handleDrawNumber = async (forcedNumber?: string) => {
    if (auth.currentUser?.uid !== '5su9L3gQochvbkXI72GoHoddhjF2') {
      console.error("Access Denied: Administrative action rejected.");
      return;
    }
    const resultNumber = forcedNumber || Array.from({ length: 3 }, () => Math.floor(Math.random() * 10).toString()).join('');
    
    const docRef = doc(db, 'drawState', 'current');
    await setDoc(docRef, {
      winningNumber: resultNumber,
      isRolling: true,
      lastDrawnAt: null
    });

    const totalDuration = 30000; // Let's use 30 seconds for complete sequential staggered reveal

    setTimeout(async () => {
      const timestamp = new Date().toLocaleString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
      });
      
      await setDoc(docRef, {
        winningNumber: resultNumber,
        isRolling: false,
        lastDrawnAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });

      await addDoc(collection(db, 'pastWinners'), {
        winningNumber: resultNumber,
        drawnAt: timestamp
      });
    }, totalDuration);
  };

  const handleResetDraw = async () => {
    if (auth.currentUser?.uid !== '5su9L3gQochvbkXI72GoHoddhjF2') {
      console.error("Access Denied: Administrative action rejected.");
      return;
    }
    const docRef = doc(db, 'drawState', 'current');
    await setDoc(docRef, {
      winningNumber: '???',
      isRolling: false,
      lastDrawnAt: null
    });
  };

  const handleClearPastWinners = async () => {
    if (auth.currentUser?.uid !== '5su9L3gQochvbkXI72GoHoddhjF2') {
      console.error("Access Denied: Administrative action rejected.");
      return;
    }
    if (window.confirm('Are you sure you want to clear the entire drawings history?')) {
      const q = query(collection(db, 'pastWinners'));
      const snap = await getDocs(q);
      const promises = snap.docs.map(docSnap => deleteDoc(docSnap.ref));
      await Promise.all(promises);
    }
  };

  const handleClearAllTickets = async () => {
    if (auth.currentUser?.uid !== '5su9L3gQochvbkXI72GoHoddhjF2') {
      console.error("Access Denied: Administrative action rejected.");
      return;
    }
    if (window.confirm('Are you sure you want to clear all tickets?')) {
      const q = query(collection(db, 'tickets'));
      const snap = await getDocs(q);
      const promises = snap.docs.map(docSnap => deleteDoc(docSnap.ref));
      await Promise.all(promises);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-300 antialiased selection:bg-purple-600 selection:text-white overflow-x-hidden w-full relative">
      
      {/* Interactive top banner navigation */}
      <Navigation 
        currentUser={currentUser} 
        onLogin={handleLogin} 
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          </div>
        ) : !currentUser || !currentUser.isAuthenticated ? (
          <div id="login-welcome-panel" className="max-w-md mx-auto rounded-2xl border border-purple-950/40 bg-gradient-to-b from-black via-zinc-950 to-black p-6 sm:p-8 text-center py-12 space-y-6 shadow-[0_0_50px_rgba(168,85,247,0.03)] backdrop-blur-sm">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-black border border-purple-950/40 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)] animate-pulse">
              <Lock className="h-5 w-5" />
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-lg font-bold text-white tracking-tight">Golden Draw Member Portal</h2>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto font-sans">
                Welcome to the verifiable daily 5-digit lucky draw portal. Sign in securely with your Google Account to select numbers, earn gold coins, and check live drawings.
              </p>
            </div>

            <div className="pt-2">
              <button
                id="google-login-welcome-btn"
                onClick={handleLogin}
                className="w-full flex items-center justify-center gap-3 rounded-lg bg-white hover:bg-zinc-200 text-zinc-900 font-bold px-4 py-3 text-xs tracking-wide transition active:scale-95 duration-100 cursor-pointer shadow-lg font-sans"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
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
                Sign In with Google
              </button>
            </div>

            {/* Benefits layout with premium design */}
            <div className="rounded-xl bg-black/60 p-4 border border-zinc-900 text-left space-y-2.5 font-sans">
              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
                <span>Genuine secure Google account authentication</span>
              </div>
              <div className="flex items-start gap-2 text-[11px] text-zinc-400">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)] mt-1" />
                <span>Earn gold coins by inviting friends</span>
              </div>
              <div className="flex items-start gap-2 text-[11px] text-zinc-400">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.8)] mt-1" />
                <span>Live synchronised lottery drawings in real-time</span>
              </div>
            </div>

            <p className="text-[10px] text-zinc-500 font-sans">
              * Verification codes and coin balances are saved directly to Cloud Firestore.
            </p>
          </div>
        ) : (
          <>
            {/* Live Billboard always stays at the top of the app */}
            <LiveDrawDisplay 
              winningNumber={drawState.winningNumber} 
              isRolling={drawState.isRolling} 
              lastDrawnAt={drawState.lastDrawnAt} 
            />

            {/* View Switching based on Active Tab */}
            {activeTab === 'user' || !currentUser.isAdmin ? (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  
                  {/* Left Form: Ticket customization & checkout (3 Cols) */}
                  <div className="lg:col-span-3">
                    <TicketSelector 
                      currentUser={currentUser} 
                      tickets={tickets}
                      onAddTicket={handleAddTicket} 
                      onUpdateCoins={handleUpdateCoins}
                    />
                  </div>

                  {/* Right Form: User's ordered Ticketing List (2 Cols) */}
                  <div className="lg:col-span-2 space-y-8">
                    <UserTickets 
                      tickets={tickets} 
                      currentUserEmail={currentUser.email} 
                      winningNumber={drawState.winningNumber}
                      isRolling={drawState.isRolling}
                    />
                  </div>

                </div>
              </div>
            ) : (
              // Admin Controller System View
              <div className="space-y-8 animate-in fade-in duration-300">
                <AdminPanel 
                  tickets={tickets}
                  accounts={accounts}
                  pastWinners={pastWinners}
                  winningNumber={drawState.winningNumber}
                  isRolling={drawState.isRolling}
                  onUpdateTicketStatus={handleUpdateTicketStatus}
                  onDrawNumber={handleDrawNumber}
                  onResetDraw={handleResetDraw}
                  onClearAllTickets={handleClearAllTickets}
                  onGiveCoins={handleGiveCoins}
                />

                {/* Past Winners with Clear Log permission for Admins */}
                <div className="max-w-3xl mx-auto font-sans">
                  <PastWinners 
                    winners={pastWinners} 
                    onClearHistory={handleClearPastWinners} 
                    isAdmin={true} 
                  />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modern, minimalist premium footer block */}
      <footer className="mt-20 border-t border-purple-950/20 bg-black/80 py-10 text-center text-[11px] text-zinc-500">
        <p className="font-semibold text-zinc-400">Golden Draw Validation System</p>
        <p className="mt-1 text-[10px] text-zinc-650 font-mono">Protected with secure Google authentication & Cloud Firestore. All rights reserved.</p>
        <p className="mt-2 text-zinc-400 text-[10px] font-sans">
          Support: <a href="mailto:goldendraw777@gmail.com" className="hover:underline text-purple-400 font-bold font-mono">goldendraw777@gmail.com</a>
        </p>
      </footer>

      {/* Profile Popup Window */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        tickets={tickets}
        pastWinners={pastWinners}
        coinTransactions={coinTransactions}
        onUpdateCoins={handleUpdateCoins}
      />
    </div>
  );
}
