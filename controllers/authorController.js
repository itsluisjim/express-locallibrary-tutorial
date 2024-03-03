const Author = require("../models/author");
const Book = require("../models/book");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require('express-validator');

// Display list of all Authors.
exports.author_list = asyncHandler(async (req, res, next) => {
  const allAuthors = await Author.find().sort({family_name: 1}).exec();

  res.render('author_list', {
    title: 'Author List',
    author_list: allAuthors
  })
});

// Display detail page for a specific Author.
exports.author_detail = asyncHandler(async (req, res, next) => {
  const [author, books] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({author: req.params.id}, 'title summary').exec()
  ]);

  if(author === null){
    const err = new Error("Author not found");
    err.status = 404;
    return next(err);
  }

  res.render('author_detail', {
    title: 'Author Detail',
    author: author,
    books: books
  })

});

// Display Author create form on GET.
exports.author_create_get = (req, res, next) => {
  res.render('author_form', {
    title: 'Create author',
    author: undefined,
    errors: []
  })
};

// Handle Author create on POST.
exports.author_create_post = [
  body('first_name')
    .trim()
    .isLength({min: 3})
    .escape()
    .withMessage("First name must be specified.")
    .isAlphanumeric()
    .withMessage("First name has non-alphanumeric characters."),

  body('family_name')
    .trim()
    .isLength({min: 2})
    .escape()
    .withMessage("Last name must be specified.")
    .isAlphanumeric()
    .withMessage("Last name has non-alphanumeric characters."),

    body('date_of_birth', "Invalid date of birth")
      .optional({values: "falsy"})
      .isISO8601()
      .toDate(),

    body('date_of_death', 'Invalid date of death')
      .optional({values: "falsy"})
      .isISO8601()
      .toDate(),

    asyncHandler(async (req, res, next) => {
      const errors = validationResult(req);

      const author = new Author({
         first_name: req.body.first_name,
         family_name: req.body.family_name,
         date_of_birth: req.body.date_of_birth,
         date_of_death: req.body.date_of_death
      });

      if(!errors.isEmpty()){
        return res.render('author_form', {
          title: 'Create author',
          author,
          errors: errors.array()
        })
      } else {
        const authorExists = await Author.findOne({
          first_name: req.body.first_name,
          family_name: req.body.family_name,
          date_of_birth: req.body.date_of_birth,
          date_of_death: req.body.date_of_death 
        })
        .collation({ locale: "en", strength: 2 })
        .exec();

        if(authorExists) {
          res.redirect(authorExists.url)
          return;
        } else {
          await author.save();
          res.redirect(author.url)
        }
      }
    })
  ];

// Display Author delete form on GET.
exports.author_delete_get = asyncHandler(async (req, res, next) => {

  const [author, book_list] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({author: req.params.id }, "title summary").sort({title: 1}).exec()
  ]);

  if (author === null) {
    // No results.
    res.redirect("/catalog/authors");
  }
  
  res.render('author_delete', {
    title: 'Delete Author',
    author,
    book_list
  });
});

// Handle Author delete on POST.
exports.author_delete_post = asyncHandler(async (req, res, next) => {
  const [author, book_list] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({author: req.params.id }, "title summary").sort({title: 1}).exec()
  ]);

  if (book_list.length > 0) {
    res.render('author_delete', {
      title: 'Delete Author',
      author,
      book_list
    });
    return;
  } else {
    await Author.findByIdAndDelete(req.body.authorid);
    res.redirect("/catalog/authors");
  }
});

// Display Author update form on GET.
exports.author_update_get = asyncHandler(async (req, res, next) => {
  const author = await Author.findById(req.params.id).exec();

  if(author === null){
    res.redirect('/catalog/authors');
    return;
  }

  res.render('author_form', {
    title: 'Update form',
    author,
    errors: []
  })
});

// Handle Author update on POST.
exports.author_update_post = [
  body('first_name')
    .trim()
    .isLength({min: 3})
    .escape()
    .withMessage("First name must be specified.")
    .isAlphanumeric()
    .withMessage("First name has non-alphanumeric characters."),

  body('family_name')
    .trim()
    .isLength({min: 2})
    .escape()
    .withMessage("Last name must be specified.")
    .isAlphanumeric()
    .withMessage("Last name has non-alphanumeric characters."),

    body('date_of_birth', "Invalid date of birth")
      .optional({values: "falsy"})
      .isISO8601()
      .toDate(),

    body('date_of_death', 'Invalid date of death')
      .optional({values: "falsy"})
      .isISO8601()
      .toDate(),

    asyncHandler(async(req, res, next) => {
      const errors = validationResult(req);

      const author = new Author({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death,
        _id: req.params.id
      });

      if(!errors.isEmpty()){
        res.render('author_form', {
          title: 'Update Author',
          author,
          errors: errors.array()
        });
        return;
      } else {
        const updatedAuthor = await Author.findByIdAndUpdate(req.params.id, author, {});
        res.redirect(updatedAuthor.url);
      }
    })
];
