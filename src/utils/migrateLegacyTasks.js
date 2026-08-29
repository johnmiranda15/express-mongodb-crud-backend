import mongoose from "mongoose";
import { fileURLToPath } from "node:url";
import Task from "../model/Task.js";
import User from "../model/User.js";
import { MONGODB_URI, ADMIN_EMAIL } from "../config.js";

// Asigna el dueño (admin) a las tareas legacy que no tienen owner.
// Taller seguro: solo actualiza tareas sin owner, no toca el resto.
export const runMigration = async ({ uri, adminEmail }) => {
  const wasConnected = mongoose.connection.readyState === 1;
  if (!wasConnected) {
    await mongoose.connect(uri);
  }
  try {
    const admin = await User.findOne({ email: adminEmail, role: "admin" });
    if (!admin) {
      throw new Error(
        `No se encontró admin con email "${adminEmail}". Configura ADMIN_EMAIL y crea el admin (seed) primero.`
      );
    }

    const legacyCount = await Task.countDocuments({ owner: { $exists: false } });

    const result = await Task.updateMany(
      { owner: { $exists: false } },
      { $set: { owner: admin._id } }
    );

    return { adminEmail: admin.email, legacyCount, modified: result.modifiedCount };
  } finally {
    if (!wasConnected) {
      await mongoose.disconnect();
    }
  }
};

const migrateLegacyTasks = async () => {
  try {
    const result = await runMigration({ uri: MONGODB_URI, adminEmail: ADMIN_EMAIL });
    console.log(
      `Migración completada: ${result.modified} de ${result.legacyCount} tarea(s) legacy asignada(s) al admin ${result.adminEmail}`
    );
  } catch (error) {
    console.error("Migración abortada:", error.message);
    process.exit(1);
  }
};

// Solo se ejecuta cuando el archivo se corre directamente (no al ser importado en tests).
const isMain = process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  migrateLegacyTasks();
}
