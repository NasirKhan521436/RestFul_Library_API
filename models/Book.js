const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'A book must have a title'],
    trim: true
  },
  author: {
    type: String,
    required: [true, 'A book must have an author']
  },
  ISBN: {
    type: String,
    required: [true, 'A book must have an ISBN'],
    unique: true
  },
  availableCopies: {
    type: Number,
    default: 1,
    min: [0, 'Available copies cannot be negative']
  },
  totalCopies: {
    type: Number,
    required: [true, 'A book must have total copies specified'],
    min: [1, 'A book must have at least 1 copy']
  },
  genre: {
    type: [String],
    required: [true, 'A book must have at least one genre']
  },
  publishedYear: Number
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const Book = mongoose.model('Book', bookSchema);
module.exports = Book;

bookSchema.pre('save', function(next) {
  if (this.isModified('totalCopies')) {
    this.availableCopies = this.totalCopies - (this.checkedOutCopies || 0);
  }
  next();
});