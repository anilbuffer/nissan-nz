const fs = require('fs');

const filePath = 'components/dealer/FullPageVehicleDetail.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Star to imports
if (!content.includes('Star,')) {
  content = content.replace('SlidersHorizontal,', 'SlidersHorizontal,\r\n  Star,');
  if (!content.includes('Star,')) {
    content = content.replace('SlidersHorizontal,', 'SlidersHorizontal,\n  Star,');
  }
}

// 2. Replace the quick specs row with the 4 Required Specifications Highlights strip
const oldSpecsSectionRegex = /\{\/\* Clean Inline Quick Specs Row[\s\S]*?<\/div>\s*<\/div>/;

const newSpecsSection = `{/* 4 Required Specifications Highlights (Odometer, Auction Grade, Est. Margin, Yard Location) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 sm:p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            {/* 1. Odometer */}
            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#E11D48] flex items-center justify-center shrink-0 border border-rose-100">
                <Gauge className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Odometer
                </span>
                <strong className="text-xs sm:text-sm font-black text-slate-900 font-mono block truncate">
                  {vehicle.odometerKm.toLocaleString()} km
                </strong>
              </div>
            </div>

            {/* 2. Auction Grade */}
            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Auction Grade
                </span>
                <strong className="text-xs sm:text-sm font-black text-slate-900 block truncate">
                  ★ {vehicle.auctionGrade} / {vehicle.interiorGrade}
                </strong>
              </div>
            </div>

            {/* 3. Est. Margin */}
            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Est. Margin
                </span>
                <strong className="text-xs sm:text-sm font-black text-emerald-600 font-mono block truncate">
                  +\${dealerMarginNZD.toLocaleString()}
                </strong>
              </div>
            </div>

            {/* 4. Yard Location */}
            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Yard Location
                </span>
                <strong className="text-xs sm:text-sm font-black text-slate-900 block truncate" title={vehicle.location || "Yokohama Yard"}>
                  {vehicle.location ? vehicle.location.split("(")[0]?.trim() : "Yokohama Yard"}
                </strong>
              </div>
            </div>
          </div>`;

if (oldSpecsSectionRegex.test(content)) {
  content = content.replace(oldSpecsSectionRegex, newSpecsSection);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("FullPageVehicleDetail.tsx successfully updated with 4 key specifications highlights!");
} else {
  console.error("Could not find oldSpecsSectionRegex in FullPageVehicleDetail.tsx!");
  process.exit(1);
}

