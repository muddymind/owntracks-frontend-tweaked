<template>
  <LPopup :options="options" @l-popupopen="onPopupOpen">
    <div class="device">{{ deviceName }}</div>
    <div class="wrapper">
      <img
        v-if="face"
        :src="faceImageDataURI"
        :alt="$t('Image of {deviceName}', { deviceName })"
        :title="$t('Image of {deviceName}', { deviceName })"
        class="face"
      />
      <ul class="info-list">
        <li :title="$t('Timestamp')">
          <ClockIcon size="1x" aria-hidden="true" role="img" />
          {{ new Date(timestamp * 1000).toLocaleString($config.locale) }}
          <span v-if="isoLocal && timeZone">
            <br />
            <code style="font-size: 0.7rem">
              {{ isoLocal }}[{{ timeZone }}]
            </code>
          </span>
        </li>
        <li :title="$t('Location')">
          <MapPinIcon size="1x" aria-hidden="true" role="img" />
          {{ lat }}
          <br />
          {{ lon }}
          <br />
          {{ alt }}m
        </li>
        <li v-if="address || geocodedAddress || isGeocodingAddress" :title="$t('Address')">
          <HomeIcon size="1x" aria-hidden="true" role="img" />
          <span v-if="address">{{ address }}</span>
          <span v-else-if="geocodedAddress">{{ geocodedAddress }}</span>
          <span v-else-if="isGeocodingAddress">{{ $t('Loading...') }}</span>
        </li>
        <li v-if="typeof battery === 'number'" :title="$t('Battery')">
          <BatteryIcon size="1x" aria-hidden="true" role="img" />
          {{ battery }} %
        </li>
        <li v-if="typeof speed === 'number'" :title="$t('Speed')">
          <ZapIcon size="1x" aria-hidden="true" role="img" />
          {{ speed }} km/h
        </li>
        <li v-if="wifi.ssid" :title="$t('WiFi')">
          <WifiIcon size="1x" aria-hidden="true" role="img" />
          {{ wifi.ssid }}
          <span v-if="wifi.bssid">({{ wifi.bssid }})</span>
        </li>
        <li v-if="nodeEventType" :title="$t('Event Type')">
          <TagIcon size="1x" aria-hidden="true" role="img" />
          {{ nodeEventType === 'visit' ? $t('Visit') : $t('Trip') }} #{{ nodeEventId }}
        </li>
        <li v-if="nodeEventStart && nodeEventEnd" :title="$t('Event Duration')">
          <ClockIcon size="1x" aria-hidden="true" role="img" />
          {{ new Date(nodeEventStart * 1000).toLocaleTimeString($config.locale) }} - 
          {{ new Date(nodeEventEnd * 1000).toLocaleTimeString($config.locale) }}
          <br />
          <small>{{ formatDuration(nodeEventEnd - nodeEventStart) }}</small>
        </li>
      </ul>
    </div>
    <div v-if="regions.length" class="regions">
      {{ $t("Regions:") }}
      {{ regions.join(", ") }}
    </div>
  </LPopup>
</template>

<script>
import {
  BatteryIcon,
  ClockIcon,
  HomeIcon,
  MapPinIcon,
  TagIcon,
  WifiIcon,
  ZapIcon,
} from "vue-feather-icons";
import { LPopup } from "vue2-leaflet";
import { reverseGeocodeWithRateLimit } from "@/geocoding";

export default {
  name: "LDeviceLocationPopup",
  components: {
    BatteryIcon,
    ClockIcon,
    HomeIcon,
    MapPinIcon,
    TagIcon,
    WifiIcon,
    ZapIcon,
    LPopup,
  },
  data() {
    return {
      geocodedAddress: null,
      isGeocodingAddress: false,
    };
  },
  props: {
    user: {
      type: String,
      default: "",
    },
    device: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      default: "",
    },
    face: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Number,
      default: 0,
    },
    isoLocal: {
      type: String,
      default: "",
    },
    timeZone: {
      type: String,
      default: "",
    },
    lat: {
      type: Number,
      default: 0,
    },
    lon: {
      type: Number,
      default: 0,
    },
    alt: {
      type: Number,
      default: 0,
    },
    address: {
      type: String,
      default: null,
    },
    battery: {
      type: Number,
      default: null,
    },
    speed: {
      type: Number,
      default: null,
    },
    regions: {
      type: Array,
      default: () => [],
    },
    wifi: {
      type: Object,
      default: () => {},
    },
    options: {
      type: Object,
      default: () => {},
    },
    nodeEventType: {
      type: String,
      default: null,
    },
    nodeEventId: {
      type: Number,
      default: null,
    },
    nodeEventStart: {
      type: Number,
      default: null,
    },
    nodeEventEnd: {
      type: Number,
      default: null,
    },
  },
  computed: {
    /**
     * Return the face image as a data URI string which can be used for an
     * image's src attribute.
     *
     * @returns {String} base64-encoded face image data URI
     */
    faceImageDataURI() {
      return `data:image/png;base64,${this.face}`;
    },
    /**
     * Return the device name for displaying with <user identifier>/<device
     * identifier> as fallback.
     *
     * @returns {String} device name for displaying
     */
    deviceName() {
      return this.name ? this.name : `${this.user}/${this.device}`;
    },
  },
  methods: {
    /**
     * Format duration in seconds to human readable format
     * @param {number} seconds - Duration in seconds
     * @returns {string} Formatted duration
     */
    formatDuration(seconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      
      if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
      } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
      } else {
        return `${secs}s`;
      }
    },
    
    /**
     * Handle popup open event - trigger geocoding when popup is actually opened
     */
    onPopupOpen() {
      console.log('[Popup] Popup opened, checking geocoding conditions:', {
        address: this.address,
        geocodedAddress: this.geocodedAddress,
        lat: this.lat,
        lon: this.lon,
        isGeocodingAddress: this.isGeocodingAddress
      });
      
      // Only geocode if no address is provided and we haven't geocoded yet
      if (!this.address && !this.geocodedAddress && this.lat && this.lon && !this.isGeocodingAddress) {
        console.log('[Popup] Starting geocoding...');
        this.geocodeLocation();
      } else {
        console.log('[Popup] Skipping geocoding - conditions not met');
      }
    },
    
    /**
     * Geocode the current location to get a human-readable address
     */
    async geocodeLocation() {
      if (this.isGeocodingAddress || !this.lat || !this.lon) {
        return;
      }
      
      console.log('[Popup] Geocoding:', this.lat, this.lon);
      this.isGeocodingAddress = true;
      
      try {
        const geocodedName = await reverseGeocodeWithRateLimit(this.lat, this.lon);
        if (geocodedName) {
          this.geocodedAddress = geocodedName;
          console.log('[Popup] Geocoded to:', geocodedName);
        }
      } catch (error) {
        console.warn('[Popup] Geocoding error:', error.message);
      } finally {
        this.isGeocodingAddress = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.device {
  display: inline-block;
  position: relative;
  top: -5px;
  color: var(--color-primary);
  font-weight: bold;
}
.wrapper {
  display: flex;
  margin-top: 10px;

  img {
    align-self: start;
    margin-right: 20px;
  }
}
.regions {
  border-top: 1px solid var(--color-separator);
  margin-top: 15px;
  padding-top: 15px;
}
</style>
