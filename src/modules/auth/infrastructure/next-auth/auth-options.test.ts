describe("authOptions", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      GOOGLE_CLIENT_ID: "google-client-id",
      GOOGLE_CLIENT_SECRET: "google-client-secret",
      NEXTAUTH_SECRET: "next-auth-secret",
      NEXTAUTH_URL: "http://localhost:3000",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("logs when Google token refresh fails in the jwt callback", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    await jest.isolateModulesAsync(async () => {
      jest.doMock("../oauth/google-oauth-token", () => {
        const actual = jest.requireActual("../oauth/google-oauth-token");

        return {
          ...actual,
          hasExpiredGoogleAccessToken: jest.fn(() => true),
          refreshGoogleSessionToken: jest.fn().mockRejectedValue(
            new Error("refresh failed"),
          ),
        };
      });

      const { authOptions } = await import("./auth-options");

      const result = await authOptions.callbacks?.jwt?.({
        account: null,
        token: {
          googleAccessToken: "expired-access-token",
          googleAccessTokenExpiresAt: 1,
          googleRefreshToken: "refresh-token",
        },
        user: {
          id: "google-user-123",
        } as never,
      });

      expect(result).toEqual(
        expect.objectContaining({
          googleTokenError: "RefreshGoogleAccessTokenError",
        }),
      );
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
