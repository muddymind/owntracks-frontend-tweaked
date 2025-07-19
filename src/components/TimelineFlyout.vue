<template>
  <div class="timeline-container">
    <!-- Floating Action Button -->
    <button
      class="timeline-fab"
      @click="toggleFlyout"
      :title="$t('Show timeline')"
    >
      <ListIcon size="1.5x" />
    </button>

    <!-- Flyout Panel -->
    <div v-if="isOpen" class="timeline-flyout" @click.stop>
      <div class="timeline-header">
        <h3>{{ $t("Timeline") }}</h3>
        <button class="close-button" @click="closeFlyout">
          <XIcon size="1x" />
        </button>
      </div>

      <div class="timeline-content">
        <div v-if="timelineEvents.length === 0" class="no-events">
          {{ $t("No events found") }}
        </div>

        <div v-else class="timeline-list">
          <div
            v-for="(event, index) in timelineEvents"
            :key="`${event.user || 'unknown'}-${event.device || 'unknown'}-${
              event.type
            }-${event.id || 'unknown'}-${event.startTime || 0}-${index}`"
            class="timeline-item"
            :class="{
              'is-visit': event.type === 'visit',
              'is-travel': event.type === 'travel',
            }"
          >
            <!-- Timeline Line and Dot/Icon -->
            <div class="timeline-marker">
              <div
                class="timeline-line"
                v-if="index < timelineEvents.length - 1"
              ></div>
              <div
                v-if="event.type === 'visit'"
                class="timeline-dot visit"
              ></div>
              <div v-else class="timeline-icon travel">
                <FontAwesomeIcon :icon="getTravelIcon(event)" />
              </div>
            </div>

            <!-- Event Content -->
            <div class="timeline-details">
              <div class="event-type">
                <strong v-if="event.type === 'visit'">
                  {{ getVisitDisplayName(event) }}
                </strong>
                <strong v-else>
                  {{ getTravelDisplayName(event) }}
                </strong>
              </div>

              <div class="event-info">
                <div v-if="event.type === 'visit'" class="visit-info">
                  <div class="coordinates">
                    {{ event.lat.toFixed(6) }}, {{ event.lon.toFixed(6) }}
                  </div>
                  <div class="duration">
                    {{ formatDuration(event.duration) }}
                  </div>
                </div>

                <div v-else class="travel-info">
                  <div class="travel-duration">
                    {{
                      formatDistanceAndDuration(event.distance, event.duration)
                    }}
                  </div>
                </div>
              </div>

              <div class="event-time">
                {{ formatEventTime(event.startTime, event.endTime) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Overlay to close flyout when clicking outside -->
    <div v-if="isOpen" class="timeline-overlay" @click="closeFlyout"></div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { ListIcon, XIcon } from "vue-feather-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faWalking,
  faCar,
  faPlane,
  faPersonWalking,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

// Add icons to the library
library.add(faWalking, faCar, faPlane, faPersonWalking, faUser);
import { distanceBetweenCoordinates } from "@/util";
import { reverseGeocodeWithRateLimit } from "@/geocoding";

export default {
  name: "TimelineFlyout",
  components: {
    ListIcon,
    XIcon,
    FontAwesomeIcon,
  },
  data() {
    return {
      isOpen: false,
      geocodedEvents: {}, // Use object for better reactivity
      isGeocoding: false, // Track if geocoding is in progress
    };
  },
  computed: {
    ...mapGetters(["filteredLocationHistory"]),

    timelineEvents() {
      const events = this.generateTimelineEvents();
      // Return events with any already geocoded names
      return this.mergeGeocodedNames(events);
    },
  },
  watch: {
    isOpen: {
      handler(newVal) {
        if (newVal && !this.isGeocoding) {
          this.$nextTick(() => {
            const events = this.generateTimelineEvents();
            this.geocodeVisitLocations(events);
          });
        }
      },
      immediate: true,
    },
  },
  methods: {
    generateTimelineEvents() {
      const events = [];

      // Process all users and devices
      Object.keys(this.filteredLocationHistory).forEach((user) => {
        Object.keys(this.filteredLocationHistory[user]).forEach((device) => {
          const locations = this.filteredLocationHistory[user][device];

          // Sort locations by timestamp to ensure proper order
          const sortedLocations = locations
            .slice()
            .sort((a, b) => a.tst - b.tst);

          // Group locations by their event type and ID
          const eventGroups = {};

          let validEventCount = 0;
          let invalidEventCount = 0;

          sortedLocations.forEach((location) => {
            // Safety check: only process locations with valid event metadata
            if (
              location.node_event_type &&
              location.node_event_id !== null &&
              location.node_event_id !== undefined &&
              location.node_event_start !== null &&
              location.node_event_start !== undefined &&
              location.node_event_end !== null &&
              location.node_event_end !== undefined
            ) {
              const key = `${location.node_event_type}-${location.node_event_id}`;

              if (!eventGroups[key]) {
                eventGroups[key] = {
                  type: location.node_event_type,
                  id: location.node_event_id,
                  startTime: location.node_event_start,
                  endTime: location.node_event_end,
                  locations: [],
                };
              }

              eventGroups[key].locations.push(location);
              validEventCount++;
            } else {
              // Log locations that don't have proper event metadata for debugging
              console.warn("[Timeline] Location missing event metadata:", {
                type: location.node_event_type,
                id: location.node_event_id,
                start: location.node_event_start,
                end: location.node_event_end,
                timestamp: location.tst,
              });
              invalidEventCount++;
            }
          });

          // Only log if there are invalid events to avoid spam
          if (invalidEventCount > 0) {
            console.warn(
              `[Timeline] ${user}/${device}: ${invalidEventCount} locations missing event metadata`
            );
          }

          // Sort event groups by start time to process them in chronological order
          const sortedEventGroups = Object.values(eventGroups).sort(
            (a, b) => a.startTime - b.startTime
          );

          // Convert groups to events and calculate travel distances properly
          sortedEventGroups.forEach((group, groupIndex) => {
            // Safety check: ensure group has valid ID
            if (group.id === null || group.id === undefined) {
              console.warn(
                "[Timeline] Skipping event group with undefined ID:",
                group
              );
              return;
            }

            const duration = group.endTime - group.startTime;

            if (group.type === "visit") {
              // For visits, use the averaged coordinates
              const avgLat =
                group.locations.reduce((sum, loc) => sum + loc.lat, 0) /
                group.locations.length;
              const avgLon =
                group.locations.reduce((sum, loc) => sum + loc.lon, 0) /
                group.locations.length;

              // Check if any location in the group already has address/POI data
              let existingLocationName = null;
              for (const loc of group.locations) {
                if (loc.poi) {
                  existingLocationName = loc.poi;
                  break;
                } else if (loc.addr) {
                  existingLocationName = loc.addr;
                  break;
                } else if (loc.inregions && loc.inregions.length > 0) {
                  existingLocationName = loc.inregions[0];
                  break;
                }
              }

              const visitEvent = {
                type: "visit",
                id: group.id,
                user: user,
                device: device,
                lat: avgLat,
                lon: avgLon,
                duration: duration,
                startTime: group.startTime,
                endTime: group.endTime,
                pointsCount: group.locations.length,
                locationName: existingLocationName, // Will be updated with geocoded name if needed
              };

              events.push(visitEvent);
            } else if (group.type === "travel") {
              // Calculate distance from previous visit to next visit
              let totalDistance = 0;

              // Find the previous visit event
              const prevVisitGroup =
                groupIndex > 0 ? sortedEventGroups[groupIndex - 1] : null;
              const nextVisitGroup =
                groupIndex < sortedEventGroups.length - 1
                  ? sortedEventGroups[groupIndex + 1]
                  : null;

              // Get all location points for this travel segment including boundaries
              let travelPoints = [];

              // Add last point from previous visit if it exists
              if (prevVisitGroup && prevVisitGroup.type === "visit") {
                const lastPrevPoint =
                  prevVisitGroup.locations[prevVisitGroup.locations.length - 1];
                travelPoints.push(lastPrevPoint);
              }

              // Add all travel points
              travelPoints = travelPoints.concat(group.locations);

              // Add first point from next visit if it exists
              if (nextVisitGroup && nextVisitGroup.type === "visit") {
                const firstNextPoint = nextVisitGroup.locations[0];
                travelPoints.push(firstNextPoint);
              }

              // Calculate total distance through all segments
              for (let i = 1; i < travelPoints.length; i++) {
                const prev = travelPoints[i - 1];
                const curr = travelPoints[i];
                totalDistance += distanceBetweenCoordinates(
                  { lat: prev.lat, lng: prev.lon },
                  { lat: curr.lat, lng: curr.lon }
                );
              }

              events.push({
                type: "travel",
                id: group.id,
                user: user,
                device: device,
                duration: duration,
                distance: totalDistance,
                startTime: group.startTime,
                endTime: group.endTime,
                pointsCount: group.locations.length,
              });
            }
          });
        });
      });

      // Sort events by start time
      const sortedEvents = events.sort((a, b) => a.startTime - b.startTime);

      // Only log if there are events to show
      if (sortedEvents.length > 0) {
        console.log(
          "[Timeline] Generated",
          sortedEvents.length,
          "timeline events"
        );
      }

      return sortedEvents;
    },

    async geocodeVisitLocations(events) {
      if (this.isGeocoding) {
        console.log("[Timeline] Geocoding already in progress, skipping");
        return; // Prevent multiple concurrent geocoding operations
      }

      const visitsNeedingGeocode = events.filter(
        (event) =>
          event.type === "visit" &&
          !event.locationName &&
          !this.geocodedEvents[
            `${event.user}-${event.device}-visit-${event.id}`
          ]
      );

      if (visitsNeedingGeocode.length === 0) {
        console.log("[Timeline] No visits need geocoding");
        return;
      }

      console.log(
        "[Timeline] Starting geocoding for",
        visitsNeedingGeocode.length,
        "visits"
      );
      this.isGeocoding = true;

      try {
        // Process visits using centralized queue with limited concurrency
        console.log(
          "[Timeline] Processing",
          visitsNeedingGeocode.length,
          "visits for geocoding"
        );

        // Limit concurrent requests to prevent overwhelming the queue
        const BATCH_SIZE = 2; // Reduced from 3 to be safer
        for (let i = 0; i < visitsNeedingGeocode.length; i += BATCH_SIZE) {
          const batch = visitsNeedingGeocode.slice(i, i + BATCH_SIZE);

          const batchPromises = batch.map(async (visit) => {
            try {
              console.log("[Timeline] Starting geocoding for visit", visit.id);
              const geocodedName = await reverseGeocodeWithRateLimit(
                visit.lat,
                visit.lon
              );

              if (geocodedName) {
                // Store in reactive geocoded events object
                this.$set(
                  this.geocodedEvents,
                  `${visit.user}-${visit.device}-visit-${visit.id}`,
                  geocodedName
                );

                console.log(
                  "[Timeline] Geocoded visit",
                  visit.id,
                  "to:",
                  geocodedName
                );
              }
            } catch (error) {
              console.warn(
                "[Timeline] Failed to geocode visit",
                visit.id,
                ":",
                error
              );
            }
          });

          // Wait for batch to complete before starting next batch
          try {
            await Promise.allSettled(batchPromises);
            console.log(
              "[Timeline] Completed batch",
              Math.floor(i / BATCH_SIZE) + 1,
              "of",
              Math.ceil(visitsNeedingGeocode.length / BATCH_SIZE)
            );
          } catch (batchError) {
            console.warn("[Timeline] Error in batch processing:", batchError);
          }
        }

        console.log("[Timeline] All geocoding complete");
      } catch (error) {
        console.warn("[Timeline] Error during geocoding:", error);
      } finally {
        this.isGeocoding = false;
      }
    },

    mergeGeocodedNames(events) {
      return events.map((event) => {
        if (event.type === "visit" && !event.locationName) {
          // Check if we have a geocoded name for this visit
          const geocodedName =
            this.geocodedEvents[
              `${event.user}-${event.device}-visit-${event.id}`
            ];

          if (geocodedName) {
            return { ...event, locationName: geocodedName };
          }
        }
        return event;
      });
    },
    toggleFlyout() {
      this.isOpen = !this.isOpen;
    },

    closeFlyout() {
      this.isOpen = false;
    },

    formatDuration(seconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);

      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
      } else {
        return `${secs}s`;
      }
    },

    formatDistanceAndDuration(distanceInMeters, durationInSeconds) {
      const distanceInKm = (distanceInMeters / 1000).toFixed(1);
      const duration = this.formatDuration(durationInSeconds);
      return `${distanceInKm}km • ${duration}`;
    },

    formatEventTime(startTime, endTime) {
      const start = new Date(startTime * 1000);
      const end = new Date(endTime * 1000);

      const timeOptions = {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      };

      return `${start.toLocaleTimeString(this.$config.locale, timeOptions)} - ${end.toLocaleTimeString(this.$config.locale, timeOptions)}`;
    },

    getVisitDisplayName(event) {
      if (event.locationName) {
        return event.locationName;
      }

      // Safety check for event.id
      if (!event.id) {
        return `${this.$t("Visit")} (${this.$t("Loading...")})`;
      }

      // Check if this visit is currently being geocoded
      const hasGeocodedName =
        this.geocodedEvents[`${event.user}-${event.device}-visit-${event.id}`];
      const isBeingGeocoded = this.isGeocoding && !hasGeocodedName;

      if (isBeingGeocoded) {
        return `${this.$t("Visit")} #${event.id} (${this.$t("Loading...")})`;
      }

      // Fallback to default name
      return `${this.$t("Visit")} #${event.id}`;
    },

    getTravelDisplayName(event) {
      // Calculate speed in km/h
      const durationInHours = event.duration / 3600; // Convert seconds to hours
      const distanceInKm = event.distance / 1000; // Convert meters to km
      const speedKmh = durationInHours > 0 ? distanceInKm / durationInHours : 0;

      // Return appropriate display name based on speed
      if (speedKmh <= 10) {
        return this.$t("Walking");
      } else if (speedKmh <= 200) {
        return this.$t("Driving");
      } else {
        return this.$t("Flying");
      }
    },

    getTravelIcon(event) {
      // Calculate speed in km/h
      const durationInHours = event.duration / 3600; // Convert seconds to hours
      const distanceInKm = event.distance / 1000; // Convert meters to km
      const speedKmh = durationInHours > 0 ? distanceInKm / durationInHours : 0;

      // Return appropriate Font Awesome icon based on speed
      if (speedKmh <= 10) {
        return faPersonWalking; // Walking icon
      } else if (speedKmh <= 200) {
        return faCar; // Car icon
      } else {
        return faPlane; // Airplane icon
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.timeline-container {
  position: relative;
  z-index: 1000;
}

.timeline-fab {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-primary, #007bff);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 1001;

  &:hover {
    background: var(--color-primary-dark, #0056b3);
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
  }

  &:active {
    transform: scale(0.95);
  }
}

.timeline-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 999;
}

.timeline-flyout {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 350px;
  max-height: 60vh;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 1002;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    width: calc(100vw - 40px);
    max-width: 350px;
  }
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;

  h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #333;
  }

  .close-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    color: #666;

    &:hover {
      background: #f5f5f5;
      color: #333;
    }
  }
}

.timeline-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.no-events {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 20px;
}

.timeline-list {
  position: relative;
}

.timeline-item {
  display: flex;
  margin-bottom: 20px;
  position: relative;

  &:last-child {
    margin-bottom: 0;
  }
}

.timeline-marker {
  position: relative;
  width: 20px;
  flex-shrink: 0;
  margin-right: 16px;

  .timeline-line {
    position: absolute;
    left: 50%;
    top: 20px;
    bottom: -20px;
    width: 2px;
    background: #ddd;
    transform: translateX(-50%);
  }

  .timeline-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    position: absolute;
    left: 50%;
    top: 6px;
    transform: translateX(-50%);
    border: 3px solid white;
    box-shadow: 0 0 0 2px #ddd;

    &.visit {
      background: var(--color-primary, #007bff);
      box-shadow: 0 0 0 2px var(--color-primary, #007bff);
    }
  }

  .timeline-icon {
    position: absolute;
    left: 50%;
    top: 2px;
    transform: translateX(-50%);
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
    box-shadow: 0 0 0 2px #28a745;
    font-size: 12px;

    &.travel {
      background: #28a745;
      color: white;
    }
  }
}

.timeline-details {
  flex: 1;
  min-width: 0;

  .event-type {
    margin-bottom: 4px;

    strong {
      color: #333;
      font-size: 0.9rem;
    }
  }

  .event-info {
    margin-bottom: 8px;
    font-size: 0.85rem;
    color: #666;

    .coordinates {
      font-family: monospace;
      font-size: 0.8rem;
      color: #333;
    }

    .duration {
      color: var(--color-primary, #007bff);
      font-weight: 500;
    }

    .travel-duration {
      color: #28a745;
      font-weight: 500;
    }
  }

  .event-time {
    font-size: 0.75rem;
    color: #999;
    font-family: monospace;
  }
}

// Dark mode support
@media (prefers-color-scheme: dark) {
  .timeline-flyout {
    background: #2d3748;
    color: white;

    .timeline-header {
      border-bottom-color: #4a5568;

      h3 {
        color: white;
      }

      .close-button {
        color: #a0aec0;

        &:hover {
          background: #4a5568;
          color: white;
        }
      }
    }

    .timeline-marker .timeline-line {
      background: #4a5568;
    }

    .timeline-details {
      .event-type strong {
        color: white;
      }

      .coordinates {
        color: #e2e8f0;
      }
    }
  }

  .no-events {
    color: #a0aec0;
  }
}
</style>
