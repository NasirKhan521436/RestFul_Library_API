const express = require('express');
const reservationController = require('../controllers/reservationController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.post(
  '/:bookId',
  authController.restrictTo('member', 'librarian'),
  reservationController.createReservation
);

module.exports = router;