const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, '..', 'components', 'dealer', 'DealerStockCatalog.tsx');
let content = fs.readFileSync(catalogPath, 'utf8');

// 1. Remove the tab button for Available for Hold
const oldTabButton = `        <button
          type="button"
          onClick={() => {
            audio.playSubtleClick();
            setStatusFilter("AVAILABLE");
          }}
          className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 \${statusFilter === "AVAILABLE"
            ? "bg-[#0A0A0A] text-white shadow-xs"
            : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
            }\`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Available for Hold</span>
          <span className={\`ml-1 px-1.5 py-0.2 rounded-md font-mono text-[10px] \${statusFilter === "AVAILABLE" ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
            }\`}>
            {vehicles.filter((v) => v.status === "AVAILABLE").length}
          </span>
        </button>`;

// 2. Remove the top header badge for Available for Hold
const oldHeaderBadge = `            <>
              <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium flex items-center gap-2 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span><strong className="text-slate-900 font-mono font-bold">{availableCount}</strong> Available for Hold</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium flex items-center gap-1.5 shadow-2xs">
                <span className="text-slate-400 font-normal">Pricing Zone:</span>
                <span className="font-extrabold font-mono text-[#0A0A0A]">{dealerZone}</span>
              </div>
            </>`;

const newHeaderBadge = `            <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium flex items-center gap-1.5 shadow-2xs">
              <span className="text-slate-400 font-normal">Pricing Zone:</span>
              <span className="font-extrabold font-mono text-[#0A0A0A]">{dealerZone}</span>
            </div>`;

// 3. Update statusFilter type
content = content.replace(
  'const [statusFilter, setStatusFilter] = useState<"ALL" | "AVAILABLE" | "HELD">("ALL");',
  'const [statusFilter, setStatusFilter] = useState<"ALL" | "HELD">("ALL");'
);

const normContent = content.replace(/\r\n/g, '\n');
const normOldTab = oldTabButton.replace(/\r\n/g, '\n');
const normOldBadge = oldHeaderBadge.replace(/\r\n/g, '\n');
const normNewBadge = newHeaderBadge.replace(/\r\n/g, '\n');

let updated = normContent;

if (updated.includes(normOldTab)) {
  updated = updated.replace(normOldTab, '');
  console.log('Removed [Available for Hold] tab button successfully.');
} else {
  console.log('Could not find tab button');
}

if (updated.includes(normOldBadge)) {
  updated = updated.replace(normOldBadge, normNewBadge);
  console.log('Removed Available for Hold badge from top header successfully.');
} else {
  console.log('Could not find header badge');
}

fs.writeFileSync(catalogPath, updated, 'utf8');
console.log('DealerStockCatalog.tsx updated.');

