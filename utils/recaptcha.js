const Recaptcha = require('express-recaptcha').RecaptchaV2;
const recaptcha = new Recaptcha(
    process.env.RECAPTCHA_SITE_KEY,
    process.env.RECAPTCHA_SECRET_KEY
);

module.exports = recaptcha
