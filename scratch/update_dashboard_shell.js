const fs = require('fs');

const filePath = 'components/layout/DashboardShell.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update resolveActiveTab for /vehicles/
content = content.replace(
  'if (pathname.includes("/vehicles/")) return "dealer-stock";',
  `if (pathname.includes("/vehicles/")) {\n      if (pathname.startsWith("/admin") || portal === "admin" || currentUser?.role === "AUTOHUB_ADMIN") {\n        return "admin-catalogue";\n      }\n      return "dealer-stock";\n    }`
);

// 2. Update handleSelectVehicle and handleBackFromVehicle
const oldVehicleHandlers = `  const handleSelectVehicle = (vehicleId: string) => {
    setViewingVehicleId(vehicleId);
    router.push(\`/dealer/vehicles/\${vehicleId}\`);
  };

  const handleBackFromVehicle = () => {
    setViewingVehicleId(null);
    router.push("/dealer/stocks");
  };`;

const newVehicleHandlers = `  const handleSelectVehicle = (vehicleId: string) => {
    setViewingVehicleId(vehicleId);
    if (portal === "admin" || pathname.startsWith("/admin") || currentUser?.role === "AUTOHUB_ADMIN") {
      router.push(\`/admin/vehicles/\${vehicleId}\`);
    } else {
      router.push(\`/dealer/vehicles/\${vehicleId}\`);
    }
  };

  const handleBackFromVehicle = () => {
    setViewingVehicleId(null);
    if (portal === "admin" || pathname.startsWith("/admin") || currentUser?.role === "AUTOHUB_ADMIN") {
      router.push("/admin/catalogue");
    } else {
      router.push("/dealer/stocks");
    }
  };`;

content = content.replace(oldVehicleHandlers, newVehicleHandlers);

// 3. Update activeTab prop passed to Sidebar and MobileBottomNav
content = content.replace(
  'activeTab={viewingVehicleId ? "dealer-stock" : activeTab}',
  'activeTab={viewingVehicleId ? (portal === "admin" || pathname.startsWith("/admin") || currentUser?.role === "AUTOHUB_ADMIN" ? "admin-catalogue" : "dealer-stock") : activeTab}'
);
content = content.replace(
  'activeTab={viewingVehicleId ? "dealer-stock" : activeTab}',
  'activeTab={viewingVehicleId ? (portal === "admin" || pathname.startsWith("/admin") || currentUser?.role === "AUTOHUB_ADMIN" ? "admin-catalogue" : "dealer-stock") : activeTab}'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully updated DashboardShell.tsx!");

