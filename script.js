// Set map bounds
const bounds = [[-90, -180], [90, 180]];
const map = L.map('map', {
  maxBounds: bounds,
  maxBoundsViscosity: 1.0,
  minZoom: 2
}).setView([20, 0], 2);

// Add base tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

// Load GeoJSON
fetch('data/languages.geojson')
  .then(res => res.json())
  .then(data => {

    // 1️⃣ Areas (non-clickable)
    L.geoJSON(data, {
      style: feature => {
        if (feature.properties.kind === 'area') {
          return {
            color: '#444',
            weight: 2,
            fillOpacity: 0.5
          };
        }
      },
      filter: feature => feature.properties.kind === 'area'
    }).addTo(map);

    // 2️⃣ Points (black diamonds, clickable)
    L.geoJSON(data, {
   // POINT / DIAMOND LAYER
L.geoJSON(data, {
  filter: f => f.properties.kind === 'point',
  pointToLayer: (feature, latlng) => {
    const diamondSVG = `
      <svg width="28" height="28" viewBox="0 0 24 24">
        <polygon
          points="12,0 24,12 12,24 0,12"
          fill="black"
          stroke="white"
          stroke-width="2"
        />
      </svg>
    `;

    return L.marker(latlng, {
      icon: L.divIcon({
        html: diamondSVG,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      })
    });
  },
  onEachFeature: (feature, layer) => {
    layer.bindPopup(
      `<strong>${feature.properties.language}</strong><br>${feature.properties.description || ''}`
    );
  }
}).addTo(map);
          });
        }
      },
      onEachFeature: (feature, layer) => {
        if (feature.properties.kind === 'point') {
          layer.bindPopup(
            `<strong>${feature.properties.language}</strong><br>${feature.properties.description || feature.properties.family}`
          );
        }
      },
      filter: feature => feature.properties.kind === 'point'
    }).addTo(map);
  });
