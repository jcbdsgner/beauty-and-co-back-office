"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { defaultAccount, type OwnerAccount } from "@/lib/mock/compte";

// Compte de la propriétaire : une seule source de vérité pour son identité
// (nom, photo, email…). Consommée par l'écran `/compte` ET par le menu compte
// du header — changer son nom sur l'écran se voit immédiatement dans le header.
//
// État de SESSION pur : aucune persistance (comme NotificationsContext).
// Rafraîchir la page remet le compte à son état initial.

type AccountContextType = {
  account: OwnerAccount;
  updateAccount: (patch: Partial<OwnerAccount>) => void;
};

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export const useAccount = () => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error("useAccount doit être utilisé dans un AccountProvider");
  }
  return context;
};

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [account, setAccount] = useState<OwnerAccount>(defaultAccount);

  const updateAccount = useCallback((patch: Partial<OwnerAccount>) => {
    setAccount((current) => ({ ...current, ...patch }));
  }, []);

  const value = useMemo<AccountContextType>(
    () => ({ account, updateAccount }),
    [account, updateAccount],
  );

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
};
