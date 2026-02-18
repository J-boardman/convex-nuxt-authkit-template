// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  modules: ['convex-nuxt'],
  convex: {
    url: process.env.CONVEX_URL
  },
  runtimeConfig: {
    public: {
      workosClientId: process.env.WORKOS_CLIENT_ID,
      workosRedirectUri: process.env.WORKOS_REDIRECT_URI,
    },
  },
})