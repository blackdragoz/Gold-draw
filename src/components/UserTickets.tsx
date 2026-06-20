/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Ticket } from '../types';
import { Ticket as TicketIcon, CheckCircle, Clock, XCircle, Trophy, Sparkles } from 'lucide-react';

interface UserTicketsProps {
  tickets: Ticket[];
  currentUserEmail: string;
  winningNumber: string;
  isRolling?: boolean;
}

export default function UserTickets({ tickets, currentUserEmail, winningNumber, isRolling }: UserTicketsProps) {
  const userTickets = tickets.filter(t => t.userEmail === currentUserEmail);

  const getStatusBadge = (ticket: Ticket) => {
    switch (ticket.status) {
      case 'approved':
        // Check if the ticket matches the current winning draw number
        const isWinner = !isRolling && winningNumber !== '???' && ticket.number === winningNumber;
        if (isWinner) {
          return (
            <div className="inline-flex items-center gap-1 rounded bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-400">
              <Trophy className="h-3 w-3 text-purple-400 animate-bounce" />
              Winner
            </div>
          );
        }
        return (
          <div className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
            <CheckCircle className="h-3 w-3" />
            Approved
          </div>
        );
      case 'declined':
        return (
          <div className="inline-flex items-center gap-1 rounded bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-medium text-rose-455">
            <XCircle className="h-3 w-3" />
            Declined
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-1 rounded bg-purple-950/30 border border-purple-900/20 px-2 py-0.5 text-[10px] font-medium text-purple-400">
            <Clock className="h-3 w-3 text-purple-400 animate-pulse" />
            Pending Review
          </div>
        );
    }
  };

  return (
    <div id="user-tickets-card" className="rounded-2xl border border-purple-950/40 bg-black/40 p-6 backdrop-blur-md shadow-[0_0_30px_rgba(168,85,247,0.02)]">
      <div className="flex items-center justify-between mb-4 border-b border-purple-950/30 pb-3">
        <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
          <TicketIcon className="h-4 w-4 text-purple-400" />
          My Registered Tickets
        </h2>
        <span className="text-xs text-zinc-450 font-mono font-bold bg-black border border-purple-950/30 px-2.5 py-1 rounded">
          Total: {userTickets.length}
        </span>
      </div>

      {userTickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <TicketIcon className="h-9 w-9 text-zinc-800 mb-2" />
          <p className="text-xs text-zinc-400 font-medium font-sans">No tickets registered yet</p>
          <p className="text-[11px] text-zinc-650 mt-1 max-w-[240px]">
            Once you choose and submit a 3-digit number, they will be listed here.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {userTickets.map((ticket) => {
            const isWinner = !isRolling && winningNumber !== '???' && ticket.number === winningNumber && ticket.status === 'approved';
            
            return (
              <div 
                key={ticket.id}
                className={`rounded-xl border p-3.5 transition-all relative overflow-hidden ${
                  isWinner 
                    ? 'border-purple-500 bg-purple-500/5 shadow-[0_0_15px_rgba(168,85,247,0.08)]' 
                    : 'border-purple-950/25 bg-black/40 hover:border-purple-900/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Big Ticket Number visualization */}
                    <div className="flex h-11 w-14 flex-col items-center justify-center rounded bg-black border border-purple-950/60 animate-none">
                      <div className="text-[8px] text-zinc-555 font-mono">CODE</div>
                      <div className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-red-500 font-mono tracking-wide">{ticket.number}</div>
                    </div>

                    <div className="leading-tight">
                      {/* Unique dynamic billing ID */}
                      <div className="text-[10px] text-zinc-400 font-semibold font-mono">
                        Ref: <span className="text-zinc-350 select-all">{ticket.paymentId}</span>
                      </div>
                      <div className="text-[10px] text-zinc-550 mt-0.5">
                        UPI: <span className="text-zinc-450 font-mono select-all">{ticket.txnId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1.5 font-sans">
                    {getStatusBadge(ticket)}
                    <div className="text-[9px] text-zinc-500 font-mono text-right leading-tight whitespace-nowrap">
                      <div>{new Date(ticket.createdAt).toLocaleDateString([], { month: '2-digit', day: '2-digit', year: 'numeric' })}</div>
                      <div className="text-zinc-400">{new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                    </div>
                  </div>
                </div>

                {isWinner && (
                  <div className="mt-2.5 flex items-center gap-1.5 border-t border-purple-500/20 pt-2 text-[10px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-red-500">
                    <Sparkles className="h-3 w-3 text-purple-400" />
                    Congratulations! Your ticket matches the drawn winning number!
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
