"use client";

import { LocationProvider } from "@/context/LocationContext";
import { AccountProvider } from "@/context/AccountContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { PlanningProvider } from "@/context/PlanningContext";
import { ClientsProvider } from "@/context/ClientsContext";
import { PreferencesProvider } from "@/context/PreferencesContext";
import { AutorisationsProvider } from "@/context/AutorisationsContext";
import { FideliteProvider } from "@/context/FideliteContext";
import { ServicesDataProvider } from "@/components/back-office/services/ServicesData";
import AppSidebar from "@/layout/AppSidebar";
import React from "react";

export default function AdminLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <LocationProvider>
      <AccountProvider>
        <NotificationsProvider>
          <PlanningProvider>
            <ClientsProvider>
            <PreferencesProvider>
            <AutorisationsProvider>
            <FideliteProvider>
            {/* Catalogue de session (Services) — lu aussi par la prise de rendez-vous. */}
            <ServicesDataProvider>
              <div className="min-h-screen xl:flex">
                {/* Sidebar fixe 260px (Figma « Point de vente », node 381:497) */}
                <AppSidebar />
                {/* Main Content Area */}
                <div
                  className="ml-[260px] min-w-0 flex-1 bg-base-200 print:!ml-0"
                >
                  {/* Page Content */}
                  <div className="mx-auto max-w-[1440px] px-8 pt-8 pb-8 print:p-0">
                    {children}
                  </div>
                </div>
              </div>
              {modal}
            </ServicesDataProvider>
            </FideliteProvider>
            </AutorisationsProvider>
            </PreferencesProvider>
            </ClientsProvider>
          </PlanningProvider>
        </NotificationsProvider>
      </AccountProvider>
    </LocationProvider>
  );
}
