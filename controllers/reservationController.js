const Reservation = require('../models/Reservation');
const Book = require('../models/Book');
const catchAsync = require('../utils/catchAsync');

exports.createReservation = catchAsync(async (req, res, next) => {
  const book = await Book.findById(req.params.bookId);
  if (!book || book.availableCopies < 1) {
    return next(new AppError('Book not available for reservation', 400));
  }

  const reservation = await Reservation.create({
    user: req.user.id,
    book: req.params.bookId
  });

  res.status(201).json({
    status: 'success',
    data: { reservation }
  });
});