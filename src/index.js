import app from "./app.js";
import "./utils/mongoose.js";
import { PORT } from "./config.js";

app.listen(PORT, () => {
  console.log("Server on port", PORT);
});
