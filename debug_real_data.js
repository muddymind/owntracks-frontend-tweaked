/**
 * Debug script for real location data issue
 */

import { enhanceLocationData, _internal } from './src/store/locationEnhancer.js';

const realData = [{"_type":"location","lat":55.8766864,"lon":12.8333159,"tst":1751300522,"alt":43,"acc":7.256999969482422,"_http":true,"ghash":"u3cjuh0","isorcv":"2025-06-30T16:22:02Z","isotst":"2025-06-30T16:22:02Z","disptst":"2025-06-30 16:22:02","tzname":"Europe/Stockholm","isolocal":"2025-06-30T18:22:02+0200","node_event_type":null,"node_event_id":null,"node_event_start":null,"node_event_end":null},{"_type":"location","lat":55.8768547,"lon":12.8331671,"tst":1751300654,"alt":42,"acc":4.75,"_http":true,"ghash":"u3cjuh0","isorcv":"2025-06-30T16:24:14Z","isotst":"2025-06-30T16:24:14Z","disptst":"2025-06-30 16:24:14","tzname":"Europe/Stockholm","isolocal":"2025-06-30T18:24:14+0200","node_event_type":null,"node_event_id":null,"node_event_start":null,"node_event_end":null},{"_type":"location","lat":55.8750395,"lon":12.8298282,"tst":1751301508,"alt":45,"acc":38.15000152587891,"_http":true,"ghash":"u3cjggw","isorcv":"2025-06-30T16:38:28Z","isotst":"2025-06-30T16:38:28Z","disptst":"2025-06-30 16:38:28","tzname":"Europe/Stockholm","isolocal":"2025-06-30T18:38:28+0200","node_event_type":null,"node_event_id":null,"node_event_start":null,"node_event_end":null},{"_type":"location","lat":55.8777671,"lon":12.8337622,"tst":1751301518,"alt":43,"acc":72.71700286865234,"_http":true,"ghash":"u3cjuh1","isorcv":"2025-06-30T16:38:38Z","isotst":"2025-06-30T16:38:38Z","disptst":"2025-06-30 16:38:38","tzname":"Europe/Stockholm","isolocal":"2025-06-30T18:38:38+0200","node_event_type":null,"node_event_id":null,"node_event_start":null,"node_event_end":null},{"_type":"location","lat":55.8767888,"lon":12.8332181,"tst":1751301646,"alt":39,"acc":3.819000005722046,"_http":true,"ghash":"u3cjuh0","isorcv":"2025-06-30T16:40:46Z","isotst":"2025-06-30T16:40:46Z","disptst":"2025-06-30 16:40:46","tzname":"Europe/Stockholm","isolocal":"2025-06-30T18:40:46+0200","node_event_type":null,"node_event_id":null,"node_event_start":null,"node_event_end":null},{"_type":"location","lat":55.8766651,"lon":12.8332079,"tst":1751301833,"alt":43,"acc":12.86999988555908,"_http":true,"ghash":"u3cjuh0","isorcv":"2025-06-30T16:43:53Z","isotst":"2025-06-30T16:43:53Z","disptst":"2025-06-30 16:43:53","tzname":"Europe/Stockholm","isolocal":"2025-06-30T18:43:53+0200","node_event_type":null,"node_event_id":null,"node_event_start":null,"node_event_end":null},{"_type":"location","lat":55.876662,"lon":12.8331931,"tst":1751301870,"alt":43,"acc":10.94799995422363,"_http":true,"ghash":"u3cjuh0","isorcv":"2025-06-30T16:44:30Z","isotst":"2025-06-30T16:44:30Z","disptst":"2025-06-30 16:44:30","tzname":"Europe/Stockholm","isolocal":"2025-06-30T18:44:30+0200","node_event_type":null,"node_event_id":null,"node_event_start":null,"node_event_end":null},{"_type":"location","lat":55.8766776,"lon":12.8332084,"tst":1751301911,"alt":43,"acc":11.79100036621094,"_http":true,"ghash":"u3cjuh0","isorcv":"2025-06-30T16:45:11Z","isotst":"2025-06-30T16:45:11Z","disptst":"2025-06-30 16:45:11","tzname":"Europe/Stockholm","isolocal":"2025-06-30T18:45:11+0200","node_event_type":null,"node_event_id":null,"node_event_start":null,"node_event_end":null},{"_type":"location","lat":55.8766729,"lon":12.8332084,"tst":1751303047,"alt":43,"acc":106,"_http":true,"ghash":"u3cjuh0","isorcv":"2025-06-30T17:04:07Z","isotst":"2025-06-30T17:04:07Z","disptst":"2025-06-30 17:04:07","tzname":"Europe/Stockholm","isolocal":"2025-06-30T19:04:07+0200","node_event_type":null,"node_event_id":null,"node_event_start":null,"node_event_end":null},{"_type":"location","lat":55.8766657,"lon":12.8332055,"tst":1751303346,"alt":43,"acc":12.72799968719482,"_http":true,"ghash":"u3cjuh0","isorcv":"2025-06-30T17:09:06Z","isotst":"2025-06-30T17:09:06Z","disptst":"2025-06-30 17:09:06","tzname":"Europe/Stockholm","isolocal":"2025-06-30T19:09:06+0200","node_event_type":null,"node_event_id":null,"node_event_start":null,"node_event_end":null},{"_type":"location","lat":55.8766776,"lon":12.8332084,"tst":1751304443,"alt":43,"acc":114.25,"_http":true,"ghash":"u3cjuh0","isorcv":"2025-06-30T17:27:23Z","isotst":"2025-06-30T17:27:23Z","disptst":"2025-06-30 17:27:23","tzname":"Europe/Stockholm","isolocal":"2025-06-30T19:27:23+0200","node_event_type":null,"node_event_id":null,"node_event_start":null,"node_event_end":null},{"_type":"location","lat":55.876685,"lon":12.8332004,"tst":1751305051,"alt":43,"acc":100,"_http":true,"ghash":"u3cjuh0","isorcv":"2025-06-30T17:37:31Z","isotst":"2025-06-30T17:37:31Z","disptst":"2025-06-30 17:37:31","tzname":"Europe/Stockholm","isolocal":"2025-06-30T19:37:31+0200","node_event_type":null,"node_event_id":null,"node_event_start":null,"node_event_end":null},{"_type":"location","lat":55.8767778,"lon":12.8334445,"tst":1751305605,"alt":43,"acc":25.97500038146973,"_http":true,"ghash":"u3cjuh1","isorcv":"2025-06-30T17:46:45Z","isotst":"2025-06-30T17:46:45Z","disptst":"2025-06-30 17:46:45","tzname":"Europe/Stockholm","isolocal":"2025-06-30T19:46:45+0200","node_event_type":null,"node_event_id":null,"node_event_start":null,"node_event_end":null},{"_type":"location","lat":55.876875,"lon":12.8330749,"tst":1751305620,"alt":8,"acc":6.420000076293945,"_http":true,"ghash":"u3cjuh0","isorcv":"2025-06-30T17:47:00Z","isotst":"2025-06-30T17:47:00Z","disptst":"2025-06-30 17:47:00","tzname":"Europe/Stockholm","isolocal":"2025-06-30T19:47:00+0200","node_event_type":null,"node_event_id":null,"node_event_start":null,"node_event_end":null},{"_type":"location","lat":55.8770245,"lon":12.8331474,"tst":1751305650,"alt":40,"acc":23.625,"_http":true,"ghash":"u3cjuh0","isorcv":"2025-06-30T17:47:30Z","isotst":"2025-06-30T17:47:30Z","disptst":"2025-06-30 17:47:30","tzname":"Europe/Stockholm","isolocal":"2025-06-30T19:47:30+0200","node_event_type":null,"node_event_id":null,"node_event_start":null,"node_event_end":null},{"_type":"location","lat":55.8817579,"lon":12.8326035,"tst":1751305824,"alt":50,"acc":96.54199981689453,"_http":true,"ghash":"u3cjuhb","isorcv":"2025-06-30T17:50:24Z","isotst":"2025-06-30T17:50:24Z","disptst":"2025-06-30 17:50:24","tzname":"Europe/Stockholm","isolocal":"2025-06-30T19:50:24+0200","node_event_type":null,"node_event_id":null,"node_event_start":null,"node_event_end":null},{"_type":"location","lat":55.876745,"lon":12.8333918,"tst":1751306318,"alt":43,"acc":100,"_http":true,"ghash":"u3cjuh0","isorcv":"2025-06-30T17:58:38Z","isotst":"2025-06-30T17:58:38Z","disptst":"2025-06-30 17:58:38","tzname":"Europe/Stockholm","isolocal":"2025-06-30T19:58:38+0200","node_event_type":null,"node_event_id":null,"node_event_start":null,"node_event_end":null},{"_type":"location","lat":55.8766576,"lon":12.8331965,"tst":1751306589,"alt":43,"acc":10.98099994659424,"_http":true,"ghash":"u3cjuh0","isorcv":"2025-06-30T18:03:09Z","isotst":"2025-06-30T18:03:09Z","disptst":"2025-06-30 18:03:09","tzname":"Europe/Stockholm","isolocal":"2025-06-30T20:03:09+0200","node_event_type":null,"node_event_id":null,"node_event_start":null,"node_event_end":null},{"_type":"location","lat":55.8766576,"lon":12.8331965,"tst":1751306978,"alt":43,"acc":28.23099899291992,"_http":true,"ghash":"u3cjuh0","isorcv":"2025-06-30T18:09:38Z","isotst":"2025-06-30T18:09:38Z","disptst":"2025-06-30 18:09:38","tzname":"Europe/Stockholm","isolocal":"2025-06-30T20:09:38+0200","node_event_type":null,"node_event_id":null,"node_event_start":null,"node_event_end":null},{"_type":"location","lat":55.8767402,"lon":12.8333039,"tst":1751308361,"alt":43,"acc":9.336999893188477,"_http":true,"ghash":"u3cjuh0","isorcv":"2025-06-30T18:32:41Z","isotst":"2025-06-30T18:32:41Z","disptst":"2025-06-30 18:32:41","tzname":"Europe/Stockholm","isolocal":"2025-06-30T20:32:41+0200","node_event_type":null,"node_event_id":null,"node_event_start":null,"node_event_end":null},{"_type":"location","lat":55.8716271,"lon":12.8288255,"tst":1751308920,"alt":42,"acc":194.5,"_http":true,"ghash":"u3cjggj","isorcv":"2025-06-30T18:42:00Z","isotst":"2025-06-30T18:42:00Z","disptst":"2025-06-30 18:42:00","tzname":"Europe/Stockholm","isolocal":"2025-06-30T20:42:00+0200","node_event_type":null,"node_event_id":null,"node_event_start":null,"node_event_end":null},{"_type":"location","lat":55.8751071,"lon":12.8398476,"tst":1751308965,"alt":42,"acc":294.77099609375,"_http":true,"ghash":"u3cju5v","isorcv":"2025-06-30T18:42:45Z","isotst":"2025-06-30T18:42:45Z","disptst":"2025-06-30 18:42:45","tzname":"Europe/Stockholm","isolocal":"2025-06-30T20:42:45+0200","node_event_type":null,"node_event_id":null,"node_event_start":null,"node_event_end":null},{"_type":"location","lat":55.8765212,"lon":12.8400815,"tst":1751309047,"alt":44,"acc":70.75,"_http":true,"ghash":"u3cjuhj","isorcv":"2025-06-30T18:44:07Z","isotst":"2025-06-30T18:44:07Z","disptst":"2025-06-30 18:44:07","tzname":"Europe/Stockholm","isolocal":"2025-06-30T20:44:07+0200","node_event_type":null,"node_event_id":null,"node_event_start":null,"node_event_end":null},{"_type":"location","lat":55.8772504,"lon":12.8332371,"tst":1751309226,"alt":42,"acc":35.19400024414062,"_http":true,"ghash":"u3cjuh0","isorcv":"2025-06-30T18:47:06Z","isotst":"2025-06-30T18:47:06Z","disptst":"2025-06-30 18:47:06","tzname":"Europe/Stockholm","isolocal":"2025-06-30T20:47:06+0200","node_event_type":null,"node_event_id":null,"node_event_start":null,"node_event_end":null},{"_type":"location","lat":55.8775978,"lon":12.8331219,"tst":1751309638,"alt":43,"acc":392.5,"_http":true,"ghash":"u3cjuh0","isorcv":"2025-06-30T18:53:58Z","isotst":"2025-06-30T18:53:58Z","disptst":"2025-06-30 18:53:58","tzname":"Europe/Stockholm","isolocal":"2025-06-30T20:53:58+0200","node_event_type":null,"node_event_id":null,"node_event_start":null,"node_event_end":null},{"_type":"location","lat":55.8766628,"lon":12.8332062,"tst":1751310576,"alt":43,"acc":82.68499755859375,"_http":true,"ghash":"u3cjuh0","isorcv":"2025-06-30T19:09:36Z","isotst":"2025-06-30T19:09:36Z","disptst":"2025-06-30 19:09:36","tzname":"Europe/Stockholm","isolocal":"2025-06-30T21:09:36+0200","node_event_type":null,"node_event_id":null,"node_event_start":null,"node_event_end":null},{"_type":"location","lat":55.8767063,"lon":12.8332652,"tst":1751311211,"alt":43,"acc":380.0039978027344,"_http":true,"ghash":"u3cjuh0","isorcv":"2025-06-30T19:20:11Z","isotst":"2025-06-30T19:20:11Z","disptst":"2025-06-30 19:20:11","tzname":"Europe/Stockholm","isolocal":"2025-06-30T21:20:11+0200","node_event_type":null,"node_event_id":null,"node_event_start":null,"node_event_end":null},{"_type":"location","lat":55.8750371,"lon":12.829815,"tst":1751311667,"alt":43,"acc":82.5,"_http":true,"ghash":"u3cjggw","isorcv":"2025-06-30T19:27:47Z","isotst":"2025-06-30T19:27:47Z","disptst":"2025-06-30 19:27:47","tzname":"Europe/Stockholm","isolocal":"2025-06-30T21:27:47+0200","node_event_type":null,"node_event_id":null,"node_event_start":null,"node_event_end":null},{"_type":"location","lat":55.8766702,"lon":12.8332104,"tst":1751312586,"alt":43,"acc":152.3049926757812,"_http":true,"ghash":"u3cjuh0","isorcv":"2025-06-30T19:43:06Z","isotst":"2025-06-30T19:43:06Z","disptst":"2025-06-30 19:43:06","tzname":"Europe/Stockholm","isolocal":"2025-06-30T21:43:06+0200","node_event_type":null,"node_event_id":null,"node_event_start":null,"node_event_end":null},{"_type":"location","lat":55.8766702,"lon":12.8332104,"tst":1751312917,"alt":43,"acc":184.75,"_http":true,"ghash":"u3cjuh0","isorcv":"2025-06-30T19:48:37Z","isotst":"2025-06-30T19:48:37Z","disptst":"2025-06-30 19:48:37","tzname":"Europe/Stockholm","isolocal":"2025-06-30T21:48:37+0200","node_event_type":null,"node_event_id":null,"node_event_start":null,"node_event_end":null}];

console.log('=== Debugging Real Location Data ===');
console.log(`Input: ${realData.length} points`);

// Test with full pipeline
const testHistory = {
  testUser: {
    testDevice: realData
  }
};

console.log('\n=== Full Pipeline Test ===');
const result = enhanceLocationData(testHistory);
const processedPoints = result.testUser.testDevice;

console.log(`Output: ${processedPoints.length} points`);

const visitPoints = processedPoints.filter(p => p.node_event_type === 'visit');
const travelPoints = processedPoints.filter(p => p.node_event_type === 'travel');

console.log(`Visit points: ${visitPoints.length}`);
console.log(`Travel points: ${travelPoints.length}`);

// Show details
visitPoints.forEach((p, i) => {
  console.log(`Visit ${i+1}: ID=${p.node_event_id}, at (${p.lat.toFixed(6)}, ${p.lon.toFixed(6)})`);
});

travelPoints.forEach((p, i) => {
  console.log(`Travel ${i+1}: ID=${p.node_event_id}, at (${p.lat.toFixed(6)}, ${p.lon.toFixed(6)}) timestamp=${p.tst}`);
});

console.log('\n=== Raw Clustering Analysis ===');
const { findLocationClusters, calculateDistanceInMeters } = _internal;

// Test with different parameters
const CLUSTER_RADIUS = 25;
const MIN_VISIT_CLUSTER_SIZE = 3;
const MIN_TRAVEL_CLUSTER_SIZE = 5;

// Sort by timestamp
const sortedData = [...realData].sort((a, b) => a.tst - b.tst);

const clusters = findLocationClusters(sortedData, CLUSTER_RADIUS, MIN_VISIT_CLUSTER_SIZE, MIN_TRAVEL_CLUSTER_SIZE);

console.log(`\nClusters found: ${clusters.length}`);
clusters.forEach((cluster, i) => {
  console.log(`Cluster ${i+1}: ${cluster.type}, ${cluster.pointIndices.length} points`);
  if (cluster.type === 'visit') {
    console.log(`  Center: (${cluster.centerLat.toFixed(6)}, ${cluster.centerLon.toFixed(6)})`);
  }
});

// Analyze distances between consecutive main cluster points
console.log('\n=== Distance Analysis ===');
const mainClusterPoints = realData.filter(p => 
  p.lat >= 55.8766 && p.lat <= 55.8778 && 
  p.lon >= 12.833 && p.lon <= 12.834
);

console.log(`Main cluster candidates: ${mainClusterPoints.length} points`);

for (let i = 0; i < Math.min(5, mainClusterPoints.length - 1); i++) {
  const dist = calculateDistanceInMeters(mainClusterPoints[i], mainClusterPoints[i + 1]);
  console.log(`Distance ${i} to ${i+1}: ${dist.toFixed(2)}m`);
}
