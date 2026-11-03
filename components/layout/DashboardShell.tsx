"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileBottomNav from "./MobileBottomNav";
import { useAuth } from "@/lib/auth-context";
import DealerStockCatalog from "@/components/dealer/DealerStockCatalog";
import FullPageVehicleDetail from "@/components/dealer/FullPageVehicleDetail";
import DealerOrdersView from "@/components/dealer/DealerOrdersView";
import DealershipProfileView from "@/components/dealer/DealershipProfileView";
import JapanInventoryView from "@/components/japan/JapanInventoryView";
import JapanInventoryDetailsView from "@/components/japan/JapanInventoryDetailsView";
import BatchUploadView from "@/components/japan/BatchUploadView";
import AddVehicleForm from "@/components/japan/AddVehicleForm";
import AdminDashboardView from "@/components/admin/AdminDashboardView";
import AdminMenuPortalView from "@/components/admin/AdminMenuPortalView";
import AdminReservationsView from "@/components/admin/AdminReservationsView";
import DealerApprovalsView from "@/components/admin/DealerApprovalsView";
import AdminInventoryControllerView from "@/components/admin/AdminInventoryControllerView";
import AllocationMilestonesView from "@/components/admin/AllocationMilestonesView";
import AuditExportView from "@/components/admin/AuditExportView";
import UserManagementView from "@/components/admin/UserManagementView";
import RolesPermissionsView from "@/components/admin/RolesPermissionsView";
import PlatformSettingsView from "@/components/settings/PlatformSettingsView";

interface DashboardShellProps {
  initialVehicleId?: string;
  initialTab?: string;
  portal?: "dealer" | "admin" | "japan" | "common";
}

export default function DashboardShell({
  initialVehicleId,
  initialTab,
  portal,
}: DashboardShellProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser } = useAuth();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [viewingVehicleId, setViewingVehicleId] = useState<string | null>(initialVehicleId || null);
  const [globalSearch, setGlobalSearch] = useState("");

  // Sync viewing vehicle ID when route changes
  useEffect(() => {
    if (initialVehicleId) {
      setViewingVehicleId(initialVehicleId);
    } else if (pathname.includes("/vehicles/")) {
      const parts = pathname.split("/vehicles/");
      if (parts[1]) {
        setViewingVehicleId(parts[1]);
      }
    } else {
      setViewingVehicleId(null);
    }
  }, [initialVehicleId, pathname]);

  // Determine active view tab based on pathname and initialTab
  const resolveActiveTab = (): string => {
    if (pathname.includes("/vehicles/")) {
      if (pathname.startsWith("/admin") || portal === "admin" || currentUser?.role === "AUTOHUB_ADMIN") {
        return "admin-catalogue";
      }
      return "dealer-stock";
    }
    if (pathname === "/settings" || initialTab === "settings") return "settings";

    // 1. Admin Portal routes (Priority when in admin path, portal, or admin role)
    if (
      pathname.startsWith("/admin") ||
      portal === "admin" ||
      (currentUser?.role === "AUTOHUB_ADMIN" && !pathname.startsWith("/dealer") && !pathname.startsWith("/japan"))
    ) {
      if (pathname === "/admin/orders" || initialTab === "orders" || initialTab === "admin-orders") return "admin-orders";
      if (pathname === "/admin/dashboard" || initialTab === "dashboard" || initialTab === "admin-dashboard") return "admin-dashboard";
      if (pathname === "/admin/catalogue" || pathname === "/admin/catalog" || initialTab === "catalogue" || initialTab === "catalog" || initialTab === "admin-catalogue") return "admin-catalogue";
      if (pathname === "/admin/reservations" || pathname === "/admin/holds" || initialTab === "reservations" || initialTab === "admin-reservations") return "admin-reservations";
      if (pathname === "/admin/dealers" || pathname === "/admin/approvals" || initialTab === "dealers" || initialTab === "admin-dealers" || initialTab === "approvals" || initialTab === "admin-approvals") return "admin-dealers";
      if (pathname === "/admin/inventory" || pathname === "/admin/stock" || initialTab === "inventory" || initialTab === "admin-inventory" || initialTab === "stock" || initialTab === "admin-stock") return "admin-inventory";
      if (pathname === "/admin/users" || initialTab === "users" || initialTab === "admin-users") return "admin-users";
      if (pathname === "/admin/roles" || initialTab === "roles" || initialTab === "admin-roles") return "admin-roles";
      if (pathname === "/admin/milestones" || pathname === "/admin/allocations" || initialTab === "milestones" || initialTab === "admin-milestones") return "admin-orders";
      if (pathname === "/admin/audit" || initialTab === "audit" || initialTab === "admin-audit") return "admin-audit";
      if (pathname === "/admin" || initialTab === "menu" || initialTab === "admin-menu") return "admin-menu";
      return "admin-dashboard";
    }

    // 2. Japan Portal routes
    if (
      pathname.startsWith("/japan") ||
      portal === "japan" ||
      (currentUser?.role === "NISSAN_JAPAN" && !pathname.startsWith("/dealer") && !pathname.startsWith("/admin"))
    ) {
      if (pathname === "/japan/upload" || pathname === "/japan/batch-upload" || initialTab === "upload" || initialTab === "japan-upload") return "japan-upload";
      if (pathname === "/japan/add-vehicle" || pathname === "/japan/add-single" || initialTab === "add-vehicle" || initialTab === "japan-add-single") return "japan-add-single";
      if (pathname === "/japan/inventory" || pathname === "/japan" || initialTab === "inventory" || initialTab === "japan-inventory") return "japan-inventory";
      return "japan-inventory";
    }

    // 3. Dealer Portal routes
    if (pathname === "/dealer/orders" || initialTab === "orders" || initialTab === "dealer-orders") return "dealer-orders";
    if (pathname === "/dealer/profile" || initialTab === "profile" || initialTab === "dealer-profile") return "dealer-profile";
    if (pathname === "/dealer/stocks" || pathname === "/dealer/stock" || initialTab === "stocks" || initialTab === "stock" || initialTab === "dealer-stock") return "dealer-stock";
    if (pathname === "/dealer/terms" || pathname === "/dealer/commercial-boundary" || initialTab === "terms" || initialTab === "dealer-terms") return "dealer-stock";

    // Default by user role if on root or ambiguous
    if (currentUser?.role === "AUTOHUB_ADMIN") return "admin-dashboard";
    if (currentUser?.role === "NISSAN_JAPAN") return "japan-inventory";
    return "dealer-stock";
  };

  const activeTab = resolveActiveTab();

  // Route map for programmatic tab navigation
  const tabToRoute = (tabId: string): string => {
    // Admin context routing
    if (pathname.startsWith("/admin") || portal === "admin") {
      switch (tabId) {
        case "admin-orders":
        case "orders":
          return "/admin/orders";
        case "admin-dashboard":
        case "dashboard":
          return "/admin/dashboard";
        case "admin-catalogue":
        case "admin-catalog":
        case "catalogue":
        case "catalog":
          return "/admin/catalogue";
        case "admin-reservations":
        case "reservations":
        case "holds":
          return "/admin/reservations";
        case "admin-dealers":
        case "dealers":
        case "approvals":
        case "admin-approvals":
          return "/admin/dealers";
        case "admin-inventory":
        case "inventory":
        case "stock":
        case "admin-stock":
          return "/admin/inventory";
        case "admin-users":
        case "users":
          return "/admin/users";
        case "admin-roles":
        case "roles":
          return "/admin/roles";
        case "admin-menu":
        case "menu":
          return "/admin";
        default:
          return "/admin/dashboard";
      }
    }

    switch (tabId) {
      case "dealer-stock":
      case "stocks":
      case "stock":
        return "/dealer/stocks";
      case "dealer-orders":
      case "orders":
        return "/dealer/orders";
      case "dealer-profile":
      case "profile":
        return "/dealer/profile";
      case "dealer-terms":
      case "terms":
        return "/dealer/stocks";
      case "admin-menu":
      case "menu":
        return "/admin";
      case "admin-dashboard":
      case "dashboard":
        return "/admin/dashboard";
      case "admin-catalogue":
      case "admin-catalog":
      case "catalogue":
      case "catalog":
        return "/admin/catalogue";
      case "admin-orders":
        return "/admin/orders";
      case "admin-reservations":
      case "reservations":
      case "holds":
        return "/admin/reservations";
      case "admin-dealers":
      case "dealers":
      case "approvals":
      case "admin-approvals":
        return "/admin/dealers";
      case "admin-inventory":
      case "inventory":
      case "stock":
      case "admin-stock":
        return "/admin/inventory";
      case "admin-users":
      case "users":
        return "/admin/users";
      case "admin-roles":
      case "roles":
        return "/admin/roles";
      case "admin-milestones":
      case "milestones":
      case "allocations":
        return "/admin/orders";
      case "admin-audit":
      case "audit":
        return "/admin/audit";
      case "japan-inventory":
      case "inventory-japan":
        return "/japan/inventory";
      case "japan-upload":
      case "upload":
        return "/japan/upload";
      case "japan-add-single":
      case "add-vehicle":
        return "/japan/add-vehicle";
      case "settings":
        return "/settings";
      default:
        return "/dealer/stocks";
    }
  };

  const handleTabChange = (tabId: string) => {
    setViewingVehicleId(null);
    const dest = tabToRoute(tabId);
    router.push(dest);
  };

  const handleSelectVehicle = (vehicleId: string) => {
    setViewingVehicleId(vehicleId);
    router.push(`/dealer/vehicles/${vehicleId}`);
  };

  const handleBackFromVehicle = () => {
    setViewingVehicleId(null);
    router.push("/dealer/stocks");
  };

  // Determine what view to render based on active tab
  const renderViewContent = () => {
    // 1. Vehicle Detail Full-Page View
    if (viewingVehicleId) {
      if (
        portal === "japan" ||
        currentUser?.role === "NISSAN_JAPAN" ||
        pathname.startsWith("/japan")
      ) {
        return (
          <JapanInventoryDetailsView
            vehicleId={viewingVehicleId}
            onBack={() => {
              setViewingVehicleId(null);
              router.push("/japan/inventory");
            }}
          />
        );
      }
      return (
        <FullPageVehicleDetail
          vehicleId={viewingVehicleId}
          onBack={handleBackFromVehicle}
        />
      );
    }

    // 2. Settings Inner View
    if (activeTab === "settings") {
      return (
        <PlatformSettingsView
          onBack={() => {
            if (currentUser?.role === "AUTOHUB_ADMIN") {
              router.push("/admin/dashboard");
            } else if (currentUser?.role === "NISSAN_JAPAN") {
              router.push("/japan/inventory");
            } else {
              router.push("/dealer/stocks");
            }
          }}
        />
      );
    }

    // 3. Admin Portal Views (Path begins with /admin OR portal is admin OR admin role on neutral route)
    if (
      pathname.startsWith('/admin') ||
      portal === 'admin' ||
      ((currentUser?.role === 'AUTOHUB_ADMIN' || currentUser?.role === 'READONLY_AUDITOR') &&
        !pathname.startsWith('/dealer') &&
        !pathname.startsWith('/japan'))
    ) {
      switch (activeTab) {
        case 'admin-menu':
          return <AdminMenuPortalView onNavigateTab={handleTabChange} />;
        case 'admin-dashboard':
          return <AdminDashboardView onNavigateTab={handleTabChange} />;
        case 'admin-catalogue':
          return (
            <DealerStockCatalog
              onSelectVehicle={handleSelectVehicle}
              externalSearchQuery={globalSearch}
            />
          );
        case 'admin-orders':
        case 'dealer-orders':
        case 'orders':
          return <AllocationMilestonesView />;
        case 'admin-reservations':
        case 'reservations':
        case 'holds':
          return <AdminReservationsView onNavigateTab={handleTabChange} />;
        case 'admin-dealers':
        case 'dealers':
          return <DealerApprovalsView />;
        case 'admin-inventory':
        case 'inventory':
          return <AdminInventoryControllerView />;
        // legacy aliases
        case 'admin-users':
          return <UserManagementView />;
        case 'admin-roles':
          return <RolesPermissionsView />;
        case 'admin-approvals':
          return <DealerApprovalsView />;
        case 'admin-stock':
          return <AdminInventoryControllerView />;
        case 'admin-milestones':
          return <AllocationMilestonesView />;
        case 'admin-audit':
          return <AuditExportView />;
        default:
          if (pathname === '/admin/orders') return <AllocationMilestonesView />;
          if (pathname === '/admin/dashboard') return <AdminDashboardView onNavigateTab={handleTabChange} />;
          if (pathname === '/admin/catalogue' || pathname === '/admin/catalog')
            return (
              <DealerStockCatalog
                onSelectVehicle={handleSelectVehicle}
                externalSearchQuery={globalSearch}
              />
            );
          if (pathname === '/admin/reservations') return <AdminReservationsView onNavigateTab={handleTabChange} />;
          if (pathname === '/admin/dealers') return <DealerApprovalsView />;
          if (pathname === '/admin/inventory') return <AdminInventoryControllerView />;
          if (pathname === '/admin/users') return <UserManagementView />;
          if (pathname === '/admin/roles') return <RolesPermissionsView />;
          return <AdminDashboardView onNavigateTab={handleTabChange} />;
      }
    }

    // 4. Japan Portal Views (Path begins with /japan OR portal is japan OR Japan role on neutral route)
    if (
      pathname.startsWith('/japan') ||
      portal === 'japan' ||
      (currentUser?.role === 'NISSAN_JAPAN' &&
        !pathname.startsWith('/dealer') &&
        !pathname.startsWith('/admin'))
    ) {
      switch (activeTab) {
        case 'japan-inventory':
          return (
            <JapanInventoryView
              onNavigateAdd={() => router.push('/japan/add-vehicle')}
              onNavigateBatch={() => router.push('/japan/upload')}
            />
          );
        case 'japan-upload':
          return (
            <BatchUploadView onSuccessReturn={() => router.push('/japan/inventory')} />
          );
        case 'japan-add-single':
          return (
            <AddVehicleForm onSuccessReturn={() => router.push('/japan/inventory')} />
          );
        default:
          return (
            <JapanInventoryView
              onNavigateAdd={() => router.push('/japan/add-vehicle')}
              onNavigateBatch={() => router.push('/japan/upload')}
            />
          );
      }
    }

    // 5. Dealer Portal Views (Path begins with /dealer OR portal is dealer OR default)
    switch (activeTab) {
      case 'dealer-stock':
        return (
          <DealerStockCatalog
            onSelectVehicle={handleSelectVehicle}
            externalSearchQuery={globalSearch}
          />
        );
      case 'dealer-orders':
        return <DealerOrdersView />;
      case 'dealer-profile':
        return <DealershipProfileView />;
      default:
        return (
          <DealerStockCatalog
            onSelectVehicle={handleSelectVehicle}
            externalSearchQuery={globalSearch}
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] overflow-hidden">
      {/* 1. Responsive Collapsible Navy Sidebar (Desktop persistent + Mobile/Tablet Drawer) */}
      <Sidebar
        activeTab={viewingVehicleId ? (portal === "admin" || pathname.startsWith("/admin") || currentUser?.role === "AUTOHUB_ADMIN" ? "admin-catalogue" : "dealer-stock") : activeTab}
        onTabChange={handleTabChange}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileDrawerOpen}
        onCloseMobile={() => setIsMobileDrawerOpen(false)}
      />

      {/* 2. Main Content Container (Full Height Canvas with Top Header) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header across all panels with responsive search and mobile menu trigger */}
        <Header
          onToggleSidebar={() => {
            if (typeof window !== "undefined" && window.innerWidth < 1024) {
              setIsMobileDrawerOpen((prev) => !prev);
            } else {
              setIsSidebarCollapsed((prev) => !prev);
            }
          }}
          isSidebarCollapsed={isSidebarCollapsed}
          searchValue={globalSearch}
          onSearchChange={setGlobalSearch}
          onSearchSubmit={(val) => {
            if (!pathname.startsWith("/dealer/stocks") && !pathname.startsWith("/admin/catalogue")) {
              router.push("/dealer/stocks");
            }
          }}
        />

        {/* Scrollable View Content Canvas - Fluid Responsive for Desktop/Laptop/Tablet/Mobile */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 lg:p-8 pb-24 lg:pb-8 touch-scroll">
          <div className="max-w-[1680px] 2xl:max-w-[1960px] w-full mx-auto">
            {renderViewContent()}
          </div>
        </main>

        {/* 3. Mobile / Small Tablet Bottom Navigation Bar (Hidden on Desktop & Laptop) */}
        <MobileBottomNav
          activeTab={viewingVehicleId ? (portal === "admin" || pathname.startsWith("/admin") || currentUser?.role === "AUTOHUB_ADMIN" ? "admin-catalogue" : "dealer-stock") : activeTab}
          onTabChange={handleTabChange}
          onOpenMenu={() => setIsMobileDrawerOpen(true)}
        />
      </div>
    </div>
  );
}
