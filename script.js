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

// ===== INTRODUCTION POPUP =====
L.popup({
  maxWidth: 350,
  closeOnClick: true,
  autoClose: true,
  closeButton: true,
  className: 'intro-popup'
})
  .setLatLng([20, 0])
  .setContent(`
    <div style="text-align:center; font-family: system-ui, sans-serif;">
      <h2>🌍 Welcome to Nyelva Map! 🌍</h2>
      <p>Locations are based off the most dominantly spoken part or origin of the lect. Large diamonds show official languages, while smaller diamonds show dialects and regional varieties!</p>
    </div>
  `)
  .openOn(map);

// Load GeoJSON
fetch('data/languages.geojson')
  .then(res => res.json())
  .then(data => {

    // ===== AREAS =====
    const areaLayersByLanguage = {};

    L.geoJSON(data, {
      filter: f => f && f.properties && f.properties.kind === 'area',
      style: feature => ({
        color: '#666',
        weight: 0.8,
        fillColor: feature.properties.color || '#ccc',
        fillOpacity: 0.5
      }),
      onEachFeature: (feature, layer) => {
        const lang = feature.properties.name || feature.properties.language || 'Unknown';
        if (!areaLayersByLanguage[lang]) areaLayersByLanguage[lang] = [];
        areaLayersByLanguage[lang].push(layer);
      }
    }).addTo(map);

    // ===== POINTS (REAL DIAMONDS RE-STYLED) =====
    L.geoJSON(data, {
      filter: f => f && f.properties && f.properties.kind === 'point',
      pointToLayer: (feature, latlng) => {
        const props = feature.properties || {};
        
        // Dynamic sizing safety check
        const size = props.is_official ? 28 : 16;
        const markerColor = props.color || '#333333'; // Default to dark grey if color is missing
        
        const diamondSVG = `
          <svg width="${size}" height="${size}" viewBox="0 0 24 24">
            <polygon
              points="12,0 24,12 12,24 0,12"
              fill="${markerColor}"
              stroke="white"
              stroke-width="2"
            />
          </svg>
        `;
        
        return L.marker(latlng, {
          icon: L.divIcon({
            html: diamondSVG,
            className: 'custom-diamond-icon',
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            popupAnchor: [0, -size / 2]
          })
        });
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties || {};
        const lang = props.name || props.language || 'Unknown Lect';

        layer.on('click', e => {
          L.DomEvent.stopPropagation(e);

          Object.values(areaLayersByLanguage).flat().forEach(l =>
            l.setStyle({ fillOpacity: 0.5, color: '#666' })
          );

          if (areaLayersByLanguage[lang]) {
            areaLayersByLanguage[lang].forEach(l =>
              l.setStyle({ fillOpacity: 0.8, color: '#333' })
            );
          }
        });

        const popupHTML = `
          <div style="font-family: system-ui, sans-serif; padding: 4px; min-width: 180px;">
            <h3 style="margin: 0 0 2px 0; color: ${props.color || '#2c3e50'};">${lang}</h3>
            <p style="margin: 0 0 12px 0; font-style: italic; color: #7f8c8d; font-size: 0.95rem;">${props.native_name || ''}</p>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-bottom: 12px;">
              <tr style="border-bottom: 1px solid #eee;"><td style="padding: 4px 0;"><b>Family</b></td><td style="text-align: right;">${props.family || 'Unclassified'}</td></tr>
              <tr style="border-bottom: 1px solid #eee;"><td style="padding: 4px 0;"><b>Branch</b></td><td style="text-align: right;">${props.branch || 'None'}</td></tr>
              <tr style="border-bottom: 1px solid #eee;"><td style="padding: 4px 0;"><b>Status</b></td><td style="text-align: right;"><span style="background: ${props.is_official ? '#d4edda' : '#e2e3e5'}; color: ${props.is_official ? '#155724' : '#383d41'}; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 0.75rem;">${props.is_official ? 'Official' : 'Regional'}</span></td></tr>
            </table>
            
            <a href="${props.wikipedia_link || '#'}" target="_blank" style="color: ${props.color || '#3498db'}; text-decoration: none; font-weight: bold; font-size: 0.85rem; display: block; text-align: right;">Wikipedia Article →</a>
          </div>
        `;
        
        layer.bindPopup(popupHTML);
      }
    }).addTo(map);

    // ===== CLICK MAP TO RESET =====
    map.on('click', () => {
      Object.values(areaLayersByLanguage).flat().forEach(l =>
        l.setStyle({ fillOpacity: 0.5, color: '#666' })
      );
    });

  })
  .catch(err => console.error("Map loading error: ", err));
