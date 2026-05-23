// Set map bounds
const bounds = [[-90, -180], [90, 180]];
const map = L.map('map', {
  maxBounds: bounds,
  maxBoundsViscosity: 1.0,
  minZoom: 2
}).setView([20, 0], 2);

// Add vibrant, colorful base tiles (CartoDB Voyager)
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
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
        color: '#ffffff',             // Crisp white borders look incredible against Voyager tiles
        weight: 1.2,                  // Clean, modern boundary line thickness
        fillColor: feature.properties.color || '#ccc',
        fillOpacity: 0.4              // Richer base opacity so colors aren't washed out
      }),
      onEachFeature: (feature, layer) => {
        const lang = feature.properties.language;
        if (!areaLayersByLanguage[lang]) areaLayersByLanguage[lang] = [];
        areaLayersByLanguage[lang].push(layer);
      }
    }).addTo(map);

    // ===== POINTS (GLOSSY DYNAMIC DIAMONDS) =====
    L.geoJSON(data, {
      filter: f => f.properties.kind === 'point',
      pointToLayer: (feature, latlng) => {
        const sizeProp = feature.properties.size;
        
        let iconSize, iconAnchor, svgSize;

        // 3-Tier Hierarchy sizes (adjusted slightly to accommodate shadows cleanly)
        if (sizeProp === 'small') {
          iconSize = [10, 10];
          iconAnchor = [5, 5];
          svgSize = 14;
        } else if (sizeProp === 'medium') {
          iconSize = [14, 14];
          iconAnchor = [7, 7];
          svgSize = 18;
        } else {
          // Default Large
          iconSize = [18, 18];
          iconAnchor = [9, 9];
          svgSize = 22;
        }

        const pointColor = feature.properties.color || 'black';

        // High-end stylized SVG with embedded gradients and drop-shadows
        const diamondSVG = `
          <svg width="${svgSize}" height="${svgSize}" viewBox="0 0 24 24" style="filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.35));">
            <defs>
              <linearGradient id="grad-${pointColor.replace('#','')}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#ffffff; stop-opacity:0.35" />
                <stop offset="40%" style="stop-color:${pointColor}; stop-opacity:1" />
                <stop offset="100%" style="stop-color:#000000; stop-opacity:0.2" />
              </linearGradient>
            </defs>
            <polygon
              points="12,1 23,12 12,23 1,12"
              fill="${pointColor}"
            />
            <polygon
              points="12,1 23,12 12,23 1,12"
              fill="url(#grad-${pointColor.replace('#','')})"
              stroke="#ffffff"
              stroke-width="1.8"
              stroke-linejoin="round"
            />
          </svg>
        `;

        return L.marker(latlng, {
          icon: L.divIcon({
            html: diamondSVG,
            className: 'custom-diamond-marker', // targetable class name
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
            l.setStyle({ fillOpacity: 0.4, color: '#ffffff', weight: 1.2 })
          );

          // Highlight selected language area with maximum clarity
          (areaLayersByLanguage[lang] || []).forEach(l =>
            l.setStyle({ fillOpacity: 0.75, color: '#2c3e50', weight: 2.0 })
          );
        });

        const customUrl = feature.properties.wikipedia || `https://en.wikipedia.org/wiki/${lang.split('(')[0].trim()}_language`;
        const wikiLinkHTML = `<div style="margin-top: 10px;"><a href="${customUrl}" target="_blank" style="color: #3498db; text-decoration: none; font-weight: bold; font-size: 13px;">Wikipedia Article →</a></div>`;

        layer.bindPopup(
          `<strong>${lang}</strong><div style="color: #5a6c7d; font-size: 13px; line-height: 1.5; margin-top: 4px;">${feature.properties.description || ''}</div>${wikiLinkHTML}`
        );
      }
    }).addTo(map);

    // ===== CLICK MAP TO RESET =====
    map.on('click', () => {
      Object.values(areaLayersByLanguage).flat().forEach(l =>
        l.setStyle({ fillOpacity: 0.4, color: '#ffffff', weight: 1.2 })
      );
    });

  })
  .catch(err => console.error(err));


// ===== ABOUT PANEL TOGGLE LOGIC =====
const aboutBtn = document.getElementById('about-btn');
const aboutPanel = document.getElementById('about-panel');
const aboutCloseBtn = document.getElementById('about-close-btn');

aboutBtn.addEventListener('click', (e) => {
  L.DomEvent.stopPropagation(e);
  aboutPanel.classList.remove('hidden');
});

aboutCloseBtn.addEventListener('click', () => {
  aboutPanel.classList.add('hidden');
});

aboutPanel.addEventListener('click', (e) => {
  if (e.target === aboutPanel) {
    aboutPanel.classList.add('hidden');
  }
});