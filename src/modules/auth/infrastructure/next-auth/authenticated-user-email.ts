import type { GetServerSidePropsContext, NextApiRequest } from "next";
import { getToken } from "next-auth/jwt";

import { getGoogleOAuthServerConfig } from "../oauth/google-oauth-config";
import {
  GoogleOAuthAuthenticationError,
  GoogleOAuthConfigurationError,
} from "../oauth/google-oauth-token";

type ServerAuthRequest = GetServerSidePropsContext["req"] | NextApiRequest;
type GetJwtImplementation = typeof getToken;

type NextAuthJwtPayload = {
  email?: string | null;
};

export async function getAuthenticatedUserEmailFromRequest(
  request: ServerAuthRequest,
  dependencies: {
    getJwt?: GetJwtImplementation;
  } = {},
): Promise<string> {
  const googleOAuthServerConfig = getGoogleOAuthServerConfig();

  if (!googleOAuthServerConfig) {
    throw new GoogleOAuthConfigurationError(
      "authenticated-user-email:missing NEXTAUTH_SECRET server configuration.",
    );
  }

  const token = (await (dependencies.getJwt ?? getToken)({
    req: request as Parameters<GetJwtImplementation>[0]["req"],
    secret: googleOAuthServerConfig.nextAuthSecret,
  })) as NextAuthJwtPayload | null;
  const userEmail = token?.email?.trim().toLowerCase();

  if (!userEmail) {
    throw new GoogleOAuthAuthenticationError(
      "authenticated-user-email:request requires an authenticated Google session with email information.",
    );
  }

  return userEmail;
}
