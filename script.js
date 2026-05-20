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
    <div style="text-align:center;">
      <h2>🌍 Welcome to Nyelva Map! 🌍</h2>
      <p>Here is a map for you to explore Earth's languages. Locations are based off the most dominantly spoken part or origin of the language. Also, dialects and languages don't have a clear division so this map isn't 100% accurate (so as almost every language map you see).</p>
      <p><em>So far there are 59 languages</em></p>
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
        const lang = feature.properties.language;
        if (!areaLayersByLanguage[lang]) areaLayersByLanguage[lang] = [];
        areaLayersByLanguage[lang].push(layer);
      }
    }).addTo(map);

    // ===== POINTS (DYNAMIC DIAMONDS & COLORS) =====
    L.geoJSON(data, {
      filter: f => f.properties.kind === 'point',
      pointToLayer: (feature, latlng) => {
        const isSmall = feature.properties.size === 'small';
        
        // Micro-adjusted dimensions (Big diamond size reduced by exactly 1)
        const iconSize = isSmall ? [7, 7] : [11, 11];
        const iconAnchor = isSmall ? [3.5, 3.5] : [5.5, 5.5];
        const svgSize = isSmall ? 11 : 17;

        // Reads 'color' from GeoJSON properties, defaults to 'black' if missing
        const pointColor = feature.properties.color || 'black';

        const diamondSVG = `
          <svg width="${svgSize}" height="${svgSize}" viewBox="0 0 24 24">
            <polygon
              points="12,0 24,12 12,24 0,12"
              fill="${pointColor}"
              stroke="white"
              stroke-width="2"
            />
          </svg>
        `;

        return L.marker(latlng, {
          icon: L.divIcon({
            html: diamondSVG,
            className: '',
            iconSize: iconSize,
            iconAnchor: iconAnchor
          })
        });
      },
      onEachFeature: (feature, layer) => {
        const lang = feature.properties.language;

        layer.on('click', e => {
          L.DomEvent.stopPropagation(e); // prevent map click from firing

          // Reset all areas
          Object.values(areaLayersByLanguage).flat().forEach(l =>
            l.setStyle({ fillOpacity: 0.5, color: '#666' })
          );

          // Highlight only this language
          (areaLayersByLanguage[lang] || []).forEach(l =>
            l.setStyle({ fillOpacity: 0.8, color: '#333' })
          );
        });

        // Option 2 Integration: Custom fallback system for Wikipedia links
        const customUrl = feature.properties.wikipedia || `https://en.wikipedia.org/wiki/${lang.split('(')[0].trim()}_language`;
        const wikiLinkHTML = `<br><br><a href="${customUrl}" target="_blank" style="color: #3498db; text-decoration: none; font-weight: bold;">Wikipedia Article →</a>`;

        layer.bindPopup(
          `<strong>${lang}</strong><br>${feature.properties.description || ''}${wikiLinkHTML}`
        );
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
