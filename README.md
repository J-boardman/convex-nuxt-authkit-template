# Convex Nuxt Template

A minimal [Nuxt](https://nuxt.com) starter template with [Convex](https://convex.dev) using the [convex-nuxt](https://www.npmjs.com/package/convex-nuxt) module.

## Getting Started

1. Install dependencies

   ```bash
   bun install
   ```

2. Set up a Convex dev deployment

   Run `npx convex dev`. This will prompt you to log in with GitHub, create a project, and save your production and deployment URLs.

   The `dev` command will then continue running to sync your functions with your dev deployment in the cloud.

   ```bash
   npx convex dev
   ```

3. Add sample data to your database

   In a new terminal window, create a `sampleData.jsonl` file with some sample data.

   ```jsonl
   {"text": "Buy groceries", "isCompleted": true}
   {"text": "Go for a swim", "isCompleted": true}
   {"text": "Integrate Convex", "isCompleted": false}
   ```

   Then import it into your Convex database:

   ```bash
   npx convex import --table tasks sampleData.jsonl
   ```

4. Start the app

   In a new terminal window, start the development server and open [http://localhost:3000](http://localhost:3000):

   ```bash
   bun run dev
   ```
