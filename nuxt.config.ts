// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,
  modules: ['convex-nuxt'],
  convex: {
    url: process.env.CONVEX_URL
  },
  runtimeConfig: {
    workosApiKey: process.env.WORKOS_API_KEY,
    workosClientId: process.env.WORKOS_CLIENT_ID,
    workosCookiePassword: process.env.WORKOS_COOKIE_PASSWORD,
    workosRedirectUri: process.env.WORKOS_REDIRECT_URI,
    public: {
      convexUrl: process.env.CONVEX_URL,
    },
  },
})