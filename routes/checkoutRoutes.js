const express = require('express');
const checkoutController = require('../controllers/checkoutController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .post(checkoutController.checkoutBook)
  .get(checkoutController.getUserCheckouts);

router
  .route('/:id')
  .patch(checkoutController.returnBook);

module.exports = router;