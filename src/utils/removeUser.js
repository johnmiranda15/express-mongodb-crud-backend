import mongoose from "mongoose";
import { fileURLToPath } from "node:url";
import Task from "../model/Task.js";
import User from "../model/User.js";
import { MONGODB_URI } from "../config.js";

// Elimina un usuario por email y (opcionalmente) sus tareas.
export const removeUserByEmail = async ({ uri, email, removeTasks = true }) => {
  const wasConnected = mongoose.connection.readyState === 1;
  if (!wasConnected) {
    await mongoose.connect(uri);
  }
  try {
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user) {
      throw new Error(`No existe usuario con email "${email}"`);
    }

    const tasksRemoved = removeTasks
      ? await Task.deleteMany({ owner: user._id })
      : { deletedCount: 0 };

    await user.deleteOne();
    return {
      deleted: user.email,
      userId: String(user._id),
      tasksRemoved: tasksRemoved.deletedCount,
    };
  } finally {
    if (!wasConnected) {
      await mongoose.disconnect();
    }
  }
};

const removeUser = async () => {
  const email = process.argv[2];
  if (!email) {
    console.error("Uso: node src/utils/removeUser.js <email>");
    process.exit(1);
  }
  try {
    const result = await removeUserByEmail({ uri: MONGODB_URI, email });
    console.log(
      `Usuario eliminado: ${result.deleted} (${result.userId}). Tareas eliminadas: ${result.tasksRemoved}.`
    );
  } catch (error) {
    console.error("Eliminación abortada:", error.message);
    process.exit(1);
  }
};

// Solo se ejecuta cuando el archivo se corre directamente (no al ser importado en tests).
const isMain = process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  removeUser();
}