const fs = require('fs');

let code = fs.readFileSync('components/japan/JapanInventoryView.tsx', 'utf8');

// 1. Add import
if (!code.includes('import AmendVehicleForm')) {
  code = code.replace(
    'import JapanInventoryDetailsView from "./JapanInventoryDetailsView";',
    'import JapanInventoryDetailsView from "./JapanInventoryDetailsView";\nimport AmendVehicleForm from "./AmendVehicleForm";'
  );
}

// 2. Add Edit3 to lucide-react import
if (!code.includes('Edit3,')) {
  code = code.replace(
    '  Upload,\n} from "lucide-react";',
    '  Upload,\n  Edit3,\n} from "lucide-react";'
  );
}

// 3. Add selectedVehicleForAmend state
if (!code.includes('selectedVehicleForAmend')) {
  code = code.replace(
    '  const [selectedVehicleForDetails, setSelectedVehicleForDetails] = useState<Vehicle | null>(() => {',
    '  const [selectedVehicleForAmend, setSelectedVehicleForAmend] = useState<Vehicle | null>(null);\n  const [selectedVehicleForDetails, setSelectedVehicleForDetails] = useState<Vehicle | null>(() => {'
  );
}

// 4. Add render logic for selectedVehicleForAmend and pass onAmend to JapanInventoryDetailsView
const oldDetailsBlock = `  // If a vehicle is selected, display the full inner details page (Not a modal)
  if (selectedVehicleForDetails) {
    return (
      <JapanInventoryDetailsView
        vehicleId={selectedVehicleForDetails.id}
        onBack={() => setSelectedVehicleForDetails(null)}
        onToggleStatus={handleToggleStatus}
      />
    );
  }`;

const newDetailsBlock = `  // If a vehicle is selected for amend, display the full Amend Vehicle Form view (same approach as /add-vehicle, not a modal)
  if (selectedVehicleForAmend) {
    return (
      <AmendVehicleForm
        vehicleId={selectedVehicleForAmend.id}
        onSuccessReturn={() => setSelectedVehicleForAmend(null)}
        onViewDetails={(vId) => {
          const target = vehicles.find((v) => v.id === vId);
          setSelectedVehicleForAmend(null);
          if (target) setSelectedVehicleForDetails(target);
        }}
      />
    );
  }

  // If a vehicle is selected, display the full inner details page (Not a modal)
  if (selectedVehicleForDetails) {
    return (
      <JapanInventoryDetailsView
        vehicleId={selectedVehicleForDetails.id}
        onBack={() => setSelectedVehicleForDetails(null)}
        onToggleStatus={handleToggleStatus}
        onAmend={(vId) => {
          const target = vehicles.find((v) => v.id === vId);
          if (target) {
            setSelectedVehicleForAmend(target);
            setSelectedVehicleForDetails(null);
          }
        }}
      />
    );
  }`;

code = code.replace(oldDetailsBlock, newDetailsBlock);

// 5. Add Amend button to action column
const oldActionButtons = `{/* Details Action Button - Rightmost */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            audio.playSubtleClick();
                            setSelectedVehicleForDetails(vehicle);
                          }}
                          className="btn-outline text-xs py-1.5 px-3 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>Details</span>
                        </button>`;

const newActionButtons = `{/* Amend Details Action Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            audio.playSubtleClick();
                            setSelectedVehicleForAmend(vehicle);
                          }}
                          className="btn-outline text-xs py-1.5 px-3 cursor-pointer flex items-center gap-1.5 hover:text-[#C3002F] hover:border-[#C3002F] transition-colors"
                          title="Amend vehicle specifications"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Amend Details</span>
                        </button>

                        {/* Details Action Button - Rightmost */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            audio.playSubtleClick();
                            setSelectedVehicleForDetails(vehicle);
                          }}
                          className="btn-outline text-xs py-1.5 px-3 cursor-pointer flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>Details</span>
                        </button>`;

code = code.replace(oldActionButtons, newActionButtons);

fs.writeFileSync('components/japan/JapanInventoryView.tsx', code, 'utf8');
console.log('Successfully updated JapanInventoryView.tsx');
