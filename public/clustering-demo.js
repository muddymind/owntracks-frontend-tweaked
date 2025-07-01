/**
 * Demo script to test clustering controls
 * This can be run in the browser console to test clustering functionality
 */

// Helper function to generate test data
function generateTestLocationData() {
  const testData = {
    testUser: {
      testDevice: []
    }
  };
  
  const baseTime = Date.now();
  const locations = [];
  
  // Create a cluster of 5 points at Times Square
  for (let i = 0; i < 5; i++) {
    locations.push({
      lat: 40.7589 + (Math.random() - 0.5) * 0.0001, // Small variations
      lon: -73.9851 + (Math.random() - 0.5) * 0.0001,
      tst: baseTime + i * 60000, // 1 minute apart
      acc: 5,
      timestamp: baseTime + i * 60000
    });
  }
  
  // Travel points
  for (let i = 0; i < 3; i++) {
    locations.push({
      lat: 40.7589 + (i + 1) * 0.01, // Moving away
      lon: -73.9851 + (i + 1) * 0.01,
      tst: baseTime + (5 + i) * 60000,
      acc: 5,
      timestamp: baseTime + (5 + i) * 60000
    });
  }
  
  // Another cluster at Central Park
  for (let i = 0; i < 4; i++) {
    locations.push({
      lat: 40.7829 + (Math.random() - 0.5) * 0.0001,
      lon: -73.9654 + (Math.random() - 0.5) * 0.0001,
      tst: baseTime + (8 + i) * 60000,
      acc: 5,
      timestamp: baseTime + (8 + i) * 60000
    });
  }
  
  testData.testUser.testDevice = locations;
  return testData;
}

// Test functions
window.testClustering = {
  // Test with clustering enabled
  testEnabled: () => {
    const testData = generateTestLocationData();
    const config = {
      enabled: true,
      clusterRadius: 10,
      minVisitClusterSize: 3,
      minTravelClusterSize: 5
    };
    
    console.log('Testing with clustering ENABLED:');
    console.log('Input data:', testData);
    console.log('Config:', config);
    
    // This would call the enhancer in a real scenario
    console.log('Expected: Should see clustering and metadata applied');
  },
  
  // Test with clustering disabled
  testDisabled: () => {
    const testData = generateTestLocationData();
    const config = {
      enabled: false,
      clusterRadius: 10,
      minVisitClusterSize: 3,
      minTravelClusterSize: 5
    };
    
    console.log('Testing with clustering DISABLED:');
    console.log('Input data:', testData);
    console.log('Config:', config);
    console.log('Expected: Should return original data with null metadata');
  },
  
  // Test different parameter combinations
  testParameters: () => {
    console.log('Testing parameter combinations:');
    
    const scenarios = [
      { radius: 5, minVisit: 2, minTravel: 3, desc: 'Tight clustering' },
      { radius: 20, minVisit: 5, minTravel: 10, desc: 'Loose clustering' },
      { radius: 10, minVisit: 3, minTravel: 7, desc: 'Default clustering' }
    ];
    
    scenarios.forEach(scenario => {
      console.log(`${scenario.desc}: radius=${scenario.radius}m, minVisit=${scenario.minVisit}, minTravel=${scenario.minTravel}`);
    });
  }
};

console.log('Clustering test functions loaded. Try:');
console.log('- testClustering.testEnabled()');
console.log('- testClustering.testDisabled()'); 
console.log('- testClustering.testParameters()');
