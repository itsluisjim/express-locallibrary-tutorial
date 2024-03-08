const mongoose = require("mongoose");
require('dotenv').config();


mongoose.set("strictQuery", false);
const mongoDB = process.env.DB_URL;

async function main() {
  await mongoose.connect(mongoDB);
}
main().catch((err) => console.log(err));


module.exports = main;