import express from "express";
import morgan from "morgan";
import cors from "cors";
import tasksRoutes from "./routes/tasks.routes.js"; // nombre más claro
import { FRONTEND_URL } from "./config.js";

const app = express();

// Middlewares
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// CORS
app.use(
  cors({
    origin: FRONTEND_URL, // tu frontend en Vite
    credentials: true,
  })
);

// Ruta raiz de prueba
app.get("/", (req, res) => {
  res.json({ message: "Backend ejecutandose correctamente" });
});

// Rutas principales
app.use("/api", tasksRoutes);

// Manejo de rutas inexistentes
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

export default app;
