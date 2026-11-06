import { Vehicle } from "./types";

/**
 * Returns comprehensive multi-angle studio photography images for a given vehicle model.
 * Includes Hero Cutout, Frontal Angle, Side Profile, Rear 3/4 Quarter, and Interior Cockpit.
 */
export function getModelAngleImages(modelName?: string, baseImage?: string): string[] {
  const m = (modelName || "").toLowerCase();

  // If specific model angles are registered, return the full studio gallery
  if (m.includes("note") || m.includes("aura")) {
    return [
      "/images/cars/angles/note-side.jpg",
      "/images/cars/angles/note-front.jpg",
      "/images/cars/angles/note-rear-quarter.jpg",
      "/images/cars/angles/note-interior.jpg",
      "/images/cars/angles/note-seats.jpg",
      "/images/cars/angles/note-boot.jpg",
    ];
  }

  if (m.includes("x-trail") || m.includes("xtrail")) {
    return [
      baseImage || "/images/cars/xtrail.png",
      "/images/cars/angles/xtrail-rear.jpg",
      "/images/cars/angles/xtrail-interior.jpg",
    ];
  }

  if (m.includes("leaf")) {
    return [
      baseImage || "/images/cars/leaf.png",
      "/images/cars/angles/leaf-rear.jpg",
      "/images/cars/angles/leaf-interior.jpg",
    ];
  }

  if (m.includes("ariya")) {
    return [
      baseImage || "/images/cars/ariya.png",
      "/images/cars/angles/ariya-rear.jpg",
      "/images/cars/angles/ariya-interior.jpg",
    ];
  }

  if (m.includes("kicks")) {
    return [
      baseImage || "/images/cars/kicks.png",
      "/images/cars/angles/kicks-rear.jpg",
      "/images/cars/angles/kicks-interior.jpg",
    ];
  }

  if (m.includes("serena")) {
    return [
      baseImage || "/images/cars/serena.png",
      "/images/cars/angles/serena-interior.jpg",
    ];
  }

  if (m.includes("elgrand")) {
    return [
      baseImage || "/images/cars/elgrand.png",
      "/images/cars/angles/elgrand-interior.jpg",
    ];
  }

  if (m.includes("navara")) {
    return [
      baseImage || "/images/cars/navara.png",
      "/images/cars/angles/navara-interior.jpg",
    ];
  }

  if (m.includes("dayz") || m.includes("roox") || m.includes("sakura")) {
    return [
      baseImage || "/images/cars/dayz.png",
      "/images/cars/angles/dayz-interior.jpg",
    ];
  }

  // Fallback to base image
  return baseImage ? [baseImage] : ["/images/cars/note.png"];
}

/**
 * Returns a descriptive human-readable label for studio angle thumbnails
 */
export function getAngleLabel(imagePath: string, index: number): string {
  const p = (imagePath || "").toLowerCase();
  if (p.includes("interior") || p.includes("cockpit")) return "Interior Cockpit";
  if (p.includes("rear") || p.includes("quarter")) return "Rear 3/4 Quarter";
  if (p.includes("side") || p.includes("profile")) return "Side Profile";
  if (p.includes("front") || p.includes("grille")) return "Front Angle";
  if (p.includes("seats")) return "Rear Passenger Seats";
  if (p.includes("boot")) return "Luggage Cargo Space";
  if (index === 0) return "Exterior";
  return `Angle ${index + 1}`;
}

/**
 * Extracts canonical vehicle family name (e.g., "Note", "X-Trail", "Serena")
 */
export function getCanonicalModelName(modelName?: string): string {
  if (!modelName) return "Vehicle";
  const m = modelName.trim().toLowerCase();
  if (m.includes("note") || m.includes("aura")) return "Note";
  if (m.includes("x-trail") || m.includes("xtrail")) return "X-Trail";
  if (m.includes("serena")) return "Serena";
  if (m.includes("leaf")) return "Leaf";
  if (m.includes("ariya")) return "Ariya";
  if (m.includes("kicks")) return "Kicks";
  if (m.includes("dayz")) return "Dayz";
  if (m.includes("elgrand")) return "Elgrand";
  if (m.includes("navara")) return "Navara";
  return modelName.split(" ")[0] || modelName;
}

/**
 * Retrieves other vehicles in the fleet that belong to the same model line,
 * excluding the currently viewed vehicle.
 */
export function getSameModelVehicles(
  allVehicles: Vehicle[],
  currentVehicle?: Vehicle | { id?: string; model?: string; stockId?: string } | null
): Vehicle[] {
  if (!allVehicles || allVehicles.length === 0 || !currentVehicle) return [];

  const canonicalTarget = getCanonicalModelName(currentVehicle.model);
  const currentId = (currentVehicle as any).id;
  const currentStockId = (currentVehicle as any).stockId;

  return allVehicles.filter((v) => {
    // Exclude current vehicle by ID or StockId
    if (currentId && v.id === currentId) return false;
    if (currentStockId && v.stockId === currentStockId) return false;

    // Must match canonical model family
    const vehicleCanonical = getCanonicalModelName(v.model);
    return vehicleCanonical === canonicalTarget;
  });
}

/**
 * Enriches a vehicle object with its full multi-angle photography suite
 */
export function enrichVehicleWithAngleImages(vehicle: Vehicle): Vehicle {
  if (!vehicle) return vehicle;

  const existingImages = vehicle.images && vehicle.images.length > 0 ? vehicle.images : [];
  const baseImage = existingImages[0];
  const fullAngleSuite = getModelAngleImages(vehicle.model, baseImage);

  // If vehicle already has multiple images, retain them if they cover angles, otherwise enrich
  const mergedImages =
    existingImages.length >= fullAngleSuite.length
      ? existingImages
      : fullAngleSuite;

  return {
    ...vehicle,
    images: mergedImages,
  };
}

