const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'dealer', 'FullPageVehicleDetail.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings
content = content.replace(/\r\n/g, '\n');

// Remove Unlock and Ban imports
content = content.replace(/  Unlock,\n/, '');
content = content.replace(/  Ban,\n/, '');

// Clean up handleAdminReleaseHold and handleAdminCancelReservation
const unusedFns = `  const handleAdminReleaseHold = () => {
    audio.playSubtleClick();
    releaseHold(vehicle.id, "Hold released by Central Operations Admin back to open stock");
    setActionNotice(\`Hold released for #\${vehicle.stockId}. Stock returned to Available.\`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleAdminCancelReservation = () => {
    audio.playSubtleClick();
    if (activeReservation) {
      cancelReservation(activeReservation.id, "Cancelled under Section 6.2 cooling-off", "Autohub Admin");
    } else {
      releaseHold(vehicle.id, "Cancelled under Section 6.2 cooling-off");
    }
    setActionNotice(\`Hold on #\${vehicle.stockId} cancelled under Section 6.2 cooling-off.\`);
    setTimeout(() => setActionNotice(null), 3500);
  };
`;

if (content.includes(unusedFns)) {
  content = content.replace(unusedFns, '');
}

// Update reject action notice text
content = content.replace(
  'releaseHold(vehicle.id, "Reservation rejected by Central Operations Admin");\n    setActionNotice(`24-hour exclusivity hold released. Unit #${vehicle.stockId} is back in available catalogue.`);',
  'releaseHold(vehicle.id, "Reservation declined by Central Operations Admin");\n    setActionNotice(`Reservation declined. Unit #${vehicle.stockId} is back in available catalogue.`);'
);

fs.writeFileSync(filePath, content.replace(/\n/g, '\r\n'), 'utf8');
console.log("Cleaned up unused imports and functions in FullPageVehicleDetail.tsx!");

