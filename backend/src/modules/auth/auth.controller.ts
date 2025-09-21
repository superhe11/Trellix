import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/async-handler";
import { HttpError } from "../../utils/http-error";
import { durationToMs } from "../../utils/time";
import { env } from "../../env";
import {
  getProfile,
  loginUser,
  logoutSession,
  refreshSession,
  registerUser,
} from "./auth.service";

const REFRESH_COOKIE = "trellix_refresh_token";

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: env.COOKIE_SAME_SITE,
  secure: env.COOKIE_SECURE,
  domain: env.COOKIE_DOMAIN,
  path: "/",
  maxAge: durationToMs(env.REFRESH_TOKEN_TTL),
} as const;

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions);
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, {
    domain: env.COOKIE_DOMAIN,
    path: "/",
    sameSite: env.COOKIE_SAME_SITE,
    secure: env.COOKIE_SECURE,
  });
}

export const registerHandler = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await registerUser(req.body);
  setRefreshCookie(res, refreshToken);
  res.status(201).json({ user, accessToken });
});

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const { user, accessToken, refreshToken } = await loginUser(req.body.email, req.body.password);
  setRefreshCookie(res, refreshToken);
  res.json({ user, accessToken });
});

export const refreshHandler = asyncHandler(async (req: Request, res: Response) => {
  const tokenFromCookie = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  const tokenFromBody = typeof req.body?.refreshToken === "string" ? req.body.refreshToken : undefined;

  const token = tokenFromCookie ?? tokenFromBody;

  if (!token) {
    throw new HttpError(401, "Refresh токен отсутствует", { code: "REFRESH_TOKEN_REQUIRED" });
  }

  const { user, accessToken, refreshToken } = await refreshSession(token);
  setRefreshCookie(res, refreshToken);
  res.json({ user, accessToken });
});

export const logoutHandler = asyncHandler(async (req: Request, res: Response) => {
  const token = (req.cookies?.[REFRESH_COOKIE] as string) || req.body.refreshToken;
  if (token) {
    await logoutSession(token);
  }
  clearRefreshCookie(res);
  res.status(204).send();
});

export const meHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new HttpError(401, "Требуется авторизация", { code: "UNAUTHORIZED" });
  }
  const profile = await getProfile(req.user.userId);
  res.json({ user: profile });
});
