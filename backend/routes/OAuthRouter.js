import express from "express";
import {
  getGoogleOAuthUrl,
  handleGoogleOAuth,
  getLinkedInOAuthUrl,
  handleLinkedInOAuth,
} from "../controllers/OAuthController.js";

const router = express.Router();

// Google — mounted at /api/v1/oauth
router.get("/google/url",      getGoogleOAuthUrl);
router.get("/google/callback", handleGoogleOAuth);

// LinkedIn
router.get("/linkedin/url",      getLinkedInOAuthUrl);
router.get("/linkedin/callback", handleLinkedInOAuth);

export default router;
