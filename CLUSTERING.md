# Location Clustering Controls

The OwnTracks frontend now includes configurable location clustering controls that allow you to:

1. **Enable/Disable Clustering** - Toggle clustering on/off to see raw location data vs. clustered data
2. **Configure Cluster Radius** - Adjust how close points need to be to form a visit cluster (5-20 meters)
3. **Configure Minimum Visit Cluster Size** - Set how many points are needed to form a visit cluster (2-15 points)
4. **Configure Minimum Travel Cluster Size** - Set how many points are needed to form a travel cluster (2-15 points)

## Features

### Clustering Toggle
- **Enabled**: Location points are clustered into visits and travels with metadata
- **Disabled**: Raw location data is displayed without any clustering or metadata

### Live Updates
- Changes to clustering parameters automatically refresh the map data
- No need to manually reload or refresh the page

### Mobile-Friendly
- Slider controls are touch-friendly and work well on mobile devices
- Controls are integrated into the collapsible header toolbar

## How Clustering Works

### Visit Clusters
- Created when multiple location points are within the cluster radius
- Points are merged into a single representative point at the centroid
- Metadata includes visit duration (start/end times)

### Travel Clusters
- Created for points that don't form visit clusters
- Points are preserved individually but tagged as part of a travel segment
- Metadata includes travel duration and segment information

### Metadata Fields
Each location point gets the following metadata:
- `node_event_type`: 'visit' or 'travel' (null when clustering disabled)
- `node_event_id`: Unique identifier for the cluster
- `node_event_start`: Start timestamp of the event
- `node_event_end`: End timestamp of the event

## UI Location
The clustering controls are located in the header toolbar, next to the device selector. On mobile devices, they're part of the collapsible navigation menu.

## Parameters Guide

### Cluster Radius (5-20m)
- **5m**: Very tight clustering, only very close points are grouped
- **10m**: Good for indoor locations or precise outdoor areas
- **15m**: Good for larger outdoor areas like parking lots
- **20m**: Loose clustering for large areas

### Min Visit Cluster Size (2-15 points)
- **2-3**: Sensitive to short visits
- **4-6**: Balanced approach for most use cases
- **7+**: Only longer stays are considered visits

### Min Travel Cluster Size (2-15 points)
- **2-5**: More granular travel segments
- **6-10**: Balanced travel clustering
- **11+**: Only longer travel segments are clustered

## Testing
Run the test suite to verify clustering functionality:
```bash
npm test
```

All clustering logic is thoroughly tested with 28+ test cases covering various scenarios including:
- Visit cluster formation
- Travel cluster formation
- Consecutive cluster merging
- Transient point handling
- Edge cases
- Disabled clustering mode
