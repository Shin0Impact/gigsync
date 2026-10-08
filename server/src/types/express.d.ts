import { AuthTokenPayload } from "./index"; // Adjust path to types/index.ts if needed

declare global {
	namespace Express {
		interface Request {
			user?: AuthTokenPayload;
		}
	}
}
