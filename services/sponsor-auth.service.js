"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSponsorPayload = void 0;
/**
 * This function prepares the sponsor data to be sent to the frontend.
 * It omits sensitive data like the password.
 */
const buildSponsorPayload = (sponsor) => {
    var _a;
    // The frontend expects the 'User' type from 'spark-sponsor-dashboard/src/types.ts'
    return {
        username: sponsor.username,
        role: sponsor.role,
        remainingLimit: sponsor.remainingLimit,
        totalLimit: sponsor.totalLimit,
        validUntil: (_a = sponsor.validUntil) === null || _a === void 0 ? void 0 : _a.toISOString(),
        profileImage: sponsor.profileImage,
        customHtmlTemplate: sponsor.customHtmlTemplate,
        gamReportsEnabled: sponsor.gamReportsEnabled,
    };
};
exports.buildSponsorPayload = buildSponsorPayload;
// In your actual login/session controller, you would find the sponsor from the database
// and then call this function to build the response payload.
//
// Example:
// const payload = buildSponsorPayload(sponsorFromDb);
// res.json({ user: payload, token: '...' });
