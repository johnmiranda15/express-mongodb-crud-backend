import { isValidObjectId } from "mongoose";
import Task from "../model/Task.js";

// GET /tasks -> obtener todas (user ve solo las suyas; admin todas)
export const getTasks = async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { owner: req.user._id };
    const tasks = await Task.find(filter);
    return res.status(200).json(tasks);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /tasks -> crear (el owner es el usuario autenticado)
export const createTask = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    const task = new Task({ title: title.trim(), description, owner: req.user._id });
    await task.save();
    return res.status(201).json(task);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Task with this title already exists" });
    }
    return res.status(500).json({ message: error.message });
  }
};

// GET /tasks/:id -> obtener una sola (respetando propiedad)
export const getTask = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task id" });
    }
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (req.user.role !== "admin" && !task.owner.equals(req.user._id)) {
      return res.status(403).json({ message: "Forbidden: not your task" });
    }
    return res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /tasks/:id -> actualizar (respetando propiedad)
export const updateTask = async (req, res) => {
  try {
    const { title, description, done } = req.body;
    const updateFields = {};

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ message: "Title cannot be empty" });
      }
      updateFields.title = title.trim();
    }
    if (description !== undefined) updateFields.description = description;
    if (done !== undefined) updateFields.done = done;

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const existing = await Task.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (req.user.role !== "admin" && !existing.owner.equals(req.user._id)) {
      return res.status(403).json({ message: "Forbidden: not your task" });
    }

    const task = await Task.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PATCH /tasks/:id/toggle Cambiar estado (respetando propiedad)
export const toggleTaskDone = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task id" });
    }
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (req.user.role !== "admin" && !task.owner.equals(req.user._id)) {
      return res.status(403).json({ message: "Forbidden: not your task" });
    }
    task.done = !task.done;
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /tasks/:id -> Eliminar tarea (respetando propiedad)
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) return res.status(400).json({ message: "Task ID is required" });
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid task id" });
    }

    const existing = await Task.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (req.user.role !== "admin" && !existing.owner.equals(req.user._id)) {
      return res.status(403).json({ message: "Forbidden: not your task" });
    }

    const task = await Task.findByIdAndDelete(id);
    return res.status(200).json({ message: "Task deleted successfully", task });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: error.message });
  }
};
