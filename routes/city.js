const express = require('express');
const router = express.Router();

const cityController = require('../controllers/city');

router.get('/:cityId', cityController.fetchCity);
router.get('', cityController.fetchCities);
router.post('', cityController.addCity);
router.put('/:cityId', cityController.updateCity);
router.delete('/:cityId', cityController.deleteCity);

module.exports = router;