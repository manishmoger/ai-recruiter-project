const express = require("express");
const cors = require("cors");
require("dotenv").config();

const searchRoutes = require("./routes/searchRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", searchRoutes);

app.get("/", (req, res) => {
  res.send("Flexiple AI Recruiter API");
});

app.listen(process.env.PORT || 5000, () => {
  console.log("Server running");
});