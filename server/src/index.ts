// server/src/index.ts
import express from "express";
import cors from "cors";
import communes from "./routes/communes";
import auth from "./routes/auth";
import simulations from "./routes/simulations";
import users from "./routes/users";

import authRoutes from "./routes/auth";
import budgetRoutes from "./routes/budget";
import simulationsRoutes from "./routes/simulations";
import communesRoutes from "./routes/communes";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// routes
app.use("/api/communes", communes);
app.use("/api/auth", auth);
app.use("/api/simulations", simulations);
app.use("/api/users", users);
app.use("/api/auth", authRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/simulations", simulationsRoutes);
app.use("/api/communes", communesRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});