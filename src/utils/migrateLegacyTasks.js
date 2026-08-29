import mongoose from "mongoose";
import Task from "../model/Task.js";
import User from "../model/User.js";
import { MONGODB_URI, ADMIN_EMAIL } from "../config.js";

// Asigna el dueño (admin) a las tareas legacy que no tienen owner.
// Taller seguro: solo actualiza tareas sin owner, no toca el resto.
const migrateLegacyTasks = async () => {
  await mongoose.connect(MONGODB_URI);
  try {
    const admin = await User.findOne({ email: ADMIN_EMAIL, role: "admin" });
    if (!admin) {
      console.error(
        "Migración abortada: no se encontró admin. Configura ADMIN_EMAIL y crea el admin (seed) primero."
      );
      process.exit(1);
    }

    const legacyCount = await Task.countDocuments({ owner: { $exists: false } });
    console.log(`Tareas legacy (sin owner): ${legacyCount}`);

    const result = await Task.updateMany(
      { owner: { $exists: false } },
      { $set: { owner: admin._id } }
    );

    console.log(
      `Migración completada: ${result.modifiedCount} tarea(s) asignada(s) al admin ${admin.email}`
    );
  } catch (error) {
    console.error("Error en la migración:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

migrateLegacyTasks();
