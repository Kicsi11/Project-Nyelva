fetch('data/languages.geojson')
  .then(res => res.json())
  .then(data => {

    let areaLayers = [];

    // ===== AREA LAYER =====
    const areaLayer = L.geoJSON(data, {
      filter: f => f.properties.kind === 'area',
      style: f => ({
        color: '#555',
        weight: 2,
        fillColor: f.properties.color,
        fillOpacity: 0.6
      }),
      onEachFeature: (feature, layer) => {
        areaLayers.push(layer);
        layer.language = feature.properties.language;
      }
    }).addTo(map);

    // ===== POINT / DIAMOND LAYER =====
    const pointLayer = L.geoJSON(data, {
      filter: f => f.properties.kind === 'point',
      pointToLayer: (feature, latlng) => {
        return L.marker(latlng, {
          icon: L.divIcon({
            className: 'diamond-marker',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          })
        });
      },
      onEachFeature: (feature, layer) => {

        layer.bindPopup(
          `<strong>${feature.properties.language}</strong><br>
           ${feature.properties.description || feature.properties.family}`
        );

        layer.on('click', () => {
          // reset all areas
          areaLayers.forEach(l => {
            l.setStyle({
              color: '#555',
              weight: 2,
              fillOpacity: 0.6
            });
          });

          // highlight matching area
          areaLayers.forEach(l => {
            if (l.language === feature.properties.language) {
              l.setStyle({
                color: '#000',
                weight: 4,
                fillOpacity: 0.85
              });
            }
          });
        });
      }
    }).addTo(map);

    // Optional: click map to reset highlight
    map.on('click', () => {
      areaLayers.forEach(l => {
        l.setStyle({
          color: '#555',
          weight: 2,
          fillOpacity: 0.6
        });
      });
    });

  });
