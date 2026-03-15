async function loadBeachData() {
    try {
        const response = await fetch('data/postes_plages.json');
        const data = await response.json();

        data.postes.forEach(poste => {
            // 1. Création du Marqueur (Le Poste)
            const marker = L.marker(poste.coords, {
                icon: L.divIcon({
                    className: 'beach-icon',
                    html: '<i class="fas fa-life-ring"></i>',
                    iconSize: [24, 24]
                })
            }).addTo(beachLayer);

            marker.bindPopup(`<b>${poste.plage}</b><br>Infrastructure: ${poste.infrastructure.type}`);

            // 2. Création de la Zone de Bain (Le Polygone)
            if (poste.zone_bain && poste.zone_bain.coordinates) {
                L.polygon(poste.zone_bain.coordinates, {
                    color: poste.zone_bain.couleur || '#3b82f6',
                    weight: 2,
                    fillOpacity: 0.3
                }).addTo(beachLayer);
            }
        });

    } catch (e) {
        console.error("Erreur lors du chargement des postes :", e);
    }
}
