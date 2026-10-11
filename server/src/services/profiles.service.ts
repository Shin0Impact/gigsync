import {
	createFollow,
	deleteFollow,
	getFollowerCount,
	getRecentCommentsOnMyWorks,
	getRecentLikesOnMyWorks,
	getRecentNewFollowers,
	isFollowing,
} from "../db/social.queries";
import { find_profile_by_user_name } from "../db/queries/profiles.queries";
import { find_role_by_user_id } from "../db/queries/roles.queries";
import { list_my_applications } from "./events.service";
import {
	is_profile_verified,
	list_social_links_for_user,
} from "../db/queries/verification.queries";
import { ActivityItem, ProfileSummary } from "../types";

// Profiles (2026-10-11) - public profile lookup by username, plus the
// follow/unfollow write path. Neither existed before: the username lookup
// query (find_profile_by_user_name) was written but never called from any
// route, and `followings` only had Kareem's read-only scaffolding in
// social.queries.ts. The derived "my activity" feed at the bottom stands
// in for a notifications table, which doesn't exist on the live schema.

export async function get_profile_by_username(
	username: string,
	viewerId: string | null,
) : Promise<ProfileSummary> {
	const row = await find_profile_by_user_name(username);
	if (!row) {
		throw new Error("Profile not found");
	}

	const isOwnProfile = viewerId !== null && viewerId === row.user_id;

	const [roleRecord, isVerified, socialLinks, followersCount, isFollowedByMe] = await Promise.all([
		find_role_by_user_id(row.user_id),
		is_profile_verified(row.user_id),
		list_social_links_for_user(row.user_id),
		getFollowerCount(row.user_id),
		viewerId && !isOwnProfile ? isFollowing(viewerId, row.user_id) : Promise.resolve(false),
	]);

	return {
		userId: row.user_id,
		userName: row.user_name,
		name: row.name,
		avatarUrl: row.avatar_url,
		artistsType: row.artists_type,
		role: roleRecord?.role ?? null,
		followersCount,
		isVerified,
		isFollowedByMe,
		isOwnProfile,
		socialLinks,
		createdAt: row.created_at,
	};
}

export async function follow_profile(followerId: string, username: string) {
	const target = await find_profile_by_user_name(username);
	if (!target) {
		throw new Error("Profile not found");
	}
	if (target.user_id === followerId) {
		throw new Error("You cannot follow yourself");
	}

	await createFollow(followerId, target.user_id);
	const followersCount = await getFollowerCount(target.user_id);
	return { following: true, followersCount };
}

export async function unfollow_profile(followerId: string, username: string) {
	const target = await find_profile_by_user_name(username);
	if (!target) {
		throw new Error("Profile not found");
	}

	await deleteFollow(followerId, target.user_id);
	const followersCount = await getFollowerCount(target.user_id);
	return { following: false, followersCount };
}

const ACTIVITY_LIMIT_PER_SOURCE = 15;
const ACTIVITY_LIMIT_TOTAL = 40;

// Merges likes/comments/new-followers/application-decisions into one
// reverse-chronological list. Each source is capped individually so one
// very active work can't crowd out everything else, then the combined
// list is capped again after sorting.
export async function get_my_activity(userId: string): Promise<ActivityItem[]> {
	const [likes, comments, followers, applications] = await Promise.all([
		getRecentLikesOnMyWorks(userId, ACTIVITY_LIMIT_PER_SOURCE),
		getRecentCommentsOnMyWorks(userId, ACTIVITY_LIMIT_PER_SOURCE),
		getRecentNewFollowers(userId, ACTIVITY_LIMIT_PER_SOURCE),
		list_my_applications(userId),
	]);

	const items: ActivityItem[] = [];

	for (const like of likes) {
		items.push({
			id: `like-${like.id}`,
			type: "like",
			createdAt: like.created_at,
			actor: { userId: like.liker_id, userName: like.liker_name, avatarUrl: like.liker_avatar },
			workId: like.work_id,
		});
	}

	for (const comment of comments) {
		items.push({
			id: `comment-${comment.id}`,
			type: "comment",
			createdAt: comment.created_at,
			actor: {
				userId: comment.commenter_id,
				userName: comment.commenter_name,
				avatarUrl: comment.commenter_avatar,
			},
			workId: comment.work_id,
			commentContent: comment.content,
		});
	}

	for (const follower of followers) {
		items.push({
			id: `follow-${follower.id}`,
			type: "follow",
			createdAt: follower.created_at,
			actor: {
				userId: follower.follower_id,
				userName: follower.follower_name,
				avatarUrl: follower.follower_avatar,
			},
		});
	}

	for (const application of applications) {
		if (application.status !== "accepted" && application.status !== "rejected") {
			continue;
		}
		items.push({
			id: `application-${application.id}`,
			type: application.status === "accepted" ? "application_accepted" : "application_rejected",
			createdAt: application.updated_at.toString(),
			actor: null,
			eventId: application.event_id,
			eventTitle: application.event_title,
		});
	}

	items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

	return items.slice(0, ACTIVITY_LIMIT_TOTAL);
}
