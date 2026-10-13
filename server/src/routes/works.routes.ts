import { Router } from "express";
import { optionalAuth, requireAuth, requireRole } from "../middleware/auth.middleware";
import {
	add_comment_handler,
	add_update_media_handler,
	add_work_update_handler,
	create_work_handler,
	delete_comment_handler,
	delete_update_media_handler,
	get_work_or_user_works_handler,
	delete_work_handler,
	get_like_status_handler,
	like_work_handler,
	list_comments_handler,
	list_update_media_handler,
	list_work_updates_handler,
	list_works_feed_handler,
	list_works_handler,
	unlike_work_handler,
	get_composition_handler,
} from "../controllers/works.controller";

const router = Router();

// "Works" - an artist's portfolio (card #78 follow-up). A Work is a
// project; each Work has versioned Updates (progress posts); each Update
// can carry R2-backed media (same two-step upload-url flow as event media
// and showcases). Likes/comments/follows stay out of scope for now - see
// server/src/db/social.queries.ts for the read-only scaffolding Kareem
// already has for those.
router.post("/", requireAuth, requireRole("artist"), create_work_handler);

// GET /:identifier - one route, two reads: a user UUID returns that user's
// works list; a numeric work id returns the single work with updates and
// media embedded (work detail page). See the controller for the contract.
router.get("/:identifier", get_work_or_user_works_handler);
// and showcases).
//
// Likes/comments (2026-10-11): implemented below on top of Kareem's
// read-only scaffolding in server/src/db/social.queries.ts.
router.post("/", requireAuth, requireRole("artist"), create_work_handler);
router.get("/:userId", list_works_handler);
router.delete("/:workId", requireAuth, requireRole("artist"), delete_work_handler);

router.post("/:workId/updates", requireAuth, requireRole("artist"), add_work_update_handler);
router.get("/:workId/updates", list_work_updates_handler);

router.post("/updates/:updateId/media", requireAuth, requireRole("artist"), add_update_media_handler);
router.get("/updates/:updateId/media", list_update_media_handler);
router.delete("/updates/:updateId/media/:mediaId", requireAuth, requireRole("artist"), delete_update_media_handler);

// Explore / following feed - GET /api/works (not /api/works/:userId, so it
// has to be registered separately; no path collision since it's zero
// path segments vs. one). ?scope=following requires auth, ?scope=explore
// (default) is public but still personalizes likedByMe when signed in.
router.get("/", list_works_feed_handler);

// Likes - toggle via POST/DELETE rather than a single PATCH, matching the
// showcase add/delete and event apply patterns already used elsewhere.
router.get("/:workId/like", optionalAuth, get_like_status_handler);
router.post("/:workId/like", requireAuth, like_work_handler);
router.delete("/:workId/like", requireAuth, unlike_work_handler);

// Comments - anyone signed in can comment (not artist-only; a fan or
// organizer should be able to comment on an artist's work), but only the
// comment's own author can delete it (enforced in works.service.ts).
router.post("/:workId/comments", requireAuth, add_comment_handler);
router.get("/:workId/comments", list_comments_handler);
router.delete("/comments/:commentId", requireAuth, delete_comment_handler);

router.get("/:workId/composition", get_composition_handler);

export default router;
