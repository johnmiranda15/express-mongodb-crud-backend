import { Router } from "express";
import {
  createTask,
  deleteTask,
  getTask,
  getTasks,
  toggleTaskDone,
  updateTask,
} from "../controllers/tasks.controllers.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

// Todas las rutas de tareas requieren autenticación
router.use(authenticate);

// GET todas las tareas
router.get("/tasks", getTasks);

// POST crear nueva tarea
router.post("/tasks", createTask);

// GET una tarea por ID
router.get("/tasks/:id", getTask);

// PUT actualizar tarea
router.put("/tasks/:id", updateTask);

// Cambiar estado
router.patch("/tasks/:id/toggle", toggleTaskDone);

// DELETE eliminar tarea
router.delete("/tasks/:id", deleteTask);

export default router;
