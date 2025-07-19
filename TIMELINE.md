# Timeline Flyout Feature

The Timeline Flyout provides a chronological view of all visits and trips in an easy-to-read vertical timeline format.

## Features

### Floating Action Button

- **Location**: Bottom-right corner of the map
- **Design**: Round, floating button with list icon
- **Behavior**: Click to toggle the timeline flyout open/close
- **Tooltip**: "Show timeline"

### Timeline Flyout Panel

- **Layout**: Vertical panel that slides out from bottom-right
- **Responsive**: Adapts to mobile screen sizes
- **Dismissal**: Click outside the panel or the X button to close

### Timeline Visualization

- **Vertical Timeline**: Events are displayed in chronological order (start time)
- **Visual Indicators**:
  - **Visits**: Large blue dots with connecting line
  - **Travels**: Font Awesome transportation icons with connecting line
    - **Walking** (≤10 km/h): Walking person icon (fa-walking)
    - **Vehicle** (≤200 km/h): Car icon (fa-car)
    - **Aircraft** (>200 km/h): Airplane icon (fa-plane)
- **Continuous Line**: Connects all events to show progression

### Event Information

#### Visit Events

- **Type**: Human-readable location name (e.g., "Central Park", "123 Main St") or "Visit #X" fallback
- **Location**: Precise coordinates (6 decimal places)
- **Duration**: Human-readable format (e.g., "2h 15m", "45m 30s")
- **Time Range**: Start - End time in local format
- **Geocoding**: Automatic reverse geocoding using OpenStreetMap Nominatim API for meaningful location names

#### Travel Events

- **Type**: "Trip #X" (where X is the cluster ID)
- **Icon**: Speed-based visual indicator (walking, vehicle, or aircraft)
- **Distance & Duration**: "[distance]km • [duration]" format (e.g., "2.5km • 21m 24s")
- **Speed**: Average speed in km/h for the trip
- **Time Range**: Start - End time in local format

## Location Name Resolution

### Priority Order for Visit Names

1. **POI/Amenity Names with Context**: Specific locations within larger facilities (e.g., "Stockholm Central Station, Track 2")
2. **Major Facilities**: Train stations, airports, shopping centers, hospitals
3. **Business/Shop Names**: Stores, restaurants, services
4. **Building Names**: Office buildings, residential complexes
5. **Addresses**: Street addresses with house numbers and context
6. **Existing Data**: POI field, address field, or region names from location data
7. **Fallback**: "Visit #X" if geocoding fails or no data available

### Advanced Geocoding Features

- **Context Detection**: Automatically identifies major facilities (stations, airports, malls) and combines them with specific locations (tracks, gates, terminals)
- **Multi-language Support**: Recognizes facility patterns in English, Swedish, German, and French
- **Smart Context Building**: For specific locations like "Track 2", attempts to find the parent facility name (e.g., "Stockholm Central Station")
- **House Number Detection**: Properly handles addresses where the first part is just a house number (e.g., "2G") by building full addresses with street and locality
- **Rate Limited**: Respects OpenStreetMap Nominatim usage policy (1 request/second)
- **Cached Results**: Avoids duplicate API calls for nearby locations
- **Error Handling**: Graceful fallback to default names if geocoding fails

### Examples of Location Names

- **Complex Facilities**: "Stockholm Central Station, Track 2", "Terminal 3, Gate A15"
- **Shopping Centers**: "Mall of America, Food Court", "Nordstan, H&M"
- **Transport Hubs**: "Arlanda Airport, Terminal 5", "Central Station, Platform 1"
- **Addresses**: "2G Rua Doutor Silva Nobre, São Brás de Alportel", "123 Main Street, Downtown"
- **Simple Addresses**: "15 Oak Avenue, Suburbs"
- **Loading States**: Shows "Loading..." indicator while geocoding is in progress

## Visual Design

### Color Scheme

- **Visits**: Blue dots and text (`var(--color-primary)`)
- **Travels**: Green background with white speed-based icons (`#28a745`)
- **Timeline Line**: Light gray (`#ddd`)
- **Background**: White with subtle shadow

### Speed-Based Travel Icons

- **Walking Speed** (≤10 km/h): Font Awesome walking icon for pedestrian movement
- **Vehicle Speed** (≤200 km/h): Font Awesome car icon for automobile, bus, train, or other ground transport
- **Aircraft Speed** (>200 km/h): Font Awesome plane icon for flights or very high-speed travel

### Mobile Optimization

- **Touch-Friendly**: Large tap targets and appropriate spacing
- **Responsive Width**: Adapts to screen size (max 350px, with margins on mobile)
- **Scrollable**: Long timelines scroll vertically within the panel

### Dark Mode Support

- **Automatic Detection**: Respects `prefers-color-scheme: dark`
- **Dark Theme**: Dark background, light text, adjusted colors

## Technical Implementation

### Data Source

- Uses `filteredLocationHistory` getter from Vuex store
- Processes clustering metadata (`node_event_type`, `node_event_id`, etc.)
- Groups location points by event type and ID
- Sorts events chronologically by start time

### Performance

- **Computed Properties**: Timeline data is computed reactively
- **Efficient Rendering**: Only renders visible events
- **Memory Efficient**: Uses references to existing location data

### Integration

- **Component**: `TimelineFlyout.vue` in `/src/components/`
- **Usage**: Embedded in `Map.vue` as overlay component
- **Dependencies**: Vue 2, Vuex, vue-feather-icons

## Usage Examples

### Typical Timeline Display

```
• Visit #1
  40.758896, -73.985130
  1h 25m
  09:30 - 10:55

🚚 Trip #1
  Traveled for 12m 30s
  8 points
  45.2 km/h
  10:55 - 11:07

• Visit #2
  40.782900, -73.965400
  45m 15s
  11:07 - 11:52
```

Note: Icons shown are representational - actual icons depend on calculated travel speed.

### Duration Formatting

- Less than 1 minute: "45s"
- Less than 1 hour: "15m 30s"
- 1+ hours: "2h 15m"

### Coordinate Formatting

- 6 decimal places for precision
- Comma-separated lat, lon format
- Monospace font for alignment

## Development Notes

### Dependencies

- `vue-feather-icons`: For list and close icons
- `@fortawesome/vue-fontawesome`: For Font Awesome transportation icons
- `@fortawesome/fontawesome-svg-core`: Font Awesome core library
- `@fortawesome/free-solid-svg-icons`: Font Awesome solid icons (walking, car, plane)
- `vuex`: For accessing location data
- Vue 2 reactive system for real-time updates

### Styling

- SCSS with scoped styles
- CSS custom properties for theming
- Responsive breakpoints for mobile

### Localization

All text is localized using Vue i18n:

- "Show timeline"
- "Timeline"
- "No events found"
- "Visit" / "Trip"
- "Traveled for"
- "points"
