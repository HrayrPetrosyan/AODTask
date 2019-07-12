const express = require('express');
const router = express.Router();

const countryControllers = require('../controllers/country')

router.get('/:countryId', countryControllers.fetchCountry);
router.get('', countryControllers.fetchCountries);
router.post('', countryControllers.addCountry);
router.put('/:countryId', countryControllers.updateCountry);
router.delete('', countryControllers.deleteCountry);

module.exports = router;