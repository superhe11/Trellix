import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import {
  loginHandler,
  logoutHandler,
  meHandler,
  refreshHandler,
  registerHandler,
} from "./auth.controller";
import { loginSchema, registerSchema } from "./auth.validation";

export const authRouter = Router();

authRouter.post("/register", validate({ body: registerSchema }), registerHandler);

authRouter.post("/login", validate({ body: loginSchema }), loginHandler);

authRouter.post("/refresh", refreshHandler);

authRouter.post("/logout", logoutHandler);

authRouter.get("/me", authenticate, meHandler);
