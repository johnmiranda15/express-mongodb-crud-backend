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
    const task = new Task(req.body);
    await task.save();
    return res.status(201).json(task);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GET /tasks/:id -> obtener una sola
export const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    return res.status(202).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /tasks/:id -> actualizar
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    return res.status(200).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PATCH /tasks/:id/toggle Cambiar estado
export const toggleTaskDone = async (req, res) => {
  const task = await Task.findById(req.params.id);
  task.done = !task.done;
  await task.save();
  res.json(task);
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
