const Author = require("../models/model");
const Book = require("../models/book");

const createAuthor = async (req, res) => {
  try {
    console.log(req.body);

    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }

    const author = await Author.create({
      name,
      email,
    })

    console.log(author);

    res.status(200).json({ message: "Author created successfully", author });




  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const createBook = async (req, res) => {



    try {

        const { bookname, authorid } = req.body;

        if (!bookname || !authorid) {
            return res.status(400).json({ message: "Please fill all the fields" });
        }

        
        const book=await Book.create({
            bookname,
            authorid
        });

    const author=await Author.findByIdAndUpdate( book.authorid,{ $push:{bookid:book._id} },{new:true});

    console.log(author);

        
    
        res.status(200).json({ message: "Book created successfully", book });

        
    } catch (error) {
        
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
        
    }

}

module.exports = { createAuthor, createBook};
