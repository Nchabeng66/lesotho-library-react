// Keeps shared settings, like loan limits, in one place.

export const DB_KEYS = {
  books: 'library_books',
  users: 'library_users',
  transactions: 'library_transactions',
  purchases: 'library_purchases',
  onlineBooks: 'library_online_books',
};

export const MEMBER_SESSION_KEY = 'library_member_session';

export const LOW_STOCK_THRESHOLD = 2;
export const ADMIN_PASSWORD = 'library2026'; // Demo password for the assignment.
export const CURRENCY = 'M'; 

// Signup age requirement
export const MIN_MEMBER_AGE = 12;

// Loan length and the number of books a member can borrow
export const BORROW_DAYS = 14;
export const MAX_BORROWED = 3;

// Districts in Lesotho
export const LESOTHO_DISTRICTS = [
  'Maseru',
  'Berea',
  'Leribe',
  'Mafeteng',
  'Mohale\u2019s Hoek',
  'Quthing',
  'Qacha\u2019s Nek',
  'Butha-Buthe',
  'Mokhotlong',
  'Thaba-Tseka',
];

// Limits file uploads so the browser has room to save them.
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2MB

export const LOGIN_ERROR_MESSAGES = {
  'not-found': 'No account found with that ID number.',
  'bad-password': 'Incorrect password.',
  pending: 'Your application is still awaiting admin approval.',
  rejected: 'Your application was not approved. Contact the library for details.',
};
