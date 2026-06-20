/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PastWinner } from '../types';
import { History, Calendar, Trash2 } from 'lucide-react';

interface PastWinnersProps {
  winners: PastWinner[];
  onClearHistory?: () => void;
  isAdmin?: boolean;
}

export default function PastWinners({ winners, onClearHistory, isAdmin = false }: PastWinnersProps) {
  return (
    <div className="rounded-2xl border border-purple-950/40 bg-black/40 p-6 backdrop-blur-md shadow-[0_0_30px_rgba(168,85,247,0.02)]">
      
      <div className="flex items-center justify-between mb-5 border-b border-purple-950/30 pb-4">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-purple-400" />
          <div>
            <h2 className="font-display text-sm font-bold text-white tracking-tight">Draw Logs & Legacy Records</h2>
            <p className="text-[10px] text-zinc-500 font-medium font-mono">Verifiable chronological drawings</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] text-zinc-450 font-mono font-bold bg-black border border-purple-950/30 px-2 py-0.5 rounded">
            Total: {winners.length}
          </span>
          {isAdmin && winners.length > 0 && onClearHistory && (
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1 rounded bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 text-[10px] font-semibold text-rose-450 hover:bg-rose-500/20 transition cursor-pointer"
              title="Purge legacy records"
            >
              <Trash2 className="h-3 w-3" />
              <span>Reset Logs</span>
            </button>
          )}
        </div>
      </div>

      <div>
        {winners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-black/20 rounded-xl border border-dashed border-purple-950/35">
            <History className="h-6 w-6 text-zinc-800 mb-2" />
            <p className="text-xs text-zinc-400 font-medium font-sans">No drawings recorded yet</p>
            <p className="text-[10px] text-zinc-600 mt-0.5 max-w-[210px] font-mono">
              Chronological log columns will populate when the administrator draws winning codes.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
            {winners.map((winner, idx) => (
              <div 
                key={winner.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-black border border-purple-950/20 hover:border-purple-900/40 transition"
              >
                {/* Left block: Winning Ball Display */}
                <div className="flex items-center gap-4">
                  <div className="text-[10px] font-mono text-zinc-550 font-semibold">
                    [Draw #{winners.length - idx}]
                  </div>
                  
                  {/* Styled digits with technical block design */}
                  <div className="flex gap-1 font-mono text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-red-400">
                    {winner.winningNumber.split('').map((char, charIdx) => (
                      <span 
                        key={charIdx}
                        className="px-1.5 py-0.5 bg-zinc-950 border border-purple-950/40 rounded font-bold text-transparent bg-clip-text bg-gradient-to-b from-purple-400 to-red-500"
                      >
                        {char}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right block: Timestamp drawn details */}
                <div className="flex items-center gap-1.5 text-right font-mono text-[10px] text-zinc-550">
                  <Calendar className="h-3.5 w-3.5 text-purple-950" />
                  <span>Drawn on: <span className="text-zinc-400">{winner.drawnAt}</span></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
