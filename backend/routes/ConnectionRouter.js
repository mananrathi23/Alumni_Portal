import express from "express";
import { isAuthenticated, isVerifiedByAdmin } from "../middlewares/auth.js";
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

// Fix 12: Verified users only for sending requests and viewing connections
router.post("/send",                    isVerifiedByAdmin, sendConnectionRequest);  // send request
router.get("/",                         isVerifiedByAdmin, getMyConnections);       // my connections
router.get("/pending",                  getPendingRequests);     // pending requests
router.get("/status/:userId",           getConnectionStatus);    // check status with one person
router.put("/:requestId/respond",       respondToRequest);       // accept or reject
router.delete("/:requestId/withdraw",   withdrawRequest);        // withdraw sent request
router.delete("/:requestId/remove",     removeConnection);       // remove accepted connection

export default router;