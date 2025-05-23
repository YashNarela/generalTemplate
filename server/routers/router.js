const express = require("express");

const route = express.Router();

const { createAuthor, createBook } = require("../controllers/controllers");

const {
  createWallet,
  getWallet,
  addMoneyToWallet,
} = require("../controllers/Wallet");
route.post("/createauthor", createAuthor);

route.post("/createbook", createBook);


route.post("/createwallet", createWallet);

route.get("/getwallet", getWallet);

route.post("/addmoney", addMoneyToWallet);





module.exports = route;
