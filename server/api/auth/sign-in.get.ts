export default defineEventHandler((event) => {
  const workos = getWorkOS();
  const config = useRuntimeConfig();

  const authorizationUrl = workos.userManagement.getAuthorizationUrl({
    provider: "authkit",
    clientId: getWorkOSClientId(),
    redirectUri: config.workosRedirectUri as string,
  });

  return sendRedirect(event, authorizationUrl);
});
