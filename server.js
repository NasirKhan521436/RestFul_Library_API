require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');

// Models and Utils
const Book = require('./models/Book');
const AppError = require('./utils/appError');
//const globalErrorHandler = require('./controllers/errorController');
const globalErrorHandler = require('./controllers/errorController');

// Routers
const userRouter = require('./routes/userRoutes');
const bookRouter = require('./routes/bookRoutes');
const checkoutRouter = require('./routes/checkoutRoutes');
const reservationRouter = require('./routes/reservationRoutes');

// Initialize App
const app = express();

// ======================================
// 1. SECURITY & MIDDLEWARE CONFIGURATION
// ======================================
app.use(helmet());
app.use(cors());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

app.use(express.json({ limit: '10kb' }));

// ======================================
// 2. DATABASE CONNECTION
// ======================================
const DB = process.env.DATABASE || 'mongodb://localhost:27017/libraryDB';

mongoose.connect(DB, {
  autoIndex: true
}).then(() => console.log('✅ MongoDB connection successful!'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to DB cluster');
});

mongoose.connection.on('error', err => {
  console.error(`❌ Mongoose connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected');
});

// ======================================
// 3. ROUTES
// ======================================

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to the Library Management API',
    version: '1.0.0',
    documentation: '/api-docs',
    timestamp: new Date().toISOString()
  });
});

// ====================== BOOK ROUTES (Inline) ======================
const router = express.Router();

router.post('/books', async (req, res, next) => {
  try {
    const newBook = await Book.create(req.body);
    res.status(201).json({
      status: 'success',
      data: { book: newBook }
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      err.statusCode = 400;
      err.message = 'Validation failed: ' + Object.values(err.errors).map(el => el.message).join('. ');
    }
    next(err);
  }
});

router.get('/books', async (req, res, next) => {
  try {
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    let query = Book.find(JSON.parse(queryStr));

    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      query = query.select('-__v');
    }

    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 10;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      const numBooks = await Book.countDocuments();
      if (skip >= numBooks) throw new Error('This page does not exist');
    }

    const books = await query;

    res.status(200).json({
      status: 'success',
      results: books.length,
      data: { books }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/books/:id', async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return next(new Error('No book found with that ID'));
    res.status(200).json({
      status: 'success',
      data: { book }
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/books/:id', async (req, res, next) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!book) return next(new Error('No book found with that ID'));
    res.status(200).json({
      status: 'success',
      data: { book }
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/books/:id', async (req, res, next) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return next(new Error('No book found with that ID'));
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
});

router.get('/books/search', async (req, res, next) => {
  try {
    if (!req.query.q) return next(new Error('Please provide a search query'));
    const books = await Book.find(
      { $text: { $search: req.query.q } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });

    res.status(200).json({
      status: 'success',
      results: books.length,
      data: { books }
    });
  } catch (err) {
    next(err);
  }
});

// ====================== [MOUNT ALL ROUTERS] ======================
app.use('/api/v1', router);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/checkouts', checkoutRouter);
app.use('/api/v1/reservations', reservationRouter);

// ======================================
// 4. ERROR HANDLING
// ======================================
// 4. ERROR HANDLING
// ======================================
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

// ======================================
// 5. SERVER INITIALIZATION
// ======================================
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully...');
  server.close(() => {
    console.log('💥 Process terminated!');
    mongoose.connection.close(false, () => {
      console.log('🔌 MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('unhandledRejection', err => {
  console.log('❌ UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', err => {
  console.log('⚠️ UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;
