const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, '..', 'components', 'dealer', 'DealerStockCatalog.tsx');
let content = fs.readFileSync(catalogPath, 'utf8');

// Helper function definition to add before DealerStockCatalog component
const availabilityHelper = `// Realistic Vehicle Availability generator for Japanese export inventory
const getVehicleAvailability = (v: Vehicle, index: number) => {
  if (v.status === "RESERVED") {
    return {
      status: "On Exclusivity Hold",
      dot: "bg-amber-500",
      pillBg: "bg-amber-50 text-amber-900 border-amber-200",
    };
  }
  const variations = [
    { status: "In Stock (Yokohama Yard)", dot: "bg-emerald-500" },
    { status: "In Transit (RoRo Vessel)", dot: "bg-blue-500" },
    { status: "Ready to Ship (Tokyo)", dot: "bg-emerald-500" },
    { status: "In Stock (Immediate Hold)", dot: "bg-emerald-500" },
    { status: "In Transit (ETA 10 Days)", dot: "bg-blue-500" },
    { status: "Verified in Japan Yard", dot: "bg-emerald-500" },
  ];
  const charSum = v.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) + index;
  const item = variations[charSum % variations.length];
  return {
    status: item.status,
    dot: item.dot,
    pillBg: "bg-slate-50 text-slate-800 border-slate-200/90",
  };
};

export default function DealerStockCatalog({`;

content = content.replace('export default function DealerStockCatalog({', availabilityHelper);

// Remove Heart from lucide-react import
content = content.replace('  Heart,\n', '');
content = content.replace('  Heart,\r\n', '');

// In Grid View: update .map((vehicle) to .map((vehicle, index) and compute availability
const oldGridCardTop = `        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-4 min-[2200px]:grid-cols-5 gap-5 sm:gap-6 animate-in fade-in duration-300">
          {filteredVehicles.map((vehicle) => {
            const price = calculateLandedPrice(vehicle.fobPriceJPY, dealerZone);
            const isAvailable = vehicle.status === "AVAILABLE";
            const isFav = !!favorites[vehicle.id];

            return (
              <div
                key={vehicle.id}
                onClick={() => handleOpenFullPageDetails(vehicle.id)}
                className="bg-white rounded-[28px] border border-slate-200/80 hover:border-slate-300 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer p-6 sm:p-7 relative overflow-hidden"
              >
                <div>
                  {/* Card Top Row: Full Width Name + Model, with Arrow & Favorite on Right */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-[#C3002F] transition-colors leading-snug">
                        {vehicle.make} - {vehicle.model}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium mt-1">
                        {vehicle.year} · {vehicle.fuelType} · Grade {vehicle.auctionGrade}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(e, vehicle.id)}
                        aria-label="Add to favorites"
                        className={\`p-2 rounded-full transition-all cursor-pointer \${isFav
                            ? "text-[#C3002F] bg-[#C3002F]/10"
                            : "text-slate-300 hover:text-[#C3002F] hover:bg-slate-50"
                          }\`}
                      >
                        <Heart className={\`w-4 h-4 \${isFav ? "fill-[#C3002F]" : ""}\`} />
                      </button>
                      <div
                        className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-[#C3002F] text-slate-600 group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-2xs shrink-0"
                        title="View Full Vehicle Details"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>`;

const newGridCardTop = `        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-4 min-[2200px]:grid-cols-5 gap-5 sm:gap-6 animate-in fade-in duration-300">
          {filteredVehicles.map((vehicle, index) => {
            const price = calculateLandedPrice(vehicle.fobPriceJPY, dealerZone);
            const isAvailable = vehicle.status === "AVAILABLE";
            const availability = getVehicleAvailability(vehicle, index);

            return (
              <div
                key={vehicle.id}
                onClick={() => handleOpenFullPageDetails(vehicle.id)}
                className="bg-white rounded-[28px] border border-slate-200/80 hover:border-slate-300 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer p-6 sm:p-7 relative overflow-hidden"
              >
                <div>
                  {/* Card Top Row: Full Width Name + Model, with Arrow on Right */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-[#C3002F] transition-colors leading-snug">
                        {vehicle.make} - {vehicle.model}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium mt-1">
                        {vehicle.year} · {vehicle.fuelType} · Grade {vehicle.auctionGrade}
                      </p>

                      {/* Vehicle Availability Label */}
                      <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200/90 text-[10px]">
                        <span className={\`w-1.5 h-1.5 rounded-full \${availability.dot} shrink-0\`} />
                        <span className="text-slate-400 font-medium">Vehicle Availability:</span>
                        <span className="font-bold text-slate-800">{availability.status}</span>
                      </div>
                    </div>

                    <div className="flex items-center shrink-0">
                      <div
                        className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-[#C3002F] text-slate-600 group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-2xs shrink-0"
                        title="View Full Vehicle Details"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>`;

// In List view: also update .map((vehicle) to .map((vehicle, index) and add availability badge
const oldListCardTop = `        <div className="space-y-4 animate-in fade-in duration-300">
          {filteredVehicles.map((vehicle) => {
            const price = calculateLandedPrice(vehicle.fobPriceJPY, dealerZone);
            const isAvailable = vehicle.status === "AVAILABLE";
            const isFav = !!favorites[vehicle.id];`;

const newListCardTop = `        <div className="space-y-4 animate-in fade-in duration-300">
          {filteredVehicles.map((vehicle, index) => {
            const price = calculateLandedPrice(vehicle.fobPriceJPY, dealerZone);
            const isAvailable = vehicle.status === "AVAILABLE";
            const availability = getVehicleAvailability(vehicle, index);`;

// Also in List View info line:
const oldListInfoLine = `<div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-medium">{vehicle.year} · {vehicle.fuelType} · #{vehicle.stockId}</span>
                    <span className="flex items-center gap-1 text-slate-400 text-xs">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{vehicle.location ? vehicle.location.split("(")[0]?.trim() : "Yokohama Yard"}</span>
                    </span>
                  </div>`;

const newListInfoLine = `<div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{vehicle.year} · {vehicle.fuelType} · #{vehicle.stockId}</span>
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200/90 text-[10px]">
                        <span className={\`w-1.5 h-1.5 rounded-full \${availability.dot} shrink-0\`} />
                        <span className="text-slate-400 font-medium">Vehicle Availability:</span>
                        <span className="font-bold text-slate-800">{availability.status}</span>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-slate-400 text-xs">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{vehicle.location ? vehicle.location.split("(")[0]?.trim() : "Yokohama Yard"}</span>
                    </span>
                  </div>`;

let norm = content.replace(/\r\n/g, '\n');
norm = norm.replace(oldGridCardTop.replace(/\r\n/g, '\n'), newGridCardTop);
norm = norm.replace(oldListCardTop.replace(/\r\n/g, '\n'), newListCardTop);
norm = norm.replace(oldListInfoLine.replace(/\r\n/g, '\n'), newListInfoLine);

fs.writeFileSync(catalogPath, norm, 'utf8');
console.log('DealerStockCatalog.tsx: Wishlist icon removed and Vehicle Availability label added successfully!');

