// Mock Google Maps API
const google = {
  maps: {
    Map: class {
      constructor(div, options) {
        this.div = div;
        this.options = options;
      }
      fitBounds() {}
      setCenter() {}
      setZoom() {}
    },
    Marker: class {
      constructor(options) {
        this.options = options;
      }
      setPosition() {}
      setMap() {}
    },
    LatLngBounds: class {
      constructor() {
        this.bounds = [];
      }
      extend() {
        return this;
      }
    },
    LatLng: class {
      constructor(lat, lng) {
        this.lat = lat;
        this.lng = lng;
      }
      lat() {
        return this.lat;
      }
      lng() {
        return this.lng;
      }
    },
    InfoWindow: class {
      constructor(options) {
        this.options = options;
      }
      open() {}
      close() {}
    },
    event: {
      addListener: () => {},
      removeListener: () => {}
    },
    DirectionsService: class {
      route(request, callback) {
        callback({
          status: 'OK',
          routes: [
            {
              overview_path: [],
              legs: [
                {
                  steps: [],
                  distance: { text: '10 km', value: 10000 },
                  duration: { text: '15 mins', value: 900 }
                }
              ]
            }
          ]
        });
      }
    },
    DirectionsRenderer: class {
      constructor(options) {
        this.options = options;
      }
      setDirections() {}
      setMap() {}
    },
    Polyline: class {
      constructor(options) {
        this.options = options;
      }
      setMap() {}
      getPath() {
        return [];
      }
    },
    MapTypeId: {
      ROADMAP: 'roadmap',
      SATELLITE: 'satellite',
      HYBRID: 'hybrid',
      TERRAIN: 'terrain'
    },
    Animation: {
      DROP: 'DROP',
      BOUNCE: 'BOUNCE'
    },
    places: {
      AutocompleteService: class {
        getPlacePredictions() {}
      },
      PlacesService: class {
        getDetails() {}
      }
    },
    Size: class {
      constructor(width, height) {
        this.width = width;
        this.height = height;
      }
    },
    Point: class {
      constructor(x, y) {
        this.x = x;
        this.y = y;
      }
    }
  }
};

// Define libraries as a property on maps
google.maps.Libraries = ['places', 'geometry', 'drawing', 'visualization'];

// Add to global scope
global.google = google;

// Use CommonJS export for Jest compatibility
module.exports = google;