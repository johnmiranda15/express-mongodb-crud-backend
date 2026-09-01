import mongoose from "mongoose";
import { fileURLToPath } from "node:url";
import Task from "../model/Task.js";
import User from "../model/User.js";
import { MONGODB_URI, ADMIN_EMAIL } from "../config.js";

// Asigna el dueño a las tareas legacy que no tienen owner.
// Por defecto las asigna al admin; si se pasa targetEmail, a ese usuario (cualquier rol).
// Taller seguro: solo actualiza tareas sin owner, no toca el resto.
export const runMigration = async ({ uri, adminEmail, targetEmail }) => {
  const wasConnected = mongoose.connection.readyState === 1;
  if (!wasConnected) {
    await mongoose.connect(uri);
  }
  try {
    const email = (targetEmail || adminEmail || "").toLowerCase();
    const query = targetEmail ? { email } : { email, role: "admin" };

    const owner = await User.findOne(query);
    if (!owner) {
      const what = targetEmail
        ? `usuario con email "${targetEmail}"`
        : `admin con email "${adminEmail}"`;
      throw new Error(
        `No se encontró ${what}. Crea el usuario o revisa las variables de entorno antes de migrar.`
      );
    }

    const legacyCount = await Task.countDocuments({ owner: { $exists: false } });

    const result = await Task.updateMany(
      { owner: { $exists: false } },
      { $set: { owner: owner._id } }
    );

    return {
      adminEmail: owner.email,
      ownerId: String(owner._id),
      legacyCount,
      modified: result.modifiedCount,
    };
  } finally {
    if (!wasConnected) {
      await mongoose.disconnect();
    }
  }
};

const parseArg = (flag) => {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
};

const migrateLegacyTasks = async () => {
  try {
    const targetEmail = parseArg("--user");
    const result = await runMigration({
      uri: MONGODB_URI,
      adminEmail: ADMIN_EMAIL,
      targetEmail,
    });
    const who = targetEmail ? `al usuario ${result.adminEmail}` : `al admin ${result.adminEmail}`;
    console.log(
      `Migración completada: ${result.modified} de ${result.legacyCount} tarea(s) legacy asignada(s) ${who}`
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
