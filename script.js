// ===== POINTS (REAL DIAMONDS RE-STYLED) =====
    L.geoJSON(data, {
      filter: f => f.properties.kind === 'point',
      pointToLayer: (feature, latlng) => {
        // 1. Assign pixel size based on official flag (Official = 28px, Regional = 16px)
        // Adjusted slightly to match the original layout proportions beautifully
        const size = feature.properties.is_official ? 28 : 16;
        
        // 2. Generate the traditional sharp diamond using your custom family color
        const diamondSVG = `
          <svg width="${size}" height="${size}" viewBox="0 0 24 24">
            <polygon
              points="12,0 24,12 12,24 0,12"
              fill="${feature.properties.color || '#333'}"
              stroke="white"
              stroke-width="2"
            />
          </svg>
        `;
        
        // 3. Render icon anchor calculated dynamically to stay perfectly centered
        return L.marker(latlng, {
          icon: L.divIcon({
            html: diamondSVG,
            className: 'custom-diamond-icon', // Keeps the transparent box fix active
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

        // 4. Custom formatted data popup table layout
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
