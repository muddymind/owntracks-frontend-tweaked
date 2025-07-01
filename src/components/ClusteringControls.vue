<template>
  <div class="nav-item clustering-controls">
    <div class="clustering-icon">
      <SettingsIcon size="1x" aria-hidden="true" role="img" />
    </div>
    <DropdownButton
      :label="$t('Clustering')"
      :title="$t('Configure location clustering')"
      class="clustering-dropdown"
    >
      <div class="clustering-panel">
        <!-- Enable/Disable Toggle -->
        <div class="control-group">
          <label class="toggle-label">
            <input
              type="checkbox"
              :checked="clustering.enabled"
              @change="setClusteringEnabled($event.target.checked)"
            />
            {{ $t("Enable clustering") }}
          </label>
        </div>

        <!-- Cluster Parameters (only show when enabled) -->
        <template v-if="clustering.enabled">
          <div class="control-group">
            <label class="slider-label">
              {{ $t("Cluster radius") }}: {{ clustering.clusterRadius }}m
            </label>
            <input
              type="range"
              min="5"
              max="20"
              step="1"
              :value="clustering.clusterRadius"
              @input="setClusterRadius(parseInt($event.target.value))"
              class="slider"
            />
            <div class="slider-info">5m – 30m</div>
          </div>

          <div class="control-group">
            <label class="slider-label">
              {{ $t("Min visit size") }}: {{ clustering.minVisitClusterSize }}
            </label>
            <input
              type="range"
              min="2"
              max="15"
              step="1"
              :value="clustering.minVisitClusterSize"
              @input="setMinVisitClusterSize(parseInt($event.target.value))"
              class="slider"
            />
            <div class="slider-info">2 – 15 points</div>
          </div>

          <div class="control-group">
            <label class="slider-label">
              {{ $t("Min travel size") }}: {{ clustering.minTravelClusterSize }}
            </label>
            <input
              type="range"
              min="2"
              max="15"
              step="1"
              :value="clustering.minTravelClusterSize"
              @input="setMinTravelClusterSize(parseInt($event.target.value))"
              class="slider"
            />
            <div class="slider-info">2 – 15 points</div>
          </div>
        </template>
      </div>
    </DropdownButton>
  </div>
</template>

<script>
import { mapActions, mapState } from "vuex";
import { SettingsIcon } from "vue-feather-icons";
import DropdownButton from "@/components/DropdownButton.vue";

export default {
  name: "ClusteringControls",
  components: {
    SettingsIcon,
    DropdownButton,
  },
  computed: {
    ...mapState(["clustering"]),
  },
  methods: {
    ...mapActions([
      "setClusteringEnabled",
      "setClusterRadius", 
      "setMinVisitClusterSize",
      "setMinTravelClusterSize",
    ]),
  },
};
</script>

<style lang="scss" scoped>
.clustering-controls {
  .clustering-icon {
    display: inline-block;
    margin-right: 0.5rem;
  }

  .clustering-dropdown {
    min-width: 200px;
  }
}

.clustering-panel {
  padding: 1rem;
  min-width: 280px;
  max-width: 320px;

  .control-group {
    margin-bottom: 1rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .toggle-label {
    display: flex;
    align-items: center;
    cursor: pointer;
    font-weight: 500;

    input[type="checkbox"] {
      margin-right: 0.5rem;
    }
  }

  .slider-label {
    display: block;
    font-weight: 500;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }

  .slider {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: #ddd;
    outline: none;
    appearance: none;
    margin-bottom: 0.25rem;

    &::-webkit-slider-thumb {
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--color-primary, #007bff);
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    &::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--color-primary, #007bff);
      cursor: pointer;
      border: none;
    }
  }

  .slider-info {
    font-size: 0.8rem;
    color: #666;
    text-align: center;
  }
}

// Mobile-specific styles
@media (max-width: 768px) {
  .clustering-panel {
    min-width: 260px;
    max-width: 280px;
    padding: 0.75rem;

    .slider-label {
      font-size: 0.85rem;
    }

    .slider {
      height: 8px; // Slightly thicker for mobile
      
      &::-webkit-slider-thumb {
        width: 20px;
        height: 20px; // Larger touch target for mobile
      }

      &::-moz-range-thumb {
        width: 20px;
        height: 20px;
      }
    }
  }
}
</style>
