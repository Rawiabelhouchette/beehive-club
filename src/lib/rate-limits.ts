import { createRateLimiter } from "./rate-limit";

/** Une seule limite pour les deux formulaires : 5 demandes par appareil toutes les 10 minutes. */
export const bookingRateLimit = createRateLimiter(5, 10 * 60 * 1000);
