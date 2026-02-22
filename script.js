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

    // ===== AREAS =====
    L.geoJSON(data, {
      filter: feature => feature.properties.kind === 'area',
      style: feature => ({
        color: '#666',
        weight: 0.8,
        fillColor: feature.properties.color || '#ccc',
        fillOpacity: 0.5
      })
    }).addTo(map);

    // ===== POINTS (REAL DIAMONDS) =====
    L.geoJSON(data, {
      filter: feature => feature.properties.kind === 'point',
      pointToLayer: (feature, latlng) => {

        const diamondSVG = `
          <svg width="18" height="18" viewBox="0 0 24 24">
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
            iconSize: [18, 18],
            iconAnchor: [9, 9]
          })
        });
      },
      onEachFeature: (feature, layer) => {
        layer.bindPopup(
          `<strong>${feature.properties.language}</strong><br>${feature.properties.description || ''}`
        );
      }
    }).addTo(map);

  })
  .catch(err => console.error(err));
