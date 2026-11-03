import { ZoneId, LandedPriceBreakdown, GeographicPricingZone } from "./types";

export const JPY_TO_NZD_EXCHANGE_RATE = 0.01085; // 1 NZD = ~92.16 JPY

export const OFFICIAL_PRICING_ZONES: Record<ZoneId, GeographicPricingZone> = {
  ZONE_1: {
    zoneId: "ZONE_1",
    zoneName: "Zone 1 - Upper North Island",
    coverage: "Upper North Island",
    majorLocations: ["Auckland", "Northland", "Whangarei"],
    deliveryCostNZD: 650,
    oceanFreightNZD: 1950,
    customsProcessingNZD: 380,
    complianceInspectionNZD: 680,
    programmeFeeNZD: 550,
    effectiveDate: "2026-11-01",
    notes: "Direct Auckland port clearance and two metro / near-port carrier movements.",
  },
  ZONE_2: {
    zoneId: "ZONE_2",
    zoneName: "Zone 2 - Central North Island",
    coverage: "Central North Island",
    majorLocations: ["Waikato", "Bay of Plenty", "Rotorua", "Taupō", "Hamilton", "Tauranga"],
    deliveryCostNZD: 850,
    oceanFreightNZD: 1950,
    customsProcessingNZD: 380,
    complianceInspectionNZD: 680,
    programmeFeeNZD: 550,
    effectiveDate: "2026-11-01",
    notes: "Auckland / Tauranga arrival with central arterial linehaul carrier delivery.",
  },
  ZONE_3: {
    zoneId: "ZONE_3",
    zoneName: "Zone 3 - Lower North Island",
    coverage: "Lower North Island",
    majorLocations: ["Taranaki", "Hawke's Bay", "Gisborne", "Manawatū", "Wellington", "Palmerston North", "New Plymouth", "Napier"],
    deliveryCostNZD: 1150,
    oceanFreightNZD: 1950,
    customsProcessingNZD: 380,
    complianceInspectionNZD: 680,
    programmeFeeNZD: 550,
    effectiveDate: "2026-11-01",
    notes: "Lower North Island regional carrier movements to dealership depot.",
  },
  ZONE_4: {
    zoneId: "ZONE_4",
    zoneName: "Zone 4 - Upper South Island",
    coverage: "Upper South Island",
    majorLocations: ["Nelson", "Marlborough", "Canterbury", "Christchurch", "Blenheim"],
    deliveryCostNZD: 1450,
    oceanFreightNZD: 1950,
    customsProcessingNZD: 380,
    complianceInspectionNZD: 680,
    programmeFeeNZD: 550,
    effectiveDate: "2026-11-01",
    notes: "Lyttelton port arrival or coastal Cook Strait vehicle carrier movement.",
  },
  ZONE_5: {
    zoneId: "ZONE_5",
    zoneName: "Zone 5 - Lower South Island",
    coverage: "Lower South Island",
    majorLocations: ["West Coast", "Otago", "Southland", "Dunedin", "Invercargill", "Queenstown"],
    deliveryCostNZD: 1750,
    oceanFreightNZD: 1950,
    customsProcessingNZD: 380,
    complianceInspectionNZD: 680,
    programmeFeeNZD: 550,
    effectiveDate: "2026-11-01",
    notes: "Long-haul southern linehaul carrier movements to lower South Island hubs.",
  },
};

/**
 * Calculates the exact Total Buy Price and commercial breakdown for a vehicle
 * based on its FOB JPY price and the dealer's assigned Geographic Pricing Zone.
 */
export function calculateLandedPrice(fobJPY: number, zoneId: ZoneId): LandedPriceBreakdown {
  const zone = OFFICIAL_PRICING_ZONES[zoneId] || OFFICIAL_PRICING_ZONES.ZONE_1;

  // 1. Convert FOB from JPY to NZD (rounded to nearest dollar)
  const fobNZD = Math.round(fobJPY * JPY_TO_NZD_EXCHANGE_RATE);

  // 2. Standard Fixed Components
  const oceanFreightNZD = zone.oceanFreightNZD;
  const customsProcessingNZD = zone.customsProcessingNZD;
  const complianceInspectionNZD = zone.complianceInspectionNZD;
  const programmeFeeNZD = zone.programmeFeeNZD;
  const zoneDeliveryNZD = zone.deliveryCostNZD;

  // 3. NZ GST (15% on CIF = FOB + Freight + Customs processing)
  const taxableImportBase = fobNZD + oceanFreightNZD + customsProcessingNZD;
  const gstNZD = Math.round(taxableImportBase * 0.15);

  // 4. Total Buy Price (Landed, Complied, and Delivered to Dealership)
  const totalBuyPriceNZD =
    fobNZD +
    oceanFreightNZD +
    customsProcessingNZD +
    gstNZD +
    complianceInspectionNZD +
    zoneDeliveryNZD +
    programmeFeeNZD;

  return {
    fobJPY,
    exchangeRateJPYtoNZD: JPY_TO_NZD_EXCHANGE_RATE,
    fobNZD,
    oceanFreightNZD,
    customsProcessingNZD,
    gstNZD,
    complianceInspectionNZD,
    zoneDeliveryNZD,
    programmeFeeNZD,
    totalBuyPriceNZD,
    zoneId: zone.zoneId,
    zoneName: zone.zoneName,
  };
}

