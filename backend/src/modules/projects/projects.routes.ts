import { Router } from "express";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { authenticate } from "../../middleware/authenticate";
import { requireRole } from "../../middleware/require-role";
import { validate } from "../../middleware/validate";
import { listProjectsHandler, setLeadBoardsHandler } from "./projects.controller";

export const projectsRouter = Router();

projectsRouter.use(authenticate, requireRole(UserRole.ADMIN));

projectsRouter.get("/", listProjectsHandler);

projectsRouter.put(
  "/leads/:leadId/boards",
  validate({ params: z.object({ leadId: z.string().uuid() }), body: z.object({ boardIds: z.array(z.string().uuid()) }) }),
  setLeadBoardsHandler
);


