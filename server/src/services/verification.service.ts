import {
  count_social_links_for_user,
  create_social_link,
  create_verification_request,
  decide_verification_request,
  find_active_verification_request_for_user,
  find_verification_request_by_id,
  is_profile_verified,
  list_pending_verification_requests,
  list_social_links_for_user,
  set_profile_verified,
  VerificationStatus,
} from '../db/queries/verification.queries';
import { find_role_by_user_id } from '../db/queries/roles.queries';
import { list_events } from '../db/queries/events.queries';
import { getWorksByUser } from '../db/social.queries';
import {
  get_id_document_view_url,
  request_id_document_upload_url,
  RequestIdDocumentUploadUrlInput,
} from './media.service';

// Eligibility bar (card #82): at least one social link connected (a
// placeholder for real OAuth connecting, which isn't built yet - for now
// this is just a self-reported platform + URL), at least 3 prior
// works (artists) or events (organizers), and an uploaded ID document
// (stored in a separate private R2 bucket, viewed only by a moderator via
// a short-lived presigned URL - see media.service.ts). Bump these if the
// product call changes; nothing else ties the numbers to 1/3.
const MIN_SOCIAL_LINKS = 1;
const MIN_PRIOR_WORK = 3;

export interface AddSocialLinkInput {
  platform: string;
  url: string;
}

export async function add_social_link(userId: string, input: AddSocialLinkInput) {
  const { platform, url } = input;

  if (!platform || !url) {
    throw new Error('platform and url are required');
  }

  return create_social_link(userId, platform, url);
}

export async function get_social_links_for_user(userId: string) {
  return list_social_links_for_user(userId);
}

async function count_prior_work_for_user(userId: string): Promise<{ role: string; count: number }> {
  const roleRecord = await find_role_by_user_id(userId);

  if (!roleRecord) {
    throw new Error('User role not found');
  }

  if (roleRecord.role === 'artist') {
    const works = await getWorksByUser(userId);
    return { role: 'artist', count: works.length };
  }

  if (roleRecord.role === 'organizer') {
    const events = await list_events({ organizerId: userId });
    return { role: 'organizer', count: events.length };
  }

  throw new Error('Only artists and organizers can request verification');
}

// Thin wrapper so callers only import from verification.service, not
// media.service directly. Anyone authenticated can request an upload URL -
// eligibility (social links / prior work) is only checked when they
// actually submit the request below, not at upload time.
export async function get_id_document_upload_url(input: RequestIdDocumentUploadUrlInput) {
  return request_id_document_upload_url(input);
}

export interface SubmitVerificationInput {
  idDocumentObjectKey: string;
}

export async function submit_verification_request(userId: string, input: SubmitVerificationInput) {
  const { idDocumentObjectKey } = input;

  if (!idDocumentObjectKey) {
    throw new Error('idDocumentObjectKey is required');
  }

  const existing = await find_active_verification_request_for_user(userId);
  if (existing) {
    throw new Error(
      existing.status === 'approved' ? 'You are already verified' : 'You already have a pending verification request',
    );
  }

  const socialLinkCount = await count_social_links_for_user(userId);
  if (socialLinkCount < MIN_SOCIAL_LINKS) {
    throw new Error(`Connect at least ${MIN_SOCIAL_LINKS} social link before requesting verification`);
  }

  const { role, count } = await count_prior_work_for_user(userId);
  if (count < MIN_PRIOR_WORK) {
    throw new Error(
      `You need at least ${MIN_PRIOR_WORK} ${role === 'artist' ? 'works' : 'events'} before requesting verification (you have ${count})`,
    );
  }

  return create_verification_request(userId, idDocumentObjectKey);
}

export async function get_verification_status_for_user(userId: string) {
  const isVerified = await is_profile_verified(userId);
  const activeRequest = await find_active_verification_request_for_user(userId);
  return { isVerified, request: activeRequest };
}

// Moderator/admin only - enforced by requireRole on the route, not here.
export async function get_pending_verification_requests() {
  return list_pending_verification_requests();
}

// Moderator/admin only - enforced by requireRole on the route, not here.
// Looks the request up first so a bad id gives a clean 404 instead of a
// presign attempt against a made-up key.
export async function get_id_document_view_url_for_request(requestId: string): Promise<string> {
  const request = await find_verification_request_by_id(requestId);
  if (!request) {
    throw new Error('Verification request not found');
  }

  return get_id_document_view_url(request.id_document_key);
}

export interface ReviewVerificationInput {
  status: VerificationStatus;
  notes?: string | null;
}

export async function review_verification_request(
  moderatorId: string,
  requestId: string,
  input: ReviewVerificationInput,
) {
  const { status, notes = null } = input;

  if (status !== 'approved' && status !== 'rejected') {
    throw new Error("status must be 'approved' or 'rejected'");
  }

  const request = await find_verification_request_by_id(requestId);
  if (!request) {
    throw new Error('Verification request not found');
  }

  if (request.status !== 'pending') {
    throw new Error('This request has already been reviewed');
  }

  const updated = await decide_verification_request(requestId, status, moderatorId, notes);

  if (status === 'approved') {
    await set_profile_verified(request.user_id, true);
  }

  return updated;
}
