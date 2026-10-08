# Lesotho Library Community — React

A web-based library management system for a community library, built with
React. A librarian can manage the book catalog, track stock, and handle
members; members log in, browse what's available, and order a book to
borrow. Everything is saved in the browser's `localStorage`, which acts as
a simple local "database" — there's no backend.

This is the React rewrite of my earlier DOM version. Same features, rebuilt
around components, hooks and React Router instead of
`document.createElement` and hidden `<section>` elements.

## Getting it running

```bash
npm install     # only needed if node_modules is missing
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

To reset everything to a blank slate, open dev tools → Application → Local
Storage and clear the site's data, or open the app in a fresh incognito
window.

Demo admin password: `library2026`.

## How it's put together

```
src/
  main.jsx                  mounts <App> inside the provider and the router
  App.jsx                   all the routes, plus the two route guards
  context/
    LibraryContext.jsx      every collection + every action that changes one
  hooks/
    useLocalStorage.js      useState + useEffect kept in sync with storage
  library/
    constants.js            storage keys, borrow rules, districts, prices
    helpers.js              ids, dates, ISBN/URL checks, book predicates
    validation.js           one validator per form, returns { field: error }
  components/
    Layout.jsx              sidebar + <Outlet /> for the current page
    uiComponents.jsx        Field, PasswordInput, Stamp, TableWrap, Toast…
    BookCard.jsx            catalog card incl. buy / download flow
    OnlineBookCard.jsx      card for link-only titles
  pages/
    Dashboard.jsx           stats strip + free/paid card grids
    BookManagement.jsx      book CRUD + online-book CRUD (staff only)
    Transactions.jsx        stock in/out, member orders, loans, history
    OnlineBooks.jsx         browse the linked titles
    Membership.jsx          log in, sign up, profile, admin area
```

### Where the React concepts show up

- **Hooks** — `useState` for every form and toggle, `useEffect` inside
  `useLocalStorage` to persist on change and inside `Toast` to run the
  fade-out timers (with cleanup, so a new toast cancels the old one),
  `useMemo` for derived values like the dashboard stats and the list of
  outstanding loans, `useCallback` for the actions on the context.
- **Lifecycle via hooks** — `useEffect(..., [key, value])` is the
  componentDidUpdate equivalent: it runs after any render where the value
  changed and writes it back to storage. The cleanup function returned from
  the toast effect is componentWillUnmount.
- **Component composition** — `Field`, `PasswordInput`, `TableWrap`,
  `Stamp` and `EmptyRow` are reused across every page, so forms and tables
  are assembled rather than repeated.
- **Forms** — all controlled. Each input reads its value from state and
  writes back through `onChange`, so state is the single source of truth;
  validation runs on submit and the errors object drives what each field
  shows. Some fields clean themselves as you type (names strip digits, ID
  numbers strip non-digits).
- **React Router** — five real URLs (`/`, `/books`, `/transactions`,
  `/online`, `/members`) with a shared `Layout` and `<Outlet />`. Two
  guards wrap the routes: `RequireAuth` bounces logged-out visitors to
  `/members`, `RequireStaff` keeps non-staff off Book Management.

### Why there's a context

In the DOM version, `BookStore`, `UserStore` and friends read and wrote
`localStorage` directly, and every change ended with a manual call to
`renderBookTable()` or similar to repaint. React can't work that way —
nothing would re-render. So the collections live in state in
`LibraryContext`, at the top of the tree, and pages read them through
`useLibrary()`. Adding a book now re-renders the dashboard, the catalog
table and the transactions dropdown on its own.

## What it can do

**Book Management (staff only)** — add, edit and delete books (title,
author, genre, ISBN, quantity, optional price). A book can carry an
attached file (PDF, EPUB…) that members download once they have access, or
you can add a link-only title under "Online Books" instead.

**Availability & transactions** — every movement of stock is logged. Staff
get a stock in/out form plus a running history; members get "Order a Book",
where they pick a title and confirm it's them with their ID number, and one
copy comes off the shelf. Each order gets a 14-day due date, and a member
can hold at most 3 books at once. Members see their own loans under "My
Borrowed Books" with a Return button; staff see every loan under
"Outstanding Loans" and can mark returns from there too.

**Membership** — anyone can apply through Sign Up (name, ID number, age,
district, address, password). You need to be 12 or older and live in one of
Lesotho's 10 districts. Applications sit as "pending" until a librarian
approves them, at which point a membership ID is assigned and the member
can log in.

**Administrator area** — password-protected. Approve or reject membership
applications, confirm proof-of-payment for paid books, and manage the
member register. The admin password has to be typed fresh every page load;
it isn't remembered between visits.

## A few honest caveats

Built to satisfy the brief (React + local storage as the "database")
rather than to be production-ready:

- **Passwords aren't encrypted.** They sit in `localStorage` as plain
  text. A real system would hash them and never let the client touch the
  database directly.
- **The admin password is hardcoded** in `src/lib/constants.js`. Anyone
  who opens dev tools can read it.
- **Everything is per-browser.** No server, so the catalog and member list
  only exist in whichever browser created them.
- **`localStorage` has a small quota** (5–10MB per site), and uploaded
  files are stored as base64, which is bulkier than the original. That's
  why uploads are capped at 2MB each.
