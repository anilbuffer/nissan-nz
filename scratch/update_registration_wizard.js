const fs = require('fs');

const filePath = 'components/onboarding/DealerRegistrationWizard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Download to imports if not present
if (!content.includes('Download,')) {
  content = content.replace('Sparkles,', 'Sparkles,\r\n  Download,');
  if (!content.includes('Download,')) {
    content = content.replace('Sparkles,', 'Sparkles,\n  Download,');
  }
}

// 2. Change action buttons in success view to brand theme
const oldSuccessButtonsCRLF = `              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="w-full sm:w-auto px-7 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-soft cursor-pointer active:scale-[0.99]"
                >
                  Return to Sign In Portal
                </button>
                <button
                  type="button"
                  onClick={() => alert("Application PDF receipt generated with UTC timestamp and terms hash.")}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all cursor-pointer active:scale-[0.99]"
                >
                  Download Application Copy
                </button>
              </div>`;

const newSuccessButtons = `              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    audio.playSubtleClick();
                    router.push("/");
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-[#E11D48] via-[#BE123C] to-[#9F1239] hover:from-[#BE123C] hover:to-[#881337] text-white text-xs font-bold transition-all shadow-[0_4px_18px_rgba(225,29,72,0.35)] hover:shadow-[0_6px_22px_rgba(225,29,72,0.45)] cursor-pointer active:scale-[0.99]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In Portal</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    audio.playSuccessChime();
                    alert("Application PDF receipt generated with UTC timestamp and terms hash.");
                  }}
                  className="w-full sm:w-auto btn-outline text-xs py-3 px-6"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download Application Copy</span>
                </button>
              </div>`;

// Replace success buttons matching either CRLF or LF
const normalizedOldButtons = oldSuccessButtonsCRLF.replace(/\r\n/g, '\n');
const normalizedContent = content.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedOldButtons)) {
  const updatedNormalized = normalizedContent.replace(normalizedOldButtons, newSuccessButtons.replace(/\r\n/g, '\n'));
  content = updatedNormalized;
} else {
  console.log("Warning: normalized old buttons not found directly");
}

// 3. Make Commercial Boundary lists full width (grid-cols-1 instead of grid-cols-1 sm:grid-cols-2)
content = content.replace(
  '<ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">',
  '<ul className="grid grid-cols-1 gap-2 text-[11px] text-slate-600 pt-1">'
);
content = content.replace(
  '<ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">',
  '<ul className="grid grid-cols-1 gap-2 text-[11px] text-slate-600 pt-1">'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully updated DealerRegistrationWizard.tsx");

