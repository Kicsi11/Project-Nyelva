// Initialize the map
const bounds = [[-90, -180], [90, 180]];
const map = L.map('map', {
  maxBounds: bounds,
  maxBoundsViscosity: 1.0,
  minZoom: 2
});

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

// Load language data
fetch('data/languages.geojson')
  .then(res => res.json())
  .then(data => {

    let areaLayers = [];

    // Draw areas
    const areaLayerGroup = L.geoJSON(data, {
      filter: f => f.properties.kind === 'area',
      style: f => ({
        color: '#333',
        weight: 2,
        fillColor: f.properties.color,
        fillOpacity: 0.5
      }),
      onEachFeature: (feature, layer) => {
        layer.language = feature.properties.language;
        areaLayers.push(layer);
      }
    }).addTo(map);

    // Auto-zoom to all areas
    map.fitBounds(areaLayerGroup.getBounds());

    // Draw diamond points
    L.geoJSON(data, {
      filter: f => f.properties.kind === 'point',
      pointToLayer: (feature, latlng) =>
        L.marker(latlng, {
          icon: L.divIcon({
            html: '<div class="diamond"></div>',
            className: '',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          })
        }),
      onEachFeature: (feature, layer) => {
        layer.bindPopup(`<strong>${feature.properties.language}</strong><br>${feature.properties.description || ''}`);

        layer.on('click', () => {
          // Reset all areas
          areaLayers.forEach(a => a.setStyle({ color: '#333', weight: 2, fillOpacity: 0.5 }));

          // Highlight the clicked area
          areaLayers.forEach(a => {
            if (a.language === feature.properties.language) {
              a.setStyle({ color: '#000', weight: 4, fillOpacity: 0.8 });
            }
          });
        });
      }
    }).addTo(map);

  })
  .catch(err => console.error(err));
