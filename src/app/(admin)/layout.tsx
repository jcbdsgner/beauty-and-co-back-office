"use client";

import { useSidebar } from "@/context/SidebarContext";
import { LocationProvider } from "@/context/LocationContext";
import { AccountProvider } from "@/context/AccountContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { PlanningProvider } from "@/context/PlanningContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React from "react";

export default function AdminLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[260px]"
    : "lg:ml-[80px]";

  return (
    <LocationProvider>
      <AccountProvider>
        <NotificationsProvider>
          <PlanningProvider>
            <div className="min-h-screen xl:flex">
              {/* Sidebar and Backdrop */}
              <AppSidebar />
              <Backdrop />
              {/* Main Content Area */}
              <div
                className={`flex-1 transition-all  duration-300 ease-in-out print:!ml-0 ${mainContentMargin}`}
              >
                {/* Header */}
                <AppHeader />
                {/* Page Content */}
                <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6 print:p-0">
                  {children}
                </div>
              </div>
            </div>
            {modal}
          </PlanningProvider>
        </NotificationsProvider>
      </AccountProvider>
    </LocationProvider>
  );
}
