import User from "../model/User.js";
import { ADMIN_EMAIL, ADMIN_USERNAME, ADMIN_PASSWORD } from "../config.js";

// Crea el primer administrador (si las vars de entorno están configuradas
// y el email no existe aún). No pisa a un admin ya existente.
export const seedAdmin = async () => {
  if (!ADMIN_EMAIL || !ADMIN_USERNAME || !ADMIN_PASSWORD) {
    console.log(
      "seedAdmin: ADMIN_EMAIL, ADMIN_USERNAME o ADMIN_PASSWORD no configurados. No se crea admin."
    );
    return;
  }

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log("seedAdmin: admin ya existe, se omite.");
    return;
  }

  const admin = new User({
    username: ADMIN_USERNAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: "admin",
  });
  await admin.save();
  console.log(`seedAdmin: administrador creado (${ADMIN_USERNAME} / ${ADMIN_EMAIL})`);
};
