import { VersionHistoryItem, ComparisonReport, TwinZone } from "@/types/digitalTwin";

export const TwinComparisonService = {
  /**
   * Compares two digital twin configuration versions and details added/removed zones, crop shifts and score gains.
   */
  compareVersions(vA: VersionHistoryItem, vB: VersionHistoryItem): ComparisonReport {
    const addedZones: string[] = [];
    const removedZones: string[] = [];
    const cropChanges: string[] = [];

    const mapA = new Map<string, TwinZone>();
    vA.zones.forEach(z => mapA.set(z.zoneId, z));

    const mapB = new Map<string, TwinZone>();
    vB.zones.forEach(z => mapB.set(z.zoneId, z));

    // 1. Detect Added and Modified Zones
    vB.zones.forEach((zoneB) => {
      const zoneA = mapA.get(zoneB.zoneId);
      if (!zoneA) {
        addedZones.push(`Added new ${zoneB.zoneName} (${zoneB.zoneType.replace("_", " ")})`);
      } else {
        // Check crop changes
        if (zoneA.currentCrop !== zoneB.currentCrop) {
          const cropOld = zoneA.currentCrop && zoneA.currentCrop !== "None" ? zoneA.currentCrop : "Empty";
          const cropNew = zoneB.currentCrop && zoneB.currentCrop !== "None" ? zoneB.currentCrop : "Empty";
          cropChanges.push(`In ${zoneB.zoneName}: Crop changed from "${cropOld}" to "${cropNew}"`);
        }
        // Check general layout shifts
        if (zoneA.coordinates.w !== zoneB.coordinates.w || zoneA.coordinates.h !== zoneB.coordinates.h) {
          cropChanges.push(`In ${zoneB.zoneName}: Area coordinates dimensions resized.`);
        }
      }
    });

    // 2. Detect Removed Zones
    vA.zones.forEach((zoneA) => {
      if (!mapB.has(zoneA.zoneId)) {
        removedZones.push(`Removed ${zoneA.zoneName} (${zoneA.zoneType.replace("_", " ")})`);
      }
    });

    // 3. Compute score diffs
    const scoreA = vA.intelligence?.healthScore || 0;
    const scoreB = vB.intelligence?.healthScore || 0;
    const healthScoreDiff = scoreB - scoreA;

    const effA = vA.intelligence?.farmingEfficiency || 0;
    const effB = vB.intelligence?.farmingEfficiency || 0;
    const efficiencyDiff = effB - effA;

    const susA = vA.intelligence?.sustainability || 0;
    const susB = vB.intelligence?.sustainability || 0;
    const sustainabilityDiff = susB - susA;

    return {
      versionA: vA.version,
      versionB: vB.version,
      addedZones,
      removedZones,
      cropChanges,
      healthScoreDiff,
      efficiencyDiff,
      sustainabilityDiff
    };
  }
};
