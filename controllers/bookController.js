const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");
const { body, validationResult } = require('express-validator');

const asyncHandler = require("express-async-handler");

exports.index = asyncHandler(async (req, res, next) => {
  // Get details of books, book instances, authors and genre counts (in parallel)
  const [
    numBooks,
    numBookInstances,
    numAvailableBookInstances,
    numAuthors,
    numGenres,
  ] = await Promise.all([
    Book.countDocuments({}).exec(),
    BookInstance.countDocuments({}).exec(),
    BookInstance.countDocuments({ status: "Available" }).exec(),
    Author.countDocuments({}).exec(),
    Genre.countDocuments({}).exec(),
  ]);

  res.render("home", {
    title: "Local Library Home",
    book_count: numBooks,
    book_instance_count: numBookInstances,
    book_instance_available_count: numAvailableBookInstances,
    author_count: numAuthors,
    genre_count: numGenres,
  });
});

// Display list of all books.
exports.book_list = asyncHandler(async (req, res, next) => {
  const allBooks = await Book.find({}, "title author")
    .sort({ title: 1 })
    .populate("author")
    .exec();

  res.render("book_list", { title: "Book List", book_list: allBooks });
});

// Display detail page for a specific book.
exports.book_detail = asyncHandler(async (req, res, next) => {
  const [book, book_instances] = await Promise.all([
    Book.findById(req.params.id)
      .populate("author")
      .populate("genre")
      .exec(),
    BookInstance.find({book: req.params.id}).exec()
  ])

  if(book === null){
    const err = new Error("Book not found");
    err.status = 404;
    return next(err)
  }
  
  res.render("book_detail", {
    title: "Book Detail",
    book: book,
    book_instances: book_instances
  });
});

// Display book create form on GET.
exports.book_create_get = asyncHandler(async (req, res, next) => {

  const [authors, genres] = await Promise.all([
    Author.find().sort({family_name: 1}).exec(),
    Genre.find().sort({name: 1}).exec()
  ]);

  res.render('book_form', {
    title: "Create Book",
    authors,
    genres,
    book: undefined,
    errors: [],
  })
});

// Handle book create on POST.
exports.book_create_post = [

  // make sure genre field is present even if no genre was selected in the form
  (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      req.body.genre =
        typeof req.body.genre === "undefined" ? [] : [req.body.genre];
    }
    next();
  },

  body('title', 'Title field must not be empty.')
    .trim()
    .isLength({min: 2})
    .withMessage("Title must be longer than 2 characters")
    .escape(),
  body('author', 'Author field must not be empty.')
    .trim()
    .isLength({min: 3})
    .withMessage('Name must be longer than 3 characters')
    .escape(),
  body('summary', 'Summary filed must not be empty.')
    .trim()
    .isLength({min: 1})
    .withMessage('Summray must be longer than 1 character')
    .escape(),
  body('isbn')
    .trim()
    .isLength({min: 1})
    .withMessage('ISBN must be more than 1 character')
    .escape(),
  body('genre*')
    .escape(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
    });

    if(!errors.isEmpty()){
      const [authors, genres] = await Promise.all([
        Author.find().sort({family_name: 1}).exec(),
        Genre.find().sort({name: 1}).exec()
      ]);

      genres.forEach(genre => {
        if(book.genre.includes(genre._id)){
          genre.checked = 'true';
        }
      });

      res.render("book_form", {
        title: "Create Book",
        authors,
        genres,
        book: book,
        errors: errors.array(),
      });
      return;
    } else {
      await book.save();
      res.redirect(book.url);
    }
  })
];

// Display book delete form on GET.
exports.book_delete_get = asyncHandler(async (req, res, next) => {
  const book = await Book.findById(req.params.id).populate("author").exec();

  if(book === null){
    res.redirect("/catalog/books");
  }

  res.render('book_delete', {
    title: "Delete book",
    book
  });
});

// Handle book delete on POST.
exports.book_delete_post = asyncHandler(async (req, res, next) => {
  const book = await Book.findById(req.params.id).exec();

  if (book === null) {
    res.redirect("/catalog/books");
    return;
  } else {
    await Book.findByIdAndDelete(req.body.bookid);
    res.redirect("/catalog/books");
  }
});

// Display book update form on GET.
exports.book_update_get = asyncHandler(async (req, res, next) => {
  const [book, authors, genres] = await Promise.all([
    Book.findById(req.params.id).populate("author").exec(),
    Author.find().sort({family_name: 1}).exec(),
    Genre.find().sort({name: 1}).exec()
  ]);

  if (book === null) {
    const err = new Error("Book not found");
    err.status = 404;
    return next(err);
  }

  genres.forEach((genre) => {
    if (book.genre.includes(genre._id)) {
     genre.checked = "true";
    } 
  });

  res.render('book_form', {
    title: "Update Book",
    authors,
    genres,
    book: book,
    errors: [],
  })
});

// Handle book update on POST.
exports.book_update_post = [
  (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      req.body.genre =
        typeof req.body.genre === "undefined" ? [] : [req.body.genre];
    }
    next();
  },

  // Validate and sanitize fields.
  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "Author must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "Summary must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN must not be empty")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("genre.*")
    .escape(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: typeof req.body.genre === "undefined" ? [] : req.body.genre,
      _id: req.params.id, // This is required, or a new ID will be assigned!
    });

    if (!errors.isEmpty()) {
      const [authors, genres] = await Promise.all([
        Author.find().sort({ family_name: 1 }).exec(),
        Genre.find().sort({ name: 1 }).exec(),
      ]);

      genres.forEach(genre => {
        if (book.genre.indexOf(genre._id) > -1) {
          genre.checked = "true";
        }
      });

      res.render("book_form", {
        title: "Update Book",
        authors: authors,
        genres: genres,
        book: book,
        errors: errors.array(),
      });
      return;
    } else {
      const updatedBook = await Book.findByIdAndUpdate(req.params.id, book, {});
      res.redirect(updatedBook.url);
    }
  }),
];

