import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import express from "express";
import cors from "cors";
import communes from "./routes/communes";
import auth from "./routes/auth";
import simulations from "./routes/simulations";

const app = express();

app.use(cors());
app.use(express.json());

// routes
app.use("/api/communes", communes);
app.use("/api/auth", auth);
app.use("/api/simulations", simulations);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`✅ Server listening on port ${port}`);
});
