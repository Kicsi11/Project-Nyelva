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
const introPopup = L.popup({
  maxWidth: 350,
  closeOnClick: true,
  autoClose: true,
  closeButton: true,
  className: 'intro-popup'
})
  .setLatLng([20, 0]) // center of the map
  .setContent(`
    <div style="text-align:center; font-family: system-ui, sans-serif;">
      <h2>🌍 Welcome to Nyelva Map! 🌍</h2>
      <p>Here is a map for you to explore Earth's languages and speech varieties. Locations are based off the most dominantly spoken part or origin of the lect. Large diamonds show official languages, while smaller diamonds show dialects, creoles, and regional varieties!</p>
      <p><em>Explore the deep layers of linguistic varieties below.</em></p>
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
      filter: f => f.properties.kind === 'area',
      style: feature => ({
        color: '#666',
        weight: 0.8,
        fillColor: feature.properties.color || '#ccc',
        fillOpacity: 0.5
      }),
      onEachFeature: (feature, layer) => {
        // Fallback to old property structure if name isn't present in area features yet
        const lang = feature.properties.name || feature.properties.language;
        if (!areaLayersByLanguage[lang]) areaLayersByLanguage[lang] = [];
        areaLayersByLanguage[lang].push(layer);
      }
    }).addTo(map);

    // ===== POINTS (DYNAMIC DIAMONDS) =====
    L.geoJSON(data, {
      filter: f => f.properties.kind === 'point',
      pointToLayer: (feature, latlng) => {
        // 1. Assign pixel size using the official flag (Official = 30px, Unofficial = 18px)
        const size = feature.properties.is_official ? 30 : 18;
        
        // 2. Generate the SVG design using the custom family color
        const diamondSVG = `
          <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 12L12 22L22 12L12 2ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z" 
                  fill="${feature.properties.color || '#333'}" 
                  stroke="white" 
                  stroke-width="1.5"/>
          </svg>
        `;
        
        // 3. Render icon anchor calculated dynamically to stay centered
        return L.marker(latlng, {
          icon: L.divIcon({
            html: diamondSVG,
            className: '',
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
            popupAnchor: [0, -size / 2]
          })
        });
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties;
        const lang = props.name || props.language;

        // Area highlight interaction tracking
        layer.on('click', e => {
          L.DomEvent.stopPropagation(e); // prevent map click from firing

          // Reset all regional highlight polygon layouts
          Object.values(areaLayersByLanguage).flat().forEach(l =>
            l.setStyle({ fillOpacity: 0.5, color: '#666' })
          );

          // Highlight corresponding polygon territory overlay matching this lect
          if (lang && areaLayersByLanguage[lang]) {
            areaLayersByLanguage[lang].forEach(l =>
              l.setStyle({ fillOpacity: 0.8, color: '#333' })
            );
          }
        });

        // 4. Build custom formatted data popup table layout
        const popupHTML = `
          <div style="font-family: system-ui, sans-serif; padding: 4px; min-width: 180px;">
            <h3 style="margin: 0 0 2px 0; color: ${props.color || '#2c3e50'};">${lang || 'Unknown Lect'}</h3>
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
  .catch(err => console.error(err));
