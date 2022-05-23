const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Handy Portal Sever On!!!!");
});

app.listen(port, () => {
  console.log(`Handy app listening on port ${port}`);
});
