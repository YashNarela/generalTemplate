const mongoose = require("mongoose");

const AuthorSchema = new mongoose.Schema({
  name: String,
  email: String,
  bookid:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book"
    }

  ]
});

module.exports = mongoose.model("Author", AuthorSchema);
