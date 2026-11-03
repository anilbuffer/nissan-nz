export type UserRole =
  | "DEALER_USER"
  | "DEALER_ADMIN"
  | "AUTOHUB_ADMIN"
  | "NISSAN_JAPAN"
  | "READONLY_AUDITOR";

export type DealerStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "SUSPENDED";

export type ZoneId = "ZONE_1" | "ZONE_2" | "ZONE_3" | "ZONE_4" | "ZONE_5";

export interface GeographicPricingZone {
  zoneId: ZoneId;
  zoneName: string;
  coverage: string;
  majorLocations: string[];
  deliveryCostNZD: number; // 2 standard domestic delivery movements
  oceanFreightNZD: number; // RoRo marine transit
  complianceInspectionNZD: number; // Standard MR2A compliance entry inspection
  customsProcessingNZD: number; // Customs clearance & biosecurity
  programmeFeeNZD: number; // Nissan programme fee
  effectiveDate: string;
  notes?: string;
}

export interface LandedPriceBreakdown {
  fobJPY: number;
  exchangeRateJPYtoNZD: number;
  fobNZD: number;
  oceanFreightNZD: number;
  customsProcessingNZD: number;
  gstNZD: number;
  complianceInspectionNZD: number;
  zoneDeliveryNZD: number;
  programmeFeeNZD: number;
  totalBuyPriceNZD: number;
  zoneId: ZoneId;
  zoneName: string;
}

export interface DealerAccount {
  id: string;
  dealerCode: string;
  legalTradingName: string;
  nzbn: string;
  address: string;
  region: string;
  pricingZoneId: ZoneId;
  status: DealerStatus;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  termsAcceptedVersion: string;
  termsAcceptedAt: string;
  costBoundaryAccepted: boolean;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  dealerId?: string;
  dealershipName?: string;
  avatar?: string;
  active: boolean;
  phone?: string;
  title?: string;
  department?: string;
  zoneId?: ZoneId;
  mfaEnabled?: boolean;
  lastLoginAt?: string;
  lastLoginIp?: string;
  holdingLimitNZD?: number;
  maxActiveHolds?: number;
  permissions?: string[];
  createdAt?: string;
}

export type PlatformPermission =
  | "inventory.browse"
  | "inventory.view_fob"
  | "inventory.view_landed"
  | "inventory.reserve_hold"
  | "inventory.create_edit"
  | "inventory.batch_upload"
  | "commercial.view_margins"
  | "commercial.configure_zones"
  | "commercial.approve_dealers"
  | "commercial.override_costs"
  | "compliance.view_auction_sheet"
  | "compliance.jevic_signoff"
  | "compliance.mr2a_certification"
  | "compliance.biosecurity_export"
  | "admin.manage_users"
  | "admin.manage_roles"
  | "admin.view_audit_log"
  | "admin.export_financials";

export type VehicleStatus =
  | "DRAFT"
  | "AVAILABLE"
  | "RESERVED"
  | "ALLOCATED"
  | "WITHDRAWN"
  | "SOLD";

export interface Vehicle {
  id: string;
  stockId: string;
  vinChassis: string;
  make: string;
  model: string;
  grade: string;
  year: number;
  odometerKm: number;
  odometerUnit?: "km" | "mi";
  transmission: "Automatic" | "CVT" | "e-Power Drive" | "Manual";
  color: string;
  fuelType: "Petrol" | "Hybrid" | "e-Power" | "100% Electric";
  driveType: "2WD" | "4WD" | "e-4ORCE AWD";
  engineCc: number;
  auctionGrade: string; // e.g. "4.5", "4.0", "RA"
  interiorGrade: string; // "A", "B", "C"
  exteriorGrade: string; // "A", "B", "C"
  conditionSummary?: string;
  inspectionDate?: string;
  location: string;
  images: string[];
  conditionReportUrl?: string;
  knownDefects: string[];
  fobPriceJPY: number;
  status: VehicleStatus;
  reservedByDealerId?: string;
  reservedAt?: string;
  reservationExpiresAt?: string;
}

export type ReservationStatus =
  | "ACTIVE_HOLD"
  | "CONFIRMED_ALLOCATED"
  | "RELEASED"
  | "EXPIRED"
  | "REJECTED"
  | "CANCELLED";

export interface ReservationRequest {
  id: string;
  requestId: string;
  vehicleId: string;
  vehicle: Vehicle;
  dealerId: string;
  dealerName: string;
  dealerCode: string;
  userId: string;
  userName: string;
  userEmail: string;
  requestedAt: string;
  expiresAt: string;
  status: ReservationStatus;
  priceSnapshot: LandedPriceBreakdown;
  termsVersionSnapshot: string;
  acknowledgedBoundary: boolean;
  acknowledgedCancellation: boolean;
  decision?: "CONFIRMED" | "RELEASED" | "EXPIRED" | "REJECTED" | "CANCELLED";
  decisionReason?: string;
  decidedAt?: string;
  decidedBy?: string;
}

export type OrderMilestone =
  | "ORDER_CONFIRMED"
  | "JAPAN_VERIFICATION"
  | "BOOKED_FOR_SHIPPING"
  | "IN_TRANSIT"
  | "NZ_BORDER_PROCESSING"
  | "COMPLIANCE"
  | "AWAITING_ADDITIONAL_COST"
  | "READY_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export interface MilestoneStep {
  key: OrderMilestone;
  label: string;
  completedAt?: string;
  notes?: string;
  updatedBy?: string;
  eta?: string;
}

export interface AdditionalCostItem {
  id: string;
  type: "COMPLIANCE_REPAIR" | "CERTIFICATION" | "BORDER_FLAG" | "STORAGE_TRANSPORT" | "ACCESSORY";
  description: string;
  amountNZD: number;
  evidenceDocumentUrl?: string;
  status: "PENDING_DEALER_APPROVAL" | "APPROVED" | "DECLINED";
  proposedAt: string;
  decidedAt?: string;
  notes?: string;
}

export interface OrderDocument {
  id: string;
  name: string;
  type: "AUCTION_SHEET" | "JEVIC_CERTIFICATE" | "MR2A_PASS" | "BILL_OF_LADING" | "CUSTOMS_ENTRY" | "INVOICE";
  url: string;
  uploadedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  vehicleId: string;
  vehicle: Vehicle;
  dealerId: string;
  dealerName: string;
  pricingZoneId: ZoneId;
  orderedByUserId: string;
  orderedByUserName: string;
  orderedAt: string;
  priceBreakdown: LandedPriceBreakdown;
  currentMilestone: OrderMilestone;
  milestones: MilestoneStep[];
  additionalCosts: AdditionalCostItem[];
  documents?: OrderDocument[];
  etaDeliveryDate?: string;
  deliveryAddress: string;
  vesselName?: string;
  voyageNumber?: string;
}

export interface AuditEvent {
  id: string;
  actorName: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  category: "AUTHENTICATION" | "TERMS" | "PRICING" | "INVENTORY" | "RESERVATION" | "ALLOCATION" | "MILESTONE";
  objectType: string;
  objectId: string;
  details: string;
  timestamp: string;
  beforeValue?: any;
  afterValue?: any;
}
