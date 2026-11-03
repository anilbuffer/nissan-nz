const fs = require('fs');
const path = require('path');

// 1. Update mock-data.ts
const mockPath = path.resolve('lib/mock-data.ts');
let mockContent = fs.readFileSync(mockPath, 'utf8').replace(/\r\n/g, '\n');

if (!mockContent.includes('DEALER_006')) {
  const target = `  {
    id: "DEALER_005",
    dealerCode: "NZ-NIS-DND05",
    legalTradingName: "Otago Nissan Dunedin",
    nzbn: "9429039841234",
    address: "444 Andersons Bay Road, South Dunedin 9012",
    region: "Lower South Island (Otago, Southland)",
    pricingZoneId: "ZONE_5",
    status: "PENDING_APPROVAL",
    primaryContactName: "Liam Macpherson",
    primaryContactEmail: "liam@otagonissan.co.nz",
    primaryContactPhone: "+64 3 477 1234",
    termsAcceptedVersion: "v2026.1",
    termsAcceptedAt: "2026-11-02T10:15:00Z",
    costBoundaryAccepted: true,
  },`;

  const replacement = `  {
    id: "DEALER_005",
    dealerCode: "NZ-NIS-DND05",
    legalTradingName: "Otago Nissan Dunedin",
    nzbn: "9429039841234",
    address: "444 Andersons Bay Road, South Dunedin 9012",
    region: "Lower South Island (Otago, Southland)",
    pricingZoneId: "ZONE_5",
    status: "PENDING_APPROVAL",
    primaryContactName: "Liam Macpherson",
    primaryContactEmail: "liam@otagonissan.co.nz",
    primaryContactPhone: "+64 3 477 1234",
    termsAcceptedVersion: "v2026.1",
    termsAcceptedAt: "2026-11-02T10:15:00Z",
    costBoundaryAccepted: true,
  },
  {
    id: "DEALER_006",
    dealerCode: "NZ-NIS-HBY06",
    legalTradingName: "Hawke's Bay Nissan Hastings",
    nzbn: "9429039918273",
    address: "105 Karamu Road North, Hastings 4122",
    region: "Lower North Island (Hawke's Bay)",
    pricingZoneId: "ZONE_3",
    status: "PENDING_APPROVAL",
    primaryContactName: "Cameron Scott",
    primaryContactEmail: "cameron@hbnissan.co.nz",
    primaryContactPhone: "+64 6 878 9100",
    termsAcceptedVersion: "v2026.1",
    termsAcceptedAt: "2026-11-03T08:30:00Z",
    costBoundaryAccepted: true,
  },`;

  mockContent = mockContent.replace(target, replacement);
  fs.writeFileSync(mockPath, mockContent, 'utf8');
  console.log('Added DEALER_006 to mock-data.ts');
}

// 2. Bump storage key in programme-context.tsx from v6 to v7 to ensure fresh pending dealers show up
const progPath = path.resolve('lib/programme-context.tsx');
let progContent = fs.readFileSync(progPath, 'utf8').replace(/\r\n/g, '\n');
progContent = progContent.replace(
  'dealer_platform_programme_state_v6',
  'dealer_platform_programme_state_v7'
);
fs.writeFileSync(progPath, progContent, 'utf8');
console.log('Bumped STORAGE_KEY to v7');

