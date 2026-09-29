import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { getBatchmates } from "../controllers/BatchmatesController.js";

const router = express.Router();

router.use(isAuthenticated);
router.get("/", getBatchmates);

export default router;
