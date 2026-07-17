import React, { useEffect, useRef } from 'react';
import { useWalletContext } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export default function LogPage() {
  const { activityLog, clearLog } = useWalletContext();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activityLog]);

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-2xl font-bold tracking-tight">Activity Log</h2>
        <Button variant="outline" size="sm" onClick={clearLog} className="gap-2 text-muted-foreground hover:text-destructive">
          <Trash2 className="w-4 h-4" /> Clear Log
        </Button>
      </div>

      <div className="flex-1 bg-black rounded-lg border border-border p-4 font-mono text-xs sm:text-sm overflow-y-auto">
        {activityLog.length === 0 ? (
          <div className="text-muted-foreground opacity-50 italic">No activity recorded yet...</div>
        ) : (
          <div className="space-y-1">
            {activityLog.map((log, i) => {
              // Parse out timestamp for styling
              const match = log.match(/^\[(.*?)\] (.*)$/);
              if (match) {
                return (
                  <div key={i} className="flex gap-3 hover:bg-white/5 py-0.5 px-1 rounded transition-colors">
                    <span className="text-primary/70 shrink-0">[{match[1]}]</span>
                    <span className="text-foreground/90">{match[2]}</span>
                  </div>
                );
              }
              return <div key={i} className="text-foreground/90">{log}</div>;
            })}
            <div ref={endRef} />
          </div>
        )}
      </div>
    </div>
  );
}