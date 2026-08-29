import { connect } from "mongoose";
import { MONGODB_URI } from "../config.js";
import { seedAdmin } from "./seedAdmin.js";

// connection to db
(async () => {
  try {
    const db = await connect(MONGODB_URI);
    console.log("Db connectect to", db.connection.name);
    await seedAdmin();
  } catch (error) {
    console.error(error);
  }
})();
