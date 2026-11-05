import { Vehicle } from "./types";

/**
 * Calculates priority score for vehicle/inventory/product listing.
 * Lower score = Higher priority (shows firstly at the top).
 *
 * Priority order requested:
 * 1. Additional Cost (Defect remediation or compliance surcharge attached)
 * 2. Reserved by Auckland Nissan / Current Dealer
 * 3. Buyed
 * 4. Sold
 * 5. Allocated
 * 6. Reserved (generic hold)
 * 7. Available stock
 * 8. Other (Draft / Withdrawn)
 */
export function getVehiclePriorityScore(
  vehicle: Vehicle,
  currentDealerId?: string,
  isAdminView?: boolean
): number {
  const hasAdditionalCost = Boolean(
    vehicle.additionalCosts && vehicle.additionalCosts.length > 0
  );
  const isAucklandReserved =
    vehicle.status === "RESERVED" &&
    (vehicle.reservedByDealerId === "DEALER_001" || vehicle.reservedByDealerId === "Auckland Nissan");
  const isCurrentDealerReserved =
    vehicle.status === "RESERVED" &&
    Boolean(currentDealerId && vehicle.reservedByDealerId === currentDealerId);
  const isAnyDealerReserved =
    vehicle.status === "RESERVED" && Boolean(vehicle.reservedByDealerId);

  // Rank 1: Additional Cost attached
  if (hasAdditionalCost) {
    // If it also has a reservation by Auckland Nissan / Current Dealer, it takes top spot #1
    if (isAucklandReserved || isCurrentDealerReserved) return 10;
    return 15;
  }

  // Rank 2: Reserved by Auckland Nissan or current dealer
  if (isAucklandReserved || isCurrentDealerReserved) {
    return 20;
  }

  // Rank 2.5: Reserved by other network franchise dealer
  if (isAnyDealerReserved) {
    return 25;
  }

  // Rank 3: Buyed
  if (vehicle.status === "BUYED") {
    return 30;
  }

  // Rank 4: Sold
  if (vehicle.status === "SOLD") {
    return 40;
  }

  // Rank 5: Allocated
  if (vehicle.status === "ALLOCATED") {
    return 50;
  }

  // Rank 6: Generic Reserve
  if (vehicle.status === "RESERVED") {
    return 60;
  }

  // Rank 7: Available Stock
  if (vehicle.status === "AVAILABLE") {
    return 70;
  }

  // Rank 8: Draft or Withdrawn
  return 90;
}

/**
 * Returns user-facing dealer reservation label
 */
export function getDealerReservationLabel(
  dealerId?: string,
  isAdminView?: boolean,
  currentDealerId?: string
): string {
  if (!dealerId) return "Reserved";

  if (dealerId === "DEALER_001") return "Reserved by Auckland Nissan";
  if (dealerId === "DEALER_002") return "Reserved by BOP Nissan";
  if (dealerId === "DEALER_003") return "Reserved by Christchurch Nissan";
  if (dealerId === "DEALER_004") return "Reserved by Wellington Nissan";
  if (dealerId === "DEALER_005") return "Reserved by Otago Nissan";

  if (!isAdminView && currentDealerId && dealerId === currentDealerId) {
    return "Reserved by Auckland Nissan (Your Reservation)";
  }

  return `Reserved (${dealerId})`;
}

