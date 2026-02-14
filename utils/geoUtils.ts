/**
 * Computes the haversine distance between two points (in meters).
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in meters
 */
export const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

/**
 * Checks if a point is within a given radius from another point.
 * @param point1 Coordinates of point 1
 * @param point2 Coordinates of point 2
 * @param radiusInMeters Radius threshold
 * @returns boolean
 */
export const isWithinRadius = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
    radiusInMeters: number = 200
): boolean => {
    const distance = getDistance(lat1, lon1, lat2, lon2);
    return distance <= radiusInMeters;
};
