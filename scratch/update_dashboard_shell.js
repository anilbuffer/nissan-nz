const fs = require('fs');

let code = fs.readFileSync('components/layout/DashboardShell.tsx', 'utf8');

// 1. Add import
if (!code.includes('import AmendVehicleForm')) {
  code = code.replace(
    'import AddVehicleForm from "@/components/japan/AddVehicleForm";',
    'import AddVehicleForm from "@/components/japan/AddVehicleForm";\nimport AmendVehicleForm from "@/components/japan/AmendVehicleForm";'
  );
}

// 2. Add route mapping in getInitialActiveTab
if (!code.includes('pathname.startsWith("/japan/amend")')) {
  code = code.replace(
    'if (pathname === "/japan/add-vehicle" || pathname === "/japan/add-single" || initialTab === "add-vehicle" || initialTab === "japan-add-single") return "japan-add-single";',
    'if (pathname === "/japan/add-vehicle" || pathname === "/japan/add-single" || initialTab === "add-vehicle" || initialTab === "japan-add-single") return "japan-add-single";\n      if (pathname.startsWith("/japan/amend") || pathname === "/japan/amend-vehicle" || initialTab === "amend-vehicle" || initialTab === "japan-amend-vehicle") return "japan-amend-vehicle";'
  );
}

// 3. Add tabToRoute
if (!code.includes('case "japan-amend-vehicle":')) {
  code = code.replace(
    'case "japan-add-single":\n      case "add-vehicle":\n        return "/japan/add-vehicle";',
    'case "japan-add-single":\n      case "add-vehicle":\n        return "/japan/add-vehicle";\n      case "japan-amend-vehicle":\n      case "amend-vehicle":\n        return "/japan/amend-vehicle";'
  );
}

// 4. In renderViewContent, add handler for japan-amend-vehicle
if (!code.includes('activeTab === "japan-amend-vehicle"')) {
  code = code.replace(
    '  const renderViewContent = () => {\n    // 1. Vehicle Detail Full-Page View',
    `  const renderViewContent = () => {
    // 0. Amend Vehicle Full-Page View (Japan Portal)
    if (activeTab === "japan-amend-vehicle") {
      const targetVehicleId = viewingVehicleId || searchParams?.get("id") || searchParams?.get("vehicleId") || initialVehicleId || "VEH_001";
      return (
        <AmendVehicleForm
          vehicleId={targetVehicleId}
          onSuccessReturn={() => {
            setViewingVehicleId(null);
            router.push("/japan/inventory");
          }}
          onViewDetails={(vId) => {
            setViewingVehicleId(vId);
            router.push(\`/japan/inventory/\${vId}\`);
          }}
        />
      );
    }

    // 1. Vehicle Detail Full-Page View`
  );
}

// 5. In switch (activeTab) for japan portal:
if (!code.includes("case 'japan-amend-vehicle':")) {
  code = code.replace(
    "case 'japan-add-single':\n          return (\n            <AddVehicleForm onSuccessReturn={() => router.push('/japan/inventory')} />\n          );",
    `case 'japan-add-single':
          return (
            <AddVehicleForm onSuccessReturn={() => router.push('/japan/inventory')} />
          );
        case 'japan-amend-vehicle':
          return (
            <AmendVehicleForm
              vehicleId={searchParams?.get("id") || searchParams?.get("vehicleId") || initialVehicleId || "VEH_001"}
              onSuccessReturn={() => router.push('/japan/inventory')}
              onViewDetails={(vId) => {
                setViewingVehicleId(vId);
                router.push(\`/japan/inventory/\${vId}\`);
              }}
            />
          );`
  );
}

fs.writeFileSync('components/layout/DashboardShell.tsx', code, 'utf8');
console.log('Successfully updated DashboardShell.tsx');
