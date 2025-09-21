import { UserRole } from "@prisma/client";

declare global {
  namespace Express {
    interface UserPayload {
      userId: string;
      role: UserRole;
      email: string;
      fullName: string;
    }

    interface Request {
      user?: UserPayload;
      tokenId?: string;
    }
  }
}

export {};
