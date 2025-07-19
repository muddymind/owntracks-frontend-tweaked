/**
 * Reverse geocoding utilities using OpenStreetMap Nominatim API
 */

// Cache for geocoding results to avoid repeated API calls
const geocodingCache = new Map();

/**
 * Reverse geocode coordinates to get human-readable location name
 * Uses OpenStreetMap Nominatim API with POI priority and address fallback
 *
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<string|null>} Location name or null if failed
 */
export const reverseGeocode = async (lat, lon) => {
  // Create cache key with reduced precision to group nearby locations
  const precision = 4; // ~11m accuracy
  const cacheKey = `${lat.toFixed(precision)},${lon.toFixed(precision)}`;

  // Check cache first
  if (geocodingCache.has(cacheKey)) {
    return geocodingCache.get(cacheKey);
  }

  try {
    // Use Nominatim API with specific parameters for POI and address lookup
    const url =
      `https://nominatim.openstreetmap.org/reverse?` +
      `format=json&` +
      `lat=${lat}&` +
      `lon=${lon}&` +
      `zoom=18&` + // High zoom for POI details
      `addressdetails=1&` +
      `extratags=1&` +
      `namedetails=1&` +
      `accept-language=en`; // Prefer English names

    const response = await fetch(url, {
      headers: {
        "User-Agent": "OwnTracks-Frontend/1.0", // Required by Nominatim
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.error) {
      geocodingCache.set(cacheKey, null);
      return null;
    }

    // Priority order for location names:
    // 1. POI/amenity name with context (e.g., "Stockholm Central Station, Track 2")
    // 2. Shop/business name with building context
    // 3. Building name with area context
    // 4. Address components

    let locationName = null;
    let contextName = null; // For adding building/area context
    let mainFacilityName = null; // For major facilities like stations, airports

    // First, identify major facilities from the data
    if (data.address) {
      const addr = data.address;

      // Look for major facility names in various fields
      const facilityFields = [
        addr.building,
        addr.public_building,
        addr.amenity,
        addr.railway,
        addr.aeroway,
        addr.leisure,
        addr.tourism,
        addr.man_made,
      ];

      for (const field of facilityFields) {
        if (
          field &&
          field.match(
            /(station|airport|mall|center|centre|terminal|bahnhof|flygplats|centrum|hauptbahnhof)/i
          )
        ) {
          mainFacilityName = field;
          break;
        }
      }

      // Also check in the name details or display name for major facilities
      if (!mainFacilityName) {
        if (
          data.namedetails?.name &&
          data.namedetails.name.match(
            /(station|airport|mall|center|centre|terminal|bahnhof|flygplats|centrum|hauptbahnhof)/i
          )
        ) {
          mainFacilityName = data.namedetails.name;
        } else if (data.display_name) {
          const parts = data.display_name.split(",").map((p) => p.trim());
          for (const part of parts.slice(0, 3)) {
            if (
              part.match(
                /(station|airport|mall|center|centre|terminal|bahnhof|flygplats|centrum|hauptbahnhof)/i
              )
            ) {
              mainFacilityName = part;
              break;
            }
          }
        }
      }
    }

    // Check for POI/amenity names
    if (data.namedetails?.name) {
      locationName = data.namedetails.name;
    } else if (data.display_name) {
      // Extract the first part which is usually the POI/building name
      const parts = data.display_name.split(",");
      const firstPart = parts[0]?.trim();

      // Check if it's a meaningful POI name (not just a house number or simple alphanumeric code)
      if (
        firstPart &&
        !firstPart.match(/^\d+$/) && // Not just numbers
        !firstPart.match(/^\d+[a-z]$/i) && // Not just number + letter (like "2G")
        !firstPart.match(/^[a-z]\d+$/i) && // Not just letter + number (like "A2")
        !firstPart.match(/^\d+\/\d+$/)
      ) {
        // Not fractions like "2/3"
        locationName = firstPart;
      }
    }

    // Look for building/area context to add to specific locations
    if (data.address) {
      const addr = data.address;

      // Check for building context (shopping malls, train stations, airports, etc.)
      const buildingContext =
        addr.building || addr.public_building || addr.amenity;
      const areaContext =
        addr.aeroway || addr.railway || addr.leisure || addr.tourism;

      // If we have a specific location (like "Track 2") but also building context
      if (
        locationName &&
        (buildingContext || areaContext || mainFacilityName)
      ) {
        // Check if the location name looks like a specific part (track, gate, platform, etc.)
        const specificPatterns = [
          /^(track|platform|gate|terminal|pier|dock|bay|stand)\s*\d+/i,
          /^(spår|plattform|terminal|gate)\s*\d+/i, // Swedish
          /^(gleis|bahnsteig)\s*\d+/i, // German
          /^(voie|quai)\s*\d+/i, // French
          /^level\s*\d+/i,
          /^floor\s*\d+/i,
          /^\d+[a-z]?$/, // Just numbers/letters like "2A"
          /^(terminal|hall|wing|section)\s*[a-z0-9]/i,
        ];

        const isSpecificLocation = specificPatterns.some((pattern) =>
          pattern.test(locationName)
        );

        if (isSpecificLocation) {
          // Prefer main facility name if available and not already included in locationName
          if (
            mainFacilityName &&
            mainFacilityName.toLowerCase() !== locationName.toLowerCase() &&
            !locationName
              .toLowerCase()
              .includes(mainFacilityName.toLowerCase().split(" ")[0])
          ) {
            contextName = mainFacilityName;
          } else if (
            buildingContext &&
            buildingContext.toLowerCase() !== locationName.toLowerCase() &&
            !locationName
              .toLowerCase()
              .includes(buildingContext.toLowerCase().split(" ")[0])
          ) {
            contextName = buildingContext;
          } else if (
            areaContext &&
            areaContext.toLowerCase() !== locationName.toLowerCase() &&
            !locationName
              .toLowerCase()
              .includes(areaContext.toLowerCase().split(" ")[0])
          ) {
            contextName = areaContext;
          }
        }
      }

      // If we have a main facility but no specific location, use the facility name
      if (!locationName && mainFacilityName) {
        locationName = mainFacilityName;
      }

      // If we still don't have a main location name, try to extract from address components
      if (!locationName) {
        // Look for specific facility names first
        if (addr.amenity && !addr.amenity.match(/^(yes|no|true|false|\d+)$/i)) {
          locationName = addr.amenity;
        } else if (
          addr.building &&
          !addr.building.match(/^(yes|no|true|false|\d+)$/i)
        ) {
          locationName = addr.building;
        } else if (
          addr.shop &&
          !addr.shop.match(/^(yes|no|true|false|\d+)$/i)
        ) {
          locationName = addr.shop;
        } else if (
          addr.leisure &&
          !addr.leisure.match(/^(yes|no|true|false|\d+)$/i)
        ) {
          locationName = addr.leisure;
        } else if (
          addr.tourism &&
          !addr.tourism.match(/^(yes|no|true|false|\d+)$/i)
        ) {
          locationName = addr.tourism;
        }
      }
    }

    // Combine main location with context if available
    if (locationName && contextName) {
      locationName = `${contextName}, ${locationName}`;
    }

    // Fallback to address if no POI found
    if (!locationName && data.address) {
      const addr = data.address;

      // Build address from components
      const addressParts = [];

      // Add road/street (this is the most important part for addresses)
      if (addr.road) {
        addressParts.push(addr.road);
      } else if (addr.pedestrian) {
        addressParts.push(addr.pedestrian);
      } else if (addr.path) {
        addressParts.push(addr.path);
      }

      // Add house number if available and we have a road
      if (addr.house_number && addressParts.length > 0) {
        addressParts[0] = `${addr.house_number} ${addressParts[0]}`;
      }

      // For addresses, always include locality for context (neighborhood, city, town)
      // This is essential to make addresses meaningful
      if (addr.neighbourhood) {
        addressParts.push(addr.neighbourhood);
      } else if (addr.suburb) {
        addressParts.push(addr.suburb);
      } else if (addr.city_district) {
        addressParts.push(addr.city_district);
      }

      // Add city/town (essential for addresses)
      if (
        addr.city &&
        !addressParts.some((part) =>
          part.toLowerCase().includes(addr.city.toLowerCase())
        )
      ) {
        addressParts.push(addr.city);
      } else if (
        addr.town &&
        !addressParts.some((part) =>
          part.toLowerCase().includes(addr.town.toLowerCase())
        )
      ) {
        addressParts.push(addr.town);
      } else if (
        addr.village &&
        !addressParts.some((part) =>
          part.toLowerCase().includes(addr.village.toLowerCase())
        )
      ) {
        addressParts.push(addr.village);
      }

      // For addresses, we want at least street + locality for context
      // Take up to 3 components to keep it readable but informative
      if (addressParts.length > 0) {
        locationName = addressParts.slice(0, 3).join(", ");
      }
    }

    // Final fallback - use the place type if available
    if (!locationName && data.type && data.class) {
      locationName = `${data.type} (${data.class})`;
    }

    // Cache the result
    geocodingCache.set(cacheKey, locationName);
    return locationName;
  } catch (error) {
    console.warn(
      `[Geocoding] Failed to reverse geocode ${lat}, ${lon}:`,
      error
    );
    geocodingCache.set(cacheKey, null);
    return null;
  }
};

/**
 * Add rate limiting to avoid overwhelming the Nominatim API
 * Maximum 1 request per 5 seconds to be very conservative
 */
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 500; // 0.5 seconds (very conservative)
const MAX_QUEUE_SIZE = 20; // Limit queue size to prevent memory issues

const originalReverseGeocode = reverseGeocode;

// Centralized request queue to ensure proper throttling
const requestQueue = [];
let isProcessingQueue = false;

// Circuit breaker to stop requests if too many errors occur
let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 3;
let circuitBreakerOpen = false;
let lastErrorTime = 0;
const CIRCUIT_BREAKER_RESET_TIME = 300000; // 5 minutes

export const reverseGeocodeWithRateLimit = async (lat, lon) => {
  // Check circuit breaker
  if (circuitBreakerOpen) {
    const now = Date.now();
    if (now - lastErrorTime < CIRCUIT_BREAKER_RESET_TIME) {
      console.warn("[Geocoding] Circuit breaker open, rejecting request");
      return null;
    } else {
      // Reset circuit breaker
      console.log("[Geocoding] Resetting circuit breaker");
      circuitBreakerOpen = false;
      consecutiveErrors = 0;
    }
  }

  // Create cache key first to check if we already have this result
  const precision = 4;
  const cacheKey = `${lat.toFixed(precision)},${lon.toFixed(precision)}`;

  // Check cache first - if we have it, return immediately
  if (geocodingCache.has(cacheKey)) {
    console.log("[Geocoding] Cache hit for:", cacheKey);
    return geocodingCache.get(cacheKey);
  }

  // Add to centralized queue and wait for result
  return new Promise((resolve, reject) => {
    // Add timeout to prevent hanging promises
    const timeoutId = setTimeout(() => {
      reject(new Error("Geocoding request timeout"));
    }, 30000); // 30 second timeout

    const wrappedResolve = (result) => {
      clearTimeout(timeoutId);
      resolve(result);
    };

    const wrappedReject = (error) => {
      clearTimeout(timeoutId);
      reject(error);
    };

    // Check if this request is already queued
    const existingRequest = requestQueue.find(
      (req) => req.cacheKey === cacheKey
    );
    if (existingRequest) {
      console.log("[Geocoding] Request already queued for:", cacheKey);
      existingRequest.callbacks.push({
        resolve: wrappedResolve,
        reject: wrappedReject,
      });
      return;
    }

    // Check queue size limit
    if (requestQueue.length >= MAX_QUEUE_SIZE) {
      console.warn(
        "[Geocoding] Queue size limit reached, rejecting request for:",
        cacheKey
      );
      wrappedReject(new Error("Geocoding queue is full"));
      return;
    }

    // Add new request to queue
    const request = {
      lat,
      lon,
      cacheKey,
      callbacks: [{ resolve: wrappedResolve, reject: wrappedReject }],
    };

    requestQueue.push(request);
    console.log(
      "[Geocoding] Added to queue:",
      cacheKey,
      "Queue length:",
      requestQueue.length
    );

    // Start processing queue if not already running
    if (!isProcessingQueue) {
      processRequestQueue().catch((error) => {
        console.error("[Geocoding] Error in queue processing:", error);
        isProcessingQueue = false; // Reset flag if processing fails
      });
    }
  });
};

async function processRequestQueue() {
  if (isProcessingQueue || requestQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;
  console.log(
    "[Geocoding] Starting queue processing, queue length:",
    requestQueue.length
  );

  let processedCount = 0;
  const maxProcessingAttempts = 50; // Prevent infinite loops

  while (requestQueue.length > 0 && processedCount < maxProcessingAttempts) {
    const request = requestQueue.shift();
    if (!request) break; // Safety check

    processedCount++;
    const { lat, lon, cacheKey, callbacks } = request;

    try {
      // Check cache again in case it was added while waiting
      if (geocodingCache.has(cacheKey)) {
        const result = geocodingCache.get(cacheKey);
        console.log("[Geocoding] Cache hit during processing:", cacheKey);
        callbacks.forEach((cb) => {
          try {
            cb.resolve(result);
          } catch (callbackError) {
            console.warn(
              "[Geocoding] Error in callback resolve:",
              callbackError
            );
          }
        });
        continue;
      }

      // Enforce rate limiting
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;

      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        console.log("[Geocoding] Rate limiting: waiting", waitTime, "ms");
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }

      console.log("[Geocoding] Making API request for:", cacheKey);
      lastRequestTime = Date.now();

      // Make the actual request with timeout
      const requestPromise = originalReverseGeocode(lat, lon);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 15000)
      );

      const result = await Promise.race([requestPromise, timeoutPromise]);

      // Reset error counter on success
      consecutiveErrors = 0;

      // Resolve all callbacks for this request
      callbacks.forEach((cb) => {
        try {
          cb.resolve(result);
        } catch (callbackError) {
          console.warn("[Geocoding] Error in callback resolve:", callbackError);
        }
      });
    } catch (error) {
      console.warn("[Geocoding] Error processing request:", error);

      // Increment error counter and check circuit breaker
      consecutiveErrors++;
      lastErrorTime = Date.now();

      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.error(
          "[Geocoding] Too many consecutive errors, opening circuit breaker"
        );
        circuitBreakerOpen = true;

        // Reject all remaining requests in queue
        while (requestQueue.length > 0) {
          const req = requestQueue.shift();
          req.callbacks.forEach((cb) => {
            try {
              cb.reject(new Error("Circuit breaker open"));
            } catch (callbackError) {
              console.warn(
                "[Geocoding] Error in callback reject:",
                callbackError
              );
            }
          });
        }
        break; // Exit the processing loop
      }

      callbacks.forEach((cb) => {
        try {
          cb.reject(error);
        } catch (callbackError) {
          console.warn("[Geocoding] Error in callback reject:", callbackError);
        }
      });
    }
  }

  if (processedCount >= maxProcessingAttempts) {
    console.warn(
      "[Geocoding] Maximum processing attempts reached, clearing remaining queue"
    );
    while (requestQueue.length > 0) {
      const req = requestQueue.shift();
      req.callbacks.forEach((cb) => {
        try {
          cb.reject(new Error("Processing limit reached"));
        } catch (callbackError) {
          console.warn("[Geocoding] Error in callback reject:", callbackError);
        }
      });
    }
  }

  isProcessingQueue = false;
  console.log(
    "[Geocoding] Queue processing complete, processed:",
    processedCount
  );
}

// Legacy function for backwards compatibility (not rate limited)
const legacyReverseGeocodeWithRateLimit = async (lat, lon) => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    // Wait for the remaining time
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();
  return originalReverseGeocode(lat, lon);
};

/**
 * Clear the geocoding cache (useful for testing or memory management)
 */
export const clearGeoccodingCache = () => {
  geocodingCache.clear();
};

/**
 * Get cache statistics
 */
export const getGeoccodingCacheStats = () => {
  return {
    size: geocodingCache.size,
    keys: Array.from(geocodingCache.keys()),
  };
};
