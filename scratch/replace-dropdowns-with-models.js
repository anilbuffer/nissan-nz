const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, '..', 'components', 'dealer', 'DealerStockCatalog.tsx');
let content = fs.readFileSync(catalogPath, 'utf8');

// 1. Simplify state declarations
const oldStateBlock = `  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState("ALL");
  const [selectedFuel, setSelectedFuel] = useState("ALL");
  const [selectedGrade, setSelectedGrade] = useState("ALL");
  const [selectedBudget, setSelectedBudget] = useState("ALL");
  const [sortBy, setSortBy] = useState<"PRICE_ASC" | "PRICE_DESC" | "KM_ASC" | "YEAR_DESC">("PRICE_ASC");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "HELD">("ALL");`;

const newStateBlock = `  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "HELD">("ALL");`;

// 2. Simplify reset and active filters count
const oldResetBlock = `  // Reset all filters
  const handleResetFilters = () => {
    audio.playSubtleClick();
    setSearchQuery("");
    setSelectedModel("ALL");
    setSelectedFuel("ALL");
    setSelectedGrade("ALL");
    setSelectedBudget("ALL");
    setSortBy("PRICE_ASC");
    setStatusFilter("ALL");
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedModel !== "ALL") count++;
    if (selectedFuel !== "ALL") count++;
    if (selectedGrade !== "ALL") count++;
    if (selectedBudget !== "ALL") count++;
    return count;
  }, [searchQuery, selectedModel, selectedFuel, selectedGrade, selectedBudget]);`;

const newResetBlock = `  // Reset all filters
  const handleResetFilters = () => {
    audio.playSubtleClick();
    setSearchQuery("");
    setSelectedModel("ALL");
    setStatusFilter("ALL");
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedModel !== "ALL") count++;
    return count;
  }, [searchQuery, selectedModel]);`;

// 3. Simplify filteredVehicles
const oldFilterCondition = `        if (selectedModel !== "ALL" && !v.model.toLowerCase().includes(selectedModel.toLowerCase())) {
          return false;
        }

        if (selectedFuel !== "ALL" && v.fuelType !== selectedFuel) {
          return false;
        }

        if (selectedGrade !== "ALL") {
          const numGrade = parseFloat(v.auctionGrade);
          if (selectedGrade === "5.0" && numGrade < 5.0) return false;
          if (selectedGrade === "4.5" && numGrade < 4.5) return false;
          if (selectedGrade === "4.0" && numGrade < 4.0) return false;
        }

        const price = calculateLandedPrice(v.fobPriceJPY, dealerZone).totalBuyPriceNZD;
        if (selectedBudget === "UNDER_25K" && price >= 25000) return false;
        if (selectedBudget === "25K_35K" && (price < 25000 || price > 35000)) return false;
        if (selectedBudget === "OVER_35K" && price <= 35000) return false;

        return true;
      })
      .sort((a, b) => {
        const priceA = calculateLandedPrice(a.fobPriceJPY, dealerZone).totalBuyPriceNZD;
        const priceB = calculateLandedPrice(b.fobPriceJPY, dealerZone).totalBuyPriceNZD;

        if (sortBy === "PRICE_ASC") return priceA - priceB;
        if (sortBy === "PRICE_DESC") return priceB - priceA;
        if (sortBy === "KM_ASC") return a.odometerKm - b.odometerKm;
        return b.year - a.year;
      });
  }, [vehicles, searchQuery, selectedModel, selectedFuel, selectedGrade, selectedBudget, sortBy, dealerZone, statusFilter]);`;

const newFilterCondition = `        if (selectedModel !== "ALL" && !v.model.toLowerCase().includes(selectedModel.toLowerCase())) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = calculateLandedPrice(a.fobPriceJPY, dealerZone).totalBuyPriceNZD;
        const priceB = calculateLandedPrice(b.fobPriceJPY, dealerZone).totalBuyPriceNZD;
        return priceA - priceB;
      });
  }, [vehicles, searchQuery, selectedModel, dealerZone, statusFilter]);`;

// 4. Replace 4 Dropdowns and Bottom Model Strip with Single Models Dropdown in top row
const oldFilterControlsRegex = /\{\/\* Quick Filter Selectors & Sort \*\/\}[\s\S]*?\{\/\* Bottom Filter Row: Model Pills Strip \*\/\}[\s\S]*?<\/div>\s*<\/div>/;

const newFilterControls = `{/* Models Dropdown Filter & View Mode */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Models Dropdown Selector */}
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => {
                  audio.playSubtleClick();
                  setSelectedModel(e.target.value);
                }}
                aria-label="Filter by Model"
                className="appearance-none pl-3.5 pr-8 py-2 text-xs bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#C3002F]/20 focus:border-[#C3002F] transition-all cursor-pointer shadow-2xs"
              >
                <option value="ALL">All Models ({modelStats[0]?.count || 0})</option>
                {modelStats.slice(1).map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.name} ({item.count})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Reset Button */}
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-[#C3002F] hover:text-[#A10026] font-bold flex items-center gap-1 cursor-pointer transition-colors px-2 py-1.5"
                title="Reset filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}

            {/* Grid vs List Layout Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  audio.playSubtleClick();
                  setViewMode("GRID");
                }}
                title="Grid View"
                aria-label="Grid View"
                className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer \${viewMode === "GRID"
                  ? "bg-white text-slate-950 shadow-xs border border-slate-200/60"
                  : "text-slate-500 hover:text-slate-900"
                  }\`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  audio.playSubtleClick();
                  setViewMode("LIST");
                }}
                title="List View"
                aria-label="List View"
                className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer \${viewMode === "LIST"
                  ? "bg-white text-slate-950 shadow-xs border border-slate-200/60"
                  : "text-slate-500 hover:text-slate-900"
                  }\`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
            </div>
          </div>
        </div>
      </div>`;

// Normalize and replace
let norm = content.replace(/\r\n/g, '\n');
norm = norm.replace(oldStateBlock.replace(/\r\n/g, '\n'), newStateBlock);
norm = norm.replace(oldResetBlock.replace(/\r\n/g, '\n'), newResetBlock);
norm = norm.replace(oldFilterCondition.replace(/\r\n/g, '\n'), newFilterCondition);
norm = norm.replace(oldFilterControlsRegex, newFilterControls);

fs.writeFileSync(catalogPath, norm, 'utf8');
console.log('DealerStockCatalog.tsx: 4 dropdowns replaced with Models dropdown filter.');

