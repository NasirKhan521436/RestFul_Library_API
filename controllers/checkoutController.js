const Checkout = require('../models/Checkout');
const Book = require('../models/Book');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.checkoutBook = catchAsync(async (req, res, next) => {
  const book = await Book.findById(req.body.book);
  if (!book) {
    return next(new AppError('No book found with that ID', 404));
  }

  if (book.available <= 0) {
    return next(new AppError('This book is not available for checkout', 400));
  }

  const checkout = await Checkout.create({
    book: req.body.book,
    user: req.user.id
  });

  res.status(201).json({
    status: 'success',
    data: {
      checkout
    }
  });
});

exports.returnBook = catchAsync(async (req, res, next) => {
  const checkout = await Checkout.findOneAndUpdate(
    {
      _id: req.params.id,
      user: req.user.id,
      returned: false
    },
    {
      returned: true,
      returnDate: Date.now()
    },
    {
      new: true,
      runValidators: true
    }
  );

  if (!checkout) {
    return next(new AppError('No active checkout found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      checkout
    }
  });
});

exports.getUserCheckouts = catchAsync(async (req, res, next) => {
  const checkouts = await Checkout.find({ user: req.user.id });

  res.status(200).json({
    status: 'success',
    results: checkouts.length,
    data: {
      checkouts
    }
  });
});