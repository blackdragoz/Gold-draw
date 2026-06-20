/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { ShieldCheck, Flame, Users, Layers, AlertCircle, Check, X, RefreshCw, Sparkles, Database, Download } from 'lucide-react';
import { Ticket, User, PastWinner } from '../types';

interface AdminPanelProps {
  tickets: Ticket[];
  accounts: User[];
  pastWinners: PastWinner[];
  winningNumber: string;
  isRolling: boolean;
  onUpdateTicketStatus: (ticketId: string, status: 'approved' | 'declined') => void;
  onDrawNumber: (forcedNumber?: string) => void;
  onResetDraw: () => void;
  onClearAllTickets: () => void;
  onGiveCoins: (userEmail: string, amount: number) => void;
}

export default function AdminPanel({
  tickets,
  accounts,
  pastWinners,
  winningNumber,
  isRolling,
  onUpdateTicketStatus,
  onDrawNumber,
  onResetDraw,
  onClearAllTickets,
  onGiveCoins
}: AdminPanelProps) {
  const [localTickets, setLocalTickets] = useState<Ticket[]>(tickets);
  const [isAutoRefresh, setIsAutoRefresh] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Sync with prop tickets when isAutoRefresh is true
  useEffect(() => {
    if (isAutoRefresh) {
      setLocalTickets(tickets);
    }
  }, [tickets, isAutoRefresh]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setLocalTickets(tickets);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const [manualNumber, setManualNumber] = useState<string>('');
  const [adminError, setAdminError] = useState<string>('');
  
  const [targetUserEmail, setTargetUserEmail] = useState<string>('');
  const [awardAmount, setAwardAmount] = useState<number>(30);
  const [awardSuccess, setAwardSuccess] = useState<string>('');

  const convertToCSV = (headers: string[], rows: string[][]) => {
    const headerRow = headers.join(',');
    const dataRows = rows.map(row => 
      row.map(cell => {
        const text = cell === null || cell === undefined ? '' : String(cell);
        const escaped = text.replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    );
    return [headerRow, ...dataRows].join('\n');
  };

  const triggerDownload = (csvContent: string, fileName: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportTicketsCSV = () => {
    const headers = [
      'Ticket ID',
      'Ticket Number',
      'User Name',
      'User Email',
      'Payment Method',
      'Payment ID (Ref)',
      'Transaction ID',
      'Status',
      'Matches Current Draw',
      'Created Date'
    ];

    const rows = localTickets.map(t => [
      t.id || '',
      t.number || '',
      t.userName || '',
      t.userEmail || '',
      t.paymentMethod || '',
      t.paymentId || '',
      t.txnId || '',
      t.status || '',
      (t.number === winningNumber && t.status === 'approved') ? 'YES' : 'NO',
      t.createdAt ? new Date(t.createdAt).toISOString() : ''
    ]);

    const csv = convertToCSV(headers, rows);
    triggerDownload(csv, 'goldendraw_tickets_report.csv');
  };

  const exportWinnersCSV = () => {
    const headers = [
      'Draw ID',
      'Winning Number',
      'Drawn Timestamp'
    ];

    const rows = pastWinners.map((w, index) => [
      w.id || `Draw #${pastWinners.length - index}`,
      w.winningNumber || '',
      w.drawnAt || ''
    ]);

    const csv = convertToCSV(headers, rows);
    triggerDownload(csv, 'goldendraw_drawings_report.csv');
  };

  const handleManualDraw = (e: FormEvent) => {
    e.preventDefault();
    if (manualNumber.length !== 3 || !/^\d+$/.test(manualNumber)) {
      setAdminError('Please enter a 3-digit number (e.g. 529)');
      return;
    }
    setAdminError('');
    onDrawNumber(manualNumber);
    setManualNumber('');
  };

  const pendingTickets = localTickets.filter(t => t.status === 'pending');
  const approvedTickets = localTickets.filter(t => t.status === 'approved');
  const declinedTickets = localTickets.filter(t => t.status === 'declined');

  return (
    <div id="admin-panel-main" className="space-y-6">
      
      {/* Overview stats & title */}
      <div className="rounded-2xl bg-black/40 border border-purple-950/40 p-6 backdrop-blur-md shadow-[0_0_30px_rgba(168,85,247,0.02)]">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black border border-purple-950/40">
              <ShieldCheck className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-white flex items-center gap-1">
                Draw Controls
              </h2>
              <p className="text-xs text-zinc-400">Manage daily entries, approve transaction requests, and trigger drawings</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClearAllTickets}
              className="rounded bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-455 hover:bg-rose-500/20 transition cursor-pointer"
            >
              Clear Tickets
            </button>
            <button
              onClick={onResetDraw}
              className="rounded bg-zinc-900 border border-purple-950/40 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-purple-950/30 transition cursor-pointer"
            >
              Reset Draw
            </button>
          </div>
        </div>

        {/* Dynamic quick stats banner */}
        <div className="grid grid-cols-2 gap-3.5 mt-6 sm:grid-cols-4">
          <div className="rounded-xl bg-black border border-purple-950/20 p-4">
            <div className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider font-mono mb-1">Pending</div>
            <div className="text-xl font-bold text-purple-400 font-mono">{pendingTickets.length}</div>
          </div>
          <div className="rounded-xl bg-black border border-purple-950/20 p-4">
            <div className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider font-mono mb-1">Approved</div>
            <div className="text-xl font-bold text-emerald-450 font-mono">{approvedTickets.length}</div>
          </div>
          <div className="rounded-xl bg-black border border-purple-950/20 p-4">
            <div className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider font-mono mb-1">Declined</div>
            <div className="text-xl font-bold text-rose-450 font-mono">{declinedTickets.length}</div>
          </div>
          <div className="rounded-xl bg-black border border-purple-950/20 p-4">
            <div className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider font-mono mb-1">Winning Code</div>
            <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-red-500 font-mono tracking-wide">{winningNumber}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Covers Settings & Trigger) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Draw Trigger Board */}
          <div className="rounded-2xl border border-purple-950/40 bg-black/40 p-6 space-y-4 backdrop-blur-md shadow-[0_0_30px_rgba(168,85,247,0.02)]">
            <h3 className="font-display font-bold text-white text-sm border-b border-purple-950/30 pb-2.5 flex items-center gap-2">
              <Flame className="h-4 w-4 text-purple-400" />
              Trigger Draw
            </h3>

            <div className="space-y-4">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Generate a random 3-digit number to instantly conclude the current drawing. Multi-digit flip screens will update in real-time.
              </p>

              <button
                onClick={() => onDrawNumber()}
                disabled={isRolling}
                className={`w-full flex items-center justify-center gap-1.5 rounded bg-gradient-to-r from-purple-600 via-fuchsia-600 to-red-655 hover:from-purple-500 hover:to-red-550 py-2.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(168,85,247,0.15)] cursor-pointer transition ${
                  isRolling ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRolling ? 'animate-spin' : ''}`} />
                {isRolling ? 'Spinning code...' : 'Trigger Random Draw'}
              </button>
            </div>

            <div className="border-t border-purple-950/20 pt-4 space-y-2.5">
              <div className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider font-mono">Or Set Force Specific Number</div>
              
              <form onSubmit={handleManualDraw} className="flex gap-2">
                <input
                  type="text"
                  maxLength={3}
                  value={manualNumber}
                  onChange={(e) => setManualNumber(e.target.value)}
                  placeholder="e.g. 529"
                  className="flex-1 rounded bg-black border border-purple-950/40 px-3 py-1.5 text-xs font-mono text-white text-center focus:border-purple-500 focus:outline-none placeholder-zinc-800"
                />
                <button
                  type="submit"
                  className="rounded bg-zinc-900 border border-purple-950/35 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-purple-950/20 transition cursor-pointer"
                >
                  Set
                </button>
              </form>
              {adminError && (
                <p className="text-[10px] text-rose-455 font-mono">{adminError}</p>
              )}
            </div>
          </div>

          {/* Distribute / Award Coins Panel */}
          <div className="rounded-2xl border border-purple-950/40 bg-black/40 p-6 space-y-4 backdrop-blur-md shadow-[0_0_30px_rgba(168,85,247,0.02)]">
            <h3 className="font-display font-bold text-white text-sm border-b border-purple-950/30 pb-2.5 flex items-center gap-2">
              <span>🪙 Reward Gold Coins</span>
            </h3>
            
            <p className="text-xs text-zinc-400 leading-relaxed">
              As System Admin, you have unlimited gold coins. Select any registered user account below to credit coins immediately.
            </p>

            <div className="space-y-3 pt-1">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Select User:</label>
                <select
                  value={targetUserEmail}
                  onChange={(e) => {
                    setTargetUserEmail(e.target.value);
                    setAwardSuccess('');
                  }}
                  className="w-full text-xs rounded bg-black border border-purple-950/40 px-3 py-2 text-zinc-100 focus:border-purple-500 focus:outline-none"
                >
                  <option value="">-- Choose User Account --</option>
                  {accounts.filter(a => !a.isAdmin).map((a) => (
                    <option key={a.email} value={a.email}>
                      {a.name} ({a.email}) - {a.goldCoins ?? 0}🪙
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Coin Amount:</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={awardAmount}
                    onChange={(e) => {
                      setAwardAmount(Math.max(1, parseInt(e.target.value) || 0));
                      setAwardSuccess('');
                    }}
                    className="w-20 rounded bg-black border border-purple-950/40 px-3 py-1.5 text-xs text-center font-mono text-zinc-100 focus:border-purple-500 focus:outline-none"
                  />
                  <div className="flex-1 flex gap-1">
                    {[10, 30, 100].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setAwardAmount(preset);
                          setAwardSuccess('');
                        }}
                        className={`px-2 py-1 text-[10px] font-bold font-mono rounded border transition cursor-pointer ${
                          awardAmount === preset
                            ? 'bg-amber-955/30 border-amber-500/40 text-amber-300'
                            : 'bg-zinc-950 border-purple-950/15 text-zinc-400 hover:border-purple-950/40 hover:text-zinc-200'
                        }`}
                      >
                        +{preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={!targetUserEmail}
                onClick={() => {
                  if (!targetUserEmail) return;
                  onGiveCoins(targetUserEmail, awardAmount);
                  const recipient = accounts.find(a => a.email.toLowerCase() === targetUserEmail.toLowerCase());
                  setAwardSuccess(`Credited +${awardAmount} coins to ${recipient?.name || targetUserEmail}!`);
                  setTimeout(() => setAwardSuccess(''), 4500);
                }}
                className="w-full py-2.5 text-xs font-bold rounded bg-amber-500 hover:bg-amber-400 text-black transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(245,158,11,0.15)]"
              >
                Award Coins
              </button>
              {awardSuccess && (
                <p className="text-[9px] text-emerald-400 font-bold font-mono text-center mt-2.5 animate-pulse">{awardSuccess}</p>
              )}
            </div>
          </div>

          {/* Export CSV Audit Reports */}
          <div className="rounded-2xl border border-purple-950/40 bg-black/40 p-6 space-y-4 backdrop-blur-md shadow-[0_0_30px_rgba(168,85,247,0.02)]">
            <h3 className="font-display font-bold text-white text-sm border-b border-purple-950/30 pb-2.5 flex items-center gap-2">
              <Download className="h-4 w-4 text-purple-400" />
              <span>Export Accounting CSV</span>
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Generate fully auditable, compliant CSV spreadsheets of all verified lottery ticket bookings and drawing history records for accounting and ledger purposes.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1.5">
              <button
                type="button"
                onClick={exportTicketsCSV}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border border-purple-950/40 bg-zinc-950/80 hover:bg-purple-950/35 hover:border-purple-800/40 text-purple-300 hover:text-white transition text-xs font-bold cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Tickets</span>
              </button>
              <button
                type="button"
                onClick={exportWinnersCSV}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border border-purple-950/40 bg-zinc-950/80 hover:bg-purple-950/35 hover:border-purple-800/40 text-purple-300 hover:text-white transition text-xs font-bold cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Draw Logs</span>
              </button>
            </div>
          </div>
        </div>

        {/* Verification & Reconciliation Grid (2nd & 3rd Cols) */}
        <div className="rounded-2xl border border-purple-950/40 bg-black/40 p-6 lg:col-span-2 space-y-4 backdrop-blur-md shadow-[0_0_30px_rgba(168,85,247,0.02)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-950/30 pb-3">
            <h3 className="font-display font-bold text-white text-sm flex items-center gap-2">
              <Database className="h-4 w-4 text-purple-400" />
              <span>Incoming Entries & Payments</span>
            </h3>
            
            <div className="flex items-center gap-3 flex-wrap">
              {/* Auto Refresh Toggle */}
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAutoRefresh}
                  onChange={(e) => setIsAutoRefresh(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:border-zinc-400 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-white peer-checked:after:border-purple-600"></div>
                <span className="ml-1.5 text-[10px] font-medium text-zinc-400 font-sans">Auto Sync</span>
              </label>

              {/* Manual Refresh Button */}
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isAutoRefresh}
                className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-medium transition cursor-pointer ${
                  isAutoRefresh 
                    ? 'opacity-30 cursor-not-allowed bg-zinc-900 border-zinc-800 text-zinc-650' 
                    : 'bg-zinc-950 border-purple-950/40 hover:bg-purple-950/20 hover:border-purple-800/40 text-purple-300'
                }`}
                title="Manually sync tickets data"
              >
                <RefreshCw className={`h-2.5 w-2.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Sync Now</span>
              </button>

              <span className="rounded bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[9px] font-mono text-purple-400 font-bold shrink-0">
                {pendingTickets.length} pending
              </span>
            </div>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Validate client transaction IDs and submitted Reference codes against your bank journal. Approve or decline below in real-time.
          </p>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {localTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-600 border border-dashed border-purple-950/30 rounded bg-black/20">
                <Users className="h-6 w-6 mb-2 text-zinc-800" />
                <p className="text-xs text-zinc-500 font-sans">No entries listed in database</p>
              </div>
            ) : (
              localTickets.map((ticket) => {
                const isPending = ticket.status === 'pending';
                const isApproved = ticket.status === 'approved';
                const rowClass = isPending
                  ? 'border-purple-500/20 bg-purple-500/[0.02] shadow-[0_0_15px_rgba(168,85,247,0.01)]'
                  : isApproved
                  ? 'border-purple-950/20 bg-black/30'
                  : 'border-purple-950/10 bg-black/10 opacity-50';

                return (
                  <div
                    key={ticket.id}
                    className={`rounded-xl border p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${rowClass}`}
                  >
                    {/* User Profile and ticket detail */}
                    <div className="flex items-start gap-3">
                      <img
                        src={ticket.userAvatar}
                        alt={ticket.userName}
                        className="h-8 w-8 rounded-full object-cover border border-purple-950/30 shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-100">{ticket.userName}</span>
                          <span className="text-[10px] font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-red-400 bg-black px-1.5 py-0.5 rounded border border-purple-950/40">
                            {ticket.number}
                          </span>
                        </div>
                        
                        <div className="text-[10px] text-zinc-550 font-mono flex items-center gap-1.5 flex-wrap">
                          <span>{ticket.userEmail}</span>
                          <span className="text-[8px] text-zinc-600 font-sans">•</span>
                          <span className="text-[9px] text-zinc-500 font-mono">
                            {new Date(ticket.createdAt).toLocaleDateString([], { month: '2-digit', day: '2-digit', year: 'numeric' })} {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>

                        {/* Payment reference layout */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 rounded bg-black border border-purple-950/25 p-2 text-[10px] leading-snug">
                          <div>
                            <span className="text-zinc-650 font-bold font-mono text-[9px] uppercase tracking-wider block">Ref Code:</span>
                            <span className="font-mono text-purple-400 font-bold select-all">{ticket.paymentId}</span>
                          </div>
                          <div className="mt-1 sm:mt-0">
                            <span className="text-zinc-650 font-bold font-mono text-[9px] uppercase tracking-wider block">Txn ID:</span>
                            <span className="font-mono text-zinc-300 font-bold select-all">{ticket.txnId}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions or Status */}
                    <div className="flex items-center justify-end gap-2 shrink-0 self-end md:self-center">
                      {isPending ? (
                        <>
                          <button
                            onClick={() => onUpdateTicketStatus(ticket.id, 'declined')}
                            className="flex h-8 w-8 items-center justify-center rounded bg-rose-500/10 border border-rose-500/20 text-rose-455 hover:bg-rose-500/20 transition cursor-pointer"
                            title="Decline entry"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onUpdateTicketStatus(ticket.id, 'approved')}
                            className="flex h-8 px-3 items-center justify-center gap-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
                            title="Approve entry"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Confirm</span>
                          </button>
                        </>
                      ) : (
                        <span className={`text-[10px] font-bold uppercase tracking-wider font-mono px-2 py-0.5 rounded border ${
                          isApproved 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {ticket.status}
                        </span>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
