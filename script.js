// Set map bounds
const bounds = [[-90, -180], [90, 180]];
const map = L.map('map', {
  maxBounds: bounds,
  maxBoundsViscosity: 1.0,
  minZoom: 2
}).setView([20, 0], 2);

// Add modern minimal base tiles (CartoDB Positron)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
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
    <div style="text-align: center; font-family: -apple-system, sans-serif; color: #2c3e50; padding: 10px;">
      <h2 style="margin-top: 0; margin-bottom: 10px; font-size: 20px; color: #1a252f;">🌍 Welcome to Nyelva Map!</h2>
      <p style="font-size: 13px; line-height: 1.6; color: #5a6c7d; margin-bottom: 0;">
        Explore Earth's languages based on core origins and regional dominance. 
        Linguistic boundaries are naturally fluid and historical—dive in to discover relationships across families.
      </p>
      <div style="margin-top: 14px; display: inline-block; background: #eef2f5; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; color: #7f8c8d;">
        🎯 Currently Cataloging 59 Languages
      </div>
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
        color: feature.properties.color || '#95a5a6', // Soft color boundary matching the family color
        weight: 0.6,                                  // Clean, thin border
        fillColor: feature.properties.color || '#ccc',
        fillOpacity: 0.25                             // Softer base opacity so background map breathes
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
        const sizeProp = feature.properties.size;
        
        let iconSize, iconAnchor, svgSize;

        // 3-Tier Hierarchy sizes
        if (sizeProp === 'small') {
          iconSize = [7, 7];
          iconAnchor = [3.5, 3.5];
          svgSize = 11;
        } else if (sizeProp === 'medium') {
          iconSize = [9, 9];
          iconAnchor = [4.5, 4.5];
          svgSize = 14;
        } else {
          // Default Large (Using your precisely adjusted 11x11 scale)
          iconSize = [11, 11];
          iconAnchor = [5.5, 5.5];
          svgSize = 17;
        }

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
          L.DomEvent.stopPropagation(e);

          // Reset all areas
          Object.values(areaLayersByLanguage).flat().forEach(l =>
            l.setStyle({ fillOpacity: 0.25, color: '#95a5a6' })
          );

          // Highlight only this language
          (areaLayersByLanguage[lang] || []).forEach(l =>
            l.setStyle({ fillOpacity: 0.7, color: '#2c3e50' })
          );
        });

        // Wikipedia Custom/Fallback integration 
        const customUrl = feature.properties.wikipedia || `https://en.wikipedia.org/wiki/${lang.split('(')[0].trim()}_language`;
        
        // Compact tight styling layout with no <br><br> drop
        const wikiLinkHTML = `<div style="margin-top: 10px;"><a href="${customUrl}" target="_blank" style="color: #3498db; text-decoration: none; font-weight: bold; font-size: 13px;">Wikipedia Article →</a></div>`;

        layer.bindPopup(
          `<strong>${lang}</strong><div style="color: #5a6c7d; font-size: 13px; line-height: 1.5; margin-top: 4px;">${feature.properties.description || ''}</div>${wikiLinkHTML}`
        );
      }
    }).addTo(map);

    // ===== CLICK MAP TO RESET =====
    map.on('click', () => {
      Object.values(areaLayersByLanguage).flat().forEach(l =>
        l.setStyle({ fillOpacity: 0.25, color: '#95a5a6' })
      );
    });

  })
  .catch(err => console.error(err));


// ===== ABOUT PANEL TOGGLE LOGIC =====
const aboutBtn = document.getElementById('about-btn');
const aboutPanel = document.getElementById('about-panel');
const aboutCloseBtn = document.getElementById('about-close-btn');

// Open the panel and stop click propagation to prevent underlying map triggers
aboutBtn.addEventListener('click', (e) => {
  L.DomEvent.stopPropagation(e);
  aboutPanel.classList.remove('hidden');
});

// Close the panel using the cross button
aboutCloseBtn.addEventListener('click', () => {
  aboutPanel.classList.add('hidden');
});

// Close the panel safely if the user clicks anywhere on the dark backdrop blur
aboutPanel.addEventListener('click', (e) => {
  if (e.target === aboutPanel) {
    aboutPanel.classList.add('hidden');
  }
});
