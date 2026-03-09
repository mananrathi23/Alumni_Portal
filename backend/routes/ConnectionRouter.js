import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  sendConnectionRequest,
  respondToRequest,
  withdrawRequest,
  removeConnection,
  getMyConnections,
  getPendingRequests,
  getConnectionStatus,
} from "../controllers/ConnectionController.js";

const router = express.Router();

// All routes require login
router.use(isAuthenticated);

router.post("/send",                    sendConnectionRequest);  // send request
router.get("/",                         getMyConnections);       // my connections
router.get("/pending",                  getPendingRequests);     // pending requests
router.get("/status/:userId",           getConnectionStatus);    // check status with one person
router.put("/:requestId/respond",       respondToRequest);       // accept or reject
router.delete("/:requestId/withdraw",   withdrawRequest);        // withdraw sent request
router.delete("/:requestId/remove",     removeConnection);       // remove accepted connection

export default router;