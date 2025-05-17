const Book = require('../models/Book');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// @desc    Get all books
// @route   GET /api/v1/books
// @access  Public
exports.getAllBooks = catchAsync(async (req, res, next) => {
  // 1) Filtering
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'limit', 'sort'];
  excludedFields.forEach(el => delete queryObj[el]);

  // 2) Advanced filtering (for price/date etc)
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

  let query = Book.find(JSON.parse(queryStr));

  // 3) Sorting
  if (req.query.sort) {
    query = query.sort(req.query.sort.split(',').join(' '));
  }

  // 4) Pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 10;
  const skip = (page - 1) * limit;

  query = query.skip(skip).limit(limit);

  const books = await query;

  res.status(200).json({
    status: 'success',
    results: books.length,
    data: { books }
  });
});
// @desc    Get single book
// @route   GET /api/v1/books/:id
// @access  Public
exports.getBook = catchAsync(async (req, res, next) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    return next(new AppError('No book found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      book
    }
  });
});

// @desc    Create a book
// @route   POST /api/v1/books
// @access  Private/Admin
exports.createBook = catchAsync(async (req, res, next) => {
  const newBook = await Book.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      book: newBook
    }
  });
});

// @desc    Update a book
// @route   PATCH /api/v1/books/:id
// @access  Private/Admin
exports.updateBook = catchAsync(async (req, res, next) => {
  const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!book) {
    return next(new AppError('No book found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      book
    }
  });
});

// @desc    Delete a book
// @route   DELETE /api/v1/books/:id
// @access  Private/Admin
exports.deleteBook = catchAsync(async (req, res, next) => {
  const book = await Book.findByIdAndDelete(req.params.id);

  if (!book) {
    return next(new AppError('No book found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});