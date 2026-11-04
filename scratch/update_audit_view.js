const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'admin', 'AuditExportView.tsx');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Lighten quick export action button in header & remove red icon
content = content.replace(
  `          <button
            type="button"
            onClick={() => exportAuditLedger("XLSX")}
            className="px-3.5 py-2 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-[0.98]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-rose-400" />
            <span>Audit (XLSX)</span>
          </button>`,
  `          <button
            type="button"
            onClick={() => exportAuditLedger("XLSX")}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
            <span>Audit (XLSX)</span>
          </button>`
);

// 2. Remove red icon in active tab icon
content = content.replace(
  `<Icon className={\`w-3.5 h-3.5 \${isActive ? "text-rose-400" : "text-slate-400"}\`} />`,
  `<Icon className={\`w-3.5 h-3.5 \${isActive ? "text-white" : "text-slate-400"}\`} />`
);

// 3. Remove "Category: " filters from Filter Bar
const oldFilterBar = `          {/* Filter Bar */}
          <div className="bg-white rounded-[16px] border border-slate-200 p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-3">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by actor name, action, object reference, or details..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all font-sans"
                />
              </div>

              {/* Time window presets */}
              <div className="flex items-center gap-1.5 w-full md:w-auto shrink-0 overflow-x-auto no-scrollbar">
                {[
                  { id: "ALL", label: "All Time" },
                  { id: "24H", label: "Past 24 Hours" },
                  { id: "7D", label: "Past 7 Days" },
                  { id: "30D", label: "Past 30 Days" },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      audio.playSubtleClick();
                      setDateRangeFilter(preset.id as any);
                    }}
                    className={\`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0 \${dateRangeFilter === preset.id
                      ? "bg-slate-900 text-white"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                      }\`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Category:
              </span>
              {[
                "ALL",
                "AUTHENTICATION",
                "TERMS",
                "PRICING",
                "INVENTORY",
                "RESERVATION",
                "ALLOCATION",
                "MILESTONE",
              ].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    audio.playSubtleClick();
                    setCategoryFilter(cat);
                  }}
                  className={\`px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold transition-colors cursor-pointer \${categoryFilter === cat
                    ? "bg-[#C3002F] text-white"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                    }\`}
                >
                  {cat === "ALL" ? "All Categories" : cat}
                </button>
              ))}
            </div>
          </div>`;

const newFilterBar = `          {/* Filter Bar */}
          <div className="bg-white rounded-[16px] border border-slate-200 p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by actor name, action, object reference, or details..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all font-sans"
                />
              </div>

              {/* Time window presets */}
              <div className="flex items-center gap-1.5 w-full md:w-auto shrink-0 overflow-x-auto no-scrollbar">
                {[
                  { id: "ALL", label: "All Time" },
                  { id: "24H", label: "Past 24 Hours" },
                  { id: "7D", label: "Past 7 Days" },
                  { id: "30D", label: "Past 30 Days" },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      audio.playSubtleClick();
                      setDateRangeFilter(preset.id as any);
                    }}
                    className={\`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0 \${dateRangeFilter === preset.id
                      ? "bg-slate-900 text-white"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                      }\`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>`;

if (!content.includes(oldFilterBar)) {
  console.error("oldFilterBar not found!");
  process.exit(1);
}
content = content.replace(oldFilterBar, newFilterBar);

// 4. Lighten Table Header
const oldThead = `<thead className="bg-[#0A0A0A] text-white text-[10px] font-bold uppercase tracking-wider border-b border-[#27272A]">
                  <tr>
                    <th className="py-3 px-4 text-slate-200">Timestamp (NZST)</th>
                    <th className="py-3 px-4 text-slate-200">Actor &amp; Role</th>
                    <th className="py-3 px-4 text-slate-200">Action Code</th>
                    <th className="py-3 px-3 text-slate-200">Category</th>
                    <th className="py-3 px-3 text-slate-200">Object Ref</th>
                    <th className="py-3 px-4 text-slate-200">Details &amp; Audit Trail Remarks</th>
                  </tr>
                </thead>`;

const newThead = `<thead className="bg-slate-50 text-slate-700 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 text-slate-700 font-bold">Timestamp (NZST)</th>
                    <th className="py-3 px-4 text-slate-700 font-bold">Actor &amp; Role</th>
                    <th className="py-3 px-4 text-slate-700 font-bold">Action Code</th>
                    <th className="py-3 px-3 text-slate-700 font-bold">Category</th>
                    <th className="py-3 px-3 text-slate-700 font-bold">Object Ref</th>
                    <th className="py-3 px-4 text-slate-700 font-bold">Details &amp; Audit Trail Remarks</th>
                  </tr>
                </thead>`;

if (!content.includes(oldThead)) {
  console.error("oldThead not found!");
  process.exit(1);
}
content = content.replace(oldThead, newThead);

// 5. Replace dark buttons and red icons in Export Center cards
// Dataset 1
content = content.replace(
  `                <button
                  type="button"
                  onClick={() => exportAuditLedger("CSV")}
                  className="flex-1 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportAuditLedger("XLSX")}
                  className="flex-1 py-2 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-[0.98]"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-rose-400" />
                  <span>Download XLSX</span>
                </button>`,
  `                <button
                  type="button"
                  onClick={() => exportAuditLedger("CSV")}
                  className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportAuditLedger("XLSX")}
                  className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download XLSX</span>
                </button>`
);

// Dataset 2
content = content.replace(
  `                <button
                  type="button"
                  onClick={() => exportStockCatalogue("CSV")}
                  className="flex-1 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportStockCatalogue("XLSX")}
                  className="flex-1 py-2 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-[0.98]"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-rose-400" />
                  <span>Download XLSX</span>
                </button>`,
  `                <button
                  type="button"
                  onClick={() => exportStockCatalogue("CSV")}
                  className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportStockCatalogue("XLSX")}
                  className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download XLSX</span>
                </button>`
);

// Dataset 3
content = content.replace(
  `                <button
                  type="button"
                  onClick={() => exportOrdersPipeline("CSV")}
                  className="flex-1 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportOrdersPipeline("XLSX")}
                  className="flex-1 py-2 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-[0.98]"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-rose-400" />
                  <span>Download XLSX</span>
                </button>`,
  `                <button
                  type="button"
                  onClick={() => exportOrdersPipeline("CSV")}
                  className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportOrdersPipeline("XLSX")}
                  className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download XLSX</span>
                </button>`
);

// Dataset 4
content = content.replace(
  `                <button
                  type="button"
                  onClick={() => exportReservationsQueue("CSV")}
                  className="flex-1 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportReservationsQueue("XLSX")}
                  className="flex-1 py-2 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-[0.98]"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-rose-400" />
                  <span>Download XLSX</span>
                </button>`,
  `                <button
                  type="button"
                  onClick={() => exportReservationsQueue("CSV")}
                  className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportReservationsQueue("XLSX")}
                  className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download XLSX</span>
                </button>`
);

// Dataset 5
content = content.replace(
  `                <button
                  type="button"
                  onClick={() => exportDealersRoster("CSV")}
                  className="flex-1 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportDealersRoster("XLSX")}
                  className="flex-1 py-2 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-[0.98]"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-rose-400" />
                  <span>Download XLSX</span>
                </button>`,
  `                <button
                  type="button"
                  onClick={() => exportDealersRoster("CSV")}
                  className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportDealersRoster("XLSX")}
                  className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download XLSX</span>
                </button>`
);

fs.writeFileSync(filePath, content.replace(/\n/g, '\r\n'), 'utf8');
console.log("Updated AuditExportView.tsx successfully!");

