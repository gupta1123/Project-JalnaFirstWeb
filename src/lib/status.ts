import { tr, Lang } from "./i18n";

const statusTranslationKeyMap: Record<string, string> = {
  open: "teamTickets.status.open",
  assigned: "teamTickets.status.assigned",
  in_progress: "teamTickets.status.inProgress",
  pending_user: "teamTickets.status.pendingUser",
  pending_admin: "teamTickets.status.pendingAdmin",
  resolved: "teamTickets.status.resolved",
  closed: "teamTickets.status.closed",
  reopened_assigned: "complaints.status.reopenedAssigned",
  reopened_in_progress: "complaints.status.reopenedInProgress",
  reopened_resolved: "complaints.status.reopenedResolved",
};

export function getTicketStatusLabel(lang: Lang, status?: string) {
  if (!status) return "";
  const translationKey = statusTranslationKeyMap[status];
  if (translationKey) {
    return tr(lang, translationKey);
  }
  return status.replace(/_/g, " ");
}

