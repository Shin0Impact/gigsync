import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { get_discovery_handler, get_timeline_handler } from "../controllers/feed.controller";

const router = Router();

// Homepage feeds (frontend "Timeline + Discovery"). Both return the same
// discriminated-union item shape ({ items: FeedItem[] }), newest first,
// with optional ?limit= (default 20, max 50) and ?offset= pagination.
// - timeline: work updates + events from accounts the viewer follows (auth)
// - discovery: work updates + events from every account (public)
router.get("/timeline", requireAuth, get_timeline_handler);
router.get("/discovery", get_discovery_handler);

export default router;
