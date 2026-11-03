const fs = require('fs');
let code = fs.readFileSync('components/japan/AddVehicleForm.tsx', 'utf8');

const targetMethod = `    setTimeout(() => {
      audio.playSuccessChime();
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 400);
  };`;

const autoFillCode = `    setTimeout(() => {
      audio.playSuccessChime();
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 400);
  };

  const handleAutoFillDemo = () => {
    audio.playSubtleClick();
    setStockId(\`NIS-2026-\${Math.floor(9100 + Math.random() * 900)}\`);
    setVinChassis("FE0-008924");
    setMake("Nissan");
    setModel("Ariya B6 e-4ORCE");
    setGrade("Premier 4WD High Spec");
    setYear(2023);
    setOdometerKm(11400);
    setOdometerUnit("km");
    setTransmission("Direct Drive e-4ORCE");
    setColor("Akatsuki Copper / Black Roof");
    setFuelType("100% Electric");
    setDriveType("4WD");
    setEngineCc(0);
    setOverallCondition("★ 4.5 - Excellent Clean Japanese Condition");
    setAuctionGrade("4.5");
    setInteriorGrade("A");
    setExteriorGrade("A");
    setKnownDefects("Clean pre-export pass. Certified 66kWh battery pack with 100% State of Health.");
    setFobPriceJPY(3850000);
    setImages(["/images/cars/ariya.png", "/images/cars/note.png"]);
  };`;

const isCrlf = code.includes('\r\n');
const normalizedTarget = isCrlf ? targetMethod.replace(/\n/g, '\r\n') : targetMethod;
const normalizedReplacement = isCrlf ? autoFillCode.replace(/\n/g, '\r\n') : autoFillCode;

code = code.replace(normalizedTarget, normalizedReplacement);

const targetBtn = `<span className="px-3 py-1.5 rounded-full bg-slate-100 font-mono text-xs font-bold text-slate-700 border border-slate-200 shadow-2xs">
            Export Terminal Staging
          </span>`;

const newBtn = `<button
            type="button"
            onClick={handleAutoFillDemo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C3002F]" />
            <span>Auto-fill Demo Vehicle</span>
          </button>
          <span className="px-3 py-1.5 rounded-full bg-slate-100 font-mono text-xs font-bold text-slate-700 border border-slate-200 shadow-2xs">
            Export Terminal Staging
          </span>`;

const normalizedBtnTarget = isCrlf ? targetBtn.replace(/\n/g, '\r\n') : targetBtn;
const normalizedBtnReplacement = isCrlf ? newBtn.replace(/\n/g, '\r\n') : newBtn;

code = code.replace(normalizedBtnTarget, normalizedBtnReplacement);

fs.writeFileSync('components/japan/AddVehicleForm.tsx', code, 'utf8');
console.log('Successfully updated AddVehicleForm.tsx');

