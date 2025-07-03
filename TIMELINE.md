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
  - **Travels**: Large green dots with connecting line
- **Continuous Line**: Connects all events to show progression

### Event Information

#### Visit Events
- **Type**: "Visit #X" (where X is the cluster ID)
- **Location**: Precise coordinates (6 decimal places)
- **Duration**: Human-readable format (e.g., "2h 15m", "45m 30s")
- **Time Range**: Start - End time in local format

#### Travel Events  
- **Type**: "Trip #X" (where X is the cluster ID)
- **Duration**: "Traveled for [duration]" in human-readable format
- **Points**: Number of location points in the travel cluster
- **Time Range**: Start - End time in local format

## Visual Design

### Color Scheme
- **Visits**: Blue dots and text (`var(--color-primary)`)
- **Travels**: Green dots and text (`#28a745`)
- **Timeline Line**: Light gray (`#ddd`)
- **Background**: White with subtle shadow

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

• Trip #1  
  Traveled for 12m 30s
  8 points
  10:55 - 11:07

• Visit #2
  40.782900, -73.965400
  45m 15s
  11:07 - 11:52
```

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
