"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Vehicle,
  VehicleStatus,
  Order,
  DealerAccount,
  AuditEvent,
  OrderMilestone,
  AdditionalCostItem,
  ZoneId,
  UserAccount,
  ReservationRequest,
  ReservationConfig,
  SystemNotification,
} from "./types";
import {
  MOCK_VEHICLES,
  MOCK_ORDERS,
  MOCK_DEALERS,
  MOCK_AUDIT_LOGS,
  MOCK_USERS,
  MOCK_RESERVATIONS,
  MOCK_NOTIFICATIONS,
} from "./mock-data";
import { calculateLandedPrice, PricingConfig, DEFAULT_PRICING_CONFIG } from "./pricing-calculator";
import { audio } from "./sound";

interface ProgrammeContextType {
  vehicles: Vehicle[];
  orders: Order[];
  dealers: DealerAccount[];
  auditLogs: AuditEvent[];
  users: UserAccount[];
  reservations: ReservationRequest[];
  pricingConfig: PricingConfig;
  updatePricingConfig: (updates: Partial<PricingConfig>) => void;
  resetPricingConfig: () => void;

  // Real-time Event Notifications
  notifications: SystemNotification[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (notif: Omit<SystemNotification, "id" | "time" | "timestamp" | "unread"> & { unread?: boolean }) => void;

  // User Management Actions
  addUser: (user: Omit<UserAccount, "id">) => UserAccount;
  updateUser: (userId: string, updates: Partial<UserAccount>) => void;
  toggleUserStatus: (userId: string) => void;
  deleteUser: (userId: string) => void;

  // Vehicle & Allocation actions
  reserveVehicle: (
    vehicleId: string,
    dealerId: string,
    user?: { id: string; name: string; email: string }
  ) => boolean;
  confirmAllocation: (vehicleId: string, reason?: string) => void;
  releaseHold: (vehicleId: string, reason?: string) => void;
  rejectReservation: (reservationId: string, reason: string) => void;
  cancelReservation: (reservationId: string, reason?: string, cancelledBy?: string) => void;
  expireReservation: (reservationId: string, reason?: string) => void;
  simulateExpiryWarning: (reservationId: string) => void;
  reservationConfig: ReservationConfig;
  updateReservationConfig: (updates: Partial<ReservationConfig>) => void;
  addVehicle: (vehicle: Omit<Vehicle, "id">) => Vehicle;
  batchAddVehicles: (newVehicles: Vehicle[]) => void;
  updateVehicle: (vehicleId: string, updates: Partial<Vehicle>) => void;
  toggleVehicleStatus: (vehicleId: string) => void;
  setVehicleStatus: (vehicleId: string, status: VehicleStatus, reason?: string) => void;

  // Logistics & Milestone actions
  advanceOrderMilestone: (
    orderId: string,
    nextMilestone: OrderMilestone,
    notes?: string,
    extraUpdates?: {
      etaDeliveryDate?: string;
      vesselName?: string;
      voyageNumber?: string;
    }
  ) => void;
  attachAdditionalCost: (orderId: string, costItem: AdditionalCostItem) => void;
  respondToAdditionalCost: (orderId: string, costId: string, decision: "APPROVED" | "DECLINED") => void;

  // Dealer Authorization & Onboarding actions
  approveDealer: (
    dealerId: string,
    pricingZoneId: ZoneId,
    holdingCreditLimitNZD?: number,
    maxConcurrentHolds?: number
  ) => void;
  rejectDealer: (dealerId: string, reason?: string) => void;
  returnDealerApplication: (dealerId: string, reason: string) => void;
  registerDealerApplication: (
    dealerData: Partial<DealerAccount> & {
      legalTradingName: string;
      dealerCode: string;
      primaryContactEmail: string;
    }
  ) => DealerAccount;
  updateDealerZone: (dealerId: string, pricingZoneId: ZoneId) => void;
  updateDealerProfile: (dealerId: string, updates: Partial<DealerAccount>) => void;

  // Helper
  resetToDefaultData: () => void;
}

const ProgrammeContext = createContext<ProgrammeContextType | undefined>(undefined);

export const DEFAULT_RESERVATION_CONFIG: ReservationConfig = {
  defaultHoldHours: 24,
  warningThresholdHours: 2,
  autoReleaseOnExpiry: true,
  maxActiveHoldsPerDealer: 5,
};

const STORAGE_KEY = "dealer_platform_programme_state_v12";

export function ProgrammeProvider({ children }: { children: React.ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(MOCK_VEHICLES);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [dealers, setDealers] = useState<DealerAccount[]>(MOCK_DEALERS);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>(MOCK_AUDIT_LOGS);
  const [users, setUsers] = useState<UserAccount[]>(MOCK_USERS);
  const [reservations, setReservations] = useState<ReservationRequest[]>(MOCK_RESERVATIONS);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>(DEFAULT_PRICING_CONFIG);
  const [reservationConfig, setReservationConfig] = useState<ReservationConfig>(DEFAULT_RESERVATION_CONFIG);
  const [notifications, setNotifications] = useState<SystemNotification[]>(MOCK_NOTIFICATIONS);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on client mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        // Clear old stale storage keys
        try {
          localStorage.removeItem("dealer_platform_programme_state_v1");
          localStorage.removeItem("dealer_platform_programme_state_v2");
          localStorage.removeItem("dealer_platform_programme_state_v3");
          localStorage.removeItem("dealer_platform_programme_state_v4");
          localStorage.removeItem("dealer_platform_programme_state_v5");
          localStorage.removeItem("dealer_platform_programme_state_v6");
          localStorage.removeItem("dealer_platform_programme_state_v7");
          localStorage.removeItem("dealer_platform_programme_state_v8");
          localStorage.removeItem("dealer_platform_programme_state_v9");
          localStorage.removeItem("dealer_platform_programme_state_v10");
          localStorage.removeItem("dealer_platform_programme_state_v11");
        } catch (e) { }

        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.vehicles && Array.isArray(parsed.vehicles)) {
            // Always sync with current MOCK_VEHICLES so transparent PNG cutouts and full catalogue take precedence
            const syncedVehicles = MOCK_VEHICLES.map((mock) => {
              const live = parsed.vehicles.find((v: Vehicle) => v.id === mock.id);
              if (live) {
                return {
                  ...mock,
                  status: live.status || mock.status,
                  reservedByDealerId: live.reservedByDealerId || mock.reservedByDealerId,
                  reservedAt: live.reservedAt || mock.reservedAt,
                  reservationExpiresAt: live.reservationExpiresAt || mock.reservationExpiresAt,
                };
              }
              return mock;
            });
            // Include any dynamically user-added vehicles created in session
            const addedByUser = parsed.vehicles.filter((v: Vehicle) => !MOCK_VEHICLES.some((m) => m.id === v.id));
            setVehicles([...syncedVehicles, ...addedByUser]);
          } else {
            setVehicles(MOCK_VEHICLES);
          }
          if (parsed.orders) setOrders(parsed.orders);
          if (parsed.dealers) setDealers(parsed.dealers);
          if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
          if (parsed.reservationConfig) setReservationConfig({ ...DEFAULT_RESERVATION_CONFIG, ...parsed.reservationConfig });
          if (parsed.notifications && Array.isArray(parsed.notifications)) setNotifications(parsed.notifications);
          if (parsed.users && Array.isArray(parsed.users) && parsed.users.length > 0) {
            setUsers(parsed.users);
          }
          if (parsed.reservations && Array.isArray(parsed.reservations) && parsed.reservations.length > 0) {
            setReservations(parsed.reservations);
          } else {
            setReservations(MOCK_RESERVATIONS);
    setNotifications(MOCK_NOTIFICATIONS);
          }
          if (parsed.pricingConfig) {
            setPricingConfig({
              ...DEFAULT_PRICING_CONFIG,
              ...parsed.pricingConfig,
              zoneDeliveryMatrix: {
                ...DEFAULT_PRICING_CONFIG.zoneDeliveryMatrix,
                ...(parsed.pricingConfig.zoneDeliveryMatrix || {}),
              },
            });
          }
        } else {
          setVehicles(MOCK_VEHICLES);
          setReservations(MOCK_RESERVATIONS);
        }
      } catch (e) {
        console.warn("Could not load persisted programme state:", e);
      }
      setIsHydrated(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ vehicles, orders, dealers, auditLogs, users, reservations, pricingConfig, reservationConfig, notifications })
      );
    } catch (e) {
      console.warn("Could not persist programme state:", e);
    }
  }, [vehicles, orders, dealers, auditLogs, users, reservations, pricingConfig, reservationConfig, notifications, isHydrated]);

  // Helper to log audit event
  const logAudit = (event: Omit<AuditEvent, "id" | "timestamp">) => {
    const newEvent: AuditEvent = {
      ...event,
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newEvent, ...prev]);
  };

  // Helper to add dynamic system notifications
  const addNotification = (notif: Omit<SystemNotification, "id" | "time" | "timestamp" | "unread"> & { unread?: boolean }) => {
    const newNotif: SystemNotification = {
      ...notif,
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      time: "Just now",
      timestamp: new Date().toISOString(),
      unread: notif.unread !== undefined ? notif.unread : true,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };


  // Pricing Configuration Handlers
  const updatePricingConfig = (updates: Partial<PricingConfig>) => {
    setPricingConfig((prev) => {
      const next = {
        ...prev,
        ...updates,
        zoneDeliveryMatrix: {
          ...prev.zoneDeliveryMatrix,
          ...(updates.zoneDeliveryMatrix || {}),
        },
      };
      logAudit({
        actorName: "Operations Administrator",
        actorEmail: "ops@autohub.co.nz",
        actorRole: "AUTOHUB_ADMIN",
        action: "STATUS_CHANGED",
        category: "PRICING",
        objectType: "PricingConfig",
        objectId: "PRICING_MATRIX",
        details: "Commercial landed pricing parameters and matrix components updated.",
      });
      return next;
    });
  };

  const resetPricingConfig = () => {
    setPricingConfig(DEFAULT_PRICING_CONFIG);
    logAudit({
      actorName: "Operations Administrator",
      actorEmail: "ops@autohub.co.nz",
      actorRole: "AUTOHUB_ADMIN",
      action: "STATUS_CHANGED",
      category: "PRICING",
      objectType: "PricingConfig",
      objectId: "PRICING_MATRIX",
      details: "Commercial landed pricing restored to default Nissan NZ schedule.",
    });
  };

  // 1. Reserve Vehicle (Atomic Lock by Dealer with full ReservationRequest snapshot)
  const reserveVehicle = (
    vehicleId: string,
    dealerId: string,
    user?: { id: string; name: string; email: string }
  ): boolean => {
    const target = vehicles.find((v) => v.id === vehicleId);
    if (!target || target.status !== "AVAILABLE") {
      return false; // Concurrency lock failure: already reserved or withdrawn
    }

    const now = new Date().toISOString();
    const holdHours = reservationConfig?.defaultHoldHours || 24;
    const expires = new Date(Date.now() + holdHours * 60 * 60 * 1000).toISOString();
    const dealer = dealers.find((d) => d.id === dealerId) || dealers[0];
    const priceSnapshot = calculateLandedPrice(target.fobPriceJPY, dealer.pricingZoneId, pricingConfig);

    const newReservation: ReservationRequest = {
      id: `RES_${Date.now()}`,
      requestId: `REQ-HOLD-${target.stockId}`,
      vehicleId: target.id,
      vehicle: target,
      dealerId: dealer.id,
      dealerName: dealer.legalTradingName,
      dealerCode: dealer.dealerCode,
      userId: user?.id || "USR_DEALER_01",
      userName: user?.name || dealer.primaryContactName,
      userEmail: user?.email || dealer.primaryContactEmail,
      requestedAt: now,
      expiresAt: expires,
      status: "ACTIVE_HOLD",
      priceSnapshot,
      termsVersionSnapshot: dealer.termsAcceptedVersion || "v2026.1",
      acknowledgedBoundary: true,
      acknowledgedCancellation: true,
    };

    setReservations((prev) => [newReservation, ...prev]);

    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId
          ? {
            ...v,
            status: "RESERVED",
            reservedByDealerId: dealerId,
            reservedAt: now,
            reservationExpiresAt: expires,
          }
          : v
      )
    );

    logAudit({
      actorName: user?.name || dealer.primaryContactName,
      actorEmail: user?.email || dealer.primaryContactEmail,
      actorRole: "DEALER_USER",
      action: "ATOMIC_HOLD_RESERVED",
      category: "RESERVATION",
      objectType: "Vehicle",
      objectId: target.stockId,
      details: `Placed 24h exclusivity hold on ${target.year} ${target.make} ${target.model} (${target.vinChassis}) for ${dealer.legalTradingName}.`,
      beforeValue: { status: "AVAILABLE", reservedByDealerId: null },
      afterValue: { status: "RESERVED", reservedByDealerId: dealerId, expiresAt: expires },
    });

    addNotification({
      type: "HOLD_CREATED",
      title: "24h Exclusivity Hold Placed",
      desc: `Exclusivity hold locked on ${target.year} ${target.make} ${target.model} (#${target.stockId}) for ${dealer.legalTradingName}.`,
      targetRole: "ALL",
      dealerId: dealer.id,
      linkUrl: "/dealer/orders",
    });

    return true;
  };

  // 2. Confirm Allocation (Admin confirms 24h hold into active Order with reason)
  const confirmAllocation = (vehicleId: string, reason?: string) => {
    const targetVehicle = vehicles.find((v) => v.id === vehicleId);
    if (!targetVehicle) return;

    const dealerId = targetVehicle.reservedByDealerId || "DEALER_001";
    const dealer = dealers.find((d) => d.id === dealerId) || dealers[0];
    const orderNum = `ORD-NZ-2026-${String(orders.length + 82).padStart(3, "0")}`;
    const priceBreakdown = calculateLandedPrice(targetVehicle.fobPriceJPY, dealer.pricingZoneId, pricingConfig);
    const now = new Date().toISOString();

    // Update matching reservation if active hold exists
    setReservations((prev) =>
      prev.map((r) =>
        r.vehicleId === vehicleId && r.status === "ACTIVE_HOLD"
          ? {
            ...r,
            status: "CONFIRMED_ALLOCATED",
            decision: "CONFIRMED",
            decisionReason: reason || "Wholesale allocation confirmed by Autohub Operations.",
            decidedAt: now,
            decidedBy: "Sarah Jenkins (Autohub)",
          }
          : r
      )
    );

    const newOrder: Order = {
      id: `ORD_${Date.now()}`,
      orderNumber: orderNum,
      vehicleId: targetVehicle.id,
      vehicle: targetVehicle,
      dealerId: dealer.id,
      dealerName: dealer.legalTradingName,
      pricingZoneId: dealer.pricingZoneId,
      orderedByUserId: "USR_DEALER_01",
      orderedByUserName: dealer.primaryContactName,
      orderedAt: now,
      priceBreakdown,
      currentMilestone: "ORDER_CONFIRMED",
      vesselName: "Trans-Pacific RoRo V.49",
      voyageNumber: "TP-2649",
      etaDeliveryDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      deliveryAddress: dealer.address,
      milestones: [
        {
          key: "ORDER_CONFIRMED",
          label: "Order Confirmed",
          completedAt: now,
          notes: reason || "Autohub Operations confirmed allocation under agreed Terms of Trade.",
          updatedBy: "Sarah Jenkins (Autohub)",
        },
        {
          key: "JAPAN_VERIFICATION",
          label: "Japan Verification",
          eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        },
        {
          key: "BOOKED_FOR_SHIPPING",
          label: "Booked for Shipping",
          eta: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        },
        {
          key: "IN_TRANSIT",
          label: "In Transit (On Vessel)",
          eta: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        },
        {
          key: "NZ_BORDER_PROCESSING",
          label: "NZ Border Processing",
          eta: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        },
        {
          key: "COMPLIANCE",
          label: "Compliance Inspection",
          eta: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        },
        {
          key: "READY_FOR_DELIVERY",
          label: "Ready for Delivery",
          eta: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        },
        {
          key: "DELIVERED",
          label: "Delivered to Dealership",
          eta: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        },
      ],
      documents: [
        {
          id: `DOC_${Date.now()}_01`,
          name: `${targetVehicle.year} ${targetVehicle.make} ${targetVehicle.model} Auction Sheet`,
          type: "AUCTION_SHEET",
          url: targetVehicle.conditionReportUrl || "https://example.com/auction-sheet.pdf",
          uploadedAt: now,
        },
        {
          id: `DOC_${Date.now()}_02`,
          name: "JEVIC Pre-Shipment Inspection Certificate",
          type: "JEVIC_CERTIFICATE",
          url: "https://example.com/jevic-pending.pdf",
          uploadedAt: now,
        },
      ],
      additionalCosts: [],
    };

    setOrders((prev) => [newOrder, ...prev]);

    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId
          ? {
            ...v,
            status: "ALLOCATED",
          }
          : v
      )
    );

    logAudit({
      actorName: "Sarah Jenkins",
      actorEmail: "ops@autohub.co.nz",
      actorRole: "AUTOHUB_ADMIN",
      action: "ALLOCATION_CONFIRMED",
      category: "ALLOCATION",
      objectType: "Order",
      objectId: orderNum,
      details: `Generated order ${orderNum} for ${dealer.legalTradingName}. Reason: ${reason || "Confirmed wholesale purchase"}.`,
      beforeValue: { status: "RESERVED", vehicleId },
      afterValue: { status: "ALLOCATED", orderNumber: orderNum, allocatedToDealer: dealer.id },
    });

    addNotification({
      type: "ORDER_CONFIRMED",
      title: "Wholesale Allocation Confirmed",
      desc: `Order #${orderNum} confirmed for ${targetVehicle.year} ${targetVehicle.make} ${targetVehicle.model}. Progressing to shipping pipeline.`,
      targetRole: "ALL",
      dealerId: dealer.id,
      linkUrl: "/dealer/orders",
    });
  };

  // 3. Release Hold (returns vehicle to available stock with reason)
  const releaseHold = (vehicleId: string, reason?: string) => {
    const target = vehicles.find((v) => v.id === vehicleId);
    if (!target) return;
    const now = new Date().toISOString();

    setReservations((prev) =>
      prev.map((r) =>
        r.vehicleId === vehicleId && r.status === "ACTIVE_HOLD"
          ? {
            ...r,
            status: "RELEASED",
            decision: "RELEASED",
            decisionReason: reason || "Released by Autohub Operations administratively.",
            decidedAt: now,
            decidedBy: "Sarah Jenkins (Autohub)",
          }
          : r
      )
    );

    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId
          ? {
            ...v,
            status: "AVAILABLE",
            reservedByDealerId: undefined,
            reservedAt: undefined,
            reservationExpiresAt: undefined,
          }
          : v
      )
    );

    logAudit({
      actorName: "Sarah Jenkins",
      actorEmail: "ops@autohub.co.nz",
      actorRole: "AUTOHUB_ADMIN",
      action: "HOLD_RELEASED",
      category: "RESERVATION",
      objectType: "Vehicle",
      objectId: target.stockId,
      details: `Released 24-hour administrative hold on ${target.stockId}. Reason: ${reason || "Administrative release"}.`,
      beforeValue: { status: "RESERVED", reservedByDealerId: target.reservedByDealerId },
      afterValue: { status: "AVAILABLE", reservedByDealerId: null },
    });

    addNotification({
      type: "HOLD_EXPIRED",
      title: "Reservation Hold Released",
      desc: `24-hour exclusivity hold on #${target.stockId} released. Stock returned to catalogue.`,
      targetRole: "ALL",
      linkUrl: "/dealer/stocks",
    });
  };

  // 3b. Reject Reservation (US-14: reject with reason)
  const rejectReservation = (reservationId: string, reason: string) => {
    const targetRes = reservations.find((r) => r.id === reservationId);
    if (!targetRes) return;
    const now = new Date().toISOString();

    setReservations((prev) =>
      prev.map((r) =>
        r.id === reservationId
          ? {
            ...r,
            status: "REJECTED",
            decision: "REJECTED",
            decisionReason: reason || "Declined during Autohub wholesale allocation review.",
            decidedAt: now,
            decidedBy: "Sarah Jenkins (Autohub)",
          }
          : r
      )
    );

    setVehicles((prev) =>
      prev.map((v) =>
        v.id === targetRes.vehicleId
          ? {
            ...v,
            status: "AVAILABLE",
            reservedByDealerId: undefined,
            reservedAt: undefined,
            reservationExpiresAt: undefined,
          }
          : v
      )
    );

    logAudit({
      actorName: "Sarah Jenkins",
      actorEmail: "ops@autohub.co.nz",
      actorRole: "AUTOHUB_ADMIN",
      action: "RESERVATION_REJECTED",
      category: "RESERVATION",
      objectType: "ReservationRequest",
      objectId: targetRes.requestId,
      details: `Rejected reservation ${targetRes.requestId} for dealer ${targetRes.dealerName}. Reason: ${reason}.`,
      beforeValue: { status: "ACTIVE_HOLD" },
      afterValue: { status: "REJECTED", reason },
    });
  };

  // 3c. Cancel Reservation (US-14 & US-12 Section 6.2 cooling-off cancellation)
  const cancelReservation = (reservationId: string, reason?: string, cancelledBy?: string) => {
    const targetRes = reservations.find((r) => r.id === reservationId);
    if (!targetRes) return;
    const now = new Date().toISOString();

    setReservations((prev) =>
      prev.map((r) =>
        r.id === reservationId
          ? {
            ...r,
            status: "CANCELLED",
            decision: "CANCELLED",
            decisionReason: reason || "Cancelled under Section 6.2 cooling-off right prior to allocation confirmation.",
            decidedAt: now,
            decidedBy: cancelledBy || "Dealer Buyer",
          }
          : r
      )
    );

    setVehicles((prev) =>
      prev.map((v) =>
        v.id === targetRes.vehicleId
          ? {
            ...v,
            status: "AVAILABLE",
            reservedByDealerId: undefined,
            reservedAt: undefined,
            reservationExpiresAt: undefined,
          }
          : v
      )
    );

    logAudit({
      actorName: cancelledBy || targetRes.userName,
      actorEmail: targetRes.userEmail,
      actorRole: "DEALER_USER",
      action: "HOLD_CANCELLED",
      category: "RESERVATION",
      objectType: "ReservationRequest",
      objectId: targetRes.requestId,
      details: `Cancelled exclusivity hold for ${targetRes.dealerName} on stock #${targetRes.vehicle?.stockId}. Reason: ${reason || "Section 6.2 cooling-off cancellation"}.`,
      beforeValue: { status: "ACTIVE_HOLD", vehicleId: targetRes.vehicleId },
      afterValue: { status: "CANCELLED", vehicleStatus: "AVAILABLE" },
    });

    addNotification({
      type: "HOLD_EXPIRED",
      title: "Reservation Hold Cancelled",
      desc: `Exclusivity hold on #${targetRes.vehicle?.stockId || targetRes.vehicleId} was cancelled under Section 6.2 cooling-off.`,
      targetRole: "ALL",
      dealerId: targetRes.dealerId,
      linkUrl: "/dealer/stocks",
    });
  };

  // 3d. Expire Reservation (US-15 Auto-Release upon hold expiry)
  const expireReservation = (reservationId: string, reason?: string) => {
    const targetRes = reservations.find((r) => r.id === reservationId);
    if (!targetRes) return;
    const now = new Date().toISOString();

    setReservations((prev) =>
      prev.map((r) =>
        r.id === reservationId
          ? {
            ...r,
            status: "EXPIRED",
            decision: "EXPIRED",
            decisionReason: reason || "Exclusivity holding window elapsed without wholesale allocation sign-off.",
            decidedAt: now,
            decidedBy: "System Daemon (Auto-Release)",
          }
          : r
      )
    );

    setVehicles((prev) =>
      prev.map((v) =>
        v.id === targetRes.vehicleId
          ? {
            ...v,
            status: "AVAILABLE",
            reservedByDealerId: undefined,
            reservedAt: undefined,
            reservationExpiresAt: undefined,
          }
          : v
      )
    );

    logAudit({
      actorName: "System Daemon",
      actorEmail: "automation@autohub.co.nz",
      actorRole: "AUTOHUB_ADMIN",
      action: "HOLD_EXPIRED_AUTORELEASE",
      category: "RESERVATION",
      objectType: "Vehicle",
      objectId: targetRes.vehicle?.stockId,
      details: `Automatic release of expired exclusivity hold for ${targetRes.dealerName}. Stock returned to open catalogue.`,
      beforeValue: { status: "RESERVED", reservationExpiresAt: targetRes.expiresAt },
      afterValue: { status: "AVAILABLE", reservationExpiresAt: null },
    });

    addNotification({
      type: "HOLD_EXPIRED",
      title: "Hold Expired & Auto-Released",
      desc: `24h hold on #${targetRes.vehicle?.stockId || targetRes.vehicleId} expired without confirmation and was automatically released.`,
      targetRole: "ALL",
      dealerId: targetRes.dealerId,
      linkUrl: "/dealer/stocks",
    });
  };

  // 3e. Simulate Expiry Warning (<2 hours remaining)
  const simulateExpiryWarning = (reservationId: string) => {
    const warningTime = new Date(Date.now() + 55 * 60 * 1000).toISOString();
    setReservations((prev) =>
      prev.map((r) =>
        r.id === reservationId
          ? { ...r, expiresAt: warningTime }
          : r
      )
    );
    const targetRes = reservations.find((r) => r.id === reservationId);
    if (targetRes) {
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === targetRes.vehicleId
            ? { ...v, reservationExpiresAt: warningTime }
            : v
        )
      );
      addNotification({
        type: "HOLD_WARNING",
        title: "⏱ Exclusivity Hold < 1h Expiry Warning",
        desc: `Hold on ${targetRes.vehicle?.year || 2023} ${targetRes.vehicle?.make || "Nissan"} ${targetRes.vehicle?.model || "Vehicle"} (#${targetRes.vehicle?.stockId || targetRes.vehicleId}) expires in under 1 hour.`,
        targetRole: "ALL",
        dealerId: targetRes.dealerId,
        linkUrl: "/dealer/orders",
      });
    }
  };

  // 3f. Update Reservation Expiry & Warning Configuration (US-15)
  const updateReservationConfig = (updates: Partial<ReservationConfig>) => {
    setReservationConfig((prev) => ({ ...prev, ...updates }));
    logAudit({
      actorName: "Sarah Jenkins",
      actorEmail: "ops@autohub.co.nz",
      actorRole: "AUTOHUB_ADMIN",
      action: "CONFIGURATION_UPDATED",
      category: "RESERVATION",
      objectType: "Configuration",
      objectId: "RESERVATION_RULES_US15",
      details: `Updated reservation rules: default hold=${updates.defaultHoldHours ?? reservationConfig.defaultHoldHours}h, warning threshold=${updates.warningThresholdHours ?? reservationConfig.warningThresholdHours}h, autoRelease=${updates.autoReleaseOnExpiry ?? reservationConfig.autoReleaseOnExpiry}.`,
    });
  };

  // 4. Add Single Vehicle (Nissan Japan)
  const addVehicle = (vehicleData: Omit<Vehicle, "id">): Vehicle => {
    const newId = `VEH_${Date.now()}`;
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: newId,
    };

    setVehicles((prev) => [newVehicle, ...prev]);

    logAudit({
      actorName: "Kenji Sato",
      actorEmail: "k-sato@nissan-japan.co.jp",
      actorRole: "NISSAN_JAPAN",
      action: "VEHICLE_DISPATCHED",
      category: "INVENTORY",
      objectType: "Vehicle",
      objectId: newVehicle.stockId,
      details: `Added new export unit ${newVehicle.year} ${newVehicle.make} ${newVehicle.model} (${newVehicle.vinChassis}) at ${newVehicle.location}.`,
    });

    addNotification({
      type: "STOCK_NEW",
      title: "New Japan Stock Unit Listed",
      desc: `${newVehicle.year} ${newVehicle.make} ${newVehicle.model} (#${newVehicle.stockId}) published to catalogue.`,
      targetRole: "ALL",
      linkUrl: "/dealer/stocks",
    });

    return newVehicle;
  };

  // 5. Batch Add Vehicles (Nissan Japan Batch Upload)
  const batchAddVehicles = (newBatch: Vehicle[]) => {
    setVehicles((prev) => [...newBatch, ...prev]);

    logAudit({
      actorName: "Kenji Sato",
      actorEmail: "k-sato@nissan-japan.co.jp",
      actorRole: "NISSAN_JAPAN",
      action: "INVENTORY_BATCH_PUBLISHED",
      category: "INVENTORY",
      objectType: "BatchUpload",
      objectId: `BATCH-${Date.now().toString().slice(-4)}`,
      details: `Ingested ${newBatch.length} verified export vehicles from Yokohama and Kobe terminals.`,
    });

    addNotification({
      type: "STOCK_NEW",
      title: "New Japan Stock Batch Available",
      desc: `${newBatch.length} verified export units published to catalogue by Yokohama dispatch yard.`,
      targetRole: "ALL",
      linkUrl: "/dealer/stocks",
    });
  };

  // Update Vehicle Parameters (FOB price, specs, etc.)
  const updateVehicle = (vehicleId: string, updates: Partial<Vehicle>) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === vehicleId ? { ...v, ...updates } : v))
    );
    const target = vehicles.find((v) => v.id === vehicleId);
    logAudit({
      actorName: "Operations Administrator",
      actorEmail: "ops@autohub.co.nz",
      actorRole: "AUTOHUB_ADMIN",
      action: "STATUS_CHANGED",
      category: "INVENTORY",
      objectType: "Vehicle",
      objectId: target?.stockId || vehicleId,
      details: `Commercial parameters updated for vehicle ${target?.stockId || vehicleId}.`,
    });
  };

  // 6. Toggle Vehicle Status (Withdraw or Republish)
  const toggleVehicleStatus = (vehicleId: string) => {
    const target = vehicles.find((v) => v.id === vehicleId);
    if (!target) return;

    const nextStatus = target.status === "WITHDRAWN" ? "AVAILABLE" : "WITHDRAWN";

    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId ? { ...v, status: nextStatus } : v
      )
    );

    logAudit({
      actorName: "Sarah Jenkins",
      actorEmail: "ops@autohub.co.nz",
      actorRole: "AUTOHUB_ADMIN",
      action: nextStatus === "AVAILABLE" ? "STOCK_REPUBLISHED" : "STOCK_WITHDRAWN",
      category: "INVENTORY",
      objectType: "Vehicle",
      objectId: target.stockId,
      details: `Status of ${target.stockId} updated to ${nextStatus}.`,
    });

    addNotification({
      type: "STOCK_NEW",
      title: `Stock ${nextStatus === "AVAILABLE" ? "Republished" : "Withdrawn"}`,
      desc: `Vehicle #${target.stockId} (${target.year} ${target.model}) is now ${nextStatus.toLowerCase()}.`,
      targetRole: "ALL",
      linkUrl: "/dealer/stocks",
    });
  };

  // 6b. Set Explicit Vehicle Status across all 6 MVP states
  const setVehicleStatus = (vehicleId: string, status: VehicleStatus, reason?: string) => {
    const target = vehicles.find((v) => v.id === vehicleId);
    if (!target) return;
    const prevStatus = target.status;

    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id !== vehicleId) return v;
        const updated: Vehicle = {
          ...v,
          status,
        };
        if (status === "AVAILABLE" || status === "DRAFT" || status === "WITHDRAWN") {
          if (prevStatus === "RESERVED") {
            updated.reservedByDealerId = undefined;
            updated.reservedAt = undefined;
            updated.reservationExpiresAt = undefined;
          }
        }
        return updated;
      })
    );

    logAudit({
      actorName: "Sarah Jenkins",
      actorEmail: "ops@autohub.co.nz",
      actorRole: "AUTOHUB_ADMIN",
      action:
        status === "AVAILABLE"
          ? "STOCK_REPUBLISHED"
          : status === "WITHDRAWN"
            ? "STOCK_WITHDRAWN"
            : "STATUS_CHANGED",
      category: "INVENTORY",
      objectType: "Vehicle",
      objectId: target.stockId,
      details: `Vehicle ${target.stockId} transitioned from ${prevStatus} to ${status}.${reason ? ` Reason: ${reason}` : ""}`,
      beforeValue: { status: prevStatus },
      afterValue: { status, reason },
    });

    addNotification({
      type: "STOCK_NEW",
      title: `Vehicle Status Transition: ${status}`,
      desc: `Stock #${target.stockId} status updated to ${status}.${reason ? ` Reason: ${reason}` : ""}`,
      targetRole: "ALL",
      linkUrl: "/dealer/stocks",
    });
  };

  // 7. Advance Order Milestone (Autohub Admin)
  const advanceOrderMilestone = (
    orderId: string,
    nextMilestone: OrderMilestone,
    notes?: string,
    extraUpdates?: {
      etaDeliveryDate?: string;
      vesselName?: string;
      voyageNumber?: string;
    }
  ) => {
    const nowStr = new Date().toISOString();

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updatedMilestones = o.milestones.map((m) =>
            m.key === nextMilestone
              ? {
                ...m,
                completedAt: nowStr,
                notes: notes || m.notes || "Milestone completed and verified.",
                updatedBy: "Sarah Jenkins (Autohub Ops)",
              }
              : m
          );

          return {
            ...o,
            currentMilestone: nextMilestone,
            milestones: updatedMilestones,
            ...(extraUpdates?.etaDeliveryDate ? { etaDeliveryDate: extraUpdates.etaDeliveryDate } : {}),
            ...(extraUpdates?.vesselName ? { vesselName: extraUpdates.vesselName } : {}),
            ...(extraUpdates?.voyageNumber ? { voyageNumber: extraUpdates.voyageNumber } : {}),
          };
        }
        return o;
      })
    );

    const targetOrder = orders.find((o) => o.id === orderId);
    logAudit({
      actorName: "Sarah Jenkins",
      actorEmail: "ops@autohub.co.nz",
      actorRole: "AUTOHUB_ADMIN",
      action: "MILESTONE_ADVANCED",
      category: "MILESTONE",
      objectType: "Order",
      objectId: targetOrder?.orderNumber || orderId,
      details: `Advanced order milestone to ${nextMilestone}. Carrier note: ${notes || "Verified"}.`,
    });

    addNotification({
      type: "ORDER_MILESTONE",
      title: `Logistics Milestone: ${nextMilestone.replace(/_/g, " ")}`,
      desc: `Order #${targetOrder?.orderNumber || orderId} progressed to ${nextMilestone.replace(/_/g, " ")}. ${notes ? `Note: ${notes}` : ""}`,
      targetRole: "ALL",
      dealerId: targetOrder?.dealerId,
      linkUrl: "/dealer/orders",
    });
  };

  // 8. Attach Additional Cost Item (Autohub Admin)
  const attachAdditionalCost = (orderId: string, costItem: AdditionalCostItem) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
            ...o,
            currentMilestone: "AWAITING_ADDITIONAL_COST",
            additionalCosts: [...o.additionalCosts, costItem],
          }
          : o
      )
    );

    const targetOrder = orders.find((o) => o.id === orderId);
    logAudit({
      actorName: "Sarah Jenkins",
      actorEmail: "ops@autohub.co.nz",
      actorRole: "AUTOHUB_ADMIN",
      action: "ADDITIONAL_COST_FLAGGED",
      category: "MILESTONE",
      objectType: "Order",
      objectId: targetOrder?.orderNumber || orderId,
      details: `Attached compliance repair quotation ($${costItem.amountNZD} NZD: ${costItem.description}) for dealer signoff.`,
    });

    addNotification({
      type: "COST_PROPOSAL",
      title: "Action Required: Defect Remediation Proposed",
      desc: `MR2A Compliance inspection flagged: ${costItem.description} ($${costItem.amountNZD.toLocaleString()} NZD) on Order #${targetOrder?.orderNumber || orderId}.`,
      targetRole: "DEALER_ADMIN",
      dealerId: targetOrder?.dealerId,
      linkUrl: "/dealer/orders",
    });
  };

  // 9. Dealer Responds to Additional Cost (Approve / Decline)
  const respondToAdditionalCost = (
    orderId: string,
    costId: string,
    decision: "APPROVED" | "DECLINED"
  ) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updatedCosts = o.additionalCosts.map((c) =>
            c.id === costId
              ? {
                ...c,
                status: decision === "APPROVED" ? ("APPROVED" as const) : ("DECLINED" as const),
                decidedAt: new Date().toISOString(),
              }
              : c
          );

          // If approved, update landed buy price total to reflect variation
          const costItem = o.additionalCosts.find((c) => c.id === costId);
          const addAmount = decision === "APPROVED" && costItem ? costItem.amountNZD : 0;

          return {
            ...o,
            currentMilestone: "COMPLIANCE",
            additionalCosts: updatedCosts,
            priceBreakdown: {
              ...o.priceBreakdown,
              totalBuyPriceNZD: o.priceBreakdown.totalBuyPriceNZD + addAmount,
            },
          };
        }
        return o;
      })
    );

    const targetOrder = orders.find((o) => o.id === orderId);
    logAudit({
      actorName: "David Miller",
      actorEmail: "dealer@aucklandnissan.co.nz",
      actorRole: "DEALER_USER",
      action: decision === "APPROVED" ? "COST_VARIATION_APPROVED" : "COST_VARIATION_DECLINED",
      category: "MILESTONE",
      objectType: "Order",
      objectId: targetOrder?.orderNumber || orderId,
      details: `Dealer ${decision.toLowerCase()} the compliance repair variation. Order milestone resumed.`,
    });

    addNotification({
      type: "COST_DECISION",
      title: `Remediation Variation ${decision === "APPROVED" ? "Approved" : "Declined"}`,
      desc: `Dealership ${decision.toLowerCase()} cost variation for Order #${targetOrder?.orderNumber || orderId}.`,
      targetRole: "AUTOHUB_ADMIN",
      dealerId: targetOrder?.dealerId,
      linkUrl: "/admin/orders",
    });
  };

  // 10. Approve Dealer (Autohub Admin)
  const approveDealer = (
    dealerId: string,
    pricingZoneId: ZoneId,
    holdingCreditLimitNZD?: number,
    maxConcurrentHolds?: number
  ) => {
    setDealers((prev) =>
      prev.map((d) =>
        d.id === dealerId
          ? {
            ...d,
            status: "APPROVED",
            pricingZoneId,
            holdingCreditLimitNZD: holdingCreditLimitNZD ?? d.holdingCreditLimitNZD ?? 350000,
            maxConcurrentHolds: maxConcurrentHolds ?? d.maxConcurrentHolds ?? 3,
            returnReason: undefined,
          }
          : d
      )
    );

    const targetDealer = dealers.find((d) => d.id === dealerId);
    logAudit({
      actorName: "Sarah Jenkins",
      actorEmail: "ops@autohub.co.nz",
      actorRole: "AUTOHUB_ADMIN",
      action: "DEALER_ONBOARDING_APPROVED",
      category: "AUTHENTICATION",
      objectType: "DealerAccount",
      objectId: dealerId,
      details: `Approved franchise dealership ${targetDealer?.legalTradingName || dealerId} and assigned to ${pricingZoneId}.`,
    });

    addNotification({
      type: "DEALER_APPROVED",
      title: "Franchise Dealership Approved",
      desc: `${targetDealer?.legalTradingName || dealerId} approved and assigned to ${pricingZoneId}. Japan export catalogue unlocked.`,
      targetRole: "ALL",
      dealerId: dealerId,
      linkUrl: "/admin/dealers",
    });
  };

  // 11. Reject Dealer
  const rejectDealer = (dealerId: string, reason?: string) => {
    setDealers((prev) =>
      prev.map((d) => (d.id === dealerId ? { ...d, status: "REJECTED", returnReason: reason } : d))
    );

    logAudit({
      actorName: "Sarah Jenkins",
      actorEmail: "ops@autohub.co.nz",
      actorRole: "AUTOHUB_ADMIN",
      action: "DEALER_ONBOARDING_REJECTED",
      category: "AUTHENTICATION",
      objectType: "DealerAccount",
      objectId: dealerId,
      details: reason
        ? `Declined dealer onboarding application for ${dealerId}. Reason: ${reason}`
        : `Declined dealer onboarding application for ${dealerId}.`,
    });
  };

  // 11b. Return Dealer Application for Information
  const returnDealerApplication = (dealerId: string, reason: string) => {
    setDealers((prev) =>
      prev.map((d) =>
        d.id === dealerId
          ? {
            ...d,
            status: "RETURNED_FOR_INFO",
            returnReason: reason,
            returnedAt: new Date().toISOString(),
          }
          : d
      )
    );

    const targetDealer = dealers.find((d) => d.id === dealerId);
    logAudit({
      actorName: "Sarah Jenkins",
      actorEmail: "ops@autohub.co.nz",
      actorRole: "AUTOHUB_ADMIN",
      action: "DEALER_APPLICATION_RETURNED",
      category: "AUTHENTICATION",
      objectType: "DealerAccount",
      objectId: dealerId,
      details: `Returned onboarding application for ${targetDealer?.legalTradingName || dealerId} requesting corrections: ${reason}`,
    });

    addNotification({
      type: "DEALER_RETURNED",
      title: "Application Returned for Revisions",
      desc: `Application for ${targetDealer?.legalTradingName || dealerId} returned. Reason: ${reason}`,
      targetRole: "DEALER_ADMIN",
      dealerId: dealerId,
      linkUrl: "/register",
    });
  };

  // 11c. Register Dealer Application (from Registration Wizard)
  const registerDealerApplication = (
    dealerData: Partial<DealerAccount> & {
      legalTradingName: string;
      dealerCode: string;
      primaryContactEmail: string;
    }
  ): DealerAccount => {
    const newDealer: DealerAccount = {
      id: `DEALER_${Date.now()}`,
      dealerCode: dealerData.dealerCode,
      legalTradingName: dealerData.legalTradingName,
      nzbn: dealerData.nzbn || "9429000000000",
      address: dealerData.address || "New Zealand Showroom Depot",
      region: dealerData.region || "Auckland",
      pricingZoneId: dealerData.pricingZoneId || "ZONE_1",
      status: "PENDING_APPROVAL",
      primaryContactName: dealerData.primaryContactName || "Authorized Dealer Principal",
      primaryContactEmail: dealerData.primaryContactEmail,
      primaryContactPhone: dealerData.primaryContactPhone || "+64 9 000 0000",
      termsAcceptedVersion: dealerData.termsAcceptedVersion || "v2026.1",
      termsAcceptedAt: dealerData.termsAcceptedAt || new Date().toISOString(),
      costBoundaryAccepted: dealerData.costBoundaryAccepted ?? true,
      emailVerified: true,
      holdingCreditLimitNZD: 350000,
      maxConcurrentHolds: 3,
    };

    setDealers((prev) => [newDealer, ...prev]);

    logAudit({
      actorName: newDealer.primaryContactName,
      actorEmail: newDealer.primaryContactEmail,
      actorRole: "DEALER_USER",
      action: "DEALER_ONBOARDING_SUBMITTED",
      category: "AUTHENTICATION",
      objectType: "DealerAccount",
      objectId: newDealer.id,
      details: `New dealer application submitted for ${newDealer.legalTradingName} (${newDealer.dealerCode}). Email verified. Terms v2026.1 accepted.`,
    });

    return newDealer;
  };

  // 11d. Update Dealer Profile (from Dealership Profile / Admin)
  const updateDealerProfile = (dealerId: string, updates: Partial<DealerAccount>) => {
    setDealers((prev) =>
      prev.map((d) => (d.id === dealerId ? { ...d, ...updates } : d))
    );

    logAudit({
      actorName: "Sarah Jenkins",
      actorEmail: "ops@autohub.co.nz",
      actorRole: "AUTOHUB_ADMIN",
      action: "DEALERSHIP_PROFILE_UPDATED",
      category: "AUTHENTICATION",
      objectType: "DealerAccount",
      objectId: dealerId,
      details: `Updated dealership profile for ${dealerId}.`,
    });
  };

  // 12. Update Dealer Pricing Zone
  const updateDealerZone = (dealerId: string, pricingZoneId: ZoneId) => {
    setDealers((prev) =>
      prev.map((d) => (d.id === dealerId ? { ...d, pricingZoneId } : d))
    );
  };

  // 13. User Management Actions
  const addUser = (userData: Omit<UserAccount, "id">): UserAccount => {
    const newUser: UserAccount = {
      ...userData,
      id: `USR_${Date.now()}`,
      createdAt: new Date().toISOString(),
      active: true,
      mfaEnabled: userData.mfaEnabled ?? true,
      lastLoginAt: "Pending Invitation",
      lastLoginIp: "—",
    };
    setUsers((prev) => [newUser, ...prev]);

    logAudit({
      actorName: "Sarah Jenkins",
      actorEmail: "ops@autohub.co.nz",
      actorRole: "AUTOHUB_ADMIN",
      action: "USER_INVITED",
      category: "AUTHENTICATION",
      objectType: "UserAccount",
      objectId: newUser.id,
      details: `Invited new platform user ${newUser.name} (${newUser.email}) with role ${newUser.role}.`,
    });

    return newUser;
  };

  const updateUser = (userId: string, updates: Partial<UserAccount>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
    );

    logAudit({
      actorName: "Sarah Jenkins",
      actorEmail: "ops@autohub.co.nz",
      actorRole: "AUTOHUB_ADMIN",
      action: "USER_UPDATED",
      category: "AUTHENTICATION",
      objectType: "UserAccount",
      objectId: userId,
      details: `Updated account details and permissions for user ID ${userId}.`,
    });
  };

  const toggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextActive = !u.active;
          logAudit({
            actorName: "Sarah Jenkins",
            actorEmail: "ops@autohub.co.nz",
            actorRole: "AUTOHUB_ADMIN",
            action: nextActive ? "USER_ACTIVATED" : "USER_SUSPENDED",
            category: "AUTHENTICATION",
            objectType: "UserAccount",
            objectId: userId,
            details: `${nextActive ? "Activated" : "Suspended"} platform access for ${u.name} (${u.email}).`,
          });
          return { ...u, active: nextActive };
        }
        return u;
      })
    );
  };

  const deleteUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));

    if (target) {
      logAudit({
        actorName: "Sarah Jenkins",
        actorEmail: "ops@autohub.co.nz",
        actorRole: "AUTOHUB_ADMIN",
        action: "USER_DELETED",
        category: "AUTHENTICATION",
        objectType: "UserAccount",
        objectId: userId,
        details: `Revoked and removed user account for ${target.name} (${target.email}).`,
      });
    }
  };

  // 14. Reset to Defaults
  const resetToDefaultData = () => {
    setVehicles(MOCK_VEHICLES);
    setOrders(MOCK_ORDERS);
    setDealers(MOCK_DEALERS);
    setAuditLogs(MOCK_AUDIT_LOGS);
    setUsers(MOCK_USERS);
    setReservations(MOCK_RESERVATIONS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) { }
  };

  return (
    <ProgrammeContext.Provider
      value={{
        vehicles,
        orders,
        dealers,
        auditLogs,
        users,
        reservations,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addNotification,
        addUser,
        updateUser,
        toggleUserStatus,
        deleteUser,
        reserveVehicle,
        confirmAllocation,
        releaseHold,
        rejectReservation,
        cancelReservation,
        expireReservation,
        simulateExpiryWarning,
        reservationConfig,
        updateReservationConfig,
        addVehicle,
        batchAddVehicles,
        updateVehicle,
        toggleVehicleStatus,
        setVehicleStatus,
        advanceOrderMilestone,
        attachAdditionalCost,
        respondToAdditionalCost,
        approveDealer,
        rejectDealer,
        returnDealerApplication,
        registerDealerApplication,
        updateDealerProfile,
        updateDealerZone,
        pricingConfig,
        updatePricingConfig,
        resetPricingConfig,
        resetToDefaultData,
      }}
    >
      {children}
    </ProgrammeContext.Provider>
  );
}

export function useProgramme() {
  const context = useContext(ProgrammeContext);
  if (!context) {
    throw new Error("useProgramme must be used within a ProgrammeProvider");
  }
  return context;
}

