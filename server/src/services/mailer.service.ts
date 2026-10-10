// Email delivery seam.
//
// The project has no mail provider yet (no SMTP/Resend/Postmark keys, and
// the coursework constraints rule out managed auth services). Until one is
// configured, "sending" logs the message to the server console and the
// caller decides whether to also hand the token back in the HTTP response
// (the auth controller does that only when NODE_ENV !== 'production', so
// the flows are fully testable locally without ever leaking tokens in a
// deployed build).
//
// To go live: implement send_email with a real provider and set e.g.
// SMTP_URL / RESEND_API_KEY in config/env.ts - nothing upstream changes.

export interface OutgoingEmail {
	to: string;
	subject: string;
	text: string;
}

export async function send_email(email: OutgoingEmail): Promise<void> {
	// eslint-disable-next-line no-console
	console.log(
		`[mailer:stub] to=${email.to} subject=${email.subject}\n${email.text
			.split("\n")
			.map((line) => `  ${line}`)
			.join("\n")}`,
	);
}
