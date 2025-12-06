import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// calculate correct env path
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

console.log("BOOTSTRAP LOADED. JWT_SECRET =", process.env.JWT_SECRET);

import "./index.js";
