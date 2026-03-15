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

// --- CONFIGURATION DES FONDS DE CARTE ---
// voir au début du code script

// On garde l'OSM par défaut au démarrage
baseLayers.osm.addTo(map);

/**
 * Change la couche de fond de la carte
 * @param {string} type - Clé correspondant à l'objet baseLayers (osm, satellite, bathy, etc.)
 */
function changeMapBase(type) {
    // 1. Nettoyage : Retirer toutes les couches de base actives
    // On boucle sur l'objet baseLayers pour tout nettoyer proprement
    Object.values(baseLayers).forEach(layer => {
        if (map.hasLayer(layer)) map.removeLayer(layer);
    });
    
    // 2. Activation : Ajouter la nouvelle couche sélectionnée
    // Cela ajoute le "pack" (Fond + Balisage) défini dans ton objet baseLayers
    if (baseLayers[type]) {
        baseLayers[type].addTo(map);
    }
    
    // 3. Superposition : Ramener les éléments de calcul au-dessus
    // Note : bringToFront() fonctionne sur les lignes et cercles, pas sur les marqueurs
    
    // La ligne de dérive (Drift Line)
    if (typeof driftLine !== 'undefined' && driftLine && map.hasLayer(driftLine)) {
        driftLine.bringToFront();
    }
    
    // Le cercle de rayon d'action (Range Circle)
    if (typeof rangeCircle !== 'undefined' && rangeCircle && map.hasLayer(rangeCircle)) {
        rangeCircle.bringToFront();
    }
    
    // Les cercles de probabilité ou zones de recherche
    if (typeof searchArea !== 'undefined' && searchArea && map.hasLayer(searchArea)) {
        searchArea.bringToFront();
    }

    // Gestion de l'AIS si la case est cochée
    if (document.getElementById('toggle-ais') && document.getElementById('toggle-ais').checked) {
        if (typeof aisLayer !== 'undefined' && aisLayer) {
            aisLayer.addTo(map); // On s'assure qu'elle est ajoutée après le fond
        }
    }
}
