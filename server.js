const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const videoRoutes = require("./routes/videoRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const authRoutes = require("./routes/authRoutes");
const errorHandler = require("./middlewares/error-handler");

// Server and DB Setups
connectDB();

const PORT = process.env.PORT || 5000;
const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/video", videoRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/auth", authRoutes);

app.use(() => {
  throw new Error("Route Not Found", 404);
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
