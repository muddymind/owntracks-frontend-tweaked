/**
 * Location data enhancement and processing layer
 * This module intercepts raw location data and allows for custom processing
 * before it reaches the standard filtering system.
 */

/**
 * Process raw location data
 * This is the main entry point for all location data processing
 *
 * @param {LocationHistory} rawLocationHistory - Raw location data from the API
 * @param {Object} clusteringConfig - Clustering configuration object
 * @param {boolean} clusteringConfig.enabled - Whether clustering is enabled
 * @param {number} clusteringConfig.clusterRadius - Cluster radius in meters
 * @param {number} clusteringConfig.minVisitClusterSize - Minimum visit cluster size
 * @param {number} clusteringConfig.minTravelClusterSize - Minimum travel cluster size
 * @returns {LocationHistory} Processed location data
 */
export const enhanceLocationData = (
  rawLocationHistory,
  clusteringConfig = {}
) => {
  console.log("[LocationEnhancer] Raw location data:", rawLocationHistory);
  console.log("[LocationEnhancer] Clustering config:", clusteringConfig);

  // Add metadata fields to all points
  Object.keys(rawLocationHistory).forEach((user) => {
    Object.keys(rawLocationHistory[user]).forEach((device) => {
      rawLocationHistory[user][device].forEach((point) => {
        point.node_event_type = null;
        point.node_event_id = null;
        point.node_event_start = null;
        point.node_event_end = null;
      });
    });
  });

  // Apply clustering if enabled
  if (clusteringConfig.enabled) {
    const clusteredData = clusterLocationPoints(
      rawLocationHistory,
      clusteringConfig
    );
    return clusteredData;
  } else {
    // Return original data without clustering
    return rawLocationHistory;
  }
};

/**
 * Calculate distance between two points in meters using Haversine formula
 *
 * @param {Object} point1 - {lat, lon}
 * @param {Object} point2 - {lat, lon}
 * @returns {number} Distance in meters
 */
const calculateDistanceInMeters = (point1, point2) => {
  const R = 6371000; // Earth's radius in meters
  const lat1Rad = (point1.lat * Math.PI) / 180;
  const lat2Rad = (point2.lat * Math.PI) / 180;
  const deltaLatRad = ((point2.lat - point1.lat) * Math.PI) / 180;
  const deltaLonRad = ((point2.lon - point1.lon) * Math.PI) / 180;

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLonRad / 2) *
      Math.sin(deltaLonRad / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Cluster location points into visit and travel clusters
 * Analyzes location data to identify patterns of movement and stationary periods
 *
 * @param {LocationHistory} locationHistory
 * @param {Object} clusteringConfig - Clustering configuration
 * @returns {LocationHistory}
 */
const clusterLocationPoints = (locationHistory, clusteringConfig) => {
  const CLUSTER_RADIUS = clusteringConfig.clusterRadius || 20;
  const MIN_VISIT_CLUSTER_SIZE = clusteringConfig.minVisitClusterSize || 3;
  const MIN_TRAVEL_CLUSTER_SIZE = clusteringConfig.minTravelClusterSize || 7;

  const filtered = {};

  Object.keys(locationHistory).forEach((user) => {
    filtered[user] = {};

    Object.keys(locationHistory[user]).forEach((device) => {
      const locations = [...locationHistory[user][device]];

      // Sort by timestamp
      locations.sort((a, b) => {
        const timeA = a.tst || a.timestamp || 0;
        const timeB = b.tst || b.timestamp || 0;
        return timeA - timeB;
      });

      console.log(
        `[LocationEnhancer] ${user}/${device}: Analyzing ${locations.length} points for clusters (radius=${CLUSTER_RADIUS}m, minVisit=${MIN_VISIT_CLUSTER_SIZE}, minTravel=${MIN_TRAVEL_CLUSTER_SIZE})`
      );

      const clusters = findLocationClusters(
        locations,
        CLUSTER_RADIUS,
        MIN_VISIT_CLUSTER_SIZE,
        MIN_TRAVEL_CLUSTER_SIZE
      );

      // Merge nearby visit clusters that should be considered as one location
      //const mergedVisitClusters = mergeNearbyVisitClusters(clusters, CLUSTER_RADIUS * 2);

      // Merge consecutive travel clusters
      const mergedClusters = mergeConsecutiveTravelClusters(clusters);

      // Process clusters and create final locations array
      const processedLocations = processClusterToLocations(
        mergedClusters,
        locations
      );

      console.log(
        `[LocationEnhancer] ${user}/${device}: Found ${clusters.length} clusters, merged to ${mergedClusters.length} clusters, final ${processedLocations.length} points`
      );

      filtered[user][device] = processedLocations;
    });
  });

  return filtered;
};

/**
 * Find location clusters (visit and travel) in temporal order
 *
 * @param {Array} locations - Array of location points (sorted by time)
 * @param {number} clusterRadius - Maximum distance for visit clusters (meters)
 * @param {number} minVisitClusterSize - Minimum points for visit cluster
 * @param {number} minTravelClusterSize - Minimum points to form a travel cluster
 * @returns {Array} Array of clusters with type 'visit' or 'travel'
 */
const findLocationClusters = (
  locations,
  clusterRadius,
  minVisitClusterSize,
  minTravelClusterSize
) => {
  console.log(
    `[LocationEnhancer] Finding clusters: radius=${clusterRadius}m, minVisit=${minVisitClusterSize}, minTravel=${minTravelClusterSize}`
  );

  if (locations.length <= 1) return [];

  // Process all locations including the last point
  const workingLocations = locations;
  const clusters = [];
  let i = 0;

  while (i < workingLocations.length) {
    // Try to create a visit cluster starting from index i
    const visitResult = tryCreateVisitCluster(
      workingLocations,
      i,
      clusterRadius,
      minVisitClusterSize,
      minTravelClusterSize
    );

    if (visitResult.success) {
      // Successfully created a visit cluster
      clusters.push(visitResult.cluster);
      console.log(
        `[LocationEnhancer] Visit cluster: ${visitResult.cluster.pointIndices.length} points at (${visitResult.cluster.centerLat.toFixed(6)}, ${visitResult.cluster.centerLon.toFixed(6)})`
      );
      i = visitResult.nextIndex;
    } else {
      // Could not create a visit cluster, create a travel cluster instead
      const travelCluster = createTravelCluster(
        workingLocations,
        i,
        minVisitClusterSize
      );
      clusters.push(travelCluster);
      console.log(
        `[LocationEnhancer] Travel cluster: ${travelCluster.pointIndices.length} points`
      );
      i = travelCluster.pointIndices[travelCluster.pointIndices.length - 1] + 1;
    }
  }

  console.log(
    `[LocationEnhancer] Found ${clusters.length} clusters (${clusters.filter((c) => c.type === "visit").length} visits, ${clusters.filter((c) => c.type === "travel").length} travels)`
  );
  return clusters;
};

/**
 * Try to create a visit cluster starting from the given index
 *
 * @param {Array} workingLocations - Array of location points
 * @param {number} startIndex - Index to start from
 * @param {number} clusterRadius - Cluster radius in meters
 * @param {number} minVisitClusterSize - Minimum visit cluster size
 * @param {number} minTravelClusterSize - Minimum travel cluster size
 * @returns {Object} Result with success boolean, cluster (if successful), and nextIndex
 */
const tryCreateVisitCluster = (
  workingLocations,
  startIndex,
  clusterRadius,
  minVisitClusterSize,
  minTravelClusterSize
) => {
  const cluster = {
    type: "visit",
    pointIndices: [startIndex],
    startTime:
      workingLocations[startIndex].tst ||
      workingLocations[startIndex].timestamp ||
      0,
    endTime:
      workingLocations[startIndex].tst ||
      workingLocations[startIndex].timestamp ||
      0,
  };

  let centerLat = workingLocations[startIndex].lat;
  let centerLon = workingLocations[startIndex].lon;
  let j = startIndex + 1;

  // Try to expand the visit cluster
  while (j < workingLocations.length) {
    const distance = calculateDistanceInMeters(
      { lat: centerLat, lon: centerLon },
      workingLocations[j]
    );

    if (distance <= clusterRadius) {
      // Point is within cluster, add it
      cluster.pointIndices.push(j);
      cluster.endTime =
        workingLocations[j].tst || workingLocations[j].timestamp || 0;

      // Recalculate center as average of all points in cluster
      const allLats = cluster.pointIndices.map(
        (idx) => workingLocations[idx].lat
      );
      const allLons = cluster.pointIndices.map(
        (idx) => workingLocations[idx].lon
      );
      centerLat = allLats.reduce((sum, lat) => sum + lat, 0) / allLats.length;
      centerLon = allLons.reduce((sum, lon) => sum + lon, 0) / allLons.length;

      j++;
    } else {
      // Point is too far away - try to skip transient points
      const skipResult = trySkipTransientPoints(
        workingLocations,
        j,
        centerLat,
        centerLon,
        clusterRadius,
        minTravelClusterSize
      );

      if (skipResult.shouldSkip) {
        // Skip transient points and continue from the return point
        j = skipResult.continueFromIndex;
        // Continue the while loop to process the return point
      } else {
        // No return to cluster found, stop expanding
        break;
      }
    }
  }

  // Check if we have enough points for a visit cluster
  if (cluster.pointIndices.length >= minVisitClusterSize) {
    cluster.centerLat = centerLat;
    cluster.centerLon = centerLon;
    return {
      success: true,
      cluster: cluster,
      nextIndex: j,
    };
  } else {
    return {
      success: false,
      nextIndex: j,
    };
  }
};

/**
 * Create a travel cluster from points that couldn't form a visit cluster
 *
 * @param {Array} workingLocations - Array of location points
 * @param {number} startIndex - Index to start from
 * @param {number} minVisitClusterSize - Minimum visit cluster size
 * @returns {Object} Travel cluster
 */
const createTravelCluster = (
  workingLocations,
  startIndex,
  minVisitClusterSize
) => {
  // Travel cluster contains minVisitClusterSize-1 points starting from startIndex
  const pointCount = minVisitClusterSize - 1;
  const endIndex = Math.min(
    startIndex + pointCount - 1,
    workingLocations.length - 1
  );

  const pointIndices = [];
  for (let i = startIndex; i <= endIndex; i++) {
    pointIndices.push(i);
  }

  const cluster = {
    type: "travel",
    pointIndices: pointIndices,
    startTime:
      workingLocations[startIndex].tst ||
      workingLocations[startIndex].timestamp ||
      0,
    endTime:
      workingLocations[endIndex].tst ||
      workingLocations[endIndex].timestamp ||
      0,
  };

  return cluster;
};

/**
 * Try to skip transient points and find if we return to the cluster
 *
 * @param {Array} workingLocations - Array of location points
 * @param {number} startIndex - Index to start looking from
 * @param {number} centerLat - Cluster center latitude
 * @param {number} centerLon - Cluster center longitude
 * @param {number} clusterRadius - Cluster radius in meters
 * @param {number} minTravelClusterSize - Minimum travel cluster size
 * @returns {Object} Result with shouldSkip boolean and continueFromIndex
 */
const trySkipTransientPoints = (
  workingLocations,
  startIndex,
  centerLat,
  centerLon,
  clusterRadius,
  minTravelClusterSize
) => {
  // Increase lookahead to be more aggressive in finding return points
  const maxLookahead = minTravelClusterSize + 1; //Math.max(minTravelClusterSize * 2, 10); // Look ahead further

  // Look ahead up to maxLookahead points to see if we return to cluster
  for (
    let k = startIndex;
    k < Math.min(startIndex + maxLookahead, workingLocations.length);
    k++
  ) {
    const returnDistance = calculateDistanceInMeters(
      { lat: centerLat, lon: centerLon },
      workingLocations[k]
    );

    if (returnDistance <= clusterRadius) {
      // Found return to cluster - skip transient points and continue from the return point
      return {
        shouldSkip: true,
        continueFromIndex: k,
      };
    }
  }

  // No return to cluster found within lookahead distance
  return {
    shouldSkip: false,
    continueFromIndex: startIndex,
  };
};

/**
 * Merge consecutive travel clusters into single travel clusters
 *
 * @param {Array} clusters - Array of clusters
 * @returns {Array} Array of clusters with consecutive travel clusters merged
 */
const mergeConsecutiveTravelClusters = (clusters) => {
  if (clusters.length <= 1) return clusters;

  const mergedClusters = [];
  let i = 0;

  while (i < clusters.length) {
    const currentCluster = clusters[i];

    if (currentCluster.type === "travel") {
      // Start collecting consecutive travel clusters
      const mergedTravelCluster = {
        type: "travel",
        pointIndices: [...currentCluster.pointIndices],
        startTime: currentCluster.startTime,
        endTime: currentCluster.endTime,
      };

      // Look for consecutive travel clusters
      let j = i + 1;
      while (j < clusters.length && clusters[j].type === "travel") {
        // Merge this travel cluster
        mergedTravelCluster.pointIndices.push(...clusters[j].pointIndices);
        mergedTravelCluster.endTime = clusters[j].endTime;
        j++;
      }

      mergedClusters.push(mergedTravelCluster);

      if (j > i + 1) {
        console.log(
          `[LocationEnhancer] Merged ${j - i} consecutive travel clusters into one (${mergedTravelCluster.pointIndices.length} total points)`
        );
      }

      i = j;
    } else {
      // Visit cluster, add as-is
      mergedClusters.push(currentCluster);
      i++;
    }
  }

  return mergedClusters;
};

/**
 * Merge nearby visit clusters that should be considered as one location
 *
 * @param {Array} clusters - Array of clusters
 * @param {number} mergeRadius - Maximum distance between visit cluster centers to merge (meters)
 * @returns {Array} Array of clusters with nearby visit clusters merged
 */
const mergeNearbyVisitClusters = (clusters, mergeRadius = 50) => {
  if (clusters.length <= 1) return clusters;

  const mergedClusters = [];
  const processed = new Set();

  for (let i = 0; i < clusters.length; i++) {
    if (processed.has(i)) continue;

    const currentCluster = clusters[i];

    if (currentCluster.type === "visit") {
      // Look for nearby visit clusters to merge
      const toMerge = [i];

      for (let j = i + 1; j < clusters.length; j++) {
        if (processed.has(j) || clusters[j].type !== "visit") continue;

        const distance = calculateDistanceInMeters(
          { lat: currentCluster.centerLat, lon: currentCluster.centerLon },
          { lat: clusters[j].centerLat, lon: clusters[j].centerLon }
        );

        if (distance <= mergeRadius) {
          toMerge.push(j);
        }
      }

      if (toMerge.length > 1) {
        // Merge multiple visit clusters
        const allPointIndices = [];
        let minStartTime = Infinity;
        let maxEndTime = -Infinity;

        toMerge.forEach((clusterIndex) => {
          const cluster = clusters[clusterIndex];
          allPointIndices.push(...cluster.pointIndices);
          minStartTime = Math.min(minStartTime, cluster.startTime);
          maxEndTime = Math.max(maxEndTime, cluster.endTime);
          processed.add(clusterIndex);
        });

        const mergedCluster = {
          type: "visit",
          pointIndices: allPointIndices,
          startTime: minStartTime,
          endTime: maxEndTime,
          centerLat: currentCluster.centerLat, // Will be recalculated in processClusterToLocations
          centerLon: currentCluster.centerLon, // Will be recalculated in processClusterToLocations
        };

        mergedClusters.push(mergedCluster);
        console.log(
          `[LocationEnhancer] Merged ${toMerge.length} nearby visit clusters (${allPointIndices.length} total points)`
        );
      } else {
        // Single visit cluster, add as-is
        mergedClusters.push(currentCluster);
        processed.add(i);
      }
    } else {
      // Travel cluster, add as-is
      mergedClusters.push(currentCluster);
      processed.add(i);
    }
  }

  return mergedClusters;
};

/**
 * Process clusters and create the final locations array
 *
 * @param {Array} clusters - Array of merged clusters
 * @param {Array} originalLocations - Original locations array (including the last point)
 * @returns {Array} Final processed locations array
 */
const processClusterToLocations = (clusters, originalLocations) => {
  const finalLocations = [];
  let visitCounter = 1;
  let travelCounter = 1;

  // First pass: Process travel clusters to set their timing based on surrounding visits
  clusters.forEach((cluster, clusterIndex) => {
    if (cluster.type === "travel") {
      // Find previous visit cluster
      let prevVisitEndTime = null;
      for (let i = clusterIndex - 1; i >= 0; i--) {
        if (clusters[i].type === "visit") {
          prevVisitEndTime = clusters[i].endTime;
          break;
        }
      }

      // Find next visit cluster
      let nextVisitStartTime = null;
      for (let i = clusterIndex + 1; i < clusters.length; i++) {
        if (clusters[i].type === "visit") {
          nextVisitStartTime = clusters[i].startTime;
          break;
        }
      }

      // Set travel cluster timing
      cluster.travelStartTime = prevVisitEndTime || cluster.startTime;
      cluster.travelEndTime = nextVisitStartTime || cluster.endTime;
    }
  });

  // Second pass: Process all clusters to create final location points
  clusters.forEach((cluster) => {
    if (cluster.type === "visit") {
      // Visit cluster: merge into 1 point
      const clusterPoints = cluster.pointIndices.map(
        (idx) => originalLocations[idx]
      );

      // Calculate average location
      const avgLat =
        clusterPoints.reduce((sum, point) => sum + point.lat, 0) /
        clusterPoints.length;
      const avgLon =
        clusterPoints.reduce((sum, point) => sum + point.lon, 0) /
        clusterPoints.length;

      // Create merged visit point using the first point as template
      const visitPoint = {
        ...clusterPoints[0], // Use first point as template
        lat: avgLat,
        lon: avgLon,
        tst: clusterPoints[0].tst || clusterPoints[0].timestamp || 0, // Time of first point
        node_event_type: "visit",
        node_event_id: visitCounter++,
        node_event_start: cluster.startTime,
        node_event_end: cluster.endTime,
      };

      finalLocations.push(visitPoint);
      console.log(
        `[LocationEnhancer] Visit ${visitPoint.node_event_id}: ${clusterPoints.length} points merged at (${avgLat.toFixed(6)}, ${avgLon.toFixed(6)})`
      );
    } else if (cluster.type === "travel") {
      // Travel cluster: retain all points with travel metadata
      cluster.pointIndices.forEach((pointIndex) => {
        const travelPoint = {
          ...originalLocations[pointIndex], // Keep original point
          node_event_type: "travel",
          node_event_id: travelCounter,
          node_event_start: cluster.travelStartTime,
          node_event_end: cluster.travelEndTime,
        };

        finalLocations.push(travelPoint);
      });

      console.log(
        `[LocationEnhancer] Travel ${travelCounter}: ${cluster.pointIndices.length} points retained`
      );
      travelCounter++;
    }
  });

  // Sort final locations by timestamp to ensure proper order
  finalLocations.sort((a, b) => {
    const timeA = a.tst || a.timestamp || 0;
    const timeB = b.tst || b.timestamp || 0;
    return timeA - timeB;
  });

  return finalLocations;
};

// Export internal functions for testing
// These are not part of the public API but are exported for unit tests
export const _internal = {
  calculateDistanceInMeters,
  findLocationClusters,
  mergeConsecutiveTravelClusters,
  mergeNearbyVisitClusters,
  tryCreateVisitCluster,
  createTravelCluster,
  trySkipTransientPoints,
  processClusterToLocations,
  clusterLocationPoints,
};
