// Stores shared library data and handles changes to it.
import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { useLocalStorage, useSessionStorage } from '../hooks/useLocalStorage.js';
import {
  ADMIN_PASSWORD,
  BORROW_DAYS,
  DB_KEYS,
  MEMBER_SESSION_KEY,
  MIN_MEMBER_AGE,
  LESOTHO_DISTRICTS,
} from '../library/constants.js';
import { generateId, nextMembershipId } from '../library/helpers.js';

// Pages use this shared data so they update when books or users change.

const SEED_ONLINE_BOOKS = [
  {
    id: 'ob-seed-1',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    genre: 'Fiction',
    url: 'https://www.gutenberg.org/ebooks/1342',
  },
  {
    id: 'ob-seed-2',
    title: 'The Adventures of Sherlock Holmes',
    author: 'Arthur Conan Doyle',
    genre: 'Fiction',
    url: 'https://www.gutenberg.org/ebooks/1661',
  },
];

const LibraryContext = createContext(null);

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used inside <LibraryProvider>');
  return ctx;
}

export function LibraryProvider({ children }) {
  // Saved library data
  const [books, setBooks] = useLocalStorage(DB_KEYS.books, []);
  const [onlineBooks, setOnlineBooks] = useLocalStorage(DB_KEYS.onlineBooks, SEED_ONLINE_BOOKS);
  const [users, setUsers] = useLocalStorage(DB_KEYS.users, []);
  const [transactions, setTransactions] = useLocalStorage(DB_KEYS.transactions, []);
  const [purchases, setPurchases] = useLocalStorage(DB_KEYS.purchases, []);

  // Login details
  // Admins must sign in again after the page reloads.
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  // Members stay signed in when this tab is refreshed.
  const [memberId, setMemberId] = useSessionStorage(MEMBER_SESSION_KEY, null);

  // Short messages shown on screen
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message) => {
    setToast({ message, id: Date.now() });
  }, []);
  const clearToast = useCallback(() => setToast(null), []);

  const currentUser = useMemo(
    () => (memberId ? users.find((u) => u.id === memberId) || null : null),
    [memberId, users],
  );

  const isAdmin = adminLoggedIn;
  // Members and admins both count as signed in.
  const isAuthenticated = Boolean(currentUser) || isAdmin;
  // Admins and Librarians can use staff tools.
  const isStaff = isAdmin || Boolean(currentUser && currentUser.role === 'Librarian');

  // Books
  const findBook = useCallback((id) => books.find((b) => b.id === id) || null, [books]);

  const addBook = useCallback(
    (book) => {
      const record = {
        id: generateId('bk'),
        price: 0,
        fileName: null,
        fileType: null,
        fileData: null,
        ...book,
      };
      setBooks((prev) => [...prev, record]);
      return record;
    },
    [setBooks],
  );

  const updateBook = useCallback(
    (id, changes) => {
      setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, ...changes } : b)));
    },
    [setBooks],
  );

  const removeBook = useCallback(
    (id) => setBooks((prev) => prev.filter((b) => b.id !== id)),
    [setBooks],
  );

  // Online books
  const addOnlineBook = useCallback(
    (book) => setOnlineBooks((prev) => [...prev, { id: generateId('ob'), ...book }]),
    [setOnlineBooks],
  );

  const updateOnlineBook = useCallback(
    (id, changes) =>
      setOnlineBooks((prev) => prev.map((b) => (b.id === id ? { ...b, ...changes } : b))),
    [setOnlineBooks],
  );

  const removeOnlineBook = useCallback(
    (id) => setOnlineBooks((prev) => prev.filter((b) => b.id !== id)),
    [setOnlineBooks],
  );

  // Members
  const addUser = useCallback(
    (user) => {
      const record = {
        id: generateId('us'),
        status: 'approved',
        requestedAt: new Date().toISOString(),
        ...user,
      };
      setUsers((prev) => [...prev, record]);
      return record;
    },
    [setUsers],
  );

  const updateUser = useCallback(
    (id, changes) => setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...changes } : u))),
    [setUsers],
  );

  const removeUser = useCallback(
    (id) => setUsers((prev) => prev.filter((u) => u.id !== id)),
    [setUsers],
  );

  // New signup requests wait for an admin to approve them.
  const requestSignup = useCallback(
    (data) =>
      addUser({
        name: data.name,
        idNumber: data.idNumber,
        age: data.age,
        address: data.address,
        district: data.district,
        password: data.password,
        role: 'Member',
        status: 'pending',
        membershipId: null,
      }),
    [addUser],
  );

  const approveUser = useCallback(
    (id) => updateUser(id, { status: 'approved', membershipId: nextMembershipId(users) }),
    [updateUser, users],
  );

  const rejectUser = useCallback((id) => updateUser(id, { status: 'rejected' }), [updateUser]);

  // Checks whether a signup meets the age and district rules.
  const meetsRequirements = useCallback((user) => {
    const ageOk = typeof user.age === 'number' && user.age >= MIN_MEMBER_AGE;
    const districtOk = LESOTHO_DISTRICTS.includes(user.district);
    return { ageOk, districtOk, allOk: ageOk && districtOk };
  }, []);

  // Checks a member's ID number and password.
  const authenticateMember = useCallback(
    (idNumber, password) => {
      const user = users.find((u) => u.idNumber === idNumber.trim());
      if (!user) return { ok: false, reason: 'not-found' };
      if (user.password !== password) return { ok: false, reason: 'bad-password' };
      if (user.status === 'pending') return { ok: false, reason: 'pending', user };
      if (user.status === 'rejected') return { ok: false, reason: 'rejected', user };
      return { ok: true, user };
    },
    [users],
  );

  const loginMember = useCallback((userId) => setMemberId(userId), [setMemberId]);
  const logoutMember = useCallback(() => setMemberId(null), [setMemberId]);

  const loginAdmin = useCallback((password) => {
    if (password === ADMIN_PASSWORD) {
      setAdminLoggedIn(true);
      return true;
    }
    return false;
  }, []);

  const logoutAdmin = useCallback(() => setAdminLoggedIn(false), []);

  // Stock changes and loans
  const addTransaction = useCallback(
    (entry) => {
      const record = { id: generateId('tx'), date: new Date().toISOString(), ...entry };
      // Put the newest transaction at the top.
      setTransactions((prev) => [record, ...prev]);
      return record;
    },
    [setTransactions],
  );

  // Finds books members have borrowed and not returned.
  const outstandingLoans = useMemo(
    () => transactions.filter((e) => e.memberId && e.type === 'deduct' && !e.returnedAt),
    [transactions],
  );

  // Updates the stock and records the change in the history.
  const recordStockChange = useCallback(
    ({ bookId, type, quantity, note, memberId: mId, memberName, dueDate }) => {
      const book = books.find((b) => b.id === bookId);
      if (!book) return null;

      const delta = type === 'add' ? quantity : -quantity;
      const resultingStock = Math.max(0, book.quantity + delta);

      updateBook(bookId, { quantity: resultingStock });
      return addTransaction({
        bookId: book.id,
        bookTitle: book.title,
        type,
        quantity,
        resultingStock,
        note: note || '',
        memberId: mId ?? null,
        memberName: memberName ?? null,
        dueDate: dueDate ?? null,
        returnedAt: null,
      });
    },
    [books, updateBook, addTransaction],
  );

  // Adds a returned book back to stock.
  const returnLoan = useCallback(
    (loanId) => {
      const loan = transactions.find((e) => e.id === loanId);
      if (!loan || loan.returnedAt) return;

      setTransactions((prev) =>
        prev.map((t) => (t.id === loanId ? { ...t, returnedAt: new Date().toISOString() } : t)),
      );

      recordStockChange({
        bookId: loan.bookId,
        type: 'add',
        quantity: 1,
        note: `Returned by ${loan.memberName || 'member'}`,
        memberId: loan.memberId,
        memberName: loan.memberName,
      });
    },
    [transactions, setTransactions, recordStockChange],
  );

  // Borrows one book and sets its return date.
  const placeOrder = useCallback(
    (book, member) => {
      const dueDate = new Date(Date.now() + BORROW_DAYS * 24 * 60 * 60 * 1000).toISOString();
      recordStockChange({
        bookId: book.id,
        type: 'deduct',
        quantity: 1,
        note: `Ordered by ${member.name} (ID ${member.idNumber})`,
        memberId: member.id,
        memberName: member.name,
        dueDate,
      });
      return dueDate;
    },
    [recordStockChange],
  );

  // Paid book requests
  const addPurchase = useCallback(
    (entry) => {
      const record = {
        id: generateId('pu'),
        status: 'pending',
        requestedAt: new Date().toISOString(),
        ...entry,
      };
      setPurchases((prev) => [record, ...prev]);
      return record;
    },
    [setPurchases],
  );

  const updatePurchase = useCallback(
    (id, changes) => setPurchases((prev) => prev.map((p) => (p.id === id ? { ...p, ...changes } : p))),
    [setPurchases],
  );

  const approvePurchase = useCallback((id) => updatePurchase(id, { status: 'approved' }), [updatePurchase]);
  const rejectPurchase = useCallback((id) => updatePurchase(id, { status: 'rejected' }), [updatePurchase]);

  // Finds a member's request for this book.
  const purchaseRequestFor = useCallback(
    (userId, bookId) => purchases.find((p) => p.userId === userId && p.bookId === bookId) || null,
    [purchases],
  );

  const value = {
    // Shared library data
    books,
    onlineBooks,
    users,
    transactions,
    purchases,
    outstandingLoans,
    pendingUsers: users.filter((u) => u.status === 'pending'),
    pendingPurchases: purchases.filter((p) => p.status === 'pending'),

    // Sign-in details
    currentUser,
    isAdmin,
    isAuthenticated,
    isStaff,
    loginMember,
    logoutMember,
    loginAdmin,
    logoutAdmin,
    authenticateMember,

    // Book actions
    findBook,
    addBook,
    updateBook,
    removeBook,

    // Online book actions
    addOnlineBook,
    updateOnlineBook,
    removeOnlineBook,

    // Member actions
    addUser,
    updateUser,
    removeUser,
    requestSignup,
    approveUser,
    rejectUser,
    meetsRequirements,

    // Borrowing actions
    recordStockChange,
    placeOrder,
    returnLoan,

    // Payment actions
    addPurchase,
    approvePurchase,
    rejectPurchase,
    purchaseRequestFor,

    // Screen messages
    toast,
    showToast,
    clearToast,
  };

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}
