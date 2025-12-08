/**
 * Mocks the Google Maps API for distance and duration calculation.
 * In a real application, this would call the Google Maps Distance Matrix API.
 * @param origin - The starting point.
 * @param destination - The ending point.
 * @returns A promise that resolves to the distance in meters and duration in seconds.
 */
export const getDistanceAndDuration = async (origin: any, destination: any): Promise<{ distance: number, duration: number }> => {
    // Mocked values for demonstration purposes
    const distance = Math.floor(Math.random() * 20000) + 5000; // 5km to 25km
    const duration = Math.floor(distance / 15) + (Math.random() * 600); // Average speed of ~54km/h + random traffic delay

    return { distance, duration };
};