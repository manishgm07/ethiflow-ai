<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- In-app pages live under the pathless `src/routes/_console` layout (client-only, admits signed-in users or guests); public pages (`/`, `/login`, `/signup`) stay top-level. Why: session and guest flag live in browser storage.
- Role-based menus and page access come from `src/lib/navigation.ts` only; pages wrap content in `RoleGate`. Why: one source of truth, unit-tested in `src/test/navigation.test.ts`.
- Privileges live only in `public.user_roles`; signup grants commuter and only records the requested role on `profiles`. Why: never derive privileges from user-editable signup metadata.
- All UI text goes through react-i18next with matching keys in `src/lib/i18n/en.ts` and `kn.ts`. Why: English/Kannada parity is a product requirement.
- Display preferences (language, high contrast, text size, reduced motion, sidebar) are applied as classes/attributes on `<html>` via `src/lib/preferences.tsx` plus a pre-paint boot script. Why: avoids flashes and keeps styling in tokens.
