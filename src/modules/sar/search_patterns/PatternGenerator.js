/**
 * PatternGenerator.js
 * Génère les waypoints des patterns de recherche SAR.
 *
 * Tous les patterns retournent { points: [{ lat, lng }, …], stats: { … } }
 * Les distances sont en milles nautiques.
 */
export default class PatternGenerator {

    // --------------------------------------------------------
    // Recommandation automatique selon le rayon de recherche
    // --------------------------------------------------------
    static getRecommendedPattern(radius) {
        if (radius < 0.5) return 'sector';
        if (radius < 2)   return 'square';
        return 'parallel';
    }

    // --------------------------------------------------------
    // Utilitaire : destination à partir d'un point
    // --------------------------------------------------------
    static _dest(point, bearingDeg, distNm) {
        const R    = 6371e3;
        const dist = distNm * 1852 / R;
        const brng = bearingDeg * Math.PI / 180;
        const φ1   = point.lat * Math.PI / 180;
        const λ1   = point.lng * Math.PI / 180;
        const φ2   = Math.asin(
            Math.sin(φ1) * Math.cos(dist) +
            Math.cos(φ1) * Math.sin(dist) * Math.cos(brng)
        );
        const λ2 = λ1 + Math.atan2(
            Math.sin(brng) * Math.sin(dist) * Math.cos(φ1),
            Math.cos(dist) - Math.sin(φ1) * Math.sin(φ2)
        );
        return {
            lat: φ2 * 180 / Math.PI,
            lng: ((λ2 * 180 / Math.PI) + 540) % 360 - 180
        };
    }

    // --------------------------------------------------------
    // Distance entre deux points (milles nautiques)
    // --------------------------------------------------------
    static _dist(a, b) {
        const R   = 6371e3;
        const rad = d => d * Math.PI / 180;
        const dφ  = rad(b.lat - a.lat);
        const dλ  = rad(b.lng - a.lng);
        const x   = Math.sin(dφ / 2) ** 2 +
                    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dλ / 2) ** 2;
        return (2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))) / 1852;
    }

    // --------------------------------------------------------
    // Calcul des statistiques d'un pattern
    // --------------------------------------------------------
    static _stats(points, shipSpeedKts) {
        let totalNm = 0;
        for (let i = 0; i < points.length - 1; i++) {
            totalNm += this._dist(points[i], points[i + 1]);
        }
        const durationMin = shipSpeedKts > 0 ? Math.round((totalNm / shipSpeedKts) * 60) : 0;
        return { totalNm: +totalNm.toFixed(2), durationMin };
    }

    // --------------------------------------------------------
    // Point d'entrée unique
    // --------------------------------------------------------
    /**
     * @param {object} params
     * @param {string}          params.type          'square' | 'sector' | 'parallel' | 'creeping'
     * @param {{ lat, lng }}    params.center        Point DATUM
     * @param {number}          params.radius        Rayon de recherche (MN)
     * @param {number}          [params.spacing=0.3] Espacement entre les passes (MN)
     * @param {number}          [params.passes=4]    Nombre de passes / rayons
     * @param {number}          [params.orientation=0] Cap d'orientation (°)
     * @param {number}          [params.sectorAngle=120] Angle du secteur (°)
     * @param {number}          [params.shipSpeed=10]  Vitesse navire pour calcul durée
     * @returns {{ points, stats, type }}
     */
    static generate({
        type        = 'square',
        center,
        radius,
        spacing     = 0.3,
        passes      = 4,
        orientation = 0,
        sectorAngle = 120,
        shipSpeed   = 10
    }) {
        if (!center) throw new Error('PatternGenerator.generate : center requis');

        let points = [];

        switch (type) {
            case 'square':
                points = this._expandingSquare(center, spacing, passes);
                break;
            case 'sector':
                points = this._sectorSearch(center, radius || spacing * passes, passes, orientation, sectorAngle);
                break;
            case 'parallel':
                points = this._parallelTrack(center, spacing, passes, orientation);
                break;
            case 'creeping':
                points = this._creepingLine(center, spacing, passes, orientation);
                break;
            default:
                points = this._expandingSquare(center, spacing, passes);
        }

        return {
            type,
            points,
            stats: this._stats(points, shipSpeed)
        };
    }

    // --------------------------------------------------------
    // 1. EXPANDING SQUARE (Carré expansif)
    // --------------------------------------------------------
    static _expandingSquare(center, spacing, passes) {
        const points = [center];
        let pos  = center;
        let dist = spacing;
        let dir  = 0;   // Nord en premier

        for (let i = 0; i < passes * 4; i++) {
            pos = this._dest(pos, dir, dist);
            points.push(pos);
            dir = (dir + 90) % 360;
            if (i % 2 === 1) dist += spacing;   // On augmente tous les 2 segments
        }
        return points;
    }

    // --------------------------------------------------------
    // 2. SECTOR SEARCH (Recherche en secteur)
    // --------------------------------------------------------
    static _sectorSearch(center, radius, numRays, startOrientation, sectorAngle) {
        const points = [];
        const step   = passes => sectorAngle / (Math.max(passes - 1, 1));
        const numR   = numRays;
        const start  = (startOrientation - sectorAngle / 2 + 360) % 360;

        for (let i = 0; i < numR; i++) {
            const ang = (start + i * (sectorAngle / (numR - 1 || 1))) % 360;
            points.push(center);
            points.push(this._dest(center, ang, radius));
            points.push(center);   // retour au centre entre chaque rayon
        }
        return points;
    }

    // --------------------------------------------------------
    // 3. PARALLEL TRACK (Peignes parallèles)
    // --------------------------------------------------------
    static _parallelTrack(center, spacing, passes, orientation) {
        const legLen = spacing * (passes + 1);
        const back   = (orientation + 180) % 360;
        const perp   = (orientation + 90)  % 360;
        const points = [];

        // Départ décalé pour centrer le pattern sur le datum
        let pos = this._dest(center, (perp + 180) % 360, (passes * spacing) / 2);
        pos     = this._dest(pos, back, legLen / 2);
        points.push(pos);

        for (let i = 0; i < passes; i++) {
            pos = this._dest(pos, orientation, legLen);
            points.push(pos);
            if (i < passes - 1) {
                pos = this._dest(pos, perp, spacing);
                points.push(pos);
            }
        }
        return points;
    }

    // --------------------------------------------------------
    // 4. CREEPING LINE (Raquette)
    // --------------------------------------------------------
    static _creepingLine(center, spacing, passes, orientation) {
        const legLen = spacing * (passes + 1);
        const back   = (orientation + 180) % 360;
        const perp   = (orientation + 90)  % 360;
        const points = [];

        let pos = this._dest(center, back, (passes * spacing) / 2);
        points.push(pos);

        for (let i = 0; i < passes; i++) {
            pos = this._dest(pos, orientation, legLen);
            points.push(pos);
            if (i < passes - 1) {
                pos = this._dest(pos, perp, spacing);
                points.push(pos);
                pos = this._dest(pos, back, legLen);
                points.push(pos);
                pos = this._dest(pos, perp, spacing);
                points.push(pos);
            }
        }
        return points;
    }
}