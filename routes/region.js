const express = require('express');
const router = express.Router();

const regionControllers = require('../controllers/region')

router.get('/:regionId', regionControllers.fetchRegion);
router.get('', regionControllers.fetchRegions);
router.post('', regionControllers.addRegion);
router.put('', regionControllers.updateRegion);
router.delete('/:regionId', regionControllers.deleteRegion);

module.exports = router;