export default defineEventHandler(async (event) => {
  const session = await getSession(event);

  if (!session) {
    return { user: null, accessToken: null };
  }

  return {
    user: session.user,
    accessToken: session.accessToken,
  };
});
