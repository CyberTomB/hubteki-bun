export const config = {
    jwtSecret: process.env.JWT_SECRET,
    refreshSecret: process.env.REFRESH_SECRET,
    accessTokenExpiry: "15m",
    refreshTokenExpiry: "7d",
    port: parseInt(process.env.PORT ||'3000')
};

if (!config.jwtSecret || config.jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be set and a minimum of 32 characters");
}

if (!config.refreshSecret || config.refreshSecret.length < 32) {
    throw new Error("REFRESH_SECRET must be set and a minimum of 32 characters");
}