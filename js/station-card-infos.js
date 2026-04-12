/**
 * STATION-CARD-INFO.JS
 * Gestion de l'affichage des détails des stations SNSM dans une card flottante.
 * Ce fichier est indépendant du moteur de rendu de la carte.
 */

/**
 * Remplit et affiche la card avec les données d'une station.
 * @param {Object} station - L'objet station provenant du JSON.
 */

function displayStationDetails(station) {
    // 1. Mise à jour des textes simples
    document.getElementById('card-station-nom').innerText = station.nom;
    document.getElementById('card-station-adresse').innerHTML = 
        `<i class="fas fa-map-marker-alt"></i> ${station.localisation.adresse || 'Adresse non renseignée'}`;
    
    // 2. Mise à jour des liens
    const phoneBtn = document.getElementById('card-phone');
    if (station.contact && station.contact.telephone) {
        phoneBtn.href = "tel:" + station.contact.telephone;
        phoneBtn.style.opacity = "1";
        phoneBtn.style.pointerEvents = "auto";
    } else {
        phoneBtn.style.opacity = "0.3";
        phoneBtn.style.pointerEvents = "none";
        phoneBtn.href = "#";
    }
    
    const webBtn = document.getElementById('card-web');
    webBtn.href = station.contact?.site_web || "#";

    // 3. Remplissage de la liste des bateaux
    const listContainer = document.getElementById('card-nautiques-list');
    listContainer.innerHTML = ""; 

    if (station.moyens && station.moyens.nautiques && station.moyens.nautiques.length > 0) {
        station.moyens.nautiques.forEach(boat => {
            const boatHtml = `
                <div class="boat-item-snsm">
                    <span class="boat-name">${boat.nom}</span>
                    <div class="boat-specs">
                        ${boat.type ? boat.type : ''} 
                        ${boat.caracteristiques?.longueur_m ? ' • ' + boat.caracteristiques.longueur_m + 'm' : ''}
                        ${boat.motorisation?.puissance_cv ? ' • ' + boat.motorisation.puissance_cv + ' CV' : ''}
                    </div>
                </div>
            `;
            listContainer.innerHTML += boatHtml;
        });
    } else {
        listContainer.innerHTML = "<p style='font-size:0.7rem; color:#64748b; font-style:italic; width:100%;'>Aucun moyen nautique enregistré.</p>";
    }

    // 4. Affichage de la card et rendu draggable
    const card = document.getElementById('station-detail-card');
    card.style.display = "flex";
    
    // On appelle ta fonction de drag existante (Section 8 de ton fichier)
    makeDraggable(card);
}

function closeStationCard() {
    const card = document.getElementById('station-detail-card');
    if (card) card.style.display = "none";
}
