const fs = require("fs");
let content = fs.readFileSync("components/layout/Header.tsx", "utf8");
content = content.replace(
  'import GlobalSearchModal from "./GlobalSearchModal";',
  'import GlobalSearchModal from "./GlobalSearchModal";\r\nimport RoleSwitcher from "./RoleSwitcher";'
);
content = content.replace(
  '{/* Real-time Notifications Popover */}',
  '{/* 1-Click Role Switcher */}\r\n        <RoleSwitcher />\r\n\r\n        {/* Real-time Notifications Popover */}'
);
fs.writeFileSync("components/layout/Header.tsx", content, "utf8");
console.log("Header updated successfully!");

