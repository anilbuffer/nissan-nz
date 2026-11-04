const fs = require('fs');

let code = fs.readFileSync('components/japan/JapanInventoryDetailsView.tsx', 'utf8');

// 1. Add import AmendVehicleForm
if (!code.includes('import AmendVehicleForm')) {
  code = code.replace(
    'import { audio } from "@/lib/sound";',
    'import { audio } from "@/lib/sound";\nimport AmendVehicleForm from "./AmendVehicleForm";'
  );
}

// 2. Update interface JapanInventoryDetailsViewProps
code = code.replace(
  `interface JapanInventoryDetailsViewProps {
  vehicleId: string;
  onBack: () => void;
  onToggleStatus?: (vehicleId: string) => void;
}`,
  `interface JapanInventoryDetailsViewProps {
  vehicleId: string;
  onBack: () => void;
  onToggleStatus?: (vehicleId: string) => void;
  onAmend?: (vehicleId: string) => void;
}`
);

// 3. Update export default function parameters
code = code.replace(
  `export default function JapanInventoryDetailsView({
  vehicleId,
  onBack,
}: JapanInventoryDetailsViewProps) {`,
  `export default function JapanInventoryDetailsView({
  vehicleId,
  onBack,
  onAmend,
}: JapanInventoryDetailsViewProps) {`
);

// 4. Add isAmending state and remove isAmendmentOpen
code = code.replace(
  '  const [isAmendmentOpen, setIsAmendmentOpen] = useState(false);',
  '  const [isAmending, setIsAmending] = useState(false);'
);

// 5. In top, if isAmending return AmendVehicleForm
const amendViewRender = `  // If user opened Amend Details, display full-page AmendVehicleForm (not a modal)
  if (isAmending && vehicle) {
    return (
      <AmendVehicleForm
        vehicleId={vehicle.id}
        onSuccessReturn={() => setIsAmending(false)}
        onViewDetails={() => setIsAmending(false)}
      />
    );
  }`;

code = code.replace(
  '  if (!vehicle) {',
  `${amendViewRender}\n\n  if (!vehicle) {`
);

// 6. Update top header Amend Details button
const oldTopAmendBtn = `            {/* Amend Details Button */}
            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                setEditModel(vehicle.model);
                setEditGrade(vehicle.grade);
                setEditYear(vehicle.year);
                setEditOdo(vehicle.odometerKm);
                setEditTransmission(vehicle.transmission);
                setEditFuel(vehicle.fuelType);
                setEditDrive(vehicle.driveType || "2WD");
                setEditEngineCc(vehicle.engineCc || 1200);
                setEditColor(vehicle.color || "Pearl White");
                setEditAuctionGrade(vehicle.auctionGrade || "4.5");
                setEditInteriorGrade(vehicle.interiorGrade || "A");
                setEditExteriorGrade(vehicle.exteriorGrade || "A");
                setEditFobJPY(vehicle.fobPriceJPY);
                setEditLocation(vehicle.location || "Yokohama Export Terminal");
                setEditCondition(vehicle.conditionSummary || "");
                setEditDefects(vehicle.knownDefects?.join("\\n") || "");
                setIsAmendmentOpen(true);
              }}
              className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Amend Details</span>
            </button>`;

const newTopAmendBtn = `            {/* Amend Details Button - Transitions to Full View (Not a modal) */}
            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                if (onAmend) {
                  onAmend(vehicle.id);
                } else {
                  setIsAmending(true);
                }
              }}
              className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5 cursor-pointer hover:text-[#C3002F] hover:border-[#C3002F] transition-colors"
              title="Amend vehicle specifications"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Amend Details</span>
            </button>`;

code = code.replace(oldTopAmendBtn, newTopAmendBtn);

// 7. Update Amend Specs in specifications card
const oldSpecsAmendBtn = `                  <button
                    type="button"
                    onClick={() => setIsAmendmentOpen(true)}
                    className="text-xs text-[#C3002F] hover:text-[#A00026] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Amend Specs</span>
                  </button>`;

const newSpecsAmendBtn = `                  <button
                    type="button"
                    onClick={() => {
                      audio.playSubtleClick();
                      if (onAmend) {
                        onAmend(vehicle.id);
                      } else {
                        setIsAmending(true);
                      }
                    }}
                    className="text-xs text-[#C3002F] hover:text-[#A00026] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Amend Specs</span>
                  </button>`;

code = code.replace(oldSpecsAmendBtn, newSpecsAmendBtn);

// 8. Remove MODAL 1 completely
const modal1Regex = /\{\/\* ─+\s*\*\/\}\s*\{\/\* MODAL 1: Premium Executive Vehicle Amendment Modal[\s\S]*?\{isAmendmentOpen && \([\s\S]*?<\/form>\s*<\/div>\s*<\/div>\s*\)\}/;

if (modal1Regex.test(code)) {
  code = code.replace(modal1Regex, '');
  console.log('Removed MODAL 1 amendment modal successfully');
} else {
  console.log('WARNING: modal1Regex did not match');
}

// 9. Remove unused state variables and handleSaveAmendment
const unusedStatesRegex = /\s*\/\/ Amendment Form States initialized if vehicle exists[\s\S]*?const \[editDefects, setEditDefects\] = useState\(vehicle\?\.knownDefects\?\.join\("\\n"\) \|\| ""\);/;
if (unusedStatesRegex.test(code)) {
  code = code.replace(unusedStatesRegex, '');
  console.log('Removed unused amendment states');
}

const unusedHandlerRegex = /\s*const handleSaveAmendment = \(e: React\.FormEvent\) => \{[\s\S]*?\};\n/;
if (unusedHandlerRegex.test(code)) {
  code = code.replace(unusedHandlerRegex, '');
  console.log('Removed handleSaveAmendment');
}

fs.writeFileSync('components/japan/JapanInventoryDetailsView.tsx', code, 'utf8');
console.log('Successfully updated JapanInventoryDetailsView.tsx');
