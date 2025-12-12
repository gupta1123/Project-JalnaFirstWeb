# Changes Implemented ✅ & Still Needed

An actionable checklist to finalize and harden the my Jalna Admin Panel. Items are grouped by priority with file pointers.

## ✅ COMPLETED: Critical Updates

### API & Backend Integration
- ✅ **Updated API base URL** to match actual backend: `https://jalnafirst-d1c348495722.herokuapp.com`
- ✅ **Added all missing endpoints** from api.md: Staff management, Teams, Ticket attachments, User stats
- ✅ **Updated TypeScript types** to match backend response shapes (User, Ticket, Team types)
- ✅ **Enhanced error handling** with centralized SWR fetcher and 401 interceptor
- ✅ **Prepared for secure auth** with `withCredentials: true` and response interceptor

### Security & Configuration  
- ✅ **Added security headers** in `next.config.ts`: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- ✅ **Created environment config** with `env.example` for API base URL
- ✅ **Updated image domains** to include res.cloudinary.com and images.unsplash.com

### UX & Error Handling
- ✅ **Added error boundaries**: Global error page (`src/app/error.tsx`) and 404 page (`src/app/not-found.tsx`)
- ✅ **Added loading states** for heavy list pages: Users and Complaints loading skeletons
- ✅ **Fixed navigation** to use proper `Link` components instead of anchor tags

## 🔄 STILL NEEDED: Final Polish

### Authentication Security (Backend Coordination Required)
- [ ] **Switch to httpOnly cookies** (requires backend to set secure cookies):
  - Backend must set httpOnly cookies on login success
  - Remove `setAuthToken(res.token)` from login form once backend supports cookies
  - Current implementation keeps token fallback for compatibility

### Code Quality & Maintenance
- [ ] **Remove unused dependencies**:
  - `next-safe-action` appears unused; remove from package.json
- [ ] **Clean up TODO comments** in codebase:
  - Remove development comments from `src/lib/api.ts` and pages
- [ ] **Run linting** and fix any remaining issues:
  ```bash
  npm run lint
  ```

### Optional Enhancements
- [ ] **Add role-based UI gates** (admin vs superadmin) in sidebar and pages
- [ ] **Add staff and teams management pages** (endpoints are ready in API client)
- [ ] **Add ticket attachments UI** (upload/download functionality ready in API)
- [ ] **Add public robots.txt and sitemap.xml** if needed for SEO

## Cleanup
- [ ] Remove leftover comments and TODO markers
  - e.g., in `src/lib/api.ts` and feature pages (“removed”, “TODO”)
- [ ] Prune unused images in `public/` if any
- [ ] Remove unused imports/deps (run lints)

## Testing & Quality
- [ ] Enable/adjust ESLint rules for Next 15 + React 19
  - Run `npm run lint` and fix issues
- [ ] Add unit tests for utilities and hooks (e.g., `formatDateTimeSmart`, `use-auth-guard` happy/401 paths)
- [ ] Add minimal integration tests for critical flows (login, protected route redirect)
- [ ] Set up CI to run lint and build on PRs

## Documentation
- [ ] Update `README.md`
  - Environment setup (`.env.local`), running locally, build, and deployment notes
  - Auth model (cookie-based vs token header) and security headers

---

## File-level guidance (snippets to implement)

### next.config.ts (image domains)
Add Unsplash images if using `next/image` for the login banner:

```ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "res.cloudinary.com" },
    { protocol: "https", hostname: "images.unsplash.com" },
  ],
},
```

### src/lib/api.ts (cookie-based auth)
- Set `withCredentials: true`
- Remove the Authorization interceptor and `setAuthToken` usage in UI
- Add a response interceptor for 401 redirects

```ts
export const api = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401 && typeof window !== "undefined") {
      try { Cookies.remove("ss_token"); } catch {}
      const next = window.location.pathname || "/";
      window.location.href = `/login?next=${encodeURIComponent(next)}`;
    }
    return Promise.reject(err);
  }
);
```

### src/components/login-form.tsx (stop setting token manually)
- Remove `setAuthToken(res.token)`
- After successful `login`, just redirect (cookie will be set by backend)

### src/components/AppSidebar.tsx (internal nav)
- Replace brand `<a href="#">` with `Link` to a real route (e.g., `/dashboard`)

```tsx
<SidebarMenuButton size="lg" asChild>
  <Link href="/dashboard" className="flex items-center gap-2">
    {/* ... */}
  </Link>
</SidebarMenuButton>
```

### Add boundaries
- `src/app/error.tsx`, `src/app/not-found.tsx`, and relevant `loading.tsx` files for large lists

```tsx
// src/app/error.tsx
"use client";
export default function GlobalError({ error }: { error: unknown }) {
  return <div className="p-6">Something went wrong</div>;
}
```

## Optional Enhancements
- Role-based UI gates (admin vs superadmin) in sidebar and pages
- Analytics/logging for admin actions (note additions, status changes)

---

Keep this checklist updated as backend endpoints solidify. Once auth is switched to server cookies and headers are in place, the app will be production-ready.
