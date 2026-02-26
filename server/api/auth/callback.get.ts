export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const code = query.code as string | undefined;

  if (!code) {
    throw createError({ statusCode: 400, statusMessage: "Missing code parameter" });
  }

  const workos = getWorkOS();

  const { accessToken, refreshToken, user } =
    await workos.userManagement.authenticateWithCode({
      clientId: getWorkOSClientId(),
      code,
    });

  // Decode expiry from JWT payload
  const jwtParts = accessToken.split(".");
  const payload = JSON.parse(
    Buffer.from(jwtParts[1]!, "base64url").toString()
  );

  const session: Session = {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      profilePictureUrl: user.profilePictureUrl,
      firstName: user.firstName,
      lastName: user.lastName,
      object: "user",
    },
    expiresAt: payload.exp * 1000,
  };

  await setSession(event, session);

  return sendRedirect(event, "/");
});
