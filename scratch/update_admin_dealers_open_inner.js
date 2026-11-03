const fs = require('fs');

const filePath = 'components/admin/DealerApprovalsView.tsx';

const newCode = `"use client";

import React, { useState } from "react";
import { DealerAccount, ZoneId } from "@/lib/types";
import { useProgramme } from "@/lib/programme-context";
import { OFFICIAL_PRICING_ZONES } from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import {
  Users,
  CheckCircle2,
  XCircle,
  Building2,
  FileCheck2,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Eye,
  Search,
  FileText,
  AlertTriangle,
  Car,
  Hash,
  Award,
  Layers,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

export default function DealerApprovalsView() {
  const { dealers, approveDealer, rejectDealer, updateDealerZone, orders, reservations, users } = useProgramme();

  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  // Track pending zone selection in main view for pending applicants
  const [pendingZoneMap, setPendingZoneMap] = useState<Record<string, ZoneId>>({
    DEALER_005: "ZONE_5",
  });

  // Track zone selection inside the details view
  const [detailSelectedZone, setDetailSelectedZone] = useState<ZoneId | null>(null);
  const [hasSavedDetailZone, setHasSavedDetailZone] = useState(false);

  const pendingDealers = dealers.filter((d) => d.status === "PENDING_APPROVAL");
  const approvedDealers = dealers.filter((d) => d.status === "APPROVED");

  // Selected dealer computed from live context
  const selectedDealer = dealers.find((d) => d.id === selectedDealerId) || null;

  // Filtered lists based on search
  const filteredPending = pendingDealers.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.legalTradingName.toLowerCase().includes(q) ||
      d.dealerCode.toLowerCase().includes(q) ||
      d.nzbn.toLowerCase().includes(q) ||
      d.region.toLowerCase().includes(q) ||
      d.primaryContactName.toLowerCase().includes(q)
    );
  });

  const filteredApproved = approvedDealers.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.legalTradingName.toLowerCase().includes(q) ||
      d.dealerCode.toLowerCase().includes(q) ||
      d.nzbn.toLowerCase().includes(q) ||
      d.region.toLowerCase().includes(q) ||
      d.primaryContactName.toLowerCase().includes(q)
    );
  });

  const handleApprove = (dealerId: string, assignedZone?: ZoneId) => {
    audio.playSuccessChime();
    const zone = assignedZone || pendingZoneMap[dealerId] || "ZONE_1";
    approveDealer(dealerId, zone);
    setNotification(\`Dealership \${dealerId} approved successfully and assigned to \${zone}.\`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleReject = (dealerId: string) => {
    audio.playSubtleClick();
    rejectDealer(dealerId);
    setNotification(\`Dealership application \${dealerId} has been declined.\`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSaveDetailZone = (dealerId: string, zoneId: ZoneId) => {
    audio.playSuccessChime();
    updateDealerZone(dealerId, zoneId);
    setHasSavedDetailZone(true);
    setNotification(\`Updated pricing zone for dealership to \${zoneId}.\`);
    setTimeout(() => {
      setHasSavedDetailZone(false);
      setNotification(null);
    }, 3500);
  };

  // ─────────────────────────────────────────────────────────────
  // A. FULL INNER DETAILS PAGE (When a dealer is selected)
  // ─────────────────────────────────────────────────────────────
  if (selectedDealer) {
    const dealer = selectedDealer;
    const isApproved = dealer.status === "APPROVED";
    const currentZoneId = detailSelectedZone || dealer.pricingZoneId || "ZONE_1";
    const currentZoneConfig = OFFICIAL_PRICING_ZONES[currentZoneId] || OFFICIAL_PRICING_ZONES.ZONE_1;

    // Filter orders and holds belonging to this dealer
    const dealerOrders = orders.filter((o) => o.dealerId === dealer.id);
    const dealerHolds = reservations.filter(
      (r) => r.dealerId === dealer.id && r.status === "ACTIVE_HOLD"
    );
    const dealerUsers = users.filter((u) => u.dealerId === dealer.id);

    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
        {/* Navigation Top Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                setSelectedDealerId(null);
                setDetailSelectedZone(null);
              }}
              className="btn-outline"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>Back to Dealers Overview</span>
            </button>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span>Platform Operations</span>
              <span>/</span>
              <span className="text-slate-900 font-semibold">Franchise Dealers</span>
              <span>/</span>
              <span className="font-mono text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border border-slate-200">
                {dealer.dealerCode}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isApproved ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Authorized Franchise</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 font-mono shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span>Pending Authorization</span>
              </span>
            )}
          </div>
        </div>

        {notification && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notification}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* 4-Stat Executive Highlights Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Assigned Pricing Zone
            </span>
            <div className="text-xl font-black text-slate-900 font-mono">
              {dealer.pricingZoneId}
            </div>
            <span className="text-xs text-slate-500 font-medium block truncate">
              \${currentZoneConfig.deliveryCostNZD.toLocaleString()} NZD Towing Schedule
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Active Exclusivity Holds
            </span>
            <div className="text-xl font-black text-amber-700 font-mono">
              {dealerHolds.length} Vehicles
            </div>
            <span className="text-xs text-slate-500 font-medium block truncate">
              24-Hour Atomic Locks
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Total Wholesale Orders
            </span>
            <div className="text-xl font-black text-slate-900 font-mono">
              {dealerOrders.length} Shipments
            </div>
            <span className="text-xs text-slate-500 font-medium block truncate">
              Confirmed Japan RoRo
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Authorized Staff Accounts
            </span>
            <div className="text-xl font-black text-slate-900 font-mono">
              {dealerUsers.length || 1} Registered
            </div>
            <span className="text-xs text-emerald-600 font-semibold block truncate">
              MFA Security Active
            </span>
          </div>
        </div>

        {/* 2-Column Executive Dealership Dossier */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Legal Profile & Allocation Activity */}
          <div className="lg:col-span-7 space-y-6">
            {/* Legal & Business Entity Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-5 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    Franchise Entity Dossier
                  </span>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    {dealer.legalTradingName}
                  </h2>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700">
                  <Building2 className="w-5 h-5 text-slate-600" />
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">New Zealand Business Number (NZBN):</span>
                  <span className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                    {dealer.nzbn}
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Franchise Dealer Code:</span>
                  <span className="font-mono font-bold text-slate-900">{dealer.dealerCode}</span>
                </div>

                <div className="flex items-start justify-between py-1.5 border-b border-slate-100 gap-3">
                  <span className="text-slate-500 font-medium shrink-0">Showroom Address:</span>
                  <span className="font-medium text-slate-800 text-right">{dealer.address}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Designated Territory:</span>
                  <span className="font-semibold text-slate-800">{dealer.region}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Terms of Trade Agreement:</span>
                  <span className="font-mono text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{dealer.termsAcceptedVersion || "v2026.1 (Fully Executed)"}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500 font-medium">Commercial Boundary Acceptance:</span>
                  <span className="font-semibold text-slate-900">
                    {dealer.costBoundaryAccepted ? "Pre-approved & Cost Boundary Enforced" : "Pending Sign-off"}
                  </span>
                </div>
              </div>
            </div>

            {/* Wholesale Allocation & Exclusivity Limits */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <FileCheck2 className="w-4 h-4 text-[#E11D48]" />
                <span>Commercial Floorplan &amp; Capacity Boundary</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Floorplan Facility</span>
                  <strong className="text-sm font-black text-slate-900 font-mono block">$350,000 NZD</strong>
                  <span className="text-[10px] text-slate-500">Tier 1 Nissan Floorplan</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Concurrent Holds</span>
                  <strong className="text-sm font-black text-slate-900 font-mono block">3 Units Max</strong>
                  <span className="text-[10px] text-slate-500">Atomic 24h Lock Limit</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Direct Order Authority</span>
                  <strong className="text-sm font-black text-emerald-700 block">Self-Service Active</strong>
                  <span className="text-[10px] text-slate-500">Wholesale Catalogue Access</span>
                </div>
              </div>
            </div>

            {/* Active Inventory Activity for this Dealership */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Car className="w-4 h-4 text-slate-600" />
                  <span>Active Stock Holds &amp; Direct Orders ({dealerHolds.length + dealerOrders.length})</span>
                </div>
              </div>

              {dealerHolds.length === 0 && dealerOrders.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500">
                  No active vehicle holds or pending shipments for this dealership right now.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {dealerHolds.map((hold) => (
                    <div
                      key={hold.id}
                      className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <strong className="text-slate-900">
                            #{hold.vehicle?.stockId} · {hold.vehicle?.model}
                          </strong>
                          <span className="text-slate-500 text-[11px] block">
                            24h Exclusivity Hold · Buyer: {hold.userName}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        \${hold.priceSnapshot.totalBuyPriceNZD.toLocaleString()} NZD
                      </span>
                    </div>
                  ))}

                  {dealerOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <strong className="text-slate-900">
                            Order #{order.orderNumber} · {order.vehicle?.make} {order.vehicle?.model}
                          </strong>
                          <span className="text-slate-500 text-[11px] block">
                            Milestone: {order.currentMilestone} · Zone: {order.pricingZoneId}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        \\\${order.priceBreakdown?.totalBuyPriceNZD?.toLocaleString()} NZD
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Contact Dossier, Interactive Zone Config & Admin Actions */}
          <div className="lg:col-span-5 space-y-6">
            {/* Primary Principal Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-4 shadow-2xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Authorized Dealer Principal
              </span>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Principal Name:</span>
                  <strong className="text-slate-900 font-bold">{dealer.primaryContactName}</strong>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Direct Email:</span>
                  <a
                    href={\`mailto:\${dealer.primaryContactEmail}\`}
                    className="text-[#E11D48] hover:underline font-medium flex items-center gap-1 font-mono"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dealer.primaryContactEmail}</span>
                  </a>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500 font-medium">Direct Telephone:</span>
                  <a
                    href={\`tel:\${dealer.primaryContactPhone}\`}
                    className="text-slate-800 hover:text-slate-900 font-mono font-medium flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dealer.primaryContactPhone}</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Interactive Pricing & Towing Zone Configuration */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-4 shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-black text-slate-900 text-sm">
                    Geographic Pricing Zone Configuration
                  </h3>
                  {hasSavedDetailZone && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1 animate-in fade-in">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Saved!</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Determines the fixed wholesale landed towing rate ($650 – $1,750 NZD) attached to all vehicle quotes for this dealer.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                {(Object.keys(OFFICIAL_PRICING_ZONES) as ZoneId[]).map((zoneKey) => {
                  const z = OFFICIAL_PRICING_ZONES[zoneKey];
                  const isSelected = currentZoneId === zoneKey;

                  return (
                    <button
                      key={zoneKey}
                      type="button"
                      onClick={() => {
                        audio.playSubtleClick();
                        setDetailSelectedZone(zoneKey);
                      }}
                      className={\`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between \${
                        isSelected
                          ? "bg-slate-50 border-[#E11D48] ring-2 ring-[#E11D48]/10 shadow-2xs"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }\`}
                    >
                      <div className="space-y-0.5 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-slate-900">{zoneKey}</span>
                          <span className="text-xs font-semibold text-slate-700">· {z.zoneName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate max-w-xs">
                          {z.majorLocations.join(", ")}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-black text-slate-900 text-xs">
                          \${z.deliveryCostNZD} <span className="text-[10px] font-normal text-slate-400">NZD</span>
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-[#E11D48] flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {detailSelectedZone && detailSelectedZone !== dealer.pricingZoneId && (
                <button
                  type="button"
                  onClick={() => handleSaveDetailZone(dealer.id, detailSelectedZone)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Save Zone Assignment ({detailSelectedZone})</span>
                </button>
              )}
            </div>

            {/* Administrative Operational Authority */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-4 shadow-2xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Administrative Operational Authority
              </span>

              {!isApproved ? (
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => handleApprove(dealer.id, currentZoneId)}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs transition-all shadow-[0_4px_16px_rgba(5,150,105,0.3)] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Authorize Franchise &amp; Assign Zone</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReject(dealer.id)}
                    className="w-full btn-outline py-2.5 px-4 text-xs text-rose-700 hover:bg-rose-50 hover:border-rose-200 justify-center"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Decline Application</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Franchise Fully Operational</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    This dealership holds authorized credentials to browse wholesale stock, place 24h locks, and access guaranteed landed pricing.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // B. MAIN DEALERS OVERVIEW (Everything Open Without Tabs)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header Banner & Executive Overview Summary              */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#E11D48] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" />
              Nissan New Zealand Network
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
              Franchise Governance
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Franchise Dealers
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete franchise network directory, pending onboarding requests, NZBN verification, and domestic towing zone assignments.
          </p>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. Executive Network 4-KPI Metric Strip                     */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Total Network
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {dealers.length}
          </div>
          <span className="text-xs text-slate-500 font-medium block truncate">
            Dealership Entities
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Pending Authorizations
          </span>
          <div className="text-2xl font-black text-amber-600 font-mono">
            {pendingDealers.length}
          </div>
          <span className="text-xs text-slate-500 font-medium block truncate">
            Awaiting Zone &amp; Sign-off
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Active Showrooms
          </span>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            {approvedDealers.length}
          </div>
          <span className="text-xs text-slate-500 font-medium block truncate">
            Wholesale Authorized
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            National Coverage
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono">
            5 Zones
          </div>
          <span className="text-xs text-slate-500 font-medium block truncate">
            Upper North to Lower South
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. Global Network Search Toolbar                            */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by legal name, dealer code, NZBN, or region..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 transition-all font-medium"
          />
        </div>

        <div className="text-xs text-slate-500 font-mono hidden sm:block">
          {dealers.length} Dealerships Registered
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 4. SECTION 1 (OPEN): Pending Franchise Applications Queue   */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Pending Onboarding Applications ({pendingDealers.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Requires Zone assignment &amp; legal sign-off before stock catalog access is granted
          </span>
        </div>

        {pendingDealers.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-2 shadow-2xs">
            <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-sm text-slate-900">All Dealership Applications Reviewed</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              There are no pending franchise authorizations. New onboarding registrations will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPending.map((dealer) => {
              const currentZone = pendingZoneMap[dealer.id] || dealer.pricingZoneId || "ZONE_1";

              return (
                <div
                  key={dealer.id}
                  className="bg-white rounded-3xl border-2 border-amber-300 shadow-xs p-6 space-y-6 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-black text-lg shrink-0">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-slate-900 text-base">
                            {dealer.legalTradingName}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono text-[10px] font-bold border border-amber-200">
                            PENDING AUTHORIZATION
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono">
                          Dealer Code: <strong className="text-slate-800">{dealer.dealerCode}</strong> · NZBN: <strong className="text-slate-800">{dealer.nzbn}</strong>
                        </p>
                        <p className="text-xs text-slate-600 flex items-center gap-1.5 pt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{dealer.address}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-left md:text-right space-y-1 text-xs">
                      <div className="text-slate-600 flex items-center md:justify-end gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono">{dealer.primaryContactEmail}</span>
                      </div>
                      <div className="text-slate-600 flex items-center md:justify-end gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono">{dealer.primaryContactPhone}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 pt-1 font-mono">
                        Terms Version: {dealer.termsAcceptedVersion || "v2026.1"}
                      </div>
                    </div>
                  </div>

                  {/* Zone Assignment Selector */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <label className="text-xs font-black text-slate-900 block">
                        Assigned Geographic Pricing Zone
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Applies fixed domestic towing schedule ($650 – $1,750 NZD) to all landed quotes for this franchise.
                      </p>
                    </div>

                    <div className="w-full md:w-80">
                      <select
                        value={currentZone}
                        onChange={(e) =>
                          setPendingZoneMap((prev) => ({
                            ...prev,
                            [dealer.id]: e.target.value as ZoneId,
                          }))
                        }
                        className="w-full px-3 py-2 text-xs bg-white rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 cursor-pointer font-medium"
                      >
                        {(Object.keys(OFFICIAL_PRICING_ZONES) as ZoneId[]).map((zoneKey) => {
                          const z = OFFICIAL_PRICING_ZONES[zoneKey];
                          return (
                            <option key={zoneKey} value={zoneKey}>
                              {zoneKey}: {z.zoneName} (\${z.deliveryCostNZD.toLocaleString()} NZD)
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        audio.playSubtleClick();
                        setSelectedDealerId(dealer.id);
                      }}
                      className="btn-outline text-xs py-2 px-3.5 self-start sm:self-auto"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>Inspect Full Dossier</span>
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleReject(dealer.id)}
                        className="btn-outline text-xs py-2 px-3 text-rose-700 hover:bg-rose-50 hover:border-rose-200"
                      >
                        Decline Application
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApprove(dealer.id, currentZone)}
                        className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-bold transition-all shadow-[0_3px_12px_rgba(5,150,105,0.25)] hover:shadow-[0_4px_16px_rgba(5,150,105,0.35)] cursor-pointer flex items-center gap-2 active:scale-[0.98]"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Authorize Franchise &amp; Assign Zone</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 5. SECTION 2 (OPEN): Approved Franchise Network Directory   */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Approved Franchise Network ({approvedDealers.length})
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Active Nissan New Zealand franchise dealers authorized for wholesale catalogue ordering and 24h holds.
            </p>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            {filteredApproved.length} Dealerships Visible
          </div>
        </div>

        <div className="overflow-x-auto touch-scroll navy-scrollbar">
          <table className="w-full text-left text-xs text-slate-600 min-w-[760px]">
            <thead className="bg-[#0A1322] text-white text-[10px] font-bold uppercase tracking-wider border-b border-[#1B2A42]">
              <tr>
                <th className="py-3.5 px-6 text-slate-200">Dealership Legal Entity</th>
                <th className="py-3.5 px-4 text-slate-200">NZBN</th>
                <th className="py-3.5 px-4 text-slate-200">Assigned Zone</th>
                <th className="py-3.5 px-4 text-slate-200">Delivery Rate</th>
                <th className="py-3.5 px-4 text-slate-200">Authorized Contact</th>
                <th className="py-3.5 px-4 text-slate-200">Terms</th>
                <th className="py-3.5 px-4 text-center text-slate-200">Dossier</th>
                <th className="py-3.5 px-6 text-right text-slate-200">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApproved.map((d) => {
                const zone = OFFICIAL_PRICING_ZONES[d.pricingZoneId] || OFFICIAL_PRICING_ZONES.ZONE_1;

                return (
                  <tr
                    key={d.id}
                    onClick={() => {
                      audio.playSubtleClick();
                      setSelectedDealerId(d.id);
                    }}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <div className="group-hover:text-[#E11D48] transition-colors font-bold text-sm">
                        {d.legalTradingName}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 font-normal mt-0.5">
                        {d.dealerCode} · {d.address}
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-700 font-medium">
                      {d.nzbn}
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 font-mono font-bold text-slate-800 text-[11px] border border-slate-200">
                        {d.pricingZoneId}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-slate-900">
                      \${zone.deliveryCostNZD.toLocaleString()} NZD
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-900">{d.primaryContactName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{d.primaryContactEmail}</div>
                    </td>

                    <td className="py-4 px-4 font-mono text-emerald-700 font-bold">
                      {d.termsAcceptedVersion || "v2026.1"}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          audio.playSubtleClick();
                          setSelectedDealerId(d.id);
                        }}
                        className="btn-outline text-xs py-1.5 px-3"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>Inspect</span>
                      </button>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] font-mono">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync(filePath, newCode, 'utf8');
console.log("Successfully overhauled DealerApprovalsView.tsx with Open Sections and Full Inner Details Page!");
