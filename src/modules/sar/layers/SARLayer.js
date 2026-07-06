/**
 * SARLayer.js
 * Gestion des éléments cartographiques du module SAR sur Leaflet.
 * Marqueur LKP, marqueur DATUM, cercle d'incertitude, ligne de dérive, pattern.
 */
export default class SARLayer {

    static group        = L.layerGroup();
    static lkpMarker    = null;
    static datumMarker  = null;
    static searchCircle = null;
    static driftLine    = null;   // Ligne LKP → DATUM
    static routeLayer   = null;
    static patternLayer = null;
    static placingLKP   = false;

    // ------------------------------------------------------------------
    // Accès à la carte Leaflet
    // ------------------------------------------------------------------
    static _map() {
        return window.OPESAR?.Map?.getMap?.() ?? window.map ?? null;
    }

    // ------------------------------------------------------------------
    // Nettoyage complet
    // ------------------------------------------------------------------
    static clear() {
        this.group.clearLayers();
        this.lkpMarker    = null;
        this.datumMarker  = null;
        this.searchCircle = null;
        this.driftLine    = null;
        this.routeLayer   = null;
        this.patternLayer = null;
    }

    // ------------------------------------------------------------------
    // Placement du LKP via clic sur la carte
    // ------------------------------------------------------------------
    static startLKPPlacement() {
        const map = this._map();
        if (!map) return;

        this.placingLKP = true;
        map.getContainer().style.cursor = 'crosshair';

        const handler = event => {
            map.off('click', handler);
            map.getContainer().style.cursor = '';
            this.placingLKP = false;
            this.setLKP(event.latlng.lat, event.latlng.lng);
        };

        map.on('click', handler);
    }

    // ------------------------------------------------------------------
    // Placement du marqueur LKP (depuis DMS validé ou clic carte)
    // ------------------------------------------------------------------
    static setLKP(lat, lng) {
        const map = this._map();
        if (!map) return;

        this.group.addTo(map);

        if (this.lkpMarker) this.group.removeLayer(this.lkpMarker);

        this.lkpMarker = L.marker([lat, lng], { draggable: true })
            .bindPopup('<b>LKP</b> — Dernière Position Connue')
            .openPopup();

        this.group.addLayer(this.lkpMarker);

        // Quand on déplace le marqueur à la main, on réémet l'événement
        this.lkpMarker.on('drag', () => {
            const pos = this.lkpMarker.getLatLng();
            window.dispatchEvent(new CustomEvent('sar:lkp:selected', {
                detail: { lat: pos.lat, lng: pos.lng }
            }));
        });

        window.dispatchEvent(new CustomEvent('sar:lkp:selected', { detail: { lat, lng } }));

        // Centrer la carte sur le LKP
        map.setView([lat, lng], Math.max(map.getZoom(), 12));
    }

    // ------------------------------------------------------------------
    // Rendu du DATUM + cercle d'incertitude + ligne de dérive
    // ------------------------------------------------------------------
    static renderDatum(sar) {
        if (!sar?.datum) return;

        const map = this._map();
        if (!map) return;

        this.group.addTo(map);

        // Nettoyage des anciens éléments dynamiques
        [this.datumMarker, this.searchCircle, this.driftLine].forEach(l => {
            if (l) this.group.removeLayer(l);
        });

        // --- Marqueur DATUM ---
        const datumIcon = L.divIcon({
            className: '',
            html: `<div style="
                width:16px;height:16px;
                background:#d32f2f;border:3px solid #ffeb3b;
                border-radius:50%;
                box-shadow:0 0 8px rgba(239,68,68,0.8);">
            </div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });

        this.datumMarker = L.marker(
            [sar.datum.lat, sar.datum.lng],
            { icon: datumIcon }
        ).bindTooltip(
            this._buildDatumTooltip(
                sar
            ),
            {
                permanent: true,
                direction: 'right',
                offset: [14, 0],
                className: 'opsar-datum-tooltip'
            }
        );
		
		// Gestion du bouton réduire
		this.datumMarker.on("tooltipopen", (e) => {

			const tooltip = e.tooltip.getElement();

			tooltip
				.querySelector(".opsar-tip-toggle")
				?.addEventListener("click", function (ev) {

					ev.stopPropagation();

					const body = tooltip.querySelector(".opsar-tip-body");

					const collapsed = body.classList.toggle("collapsed");

					this.textContent = collapsed ? "+" : "−";
				});

		});

        this.group.addLayer(this.datumMarker);

        // --- Cercle d'incertitude ---
        this.searchCircle = L.circle(
            [sar.datum.lat, sar.datum.lng],
            {
                radius:      sar.searchRadius * 1852,
                color:       '#ef4444',
                weight:      2,
                dashArray:   '6,6',
                fillColor:   '#7c3aed',
                fillOpacity: 0.08
            }
        ).bindTooltip(`Incertitude ±${sar.searchRadius?.toFixed(2)} MN`, { sticky: true });

        this.group.addLayer(this.searchCircle);

        // --- Ligne de dérive LKP → DATUM ---
        if (sar.lkp) {
            this.driftLine = L.polyline(
                [
                    [sar.lkp.lat, sar.lkp.lng],
                    [sar.datum.lat, sar.datum.lng]
                ],
                {
                    color:     '#ef4444',
                    weight:    3,
                    dashArray: '5,10',
                    opacity:   0.85
                }
            );
            this.group.addLayer(this.driftLine);
        }

    }

    // ------------------------------------------------------------------
    // Rendu de la route d'interception
    // ------------------------------------------------------------------
    static renderRoute(route) {

        if (
            !route?.points?.length
        ) {
            return;
        }

        const map =
            this._map();

        if (!map) {
            return;
        }

        this.group.addTo(map);

        if (this.routeLayer) {
            this.group.removeLayer(
                this.routeLayer
            );
        }

        const latlngs =
            route.points.map(point => [
                point.lat,
                point.lng
            ]);

        this.routeLayer =
            L.layerGroup();

        const line =
            L.polyline(
                latlngs,
                {
                    color: '#2563eb',
                    weight: 4,
                    opacity: 0.82
                }
            ).bindTooltip(
                `${route.label} — ${route.distanceNm.toFixed(1)} MN @ ${Math.round(route.bearingDeg)}°`,
                {
                    sticky: true
                }
            );

        this.routeLayer.addLayer(
            line
        );

        const startIcon =
            L.divIcon({
                className: '',
                html: `<div style="
                    width:14px;height:14px;
                    background:#2563eb;
                    border:2px solid #fff;
                    border-radius:50%;
                    box-shadow:0 0 8px rgba(37,99,235,.7);">
                </div>`,
                iconSize: [14, 14],
                iconAnchor: [7, 7]
            });

        this.routeLayer.addLayer(
            L.marker(
                latlngs[0],
                {
                    icon: startIcon
                }
            ).bindTooltip(
                route.source === 'station'
                    ? 'Départ station de référence'
                    : 'Départ GPS'
            )
        );

        this.group.addLayer(
            this.routeLayer
        );

    }

    static clearRoute() {

        if (this.routeLayer) {
            this.group.removeLayer(
                this.routeLayer
            );

            this.routeLayer =
                null;
        }

    }

    static _buildDatumTooltip(sar) {

		return `
			<div class="opsar-datum-tip">

				<div class="opsar-datum-tip-header">
					<span class="opsar-datum-tip-title">
						DATUM estimé
					</span>

					<button
						class="opsar-tip-toggle"
						type="button"
						title="Réduire"
					>
						−
					</button>
				</div>

				<div class="opsar-tip-body">

					<div class="opsar-datum-tip-row">
						<span>Position</span>
						<strong>${sar.datum.lat.toFixed(5)} / ${sar.datum.lng.toFixed(5)}</strong>
					</div>

					<div class="opsar-datum-tip-row">
						<span>Dérive</span>
						<strong>${sar.driftDistance?.toFixed(2)} MN @ ${Math.round(sar.driftDirection)}°</strong>
					</div>

					<div class="opsar-datum-tip-row">
						<span>Incertitude</span>
						<strong>±${sar.searchRadius?.toFixed(2)} MN</strong>
					</div>

				</div>

			</div>
		`;
	}

    // ------------------------------------------------------------------
    // Rendu du pattern de recherche
    // ------------------------------------------------------------------
    static renderPattern(result) {
        if (!result?.points?.length) return;

        const map = this._map();
        if (!map) return;

        if (this.patternLayer) this.group.removeLayer(this.patternLayer);

        // Convertir { lat, lng } → [lat, lng] pour Leaflet
        const latlngs = result.points.map(p => [p.lat, p.lng]);

        this.patternLayer = L.layerGroup();

        // Tracé principal
        const polyline = L.polyline(latlngs, {
            color:     '#f59e0b',
            weight:    2,
            opacity:   0.9,
            dashArray: '8,5'
        });
        this.patternLayer.addLayer(polyline);

        // Flèches de direction sur chaque segment
        for (let i = 0; i < result.points.length - 1; i++) {
            const a   = result.points[i];
            const b   = result.points[i + 1];
            const mid = { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
            const brng = this._bearing(a, b);

            const arrow = L.divIcon({
                className: '',
                html: `<div style="transform:rotate(${brng}deg);color:#fbbf24;font-size:14px;line-height:1;">▲</div>`,
                iconSize:   [14, 14],
                iconAnchor: [7, 7]
            });
            this.patternLayer.addLayer(
                L.marker([mid.lat, mid.lng], { icon: arrow, interactive: false })
            );
        }

        // Point de départ (vert)
        const startIcon = L.divIcon({
            className: '',
            html: `<div style="width:12px;height:12px;background:#22c55e;border:2px solid #fff;border-radius:50%;"></div>`,
            iconSize:   [12, 12],
            iconAnchor: [6, 6]
        });
        this.patternLayer.addLayer(
            L.marker(latlngs[0], { icon: startIcon })
             .bindTooltip('Départ recherche', { direction: 'top' })
        );

        this.group.addLayer(this.patternLayer);
        this.group.addTo(map);
    }

    // ------------------------------------------------------------------
    // Effacement du seul pattern (sans toucher au DATUM)
    // ------------------------------------------------------------------
    static clearPattern() {
        if (this.patternLayer) {
            this.group.removeLayer(this.patternLayer);
            this.patternLayer = null;
        }
    }

    // ------------------------------------------------------------------
    // Utilitaire : cap entre deux points { lat, lng }
    // ------------------------------------------------------------------
    static _bearing(a, b) {
        const rad  = d => d * Math.PI / 180;
        const dLng = rad(b.lng - a.lng);
        const y    = Math.sin(dLng) * Math.cos(rad(b.lat));
        const x    = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) -
                     Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(dLng);
        return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
    }
}
