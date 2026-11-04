const fs = require('fs');

const p = 'components/admin/CatalogueDetailsModal.tsx';
let c = fs.readFileSync(p, 'utf8');

// 1. Imports
c = c.replace(
  'import { audio } from "@/lib/sound";',
  'import { audio } from "@/lib/sound";\nimport { useProgramme } from "@/lib/programme-context";\nimport SameModelVehiclesShowcase from "@/components/common/SameModelVehiclesShowcase";\nimport { getModelAngleImages, getCanonicalModelName } from "@/lib/vehicle-media";'
);

// 2. Add useProgramme & enrich images
c = c.replace(
  `export default function CatalogueDetailsModal({
  vehicle,
  onClose,
  onNavigateToReservations,
  onNavigateToInventory,
}: CatalogueDetailsModalProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [copiedVin, setCopiedVin] = useState(false);
  const [selectedZone, setSelectedZone] = useState<"ZONE_1" | "ZONE_2" | "ZONE_3" | "ZONE_4" | "ZONE_5">("ZONE_1");

  if (!vehicle) return null;

  const images = vehicle.images && vehicle.images.length > 0
    ? vehicle.images
    : ["/images/cars/kicks.png"];`,
  `export default function CatalogueDetailsModal({
  vehicle,
  onClose,
  onNavigateToReservations,
  onNavigateToInventory,
}: CatalogueDetailsModalProps) {
  const { vehicles } = useProgramme();
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [copiedVin, setCopiedVin] = useState(false);
  const [selectedZone, setSelectedZone] = useState<"ZONE_1" | "ZONE_2" | "ZONE_3" | "ZONE_4" | "ZONE_5">("ZONE_1");

  if (!vehicle) return null;

  const images = (vehicle.images && vehicle.images.length > 1)
    ? vehicle.images
    : getModelAngleImages(vehicle.model, vehicle.images?.[0] || "/images/cars/kicks.png");`
);

// 3. Add SameModelVehiclesShowcase before Footer Actions
c = c.replace(
  `            </div>
          </div>
        </div>

        {/* Footer Actions */}`,
  `            </div>
          </div>

          {/* Sibling Units of Same Model in Central Catalogue */}
          <div className="bg-slate-50/70 rounded-2xl border border-slate-200 p-5 space-y-3">
            <SameModelVehiclesShowcase
              currentVehicle={vehicle}
              allVehicles={vehicles}
              isAdmin={true}
              portal="admin"
              compact={true}
              title={\`Other \${getCanonicalModelName(vehicle.model)} Units in Central Catalogue\`}
            />
          </div>
        </div>

        {/* Footer Actions */}`
);

fs.writeFileSync(p, c, 'utf8');
console.log('Successfully updated CatalogueDetailsModal.tsx cleanly');

