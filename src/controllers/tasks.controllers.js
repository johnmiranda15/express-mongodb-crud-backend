import Task from "../model/Task.js";

// GET /tasks -> obtener todas
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find();
    return res.status(200).json(tasks);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// POST /tasks -> crear
export const createTask = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    const task = new Task({ title: title.trim(), description });
    await task.save();
    return res.status(201).json(task);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Task with this title already exists" });
    }
    return res.status(500).json({ message: error.message });
  }
};

// GET /tasks/:id -> obtener una sola
export const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    return res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /tasks/:id -> actualizar
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

    const task = await Task.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PATCH /tasks/:id/toggle Cambiar estado
export const toggleTaskDone = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    task.done = !task.done;
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// DELETE /tasks/:id -> Eliminar tarea
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    // valida id
    if (!id) return res.status(400).json({ message: "Task ID is required" });

    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json({ message: "Task deleted successfully", task });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: error.message });
  }
};
