const BookInstance = require("../models/bookinstance");
const Book = require("../models/book");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator")

// Display list of all BookInstances.
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
  const allBookInstances = await BookInstance.find().populate("book").exec();

  res.render("bookinstance_list", {
    title: "Book Instance List",
    bookinstance_list: allBookInstances,
  });
});


// Display detail page for a specific BookInstance.
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
  const instance = await BookInstance.findById(req.params.id).populate('book').exec();

  if(instance === null){
    const err = new Error("Instance not found");
    err.status = 404;
    return next(err);
  }

  res.render('bookinstance_detail', {
    title: 'Instance Detail',
    instance: instance
  })
});

// Display BookInstance create form on GET.
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {

  const books = await Book.find({},'title').sort({title: 1}).exec();

  res.render('bookinstance_form', {
    title: "Create a Copy",
    books,
    selected_book: undefined,
    bookInstance: undefined,
    errors: []
  })
});

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  body('book', "Please select a book.")
    .trim()
    .isLength({min: 1})
    .escape(),
  body('imprint', "Imprint is required")
    .trim()
    .isLength({min: 1})
    .withMessage("Imprint must be longer than 1 character.")
    .escape(),
  body("status")
    .escape(),
  body("due_back", "Invalid date")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  asyncHandler(async (req, res, next) => {

    const errors = validationResult(req);

    const bookinstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back
    });


    if(!errors.isEmpty()){
      const books = await Book.find({}, "title").sort({ title: 1 }).exec();

      res.render('bookinstance_form', {
        title: "Create a Copy",
        books,
        selected_book: bookinstance.book._id,
        bookInstance: bookinstance,
        errors: errors.array()
      });
      return;
    } else {
      await bookinstance.save();
      res.redirect(bookinstance.url)
    }
  })
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
  const instance = await BookInstance.findById(req.params.id).populate('book').exec();

  if(instance === null){
    res.redirect("/catalog/bookinstances");
  }

  res.render('bookinstance_delete', {
    title: "Delete copy",
    instance,
    errors: []
  });
});

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
  const instance = await BookInstance.findById(req.params.id).exec();

  if (instance === null) {
    res.redirect("/catalog/bookinstances");
    return;
  } else {
    await BookInstance.findByIdAndDelete(req.body.instanceid);
    res.redirect("/catalog/bookinstances");
  }
});

// Display BookInstance update form on GET.
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
  res.send("NOT IMPLEMENTED: BookInstance update GET");
});

// Handle bookinstance update on POST.
exports.bookinstance_update_post = asyncHandler(async (req, res, next) => {
  res.send("NOT IMPLEMENTED: BookInstance update POST");
});
