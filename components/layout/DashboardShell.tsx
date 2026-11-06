"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileBottomNav from "./MobileBottomNav";
import { useAuth } from "@/lib/auth-context";
import { UserRole } from "@/lib/types";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import DealerStockCatalog from "@/components/dealer/DealerStockCatalog";
import FullPageVehicleDetail from "@/components/dealer/FullPageVehicleDetail";
import DealerOrdersView from "@/components/dealer/DealerOrdersView";
import DealershipProfileView from "@/components/dealer/DealershipProfileView";
import JapanInventoryView from "@/components/japan/JapanInventoryView";
import JapanInventoryDetailsView from "@/components/japan/JapanInventoryDetailsView";
import BatchUploadView from "@/components/japan/BatchUploadView";
import AddVehicleForm from "@/components/japan/AddVehicleForm";
import AmendVehicleForm from "@/components/japan/AmendVehicleForm";
import AdminDashboardView from "@/components/admin/AdminDashboardView";
import AdminMenuPortalView from "@/components/admin/AdminMenuPortalView";
import AdminReservationsView from "@/components/admin/AdminReservationsView";
import DealerApprovalsView from "@/components/admin/DealerApprovalsView";
import AllocationMilestonesView from "@/components/admin/AllocationMilestonesView";
import AuditExportView from "@/components/admin/AuditExportView";
import UserManagementView from "@/components/admin/UserManagementView";
import RolesPermissionsView from "@/components/admin/RolesPermissionsView";
import AdminPricingConfigView from "@/components/admin/AdminPricingConfigView";
import PlatformSettingsView from "@/components/settings/PlatformSettingsView";
import ProgrammeUserPortalView from "@/components/programme/ProgrammeUserPortalView";
import FullPageOrderDetail from "@/components/programme/FullPageOrderDetail";
import { useProgramme } from "@/lib/programme-context";

interface DashboardShellProps {
  initialVehicleId?: string;
  initialOrderId?: string;
  initialTab?: string;
  portal?: "dealer" | "admin" | "japan" | "programme" | "common";
}

export default function DashboardShell({
  initialVehicleId,
  initialOrderId,
  initialTab,
  portal,
}: DashboardShellProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentUser, switchRole } = useAuth();
  const { orders } = useProgramme();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [viewingVehicleId, setViewingVehicleId] = useState<string | null>(initialVehicleId || null);
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(initialOrderId || null);
  const [globalSearch, setGlobalSearch] = useState("");

  // Automatically default to mini-sidebar on iPad / tablet screens (< 1280px) to maximize content space
  useEffect(() => {
    const handleResponsiveSidebar = () => {
      if (typeof window !== "undefined") {
        if (window.innerWidth >= 768 && window.innerWidth < 1280) {
          setIsSidebarCollapsed(true);
        } else if (window.innerWidth >= 1280) {
          setIsSidebarCollapsed(false);
        }
      }
    };
    handleResponsiveSidebar();
    window.addEventListener("resize", handleResponsiveSidebar);
    return () => window.removeEventListener("resize", handleResponsiveSidebar);
  }, []);

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

  // Sync viewing order ID when route changes
  useEffect(() => {
    if (initialOrderId) {
      setViewingOrderId(initialOrderId);
    } else if (pathname.includes("/admin/orders/")) {
      const parts = pathname.split("/admin/orders/");
      if (parts[1]) {
        setViewingOrderId(parts[1]);
      }
    } else if (pathname.includes("/programme/orders/")) {
      const parts = pathname.split("/programme/orders/");
      if (parts[1]) {
        setViewingOrderId(parts[1]);
      }
    } else if (pathname.includes("/dealer/orders/")) {
      const parts = pathname.split("/dealer/orders/");
      if (parts[1]) {
        setViewingOrderId(parts[1]);
      }
    } else {
      setViewingOrderId(null);
    }
  }, [initialOrderId, pathname]);

  // Role Access Route Guard: Redirect unauthorized cross-portal navigation
  useEffect(() => {
    if (!currentUser) return;

    const isAdminRoute = pathname.startsWith("/admin") || portal === "admin";
    const isJapanRoute = pathname.startsWith("/japan") || portal === "japan";
    const isProgrammeRoute = pathname.startsWith("/programme") || portal === "programme";
    const isDealerRoute = pathname.startsWith("/dealer") || portal === "dealer";

    if (currentUser.role === "DEALER_APPLICANT") {
      if (
        isAdminRoute ||
        isJapanRoute ||
        isProgrammeRoute ||
        pathname === "/dealer/stocks" ||
        pathname === "/dealer/orders" ||
        pathname === "/dealer/reserve"
      ) {
        router.replace("/dealer/profile");
      }
    } else if (currentUser.role === "DEALER_USER" || currentUser.role === "DEALER_ADMIN") {
      if (isAdminRoute || isJapanRoute || isProgrammeRoute) {
        router.replace("/dealer/stocks");
      }
    } else if (currentUser.role === "NISSAN_JAPAN") {
      if (isAdminRoute || isDealerRoute || isProgrammeRoute) {
        router.replace("/japan/inventory");
      }
    } else if (currentUser.role === "READONLY_PROGRAMME_USER") {
      if (isAdminRoute || isDealerRoute || isJapanRoute) {
        router.replace("/programme/stock");
      }
    } else if (currentUser.role === "AUTOHUB_ADMIN") {
      if (isDealerRoute || isJapanRoute || isProgrammeRoute) {
        router.replace("/admin/dashboard");
      }
    }
  }, [currentUser, pathname, portal, router]);

  // Determine active view tab based on pathname and initialTab
  const resolveActiveTab = (): string => {
    if (pathname.includes("/vehicles/")) {
      if (pathname.startsWith("/programme") || portal === "programme" || currentUser?.role === "READONLY_PROGRAMME_USER") {
        return "programme-stock";
      }
      if (currentUser?.role === "AUTOHUB_ADMIN" && (pathname.startsWith("/admin") || portal === "admin")) {
        return "admin-catalogue";
      }
      return "dealer-stock";
    }
    if (pathname.includes("/orders/") && (pathname.startsWith("/programme") || portal === "programme" || currentUser?.role === "READONLY_PROGRAMME_USER")) {
      return "programme-orders";
    }
    if (pathname === "/settings" || initialTab === "settings") return "settings";

    // 1. Admin Portal routes (Strictly AUTOHUB_ADMIN only)
    if (
      currentUser?.role === "AUTOHUB_ADMIN" &&
      (pathname.startsWith("/admin") ||
        portal === "admin" ||
        (!pathname.startsWith("/dealer") && !pathname.startsWith("/japan") && !pathname.startsWith("/programme")))
    ) {
      if (pathname === "/admin/orders" || pathname.startsWith("/admin/orders") || initialTab === "orders" || initialTab === "admin-orders") return "admin-orders";
      if (pathname === "/admin/dashboard" || initialTab === "dashboard" || initialTab === "admin-dashboard") return "admin-dashboard";
      if (pathname === "/admin/catalogue" || pathname === "/admin/catalog" || initialTab === "catalogue" || initialTab === "catalog" || initialTab === "admin-catalogue") return "admin-catalogue";
      if (pathname === "/admin/reservations" || pathname === "/admin/holds" || initialTab === "reservations" || initialTab === "admin-reservations") return "admin-reservations";
      if (pathname === "/admin/dealers" || pathname === "/admin/approvals" || initialTab === "dealers" || initialTab === "admin-dealers" || initialTab === "approvals" || initialTab === "admin-approvals") return "admin-dealers";
      if (pathname === "/admin/inventory" || pathname === "/admin/stock" || initialTab === "inventory" || initialTab === "admin-inventory" || initialTab === "stock" || initialTab === "admin-stock") return "admin-catalogue";
      if (pathname === "/admin/config" || pathname === "/admin/pricing" || initialTab === "config" || initialTab === "admin-config" || initialTab === "pricing" || initialTab === "admin-pricing") return "admin-config";
      if (pathname === "/admin/users" || initialTab === "users" || initialTab === "admin-users") return "admin-dashboard";
      if (pathname === "/admin/roles" || initialTab === "roles" || initialTab === "admin-roles") return "admin-dashboard";
      if (pathname === "/admin/milestones" || pathname === "/admin/allocations" || initialTab === "milestones" || initialTab === "admin-milestones") return "admin-orders";
      if (pathname === "/admin/audit" || initialTab === "audit" || initialTab === "admin-audit") return "admin-audit";
      if (pathname === "/admin" || initialTab === "menu" || initialTab === "admin-menu") return "admin-menu";
      return "admin-dashboard";
    }

    // 2. Japan Portal routes (Strictly NISSAN_JAPAN or AUTOHUB_ADMIN)
    if (
      (currentUser?.role === "NISSAN_JAPAN" || currentUser?.role === "AUTOHUB_ADMIN") &&
      (pathname.startsWith("/japan") ||
        portal === "japan" ||
        (currentUser?.role === "NISSAN_JAPAN" && !pathname.startsWith("/dealer") && !pathname.startsWith("/admin")))
    ) {
      if (pathname === "/japan/upload" || pathname === "/japan/batch-upload" || initialTab === "upload" || initialTab === "japan-upload") return "japan-upload";
      if (pathname === "/japan/add-vehicle" || pathname === "/japan/add-single" || initialTab === "add-vehicle" || initialTab === "japan-add-single") return "japan-add-single";
      if (pathname.startsWith("/japan/amend") || pathname === "/japan/amend-vehicle" || initialTab === "amend-vehicle" || initialTab === "japan-amend-vehicle") return "japan-amend-vehicle";
      if (pathname === "/japan/inventory" || pathname === "/japan" || initialTab === "inventory" || initialTab === "japan-inventory") return "japan-inventory";
      return "japan-inventory";
    }

    // 2b. Programme Portal routes (Strictly READONLY_PROGRAMME_USER or AUTOHUB_ADMIN)
    if (
      (currentUser?.role === "READONLY_PROGRAMME_USER" || currentUser?.role === "AUTOHUB_ADMIN") &&
      (pathname.startsWith("/programme") ||
        portal === "programme" ||
        (currentUser?.role === "READONLY_PROGRAMME_USER" &&
          !pathname.startsWith("/dealer") &&
          !pathname.startsWith("/admin") &&
          !pathname.startsWith("/japan")))
    ) {
      if (pathname === "/programme/stock" || initialTab === "programme-stock" || initialTab === "stock") return "programme-stock";
      if (pathname === "/programme/reservations" || initialTab === "programme-reservations" || initialTab === "reservations") return "programme-reservations";
      if (pathname === "/programme/orders" || initialTab === "programme-orders" || initialTab === "orders") return "programme-orders";
      if (pathname === "/programme/reports" || initialTab === "programme-reports" || initialTab === "reports") return "programme-stock";
      return "programme-stock";
    }

    // 3. Dealer Portal routes
    if (pathname === "/dealer/orders" || initialTab === "orders" || initialTab === "dealer-orders") return "dealer-orders";
    if (pathname === "/dealer/reserve" || pathname === "/dealer/reservations" || initialTab === "reserve" || initialTab === "reservations" || initialTab === "dealer-reserve") return "dealer-reserve";
    if (pathname === "/dealer/profile" || initialTab === "profile" || initialTab === "dealer-profile") return "dealer-profile";
    if (pathname === "/dealer/stocks" || pathname === "/dealer/stock" || initialTab === "stocks" || initialTab === "stock" || initialTab === "dealer-stock") return "dealer-stock";
    if (pathname === "/dealer/terms" || pathname === "/dealer/commercial-boundary" || initialTab === "terms" || initialTab === "dealer-terms") return "dealer-stock";

    // Default by user role if on root or ambiguous
    if (currentUser?.role === "DEALER_APPLICANT") return "dealer-profile";
    if (currentUser?.role === "AUTOHUB_ADMIN") return "admin-dashboard";
    if (currentUser?.role === "NISSAN_JAPAN") return "japan-inventory";
    if (currentUser?.role === "READONLY_PROGRAMME_USER") return "programme-stock";
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
          return "/admin/catalogue";
        case "admin-config":
        case "config":
        case "pricing":
        case "admin-pricing":
          return "/admin/config";
        case "admin-users":
        case "users":
          return "/admin/dashboard";
        case "admin-roles":
        case "roles":
          return "/admin/dashboard";
        case "admin-menu":
        case "menu":
          return "/admin";
        default:
          return "/admin/dashboard";
      }
    }

    // Programme context routing
    if (pathname.startsWith("/programme") || portal === "programme" || currentUser?.role === "READONLY_PROGRAMME_USER") {
      switch (tabId) {
        case "programme-stock":
        case "stock":
          return "/programme/stock";
        case "programme-reservations":
        case "reservations":
        case "holds":
          return "/programme/reservations";
        case "programme-orders":
        case "orders":
          return "/programme/orders";
        case "programme-reports":
        case "reports":
          return "/programme/stock";
        default:
          return "/programme/stock";
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
      case "dealer-reserve":
      case "reserve":
      case "reservations":
        return "/dealer/reserve";
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
        return "/admin/catalogue";
      case "admin-users":
      case "users":
        return "/admin/dashboard";
      case "admin-roles":
      case "roles":
        return "/admin/dashboard";
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
      case "japan-amend-vehicle":
      case "amend-vehicle":
        return "/japan/amend-vehicle";
      case "settings":
        return "/settings";
      default:
        return "/dealer/stocks";
    }
  };

  const handleTabChange = (tabId: string) => {
    setViewingVehicleId(null);
    setViewingOrderId(null);
    const dest = tabToRoute(tabId);
    router.push(dest);
  };

  const handleSelectVehicle = (vehicleId: string) => {
    setViewingVehicleId(vehicleId);
    if (pathname.startsWith("/dealer") || portal === "dealer") {
      router.push(`/dealer/vehicles/${vehicleId}`);
    } else if (pathname.startsWith("/admin") || portal === "admin" || currentUser?.role === "AUTOHUB_ADMIN") {
      router.push(`/admin/vehicles/${vehicleId}`);
    } else if (pathname.startsWith("/japan") || portal === "japan" || currentUser?.role === "NISSAN_JAPAN") {
      router.push(`/japan/inventory/${vehicleId}`);
    } else if (pathname.startsWith("/programme") || portal === "programme" || currentUser?.role === "READONLY_PROGRAMME_USER") {
      router.push(`/programme/vehicles/${vehicleId}`);
    } else {
      router.push(`/dealer/vehicles/${vehicleId}`);
    }
  };

  const handleBackFromVehicle = () => {
    setViewingVehicleId(null);
    if (pathname.startsWith("/dealer") || portal === "dealer") {
      router.push("/dealer/stocks");
    } else if (pathname.startsWith("/admin") || portal === "admin" || currentUser?.role === "AUTOHUB_ADMIN") {
      router.push("/admin/catalogue");
    } else if (pathname.startsWith("/japan") || portal === "japan" || currentUser?.role === "NISSAN_JAPAN") {
      router.push("/japan/inventory");
    } else if (pathname.startsWith("/programme") || portal === "programme" || currentUser?.role === "READONLY_PROGRAMME_USER") {
      router.push("/programme/stock");
    } else {
      router.push("/dealer/stocks");
    }
  };

  // Determine what view to render based on active tab
  const renderViewContent = () => {
    // Role Authorization Guard: Verify user has permission to access this portal/module
    const isAdminRoute = pathname.startsWith("/admin") || portal === "admin";
    const isJapanRoute = pathname.startsWith("/japan") || portal === "japan";
    const isProgrammeRoute = pathname.startsWith("/programme") || portal === "programme";
    const isDealerRoute = pathname.startsWith("/dealer") || portal === "dealer";

    const isUnauthorized =
      ((currentUser?.role === "DEALER_USER" || currentUser?.role === "DEALER_ADMIN") && (isAdminRoute || isJapanRoute || isProgrammeRoute)) ||
      (currentUser?.role === "NISSAN_JAPAN" && (isAdminRoute || isDealerRoute || isProgrammeRoute)) ||
      (currentUser?.role === "READONLY_PROGRAMME_USER" && (isAdminRoute || isDealerRoute || isJapanRoute)) ||
      (currentUser?.role === "AUTOHUB_ADMIN" && (isDealerRoute || isJapanRoute || isProgrammeRoute));

    if (isUnauthorized) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 space-y-4 animate-in fade-in">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#C3002F] animate-pulse">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500 max-w-md">
            Your current role does not have authorization to access this module. Redirecting you to your authorized portal...
          </p>
        </div>
      );
    }

    // 0. Amend Vehicle Full-Page View (Japan Portal)
    if (activeTab === "japan-amend-vehicle") {
      const targetVehicleId = viewingVehicleId || searchParams?.get("id") || searchParams?.get("vehicleId") || initialVehicleId || "VEH_001";
      return (
        <AmendVehicleForm
          vehicleId={targetVehicleId}
          onSuccessReturn={() => {
            setViewingVehicleId(null);
            router.push("/japan/inventory");
          }}
          onViewDetails={(vId) => {
            setViewingVehicleId(vId);
            router.push(`/japan/inventory/${vId}`);
          }}
        />
      );
    }

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
      const isProgrammeContext =
        portal === "programme" ||
        pathname.startsWith("/programme") ||
        currentUser?.role === "READONLY_PROGRAMME_USER";

      const isAdminVehicleView =
        (portal === "admin" || pathname.startsWith("/admin") || currentUser?.role === "AUTOHUB_ADMIN") &&
        portal !== "dealer" &&
        !pathname.startsWith("/dealer") &&
        !isProgrammeContext;

      return (
        <FullPageVehicleDetail
          vehicleId={viewingVehicleId}
          onBack={handleBackFromVehicle}
          isAdmin={isAdminVehicleView}
          isProgramme={isProgrammeContext}
          backLabel={isProgrammeContext ? "Back to Stock Catalogue" : undefined}
        />
      );
    }

    // 1b. Order Detail Full-Page View (Programme Portal)
    if (viewingOrderId && (portal === "programme" || pathname.startsWith("/programme") || currentUser?.role === "READONLY_PROGRAMME_USER")) {
      const targetOrder = orders.find((o) => o.id === viewingOrderId || o.orderNumber === viewingOrderId) || orders[0];
      return (
        <FullPageOrderDetail
          orderId={viewingOrderId}
          orderData={targetOrder}
          backLabel="Back to Wholesale Orders"
          onBack={() => {
            setViewingOrderId(null);
            router.push("/programme/orders");
          }}
          onViewVehicle={(vId) => {
            setViewingOrderId(null);
            setViewingVehicleId(vId);
            router.push(`/programme/vehicles/${vId}`);
          }}
        />
      );
    }

    // 1c. Order Detail Full-Page View (Dealer Portal) - 100% consistent with FullPageVehicleDetail
    if (viewingOrderId && (portal === "dealer" || pathname.startsWith("/dealer") || currentUser?.role === "DEALER_USER" || currentUser?.role === "DEALER_ADMIN")) {
      const targetOrder = orders.find((o) => o.id === viewingOrderId || o.orderNumber === viewingOrderId) || orders[0];
      return (
        <FullPageVehicleDetail
          vehicleId={targetOrder?.vehicle?.id}
          vehicleData={targetOrder?.vehicle}
          orderId={targetOrder?.id}
          orderData={targetOrder}
          backLabel="Back to Orders Grid"
          onBack={() => {
            setViewingOrderId(null);
            router.push("/dealer/orders");
          }}
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
            } else if (currentUser?.role === "READONLY_PROGRAMME_USER") {
              router.push("/programme/stock");
            } else {
              router.push("/dealer/stocks");
            }
          }}
        />
      );
    }

    // 3. Admin Portal Views (Strictly AUTOHUB_ADMIN only)
    if (
      currentUser?.role === 'AUTOHUB_ADMIN' &&
      (pathname.startsWith('/admin') ||
        portal === 'admin' ||
        (!pathname.startsWith('/dealer') && !pathname.startsWith('/japan') && !pathname.startsWith('/programme')))
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
          return (
            <AllocationMilestonesView
              initialOrderId={viewingOrderId || searchParams?.get("orderId") || undefined}
              onSelectOrder={(orderId) => {
                setViewingOrderId(orderId);
                router.push(`/admin/orders/${orderId}`);
              }}
              onBackToOrders={() => {
                setViewingOrderId(null);
                router.push('/admin/orders');
              }}
            />
          );
        case 'admin-reservations':
        case 'reservations':
        case 'holds':
          return <AdminReservationsView onNavigateTab={handleTabChange} />;
        case 'admin-dealers':
        case 'dealers':
          return <DealerApprovalsView />;
        case 'admin-inventory':
        case 'inventory':
        case 'admin-stock':
          return (
            <DealerStockCatalog
              onSelectVehicle={handleSelectVehicle}
              externalSearchQuery={globalSearch}
            />
          );
        case 'admin-config':
        case 'config':
        case 'pricing':
        case 'admin-pricing':
          return <AdminPricingConfigView onNavigateTab={handleTabChange} />;
        // legacy aliases
        case 'admin-users':
          return <AdminDashboardView onNavigateTab={handleTabChange} />;
        case 'admin-roles':
          return <AdminDashboardView onNavigateTab={handleTabChange} />;
        case 'admin-approvals':
          return <DealerApprovalsView />;
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
          if (pathname === '/admin/inventory')
            return (
              <DealerStockCatalog
                onSelectVehicle={handleSelectVehicle}
                externalSearchQuery={globalSearch}
              />
            );
          if (pathname === '/admin/config' || pathname === '/admin/pricing') return <AdminPricingConfigView onNavigateTab={handleTabChange} />;
          if (pathname === '/admin/users') return <AdminDashboardView onNavigateTab={handleTabChange} />;
          if (pathname === '/admin/roles') return <AdminDashboardView onNavigateTab={handleTabChange} />;
          return <AdminDashboardView onNavigateTab={handleTabChange} />;
      }
    }

    // 4. Japan Portal Views (Strictly NISSAN_JAPAN or AUTOHUB_ADMIN)
    if (
      (currentUser?.role === 'NISSAN_JAPAN' || currentUser?.role === 'AUTOHUB_ADMIN') &&
      (pathname.startsWith('/japan') ||
        portal === 'japan' ||
        (currentUser?.role === 'NISSAN_JAPAN' &&
          !pathname.startsWith('/dealer') &&
          !pathname.startsWith('/admin')))
    ) {
      switch (activeTab) {
        case 'japan-inventory':
          return (
            <JapanInventoryView
              onSelectVehicle={handleSelectVehicle}
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
        case 'japan-amend-vehicle':
          return (
            <AmendVehicleForm
              vehicleId={searchParams?.get("id") || searchParams?.get("vehicleId") || initialVehicleId || "VEH_001"}
              onSuccessReturn={() => router.push('/japan/inventory')}
              onViewDetails={(vId) => {
                setViewingVehicleId(vId);
                router.push(`/japan/inventory/${vId}`);
              }}
            />
          );
        default:
          return (
            <JapanInventoryView
              onSelectVehicle={handleSelectVehicle}
              onNavigateAdd={() => router.push('/japan/add-vehicle')}
              onNavigateBatch={() => router.push('/japan/upload')}
            />
          );
      }
    }

    // 4b. Programme Portal Views (Strictly READONLY_PROGRAMME_USER or AUTOHUB_ADMIN)
    if (
      (currentUser?.role === 'READONLY_PROGRAMME_USER' || currentUser?.role === 'AUTOHUB_ADMIN') &&
      (pathname.startsWith('/programme') ||
        portal === 'programme' ||
        (currentUser?.role === 'READONLY_PROGRAMME_USER' &&
          !pathname.startsWith('/dealer') &&
          !pathname.startsWith('/admin') &&
          !pathname.startsWith('/japan')))
    ) {
      const subTab = activeTab.startsWith("programme-") ? (activeTab.replace("programme-", "") as "stock" | "reservations" | "orders") : "stock";
      return <ProgrammeUserPortalView initialSubTab={subTab} />;
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
        return <DealerOrdersView mode="ORDERS" />;
      case 'dealer-reserve':
        return <DealerOrdersView mode="RESERVE" />;
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
            if (typeof window !== "undefined" && window.innerWidth < 768) {
              setIsMobileDrawerOpen((prev) => !prev);
            } else {
              setIsSidebarCollapsed((prev) => !prev);
            }
          }}
          isSidebarCollapsed={isSidebarCollapsed}
          searchValue={globalSearch}
          onSearchChange={setGlobalSearch}
          onSearchSubmit={(val) => {
            if (currentUser?.role === "AUTOHUB_ADMIN") {
              if (!pathname.startsWith("/admin/catalogue")) router.push("/admin/catalogue");
            } else if (currentUser?.role === "NISSAN_JAPAN") {
              if (!pathname.startsWith("/japan/inventory")) router.push("/japan/inventory");
            } else if (currentUser?.role === "READONLY_PROGRAMME_USER") {
              if (!pathname.startsWith("/programme/stock")) router.push("/programme/stock");
            } else {
              if (!pathname.startsWith("/dealer/stocks")) router.push("/dealer/stocks");
            }
          }}
        />

        {/* Scrollable View Content Canvas - Fluid Responsive for Desktop/Laptop/Tablet/Mobile */}
        <main className="flex-1 overflow-y-auto p-2.5 xs:p-3.5 sm:p-5 md:p-6 lg:p-7 xl:p-8 3xl:p-10 pb-20 md:pb-6 touch-scroll">
          <div className="max-w-[1680px] 2xl:max-w-[1960px] 3xl:max-w-[2400px] w-full mx-auto">
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
