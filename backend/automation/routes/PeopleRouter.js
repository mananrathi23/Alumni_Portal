import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { getPeople } from "../controllers/PeopleController.js";

const router = express.Router();

router.use(isAuthenticated);

// GET /api/v1/people
// Query params:
//   search     → search by name or department
//   filterRole → "All" | "Student" | "Alumni" | "Teacher"
//   department → filter by department
router.get("/", getPeople);

export default router;