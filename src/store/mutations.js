import * as types from "@/store/mutation-types";

export default {
  [types.SET_IS_LOADING](state, isLoading) {
    state.isLoading = isLoading;
  },
  [types.SET_RECORDER_VERSION](state, version) {
    state.recorderVersion = version;
  },
  [types.SET_USERS](state, users) {
    state.users = users;
  },
  [types.SET_DEVICES](state, devices) {
    state.devices = devices;
  },
  [types.SET_LAST_LOCATIONS](state, lastLocations) {
    state.lastLocations = lastLocations;
  },
  [types.SET_LOCATION_HISTORY](state, locationHistory) {
    state.locationHistory = locationHistory;
  },
  [types.SET_SELECTED_USER](state, selectedUser) {
    state.selectedUser = selectedUser;
  },
  [types.SET_SELECTED_DEVICE](state, selectedDevice) {
    state.selectedDevice = selectedDevice;
  },
  [types.SET_START_DATE_TIME](state, startDateTime) {
    state.startDateTime = startDateTime;
  },
  [types.SET_END_DATE_TIME](state, endDateTime) {
    state.endDateTime = endDateTime;
  },
  [types.SET_MAP_CENTER](state, center) {
    state.map.center = center;
  },
  [types.SET_MAP_ZOOM](state, zoom) {
    state.map.zoom = zoom;
  },
  [types.SET_MAP_LAYER_VISIBILITY](state, { layer, visibility }) {
    state.map.layers[layer] = visibility;
  },
  [types.SET_DISTANCE_TRAVELLED](state, distanceTravelled) {
    state.distanceTravelled = distanceTravelled;
  },
  [types.SET_ELEVATION_GAIN](state, elevationGain) {
    state.elevationGain = elevationGain;
  },
  [types.SET_ELEVATION_LOSS](state, elevationLoss) {
    state.elevationLoss = elevationLoss;
  },
  [types.SET_REQUEST_ABORT_CONTROLLER](state, requestAbortController) {
    state.requestAbortController = requestAbortController;
  },
  [types.SET_CLUSTERING_ENABLED](state, enabled) {
    state.clustering.enabled = enabled;
  },
  [types.SET_CLUSTER_RADIUS](state, radius) {
    state.clustering.clusterRadius = radius;
  },
  [types.SET_MIN_VISIT_CLUSTER_SIZE](state, size) {
    state.clustering.minVisitClusterSize = size;
  },
  [types.SET_MIN_TRAVEL_CLUSTER_SIZE](state, size) {
    state.clustering.minTravelClusterSize = size;
  },
};
