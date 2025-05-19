const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);

    console.log(`db connected`);
  } catch (error) {
    console.log("Error Connecting to DB", error);
  }
};

module.exports = { connectDb };
