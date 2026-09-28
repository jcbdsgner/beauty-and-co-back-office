"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  notifications as seedNotifications,
  unreadCount as countUnread,
  type AppNotification,
} from "@/lib/mock/notifications";
import { requestNotifications, staffRequests } from "@/lib/mock/rh";
import { stockAlertNotifications } from "@/lib/mock/stock";
import { cancellationNotifications } from "@/lib/mock/rendezvous";
import { remiseNotifications } from "@/lib/mock/remises";

// Notifications : une seule source de vérité pour « ce qui s'est passé » et pour
// l'état « lu / non lu ». Consommée par la cloche du header ET par l'écran
// /notifications — marquer une notif lue dans l'un se voit immédiatement dans
// l'autre, et le compteur de la cloche se met à jour en direct.
//
// État de SESSION pur : contrairement à LocationContext, aucune persistance en
// localStorage. Rafraîchir la page remet les notifications à leur état initial.

type NotificationsContextType = {
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  // Ajoute (ou remplace, même id) une notification née pendant la session —
  // ex. un rendez-vous annulé depuis /rendez-vous.
  push: (notification: AppNotification) => void;
  remove: (id: string) => void;
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(
  undefined,
);

// Notifs « système » ponctuelles (rendez-vous, paiement, avis) + l'alerte
// stock calculée en direct (`@/lib/mock/stock`) + les demandes en attente de
// l'équipe (avance, congé), fournies par `@/lib/mock/rh`. La concaténation se
// fait ici, jamais dans `notifications.ts`, pour éviter un cycle d'imports entre
// les modules mock.
function initialNotifications(): AppNotification[] {
  return [
    ...seedNotifications,
    ...stockAlertNotifications(),
    ...cancellationNotifications(),
    ...remiseNotifications(),
    ...requestNotifications(staffRequests),
  ].sort((a, b) => b.date.localeCompare(a.date));
}

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      "useNotifications doit être utilisé dans un NotificationsProvider",
    );
  }
  return context;
};

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(
    initialNotifications,
  );

  const markRead = useCallback((id: string) => {
    setNotifications((list) =>
      list.map((n) => (n.id === id && !n.read ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((list) =>
      list.some((n) => !n.read) ? list.map((n) => ({ ...n, read: true })) : list,
    );
  }, []);

  const push = useCallback((notification: AppNotification) => {
    setNotifications((list) => [notification, ...list.filter((n) => n.id !== notification.id)]);
  }, []);

  const remove = useCallback((id: string) => {
    setNotifications((list) => (list.some((n) => n.id === id) ? list.filter((n) => n.id !== id) : list));
  }, []);

  const value = useMemo<NotificationsContextType>(
    () => ({
      notifications,
      unreadCount: countUnread(notifications),
      markRead,
      markAllRead,
      push,
      remove,
    }),
    [notifications, markRead, markAllRead, push, remove],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};
