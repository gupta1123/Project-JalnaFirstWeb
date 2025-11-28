"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { getTeamsWithSearch } from "@/lib/api";
import type { Team } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Loader2, UsersRound, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

type TeamSearchSelectProps = {
  label?: string;
  helperText?: string;
  value: string | null;
  onChange: (teamId: string | null, team?: Team | null) => void;
  disabled?: boolean;
  includeGlobalOption?: boolean;
  emptyLabel?: string;
};

export function TeamSearchSelect({
  label,
  helperText,
  value,
  onChange,
  disabled = false,
  includeGlobalOption = true,
  emptyLabel = "No teams available",
}: TeamSearchSelectProps) {
  const { data, isLoading, error } = useSWR("teams-select-options", () =>
    getTeamsWithSearch({ limit: 100, page: 1 })
  );

  const teams = data?.teams ?? [];
  const [query, setQuery] = useState("");

  const filteredTeams = useMemo(() => {
    if (!query.trim()) return teams;
    const searchLower = query.toLowerCase();
    return teams.filter((team) =>
      [team.name, team.description]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(searchLower))
    );
  }, [teams, query]);

  const handleSelect = (teamId: string | null) => {
    const team = teamId ? teams.find((t) => t._id === teamId) ?? null : null;
    onChange(teamId, team);
  };

  return (
    <div className="grid gap-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search teams by name or area..."
          disabled={disabled || isLoading || !!error}
        />
        <div className="max-h-56 overflow-y-auto space-y-2">
          {includeGlobalOption && (
            <button
              type="button"
              onClick={() => handleSelect(null)}
              disabled={disabled}
              className={cn(
                "flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition hover:border-primary hover:bg-primary/5",
                value === null ? "border-primary bg-primary/5" : "border-border"
              )}
            >
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">All Teams (Global)</p>
                  <p className="text-xs text-muted-foreground">
                    Category applies to every team
                  </p>
                </div>
              </div>
              {value === null && (
                <span className="text-xs font-medium text-primary">Selected</span>
              )}
            </button>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading teams...
            </div>
          ) : error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              Unable to load teams. Please try again later.
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-4">
              {emptyLabel}
            </div>
          ) : (
            filteredTeams.map((team) => (
              <button
                key={team._id}
                type="button"
                onClick={() => handleSelect(team._id)}
                disabled={disabled}
                className={cn(
                  "w-full rounded-md border px-3 py-2 text-left transition hover:border-primary hover:bg-primary/5",
                  value === team._id ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <div className="flex items-center gap-2">
                  <UsersRound className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{team.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {team.description || "No description available"}
                    </p>
                  </div>
                  {value === team._id && (
                    <span className="text-xs font-medium text-primary">Selected</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
      {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
    </div>
  );
}

