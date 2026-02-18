# Convex + Nuxt + WorkOS AuthKit

A [Nuxt](https://nuxt.com) starter template with [Convex](https://convex.dev) and [WorkOS AuthKit](https://workos.com/authkit) authentication, using [convex-nuxt](https://www.npmjs.com/package/convex-nuxt) and [@workos-inc/authkit-js](https://www.npmjs.com/package/@workos-inc/authkit-js).

## Prerequisites

- A [Convex](https://convex.dev) account
- A [WorkOS](https://workos.com) account with an AuthKit-enabled project

## Getting Started

1. Install dependencies

   ```bash
   bun install
   ```

2. Set up WorkOS

   In the [WorkOS Dashboard](https://dashboard.workos.com):

   - Go to **Redirects** and add `http://localhost:3000/callback`
   - Copy your **Client ID** from the dashboard

3. Create `.env.local`

   ```env
   CONVEX_URL=<your convex deployment url>
   WORKOS_CLIENT_ID=client_...
   WORKOS_REDIRECT_URI=http://localhost:3000/callback
   ```

4. Set up Convex

   Run `npx convex dev` to create a project (if you haven't already) and start syncing your functions. This will deploy `convex/auth.config.ts` which configures JWT validation for WorkOS tokens.

   ```bash
   npx convex dev
   ```

   Then set your WorkOS Client ID as an environment variable in Convex:

   ```bash
   npx convex env set WORKOS_CLIENT_ID client_...
   ```

5. Start the app

   In a new terminal, start the dev server:

   ```bash
   bun run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Click **Sign In** to authenticate via WorkOS AuthKit.

## How It Works

### Auth Flow

1. On page load, the `workos-authkit` client plugin initializes the WorkOS client and restores any existing session
2. If the user is authenticated, the plugin bridges the WorkOS access token to Convex via `ConvexClient.setAuth()`
3. Convex validates the JWT against WorkOS's JWKS endpoint (configured in `convex/auth.config.ts`)
4. Once validated, `useConvexAuth().isAuthenticated` becomes `true` and authenticated queries/mutations work

### Key Files

| File | Purpose |
|------|---------|
| `app/plugins/workos-authkit.client.ts` | Initializes WorkOS client, bridges tokens to Convex |
| `app/composables/useAuth.ts` | WorkOS auth state (`user`, `signIn`, `signOut`, etc.) |
| `app/composables/useConvexAuth.ts` | Convex auth state (`isLoading`, `isAuthenticated`) |
| `app/components/Authenticated.vue` | Renders slot when authenticated |
| `app/components/Unauthenticated.vue` | Renders slot when not authenticated |
| `app/components/AuthLoading.vue` | Renders slot while auth is loading |
| `app/pages/callback.vue` | OAuth redirect handler |
| `convex/auth.config.ts` | JWT validation config for Convex |

### Composables

```vue
<script setup>
// WorkOS auth state
const { user, signIn, signOut, isLoading } = useAuth();

// Convex auth state (true after Convex validates the token)
const { isAuthenticated, isLoading: convexLoading } = useConvexAuth();
</script>
```

### Slot-Based Components

```vue
<AuthLoading>
  <p>Loading...</p>
</AuthLoading>

<Unauthenticated>
  <button @click="signIn()">Sign In</button>
</Unauthenticated>

<Authenticated>
  <p>Welcome, {{ user?.email }}</p>
</Authenticated>
```

### Authenticated Convex Functions

Use `ctx.auth.getUserIdentity()` in your Convex functions to access the authenticated user:

```ts
import { query } from "./_generated/server";

export const myQuery = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    // identity.subject is the WorkOS user ID
    return { userId: identity.subject };
  },
});
```
