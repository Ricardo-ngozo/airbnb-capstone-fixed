const express = require('express');
const router = express.Router();
const controller = require('../controllers/taplineController');

router.get('/locations', controller.locations);
router.post('/search', controller.search);
router.post('/details', controller.details);
router.post('/price', controller.price);
router.post('/calendar', controller.calendar);
router.post('/reviews', controller.reviews);

module.exports = router;
