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

// ===== INTRODUCTION POPUP (SCALED UP EDITION) =====
const introPopup = L.popup({
  closeOnClick: true,
  autoClose: true,
  closeButton: true,
  className: 'intro-popup',
  minWidth: 320,   // Prevents layout squishing
  maxWidth: 420    // Broadens the landscape on desktop
})
  .setLatLng([20, 0]) // center of the map
  .setContent(`
    <div style="text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #2c3e50; padding: 12px 14px;">
      <h2 style="margin-top: 0; margin-bottom: 10px; font-size: 18px; color: #1a252f; font-weight: 700;">🌍 Welcome to Nyelva Map!</h2>
      <p style="font-size: 13px; line-height: 1.5; color: #5a6c7d; margin-bottom: 14px;">
        Explore Earth's languages based on core origins and regional dominance. 
        Discover any language's ancestry, total speaker count, and real-time status at a single glance.
      </p>
      <div style="display: inline-block; background: #eef2f5; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 600; color: #7f8c8d;">
        🎯 Currently Cataloging 6 Lects
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
        color: '#ffffff',              // Crisp white borders stand out against Voyager tiles
        weight: 1.2,                   // Clean, modern boundary line thickness
        fillColor: feature.properties.color || '#ccc',
        fillOpacity: 0.4               // Richer base opacity so colors aren't washed out
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

        // 3-Tier Hierarchy sizes (adjusted to give the wrapper a steady bounding box)
        if (sizeProp === 'small') {
          iconSize = [16, 16];
          iconAnchor = [8, 8];
          svgSize = 14;
        } else if (sizeProp === 'medium') {
          iconSize = [20, 20];
          iconAnchor = [10, 10];
          svgSize = 18;
        } else {
          // Default Large
          iconSize = [24, 24];
          iconAnchor = [12, 12];
          svgSize = 22;
        }

        const pointColor = feature.properties.color || 'black';

        // High-end stylized SVG inside a protective, steady wrapper div to eliminate hover jittering
        const diamondSVG = `
          <div class="diamond-wrapper" style="width: ${iconSize[0]}px; height: ${iconSize[1]}px;">
            <svg width="${svgSize}" height="${svgSize}" viewBox="0 0 24 24" style="filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.35));">
              <defs>
                <linearGradient id="grad-${pointColor.replace('#','')}" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#ffffff; stop-opacity:0.35" />
                  <stop offset="40%" style="stop-color:${pointColor}; stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#000000; stop-opacity:0.2" />
                </linearGradient>
              </defs>
              <polygon points="12,1 23,12 12,23 1,12" fill="${pointColor}" />
              <polygon
                points="12,1 23,12 12,23 1,12"
                fill="url(#grad-${pointColor.replace('#','')})"
                stroke="#ffffff"
                stroke-width="1.8"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        `;

        return L.marker(latlng, {
          icon: L.divIcon({
            html: diamondSVG,
            className: 'custom-diamond-marker', // Target class for Leaflet
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

        // Wikipedia Custom/Fallback integration 
        const customUrl = feature.properties.wikipedia || `https://en.wikipedia.org/wiki/${lang.split('(')[0].trim()}_language`;
        
        // Compact layout styling with tight matching fonts
        const wikiLinkHTML = `<div style="margin-top: 6px;"><a href="${customUrl}" target="_blank" style="color: #3498db; text-decoration: none; font-weight: bold; font-size: 11px;">Wikipedia Article →</a></div>`;

        // Removed the hardcoded maxWidth options constraint so the element behaves normally
        layer.bindPopup(
          `<strong style="font-size: 13px; line-height: 1.2; margin-bottom: 2px;">${lang}</strong><div style="color: #5a6c7d; font-size: 11px; line-height: 1.35;">${feature.properties.description || ''}</div>${wikiLinkHTML}`
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
