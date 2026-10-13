import { Router } from "express";
import { optionalAuth, requireAuth } from "../middleware/auth.middleware";
import {
	follow_profile_handler,
	get_my_activity_handler,
	get_profile_handler,
	unfollow_profile_handler,
} from "../controllers/profiles.controller";

const router = Router();

// Public profile lookup by username - optionalAuth so an anonymous visitor
// still sees the profile, but a signed-in viewer also gets isFollowedByMe.
// "me/activity" is registered before "/:username" so it can't be swallowed
// by that one-segment param route.
router.get("/me/activity", requireAuth, get_my_activity_handler);

router.get("/:username", optionalAuth, get_profile_handler);
router.post("/:username/follow", requireAuth, follow_profile_handler);
router.delete("/:username/follow", requireAuth, unfollow_profile_handler);

export default router;
