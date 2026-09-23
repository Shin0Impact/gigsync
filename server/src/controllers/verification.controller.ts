import { Request, Response } from 'express';
import {
  add_social_link,
  get_id_document_upload_url,
  get_id_document_view_url_for_request,
  get_pending_verification_requests,
  get_social_links_for_user,
  get_verification_status_for_user,
  review_verification_request,
  submit_verification_request,
} from '../services/verification.service';

const NOT_FOUND_MESSAGES = ['User role not found', 'Verification request not found'];
const CONFLICT_MESSAGES = [
  'You are already verified',
  'You already have a pending verification request',
  'This request has already been reviewed',
];

function handle_known_error(error: unknown, res: Response, fallback: string) {
  if (error instanceof Error) {
    if (NOT_FOUND_MESSAGES.includes(error.message)) {
      return res.status(404).json({ error: error.message });
    }
    if (
      CONFLICT_MESSAGES.includes(error.message) ||
      error.message.startsWith('Connect at least') ||
      error.message.startsWith('You need at least')
    ) {
      return res.status(409).json({ error: error.message });
    }
    if (
      error.message.includes('required') ||
      error.message.startsWith('Only artists and organizers') ||
      error.message.startsWith('status must be') ||
      error.message.startsWith('Unsupported contentType') ||
      error.message.startsWith('ID document uploads are not configured')
    ) {
      return res.status(400).json({ error: error.message });
    }
  }

  console.error(fallback, error);
  return res.status(500).json({ error: fallback });
}

export async function add_social_link_handler(req: Request, res: Response) {
  try {
    const link = await add_social_link(req.user!.userId, req.body);
    return res.status(201).json({ link });
  } catch (error) {
    return handle_known_error(error, res, 'Failed to add social link');
  }
}

export async function list_social_links_handler(req: Request, res: Response) {
  const links = await get_social_links_for_user(req.params.userId);
  return res.status(200).json({ links });
}

// Any authenticated user can request an ID-document upload URL - the file
// only becomes meaningful once its objectKey is attached to a submitted
// verification request below. Uploads go straight to a private R2 bucket
// with no public dev URL (card #82).
export async function request_id_document_upload_url_handler(req: Request, res: Response) {
  try {
    const result = await get_id_document_upload_url(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return handle_known_error(error, res, 'Failed to create ID document upload URL');
  }
}

export async function submit_verification_request_handler(req: Request, res: Response) {
  try {
    const request = await submit_verification_request(req.user!.userId, req.body);
    return res.status(201).json({ request });
  } catch (error) {
    return handle_known_error(error, res, 'Failed to submit verification request');
  }
}

export async function get_verification_status_handler(req: Request, res: Response) {
  const status = await get_verification_status_for_user(req.params.userId);
  return res.status(200).json(status);
}

export async function list_pending_verification_requests_handler(_req: Request, res: Response) {
  const requests = await get_pending_verification_requests();
  return res.status(200).json({ requests });
}

// Moderator/admin only (route-gated). Returns a short-lived (5 min)
// presigned GET URL for the request's ID document - never a permanent or
// public link.
export async function get_id_document_view_url_handler(req: Request, res: Response) {
  try {
    const url = await get_id_document_view_url_for_request(req.params.id);
    return res.status(200).json({ url, expiresInSeconds: 300 });
  } catch (error) {
    return handle_known_error(error, res, 'Failed to create ID document view URL');
  }
}

export async function review_verification_request_handler(req: Request, res: Response) {
  try {
    const request = await review_verification_request(req.user!.userId, req.params.id, req.body);
    return res.status(200).json({ request });
  } catch (error) {
    return handle_known_error(error, res, 'Failed to review verification request');
  }
}
