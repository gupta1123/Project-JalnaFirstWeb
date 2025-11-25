"use client";

import useSWR from "swr";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminGetTickets, getCategories } from "@/lib/api";
import type { Ticket } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDateTimeSmart } from "@/lib/utils";
import { useLanguage } from "@/components/LanguageProvider";
import { tr } from "@/lib/i18n";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronDown } from "lucide-react";

const FALLBACK_CATEGORY_NAMES = [
  "Public Safety",
  "Infrastructure and Roads",
  "Sanitation and Utilities",
  "Traffic and Transport",
  "Livelihood and Local Order",
] as const;
const STATUS_VALUES = ["open", "in_progress", "assigned", "resolved", "closed"] as const;
const PRIORITY_VALUES = ["low", "medium", "high", "urgent"] as const;

type StatusValue = (typeof STATUS_VALUES)[number];
type PriorityValue = (typeof PRIORITY_VALUES)[number];
type CategoryOption = { id: string; name: string };

export default function ComplaintsPage() {
  const { lang } = useLanguage();

  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [limit] = useState(15);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | StatusValue>("open");
  const [category, setCategory] = useState<string>("");
  const [priority, setPriority] = useState<"" | "all" | PriorityValue>("");
  const [statusSearch, setStatusSearch] = useState("");
  const [statusShowAll, setStatusShowAll] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryShowAll, setCategoryShowAll] = useState(false);
  const [prioritySearch, setPrioritySearch] = useState("");
  const [priorityShowAll, setPriorityShowAll] = useState(false);
  const {
    data: categoriesResponse,
    isValidating: categoriesRevalidating,
    mutate: refetchCategories,
    error: categoriesError,
  } = useSWR(
    "complaints-categories",
    () => getCategories({ page: 1, limit: 100 }),
    {
      revalidateOnFocus: false,
    }
  );
  const categoriesForFilter = categoriesResponse?.categories;
  const categoryOptions = useMemo<CategoryOption[]>(() => {
    if (Array.isArray(categoriesForFilter) && categoriesForFilter.length > 0) {
      const unique = new Map<string, CategoryOption>();
      categoriesForFilter.forEach((cat) => {
        const name = typeof cat?.name === "string" ? cat.name.trim() : "";
        const id = (cat?.id || (cat as { _id?: string })?._id || "").trim();
        if (!name || !id || unique.has(id)) return;
        unique.set(id, { id, name });
      });
      return Array.from(unique.values()).sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );
    }
    if (categoriesError) {
      return FALLBACK_CATEGORY_NAMES.map((name) => ({ id: name, name }));
    }
    return [];
  }, [categoriesForFilter, categoriesError]);
  const categoriesLoading =
    !categoriesError &&
    (!categoriesForFilter || categoriesRevalidating) &&
    categoryOptions.length === 0;
  const params = useMemo(() => {
    const allowed = new Set(["open", "in_progress", "assigned", "resolved", "closed"]);
    const p: Record<string, string | number> = { page, limit, sortBy: "createdAt", sortOrder: "desc" };
    if (search && search.trim()) p.search = search.trim();
    if (status && allowed.has(status)) p.status = status;
    if (category && category !== "all") {
      p.category = category;
    }
    if (priority && priority !== "all") p.priority = priority;
    return p;
  }, [page, limit, search, status, category, priority]);

  const { data, isLoading, mutate } = useSWR(["tickets-admin", params], () => adminGetTickets(params));
  const tickets: Ticket[] = data?.tickets ?? [];
  const pagination = data?.pagination;

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  useEffect(() => {
    if (!pagination) return;
    const lastPage = Math.max(1, pagination.totalPages || 1);
    if (page > lastPage) {
      setPage(lastPage);
    }
  }, [pagination, page]);

  const getNormalizedJumpTarget = (): number | null => {
    if (!pagination) return null;
    if (!pageInput.trim()) return null;
    const parsed = Number(pageInput);
    if (Number.isNaN(parsed)) return null;
    const total = Math.max(1, pagination.totalPages || 1);
    const normalized = Math.max(1, Math.min(total, Math.floor(parsed)));
    if (normalized === page) return null;
    return normalized;
  };

  const handlePageJump = () => {
    const target = getNormalizedJumpTarget();
    if (target) {
      setPage(target);
    }
  };

  const getStatusKey = (status: string): string => {
    const statusMap: Record<string, string> = {
      'open': 'open',
      'in_progress': 'inProgress',
      'assigned': 'assigned',
      'resolved': 'resolved',
      'closed': 'closed',
    };
    return statusMap[status] || status;
  };

  const filteredStatusValues = useMemo(() => {
    const base = Array.from(STATUS_VALUES);
    const query = statusSearch.trim().toLowerCase();
    if (!query) return base;
    return base.filter((value) => {
      const label = tr(lang, `complaints.filters.status.${getStatusKey(value)}`).toLowerCase();
      return label.includes(query) || value.replace(/_/g, " ").toLowerCase().includes(query);
    });
  }, [statusSearch, lang]);

  const statusDisplayValues = useMemo(() => {
    if (statusSearch.trim() || statusShowAll) return filteredStatusValues;
    return filteredStatusValues.slice(0, 3);
  }, [filteredStatusValues, statusSearch, statusShowAll]);

  const statusRenderValues = useMemo(() => {
    if (status !== "all" && !statusDisplayValues.includes(status)) {
      return [status, ...statusDisplayValues];
    }
    return statusDisplayValues;
  }, [statusDisplayValues, status]);

  const statusHasMore = filteredStatusValues.length > 3 && !statusSearch.trim();

  const filteredCategoryValues = useMemo(() => {
    const base = categoryOptions;
    const query = categorySearch.trim().toLowerCase();
    if (!query) return base;
    return base.filter((option) => option.name.toLowerCase().includes(query));
  }, [categorySearch, categoryOptions]);

  const categoryDisplayValues = useMemo(() => {
    if (categorySearch.trim() || categoryShowAll) return filteredCategoryValues;
    return filteredCategoryValues.slice(0, 3);
  }, [filteredCategoryValues, categorySearch, categoryShowAll]);

  const categoryRenderValues = useMemo(() => {
    if (
      category &&
      category !== "all" &&
      !categoryDisplayValues.some((option) => option.id === category)
    ) {
      const selectedOption = categoryOptions.find((option) => option.id === category);
      if (selectedOption) {
        return [selectedOption, ...categoryDisplayValues];
      }
    }
    return categoryDisplayValues;
  }, [categoryDisplayValues, categoryOptions, category]);

  const categoryHasMore = filteredCategoryValues.length > 3 && !categorySearch.trim();

  const filteredPriorityValues = useMemo(() => {
    const base = Array.from(PRIORITY_VALUES);
    const query = prioritySearch.trim().toLowerCase();
    if (!query) return base;
    return base.filter((value) => {
      const label = tr(lang, `complaints.filters.priority.${value}`).toLowerCase();
      return label.includes(query) || value.toLowerCase().includes(query);
    });
  }, [prioritySearch, lang]);

  const priorityDisplayValues = useMemo(() => {
    if (prioritySearch.trim() || priorityShowAll) return filteredPriorityValues;
    return filteredPriorityValues.slice(0, 3);
  }, [filteredPriorityValues, prioritySearch, priorityShowAll]);

  const priorityRenderValues = useMemo(() => {
    if (priority !== "all" && priority && !priorityDisplayValues.includes(priority)) {
      return [priority, ...priorityDisplayValues];
    }
    return priorityDisplayValues;
  }, [priorityDisplayValues, priority]);

  const priorityHasMore = filteredPriorityValues.length > 3 && !prioritySearch.trim();

  return (
    <Card>
      <CardContent className="grid gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
          <div className="flex flex-1 flex-wrap gap-2">
            <Input className="w-full sm:w-[360px]" placeholder={tr(lang, "complaints.filters.searchPlaceholder")} value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
            <Select
              value={status}
              onValueChange={(v) => {
                setPage(1);
                setStatus(v as "all" | StatusValue);
              }}
              onOpenChange={(open) => {
                if (!open) {
                  setStatusSearch("");
                  setStatusShowAll(false);
                }
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={tr(lang, "complaints.filters.status")} />
              </SelectTrigger>
              <SelectContent side="bottom" sideOffset={8} avoidCollisions={false}>
                <div className="px-2 pb-1">
                  <Input
                    autoFocus
                    value={statusSearch}
                    onChange={(e) => {
                      const value = e.target.value;
                      setStatusSearch(value);
                      setStatusShowAll(Boolean(value.trim()));
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder={tr(lang, "complaints.filters.dropdownSearchPlaceholder")}
                    className="h-8"
                  />
                </div>
                <SelectItem value="all">{tr(lang, "complaints.filters.status.all")}</SelectItem>
                {statusRenderValues.length > 0 ? (
                  <>
                    {statusRenderValues.map((value) => (
                      <SelectItem key={value} value={value}>
                        {tr(lang, `complaints.filters.status.${getStatusKey(value)}`)}
                      </SelectItem>
                    ))}
                    {statusHasMore && !statusShowAll && (
                      <div
                        className="px-2 py-2 text-sm text-primary cursor-pointer hover:bg-accent rounded-sm flex items-center gap-2"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setStatusShowAll(true);
                        }}
                      >
                        <ChevronDown className="size-4" />
                        {tr(lang, "complaints.filters.dropdownViewMore")} ({filteredStatusValues.length - 3})
                      </div>
                    )}
                  </>
                ) : (
                  <div className="px-2 py-3 text-sm text-muted-foreground">
                    {tr(lang, "complaints.filters.dropdownEmpty")}
                  </div>
                )}
              </SelectContent>
            </Select>
            <Select
              value={category}
              onValueChange={(v) => {
                setPage(1);
                setCategory(v);
              }}
              onOpenChange={(open) => {
                if (open) {
                  void refetchCategories();
                } else {
                  setCategorySearch("");
                  setCategoryShowAll(false);
                }
              }}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder={tr(lang, "complaints.filters.category")} />
              </SelectTrigger>
              <SelectContent side="bottom" sideOffset={8} avoidCollisions={false}>
                <div className="px-2 pb-1">
                  <Input
                    autoFocus
                    value={categorySearch}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCategorySearch(value);
                      setCategoryShowAll(Boolean(value.trim()));
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder={tr(lang, "complaints.filters.dropdownSearchPlaceholder")}
                    className="h-8"
                  />
                </div>
                <SelectItem value="all">
                  {tr(lang, "complaints.filters.category.all")}
                </SelectItem>
                {categoriesLoading ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground">
                    {tr(lang, "login.loading")}
                  </div>
                ) : categoryRenderValues.length > 0 ? (
                  <>
                    {categoryRenderValues.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                    {categoryHasMore && !categoryShowAll && (
                      <div
                        className="px-2 py-2 text-sm text-primary cursor-pointer hover:bg-accent rounded-sm flex items-center gap-2"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCategoryShowAll(true);
                        }}
                      >
                        <ChevronDown className="size-4" />
                        {tr(lang, "complaints.filters.dropdownViewMore")} ({filteredCategoryValues.length - 3})
                      </div>
                    )}
                  </>
                ) : (
                  <div className="px-2 py-3 text-sm text-muted-foreground">
                    {tr(lang, "complaints.filters.dropdownEmpty")}
                  </div>
                )}
              </SelectContent>
            </Select>
            <Select
              value={priority}
              onValueChange={(v) => {
                setPage(1);
                setPriority(v as "" | "all" | PriorityValue);
              }}
              onOpenChange={(open) => {
                if (!open) {
                  setPrioritySearch("");
                  setPriorityShowAll(false);
                }
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={tr(lang, "complaints.filters.priority")} />
              </SelectTrigger>
              <SelectContent side="bottom" sideOffset={8} avoidCollisions={false}>
                <div className="px-2 pb-1">
                  <Input
                    autoFocus
                    value={prioritySearch}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPrioritySearch(value);
                      setPriorityShowAll(Boolean(value.trim()));
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                    placeholder={tr(lang, "complaints.filters.dropdownSearchPlaceholder")}
                    className="h-8"
                  />
                </div>
                <SelectItem value="all">{tr(lang, "complaints.filters.priority.all")}</SelectItem>
                {priorityRenderValues.length > 0 ? (
                  <>
                    {priorityRenderValues.map((value) => (
                      <SelectItem key={value} value={value}>
                        {tr(lang, `complaints.filters.priority.${value}`)}
                      </SelectItem>
                    ))}
                    {priorityHasMore && !priorityShowAll && (
                      <div
                        className="px-2 py-2 text-sm text-primary cursor-pointer hover:bg-accent rounded-sm flex items-center gap-2"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPriorityShowAll(true);
                        }}
                      >
                        <ChevronDown className="size-4" />
                        {tr(lang, "complaints.filters.dropdownViewMore")} ({filteredPriorityValues.length - 3})
                      </div>
                    )}
                  </>
                ) : (
                  <div className="px-2 py-3 text-sm text-muted-foreground">
                    {tr(lang, "complaints.filters.dropdownEmpty")}
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          
        </div>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tr(lang, "complaints.table.ticketNumber")}</TableHead>
                <TableHead>{tr(lang, "complaints.table.description")}</TableHead>
                <TableHead>{tr(lang, "complaints.table.priority")}</TableHead>
                <TableHead>{tr(lang, "complaints.table.status")}</TableHead>
                <TableHead>{tr(lang, "complaints.table.assignedTeams")}</TableHead>
                <TableHead>{tr(lang, "complaints.table.created")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    </TableRow>
                  ))}
                </>
              )}
              {!isLoading && tickets.length === 0 && (
                <TableRow><TableCell colSpan={6}>{tr(lang, "complaints.empty.none")}</TableCell></TableRow>
              )}
              {tickets.map((t) => (
                <TableRow key={t._id}>
                  <TableCell><Link className="underline" href={`/complaints/${t._id}`}>{t.ticketNumber ?? t._id}</Link></TableCell>
                  <TableCell>
                    {t.description && t.description.length > 60 ? (
                      <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                          <span className="block max-w-[420px] truncate cursor-help">{t.description}</span>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="top" 
                          className="max-w-md p-4 text-sm bg-popover text-popover-foreground border shadow-lg rounded-lg"
                          sideOffset={8}
                        >
                          <div className="font-medium mb-2 text-xs text-muted-foreground uppercase tracking-wide">Description</div>
                          <div className="whitespace-pre-wrap break-words text-foreground leading-relaxed">{t.description}</div>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="block max-w-[420px] truncate">{t.description}</span>
                    )}
                  </TableCell>
                  <TableCell className="capitalize">
                    {t.priority ? (
                      <span
                        className={
                          t.priority === 'low'
                            ? 'rounded px-2 py-0.5 text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : t.priority === 'medium'
                            ? 'rounded px-2 py-0.5 text-xs bg-amber-500/20 text-amber-800 dark:text-amber-300'
                            : t.priority === 'high'
                            ? 'rounded px-2 py-0.5 text-xs bg-red-500/20 text-red-800 dark:text-red-300'
                            : 'rounded px-2 py-0.5 text-xs bg-red-600/20 text-red-800 dark:text-red-300'
                        }
                      >
                        {tr(lang, `complaints.priority.${t.priority}`)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="capitalize">
                    <span className={
                      t.status === 'open' ? 'rounded px-2 py-0.5 text-xs bg-sky-500/15 text-sky-700 dark:text-sky-300' :
                      t.status === 'in_progress' ? 'rounded px-2 py-0.5 text-xs bg-amber-500/15 text-amber-700 dark:text-amber-300' :
                      t.status === 'resolved' ? 'rounded px-2 py-0.5 text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' :
                      'rounded px-2 py-0.5 text-xs bg-neutral-500/15 text-neutral-700 dark:text-neutral-300'
                    }>{tr(lang, `complaints.status.${getStatusKey(t.status)}`)}</span>
                  </TableCell>
                  <TableCell>
                    {t.assignedTeams && t.assignedTeams.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {t.assignedTeams.map((team) => (
                          <Badge key={team._id} variant="outline" className="text-xs">
                            {team.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">{tr(lang, "complaints.table.noTeams")}</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDateTimeSmart(t.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {pagination && (
          <div className="flex flex-col gap-3 pt-2 lg:flex-row lg:items-center lg:justify-between">
            <Pagination className="order-2 lg:order-1">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      if (pagination.hasPrevPage) setPage((p) => Math.max(1, p - 1)); 
                    }}
                    className={!pagination.hasPrevPage ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {(() => {
                  const total = Math.max(1, pagination.totalPages || 1);
                  const current = Math.min(Math.max(1, pagination.currentPage), total);
                  const windowSize = 2;
                  const jumpSize = 10;
                  const items: Array<number | { type: "ellipsis"; key: string; target: number }> = [];

                  items.push(1);

                  let start = Math.max(2, current - windowSize);
                  let end = Math.min(total - 1, current + windowSize);

                  if (current <= windowSize + 1) {
                    end = Math.min(total - 1, 1 + windowSize * 2);
                  }
                  if (current >= total - windowSize) {
                    start = Math.max(2, total - windowSize * 2);
                  }

                  if (start > 2) {
                    items.push({ type: "ellipsis", key: "ellipsis-start", target: Math.max(1, current - jumpSize) });
                  }

                  for (let i = start; i <= end; i++) {
                    items.push(i);
                  }

                  if (end < total - 1) {
                    items.push({ type: "ellipsis", key: "ellipsis-end", target: Math.min(total, current + jumpSize) });
                  }

                  if (total > 1) {
                    items.push(total);
                  }

                  return items.map((item) => {
                    if (typeof item === "object" && "type" in item) {
                      return (
                        <PaginationItem key={item.key}>
                          <PaginationEllipsis
                            role="button"
                            tabIndex={0}
                            aria-label={`Jump to page ${item.target}`}
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              setPage(item.target);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setPage(item.target);
                              }
                            }}
                          />
                        </PaginationItem>
                      );
                    }
                    return (
                      <PaginationItem key={item}>
                        <PaginationLink
                          href="#"
                          isActive={item === current}
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(item);
                          }}
                        >
                          {item}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  });
                })()}

                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      if (pagination.hasNextPage) setPage((p) => p + 1); 
                    }}
                    className={!pagination.hasNextPage ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
            {(pagination.totalPages ?? 0) > 10 && (
              <form
                className="order-1 flex flex-col gap-1 text-sm lg:order-2 lg:text-right"
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePageJump();
                }}
              >
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Jump to page</span>
                <div className="flex items-center gap-2 lg:justify-end">
                  <Input
                    type="number"
                    min={1}
                    max={Math.max(1, pagination.totalPages || 1)}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    className="h-9 w-[110px]"
                    aria-label="Go to page"
                  />
                  <Button type="submit" size="sm" variant="secondary" disabled={!getNormalizedJumpTarget()}>
                    Go
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground">
                  Page {page} of {Math.max(1, pagination.totalPages || 1)}
                </span>
              </form>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
