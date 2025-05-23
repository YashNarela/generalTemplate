const express = require("express");
const cors = require("cors");
const { connectDb } = require("./connection/connect");
const route = require("./routers/router");
var bodyParser = require("body-parser");

const User=require("./models/user")

const app = express();

require("dotenv").config();

app.use(cors());

var jsonParser = bodyParser.json();

app.use(jsonParser);
var urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(urlencodedParser);


const port = process.env.PORT || 4000;


app.use( "/user", async(req, res) =>{


  try {
    const { name, email, phone } = req.body;

    const user = await User.create({ name, email, phone });

    res.status(200).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  }

  catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
})


app.use("/api", route);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

connectDb();
