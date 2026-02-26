export default defineEventHandler((event) => {
  clearSessionCookie(event);
  return sendRedirect(event, "/");
});
