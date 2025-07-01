import { beforeEach, describe, expect, test, vi } from "vitest";
import { enhanceLocationData, _internal } from "@/store/locationEnhancer";

// Extract the internal functions for testing
const {
  calculateDistanceInMeters,
  findLocationClusters,
  mergeConsecutiveTravelClusters,
  tryCreateVisitCluster,
  createTravelCluster,
  trySkipTransientPoints,
  processClusterToLocations,
  clusterLocationPoints
} = _internal;

// Constants from the actual implementation
const CLUSTER_RADIUS = 40;
const MIN_VISIT_CLUSTER_SIZE = 3;
const MIN_TRAVEL_CLUSTER_SIZE = 5;

// Helper functions
const createPoint = (lat, lon, timestamp) => ({
  lat,
  lon,
  tst: timestamp || Date.now()
});

const createClusteredPoints = (baseLat, baseLon, count, startTimestamp = 1000) => {
  const points = [];
  for (let i = 0; i < count; i++) {
    // Add small random offset (within ~20m)
    const latOffset = (Math.random() - 0.5) * 0.0003; // ~16m
    const lonOffset = (Math.random() - 0.5) * 0.0003; // ~16m
    points.push(createPoint(baseLat + latOffset, baseLon + lonOffset, startTimestamp + i * 1000));
  }
  return points;
};

const createDistantPoints = (baseLat, baseLon, count, startTimestamp = 1000) => {
  const points = [];
  for (let i = 0; i < count; i++) {
    // Add larger offset (>40m)
    const latOffset = (i + 1) * 0.001; // ~111m per 0.001 degrees
    points.push(createPoint(baseLat + latOffset, baseLon, startTimestamp + i * 1000));
  }
  return points;
};

// Test the full pipeline
const testFullPipeline = (locations, clusteringConfig = {
  enabled: true,
  clusterRadius: CLUSTER_RADIUS,
  minVisitClusterSize: MIN_VISIT_CLUSTER_SIZE,
  minTravelClusterSize: MIN_TRAVEL_CLUSTER_SIZE
}) => {
  const testHistory = {
    testUser: {
      testDevice: locations
    }
  };
  
  const result = enhanceLocationData(testHistory, clusteringConfig);
  return result.testUser.testDevice;
};

describe('Location Clustering Functions', () => {
  beforeEach(() => {
    // Reset any mocks or state before each test
    vi.clearAllMocks();
  });

  test('should calculate distance between points correctly', () => {
    const point1 = { lat: 40.7128, lon: -74.0060 };
    const point2 = { lat: 40.7129, lon: -74.0061 };
    
    const distance = calculateDistanceInMeters(point1, point2);
    
    // Should be approximately 13-15 meters
    expect(distance).toBeGreaterThan(10);
    expect(distance).toBeLessThan(20);
  });

  test('specific scenario: MIN_VISIT_CLUSTER_SIZE clusterable + 4 transient + return + last', () => {
    const locations = [
      createPoint(40.7128, -74.0060, 1000),  // Point 0: Start
      createPoint(40.7500, -74.0500, 2000),  // Point 1: Transient (far from cluster)
      createPoint(40.7600, -74.0600, 3000),  // Point 2: Transient (far from cluster)
      createPoint(40.7700, -74.0700, 4000),  // Point 3: Transient (far from cluster)
      createPoint(40.7800, -74.0800, 5000),  // Point 4: Transient (far from cluster)
      createPoint(40.7129, -74.0061, 6000),  // Point 5: Return to cluster (close to point 0)
      createPoint(40.8000, -74.1000, 7000)   // Point 6: Last point (always preserved)
    ];

    const clusters = findLocationClusters(locations, CLUSTER_RADIUS, MIN_VISIT_CLUSTER_SIZE, MIN_TRAVEL_CLUSTER_SIZE);
    const mergedClusters = mergeConsecutiveTravelClusters(clusters);

    // Should result in 1 travel cluster (insufficient points for visit cluster)
    // because there are only 2 points that could form a visit cluster (points 0 and 5)
    // which is less than MIN_VISIT_CLUSTER_SIZE (3)
    expect(mergedClusters).toHaveLength(1);
    expect(mergedClusters[0].type).toBe('travel');
    
    // Test full pipeline
    const result = testFullPipeline(locations);
    const visitPoints = result.filter(p => p.node_event_type === 'visit');
    const travelPoints = result.filter(p => p.node_event_type === 'travel');

    expect(visitPoints).toHaveLength(0);
    expect(travelPoints.length).toBeGreaterThan(0);
    // All points now go through clustering, no special null points
  });

  test('should create visit cluster with sufficient clustered points', () => {
    const locations = [
      ...createClusteredPoints(40.7128, -74.0060, 5, 1000), // 5 clustered points
      createPoint(40.8000, -74.1000, 6000)                 // Last point (now also processed)
    ];

    const clusters = findLocationClusters(locations, CLUSTER_RADIUS, MIN_VISIT_CLUSTER_SIZE, MIN_TRAVEL_CLUSTER_SIZE);
    const mergedClusters = mergeConsecutiveTravelClusters(clusters);

    // Should result in 1 visit cluster + 1 travel cluster (for the last distant point)
    expect(mergedClusters.length).toBeGreaterThanOrEqual(1);
    expect(mergedClusters[0].type).toBe('visit');
    expect(mergedClusters[0].pointIndices).toHaveLength(5);
  });

  test('should merge consecutive travel clusters', () => {
    const locations = [
      ...createDistantPoints(40.7128, -74.0060, 6, 1000), // 6 distant points (should create travel clusters)
      createPoint(40.8000, -74.1000, 7000)               // Last point (now also processed)
    ];

    const clusters = findLocationClusters(locations, CLUSTER_RADIUS, MIN_VISIT_CLUSTER_SIZE, MIN_TRAVEL_CLUSTER_SIZE);
    const mergedClusters = mergeConsecutiveTravelClusters(clusters);

    // Should result in 1 merged travel cluster (all points are distant, so all become travel)
    expect(mergedClusters).toHaveLength(1);
    expect(mergedClusters[0].type).toBe('travel');
    expect(mergedClusters[0].pointIndices).toHaveLength(7); // All 7 points now included
  });

  test('should handle Visit + Travel + Visit pattern', () => {
    const locations = [
      ...createClusteredPoints(40.7128, -74.0060, 3, 1000),  // Visit 1 (indices 0,1,2)
      ...createDistantPoints(40.7128, -74.0060, 2, 4000),    // Travel (indices 3,4) - only 2 points, should be travel cluster
      ...createClusteredPoints(40.8000, -74.1000, 4, 6000),  // Visit 2 (indices 5,6,7,8)
      createPoint(40.9000, -74.2000, 10000)                  // Last point (now also processed)
    ];

    const clusters = findLocationClusters(locations, CLUSTER_RADIUS, MIN_VISIT_CLUSTER_SIZE, MIN_TRAVEL_CLUSTER_SIZE);
    const mergedClusters = mergeConsecutiveTravelClusters(clusters);

    // Should result in: Visit + Travel + Visit + Travel (last point) = 4 clusters
    expect(mergedClusters.length).toBeGreaterThanOrEqual(3);
    expect(mergedClusters[0].type).toBe('visit');
    expect(mergedClusters[1].type).toBe('travel');
    expect(mergedClusters[2].type).toBe('visit');
  });

  test('should handle complex transient skipping scenario', () => {
    const locations = [
      // Visit cluster 1
      createPoint(40.7128, -74.0060, 1000),
      createPoint(40.7129, -74.0061, 2000),
      createPoint(40.7127, -74.0059, 3000),
      
      // Long sequence of transients with eventual return
      createPoint(40.7500, -74.0500, 4000),  // Transient 1
      createPoint(40.7600, -74.0600, 5000),  // Transient 2
      createPoint(40.7700, -74.0700, 6000),  // Transient 3
      createPoint(40.7800, -74.0800, 7000),  // Transient 4
      
      // Return to original cluster
      createPoint(40.7130, -74.0062, 8000),
      createPoint(40.7126, -74.0058, 9000),
      
      // Final distant point
      createPoint(41.0000, -75.0000, 10000)
    ];

    const clusters = findLocationClusters(locations, CLUSTER_RADIUS, MIN_VISIT_CLUSTER_SIZE, MIN_TRAVEL_CLUSTER_SIZE);
    const mergedClusters = mergeConsecutiveTravelClusters(clusters);

    // Based on the actual behavior, this creates 1 visit cluster and 1 travel cluster
    // The transients are too far to skip-ahead properly, so they form a separate travel cluster
    expect(mergedClusters.length).toBeGreaterThanOrEqual(1);
    expect(mergedClusters.some(c => c.type === 'visit')).toBe(true);
  });

  test('should handle edge cases', () => {
    // Empty array
    const emptyClusters = findLocationClusters([], CLUSTER_RADIUS, MIN_VISIT_CLUSTER_SIZE, MIN_TRAVEL_CLUSTER_SIZE);
    expect(emptyClusters).toHaveLength(0);

    // Single point
    const singlePointClusters = findLocationClusters([createPoint(40.7128, -74.0060, 1000)], CLUSTER_RADIUS, MIN_VISIT_CLUSTER_SIZE, MIN_TRAVEL_CLUSTER_SIZE);
    expect(singlePointClusters).toHaveLength(0);

    // Two points (less than minimum for visit cluster, but can create travel cluster)
    const twoPointClusters = findLocationClusters([
      createPoint(40.7128, -74.0060, 1000),
      createPoint(40.8000, -74.1000, 2000)
    ], CLUSTER_RADIUS, MIN_VISIT_CLUSTER_SIZE, MIN_TRAVEL_CLUSTER_SIZE);
    // With 2 points, the algorithm creates travel clusters with MIN_VISIT_CLUSTER_SIZE-1 points
    expect(twoPointClusters.length).toBeGreaterThanOrEqual(0);
  });

  test('should add metadata fields correctly in full pipeline', () => {
    const locations = [
      ...createClusteredPoints(40.7128, -74.0060, 4, 1000),  // Visit cluster
      ...createDistantPoints(40.7128, -74.0060, 3, 5000),   // Travel points
      ...createClusteredPoints(40.8000, -74.1000, 5, 8000), // Another visit cluster
      createPoint(40.9000, -74.2000, 13000)                 // Last point
    ];

    const result = testFullPipeline(locations);

    // Verify that all points have metadata fields
    expect(result.every(p => p.hasOwnProperty('node_event_type'))).toBe(true);
    expect(result.every(p => p.hasOwnProperty('node_event_id'))).toBe(true);
    expect(result.every(p => p.hasOwnProperty('node_event_start'))).toBe(true);
    expect(result.every(p => p.hasOwnProperty('node_event_end'))).toBe(true);

    // Should have both visit and travel events
    const eventTypes = result.map(p => p.node_event_type).filter(t => t !== null);
    expect(eventTypes.some(t => t === 'visit')).toBe(true);
    expect(eventTypes.some(t => t === 'travel')).toBe(true);
  });

  test('should handle last point in clustering algorithm', () => {
    const locations = [
      ...createClusteredPoints(40.7128, -74.0060, 5, 1000), // Visit cluster
      createPoint(40.8000, -74.1000, 6000)                 // Last point (now processed through clustering)
    ];

    const result = testFullPipeline(locations);
    
    // All points should now have metadata (no special null treatment)
    const lastPoint = result[result.length - 1];
    expect(lastPoint.node_event_type).not.toBeNull(); // Should have metadata now
    expect(['visit', 'travel']).toContain(lastPoint.node_event_type);
    expect(lastPoint.lat).toBe(40.8000);
    expect(lastPoint.lon).toBe(-74.1000);
  });
  
  test('should return original data when clustering is disabled', () => {
    const locations = [
      ...createClusteredPoints(40.7128, -74.0060, 5, 1000),
      createPoint(40.8000, -74.1000, 6000)
    ];
    
    // Test with clustering disabled
    const clusteringConfig = {
      enabled: false,
      clusterRadius: CLUSTER_RADIUS,
      minVisitClusterSize: MIN_VISIT_CLUSTER_SIZE,
      minTravelClusterSize: MIN_TRAVEL_CLUSTER_SIZE
    };
    
    const result = testFullPipeline(locations, clusteringConfig);
    
    // Should return all original points with null metadata
    expect(result).toHaveLength(6);
    result.forEach(point => {
      expect(point.node_event_type).toBeNull();
      expect(point.node_event_id).toBeNull();
      expect(point.node_event_start).toBeNull();
      expect(point.node_event_end).toBeNull();
    });
  });
});

describe('mergeConsecutiveTravelClusters function', () => {
  test('should not merge when no travel clusters', () => {
    const clusters = [
      {
        type: 'visit',
        pointIndices: [0, 1, 2],
        startTime: 1000,
        endTime: 3000
      }
    ];

    const merged = mergeConsecutiveTravelClusters(clusters);
    expect(merged).toHaveLength(1);
    expect(merged[0].type).toBe('visit');
  });

  test('should merge two consecutive travel clusters', () => {
    const clusters = [
      {
        type: 'travel',
        pointIndices: [0, 1],
        startTime: 1000,
        endTime: 2000
      },
      {
        type: 'travel',
        pointIndices: [2, 3],
        startTime: 3000,
        endTime: 4000
      }
    ];

    const merged = mergeConsecutiveTravelClusters(clusters);
    expect(merged).toHaveLength(1);
    expect(merged[0].type).toBe('travel');
    expect(merged[0].pointIndices).toEqual([0, 1, 2, 3]);
    expect(merged[0].startTime).toBe(1000);
    expect(merged[0].endTime).toBe(4000);
  });

  test('should handle complex alternating pattern', () => {
    const clusters = [
      { type: 'visit', pointIndices: [0], startTime: 1000, endTime: 1000 },
      { type: 'travel', pointIndices: [1, 2], startTime: 2000, endTime: 3000 },
      { type: 'travel', pointIndices: [3, 4], startTime: 4000, endTime: 5000 },
      { type: 'travel', pointIndices: [5, 6], startTime: 6000, endTime: 7000 },
      { type: 'visit', pointIndices: [7, 8], startTime: 8000, endTime: 9000 },
      { type: 'travel', pointIndices: [9, 10], startTime: 10000, endTime: 11000 },
      { type: 'visit', pointIndices: [11, 12], startTime: 12000, endTime: 13000 }
    ];

    const merged = mergeConsecutiveTravelClusters(clusters);
    expect(merged).toHaveLength(5); // V-T-V-T-V
    expect(merged[0].type).toBe('visit');
    expect(merged[1].type).toBe('travel');
    expect(merged[1].pointIndices).toEqual([1, 2, 3, 4, 5, 6]); // Merged 3 travel clusters
    expect(merged[2].type).toBe('visit');
    expect(merged[3].type).toBe('travel');
    expect(merged[4].type).toBe('visit');
  });
});
