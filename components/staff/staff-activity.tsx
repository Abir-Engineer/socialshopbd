"use client";

import { Clock, Activity } from "lucide-react";
import type { AuditLogEntry } from "@/types/staff";
import { AUDIT_ACTION_BADGE, formatAuditAction, getInitials } from "@/lib/staff/display";

interface StaffActivityProps {
  auditLogs: AuditLogEntry[];
}

export function StaffActivity({ auditLogs }: StaffActivityProps) {
  if (auditLogs.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-14 text-center">
          <div className="flex flex-col items-center gap-2">
            <Activity className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">No activity recorded yet</p>
            <p className="text-xs text-muted-foreground">
              Actions performed by team members will appear here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const groupByDate = auditLogs.reduce<Record<string, AuditLogEntry[]>>((acc, log) => {
    const date = new Date(log.created_at).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          Audit trail
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Chronological record of all actions across the workspace.
        </p>
      </div>
      <div className="divide-y divide-border/70 max-h-[500px] overflow-y-auto">
        {Object.entries(groupByDate).map(([date, logs]) => (
          <div key={date}>
            <div className="px-5 py-2 bg-muted/30">
              <span className="text-xs font-semibold text-muted-foreground">{date}</span>
            </div>
            {logs.map((log) => (
              <div key={log.id} className="px-5 py-3 hover:bg-muted/20 transition">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-400 to-slate-500 text-[10px] font-semibold text-white mt-0.5">
                    {getInitials(log.actor_name ?? log.actor_id)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          AUDIT_ACTION_BADGE[log.action] ?? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {formatAuditAction(log.action)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        on <span className="font-medium text-foreground">{log.target_type}</span>
                        {log.target_id && (
                          <span className="text-muted-foreground/60"> #{log.target_id.slice(0, 8)}</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        by {log.actor_name ?? log.actor_email ?? "Unknown"}
                      </span>
                      <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(log.created_at).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <details className="mt-1">
                        <summary className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground cursor-pointer">
                          Show details
                        </summary>
                        <pre className="mt-1 text-[10px] text-muted-foreground/80 bg-muted/50 rounded p-2 overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
