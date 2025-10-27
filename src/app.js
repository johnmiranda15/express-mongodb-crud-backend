import express from "express";
import morgan from "morgan";
import indexRoutes from "./routes/tasks.routes.js";
import cors from "cors";

const app = express();

// middlewares
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(cors({
  origin: "http://localhost:5173", // aquí tu frontend de React
  credentials: true,
}));

// routes
app.use(indexRoutes);

app.use((req, res, next) => {
  res.status(404).json({ message: "Endpoint not found" });
});

export default app;
