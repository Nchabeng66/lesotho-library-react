// Tracks stock changes, borrowed books, and returns.
import { useState } from 'react';
import { useLibrary } from '../context/LibraryContext.jsx';
import { EmptyRow, Field, PageHead, Stamp, TableWrap, TextSoft } from '../components/uiComponents.jsx';
import { MAX_BORROWED } from '../library/constants.js';
import { formatDate, isOverdue, onlyDigits } from '../library/helpers.js';

// Shows one borrowed book in a table.
function LoanRow({ loan, showMember }) {
  const { returnLoan, showToast } = useLibrary();
  const overdue = isOverdue(loan);

  return (
    <tr>
      <td><strong>{loan.bookTitle}</strong></td>
      {showMember && <td>{loan.memberName || '\u2014'}</td>}
      <td className="mono">{formatDate(loan.date)}</td>
      <td className="mono">{formatDate(loan.dueDate)}</td>
      <td>
        <Stamp tone={overdue ? 'reorder' : ''}>{overdue ? 'Overdue' : 'On Time'}</Stamp>
      </td>
      <td>
        <button
          type="button"
          className="btn btn-outline btn-small"
          onClick={() => {
            returnLoan(loan.id);
            showToast('Marked as returned.');
          }}
        >
          Return
        </button>
      </td>
    </tr>
  );
}

// Lets staff add or remove copies from the stock.
function StaffPanel() {
  const { books, recordStockChange, showToast } = useLibrary();
  const [bookId, setBookId] = useState('');
  const [type, setType] = useState('add');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!bookId) {
      setError('Choose which book this transaction is for.');
      return;
    }

    const copies = Number(amount);
    if (!amount || !Number.isInteger(copies) || copies <= 0) {
      setError('Enter a whole number of copies greater than 0.');
      return;
    }

    const book = books.find((b) => b.id === bookId);
    if (!book) {
      setError('That book no longer exists \u2014 refresh the page.');
      return;
    }

    if (type === 'deduct' && copies > book.quantity) {
      setError(
        `Only ${book.quantity} ${book.quantity === 1 ? 'copy is' : 'copies are'} in stock \u2014 cannot deduct ${copies}.`,
      );
      return;
    }

    recordStockChange({ bookId, type, quantity: copies, note: note.trim() });
    showToast(type === 'add' ? 'Stock added.' : 'Stock deducted.');
    setBookId('');
    setAmount('');
    setNote('');
    setType('add');
  }

  return (
    <section className="section">
      <h2 className="section-title">Record a Transaction</h2>
      <form className="form-panel" onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="field-book">Book</label>
            <select id="field-book" value={bookId} onChange={(e) => setBookId(e.target.value)}>
              <option value="">{books.length ? 'Select a book\u2026' : 'No books catalogued yet'}</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} &mdash; {b.quantity} in stock
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="field-amount">Copies</label>
            <input
              id="field-amount"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="field">
            <span>Type</span>
            <div className="tx-type-group">
              <label className="radio-pill">
                <input
                  type="radio"
                  name="tx-type"
                  value="add"
                  checked={type === 'add'}
                  onChange={() => setType('add')}
                />
                <span>Add Stock</span>
              </label>
              <label className="radio-pill">
                <input
                  type="radio"
                  name="tx-type"
                  value="deduct"
                  checked={type === 'deduct'}
                  onChange={() => setType('deduct')}
                />
                <span>Deduct Stock</span>
              </label>
            </div>
          </div>

          <div className="field">
            <label htmlFor="field-note">
              Note <TextSoft>(optional)</TextSoft>
            </label>
            <input
              id="field-note"
              type="text"
              placeholder="e.g. Delivery from supplier, or borrower name"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        <span className="field-error">{error}</span>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">Record Transaction</button>
        </div>
      </form>
    </section>
  );
}

// Shows all books that have not been returned.
function LoansPanel() {
  const { outstandingLoans } = useLibrary();

  return (
    <section className="section">
      <h2 className="section-title">Outstanding Loans</h2>
      <TableWrap headers={['Book', 'Member', 'Ordered', 'Due Back', 'Status', 'Action']}>
        {outstandingLoans.length === 0 ? (
          <EmptyRow colSpan={6}>Nothing is currently on loan.</EmptyRow>
        ) : (
          outstandingLoans.map((loan) => <LoanRow key={loan.id} loan={loan} showMember />)
        )}
      </TableWrap>
    </section>
  );
}

// Lets a member borrow a book.
function MemberOrderPanel() {
  const { books, currentUser, outstandingLoans, placeOrder, showToast } = useLibrary();
  const [bookId, setBookId] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [error, setError] = useState('');

  const inStock = books.filter((b) => b.quantity > 0);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!currentUser) {
      setError('You must be logged in to order a book.');
      return;
    }
    if (!bookId) {
      setError('Choose a book to order.');
      return;
    }
    // Asks the member to confirm their ID number.
    if (!idNumber.trim()) {
      setError('Enter your membership ID number to confirm this order.');
      return;
    }
    if (idNumber.trim() !== currentUser.idNumber) {
      setError('That ID number does not match your account.');
      return;
    }

    const book = books.find((b) => b.id === bookId);
    if (!book) {
      setError('That book no longer exists \u2014 refresh the page.');
      return;
    }
    if (book.quantity < 1) {
      setError('That book is out of stock.');
      return;
    }

    const alreadyOut = outstandingLoans.filter((e2) => e2.memberId === currentUser.id).length;
    if (alreadyOut >= MAX_BORROWED) {
      setError(`You already have ${MAX_BORROWED} books out \u2014 return one before ordering another.`);
      return;
    }

    const dueDate = placeOrder(book, currentUser);
    showToast(`Order placed \u2014 due back ${formatDate(dueDate)}.`);
    setBookId('');
    setIdNumber('');
  }

  return (
    <section className="section">
      <h2 className="section-title">Order a Book</h2>
      <p className="text-soft" style={{ marginTop: -8 }}>
        Choose a book to borrow and confirm it&apos;s you with your membership ID number. One copy is
        deducted from stock when you place the order.
      </p>
      <form className="form-panel" onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="field-order-book">Book</label>
            <select id="field-order-book" value={bookId} onChange={(e) => setBookId(e.target.value)}>
              <option value="">
                {inStock.length ? 'Select a book\u2026' : 'No books currently in stock'}
              </option>
              {inStock.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} &mdash; {b.quantity} in stock
                </option>
              ))}
            </select>
          </div>

          <Field label="Your Membership ID Number" htmlFor="field-order-idnumber">
            <input
              id="field-order-idnumber"
              type="text"
              inputMode="numeric"
              placeholder="Confirm your ID number"
              value={idNumber}
              onChange={(e) => setIdNumber(onlyDigits(e.target.value))}
              autoComplete="off"
            />
          </Field>
        </div>

        <span className="field-error">{error}</span>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">Place Order</button>
        </div>
      </form>
    </section>
  );
}

// Shows books borrowed by this member.
function BorrowedPanel() {
  const { currentUser, outstandingLoans } = useLibrary();
  const loans = currentUser ? outstandingLoans.filter((e) => e.memberId === currentUser.id) : [];

  return (
    <section className="section">
      <h2 className="section-title">My Borrowed Books</h2>
      <p className="text-soft" style={{ marginTop: -8 }}>
        You can have up to {MAX_BORROWED} books out at a time. Return a book to free up a slot.
      </p>
      <TableWrap headers={['Book', 'Ordered', 'Due Back', 'Status', 'Action']}>
        {loans.length === 0 ? (
          <EmptyRow colSpan={5}>You don&apos;t have any books out right now.</EmptyRow>
        ) : (
          loans.map((loan) => <LoanRow key={loan.id} loan={loan} showMember={false} />)
        )}
      </TableWrap>
    </section>
  );
}

// Shows transaction history for staff or the signed-in member.
function HistorySection() {
  const { transactions, isStaff, currentUser } = useLibrary();

  const source = isStaff
    ? transactions
    : transactions.filter((e) => currentUser && e.memberId === currentUser.id);
  const entries = source.slice(0, 50);

  return (
    <section className="section">
      <h2 className="section-title">{isStaff ? 'Transaction History' : 'Your Order History'}</h2>
      <TableWrap headers={['When', 'Book', 'Type', 'Change', 'Resulting Stock', 'Note']}>
        {entries.length === 0 ? (
          <EmptyRow colSpan={6}>
            {isStaff ? 'No transactions recorded yet.' : 'You have not placed any orders yet.'}
          </EmptyRow>
        ) : (
          entries.map((entry) => {
            const isAdd = entry.type === 'add';
            const isOrder = Boolean(entry.memberId);
            const isReturn = isOrder && isAdd;
            const label = isReturn ? 'Returned' : isOrder ? 'Ordered' : isAdd ? 'Stock In' : 'Stock Out';

            return (
              <tr key={entry.id}>
                <td className="mono">{formatDate(entry.date)}</td>
                <td><strong>{entry.bookTitle}</strong></td>
                <td>
                  <Stamp tone={isAdd ? '' : 'reorder'}>{label}</Stamp>
                </td>
                <td className="mono">{isAdd ? '+' : '-'}{entry.quantity}</td>
                <td className="mono">{entry.resultingStock}</td>
                <td className="text-soft">{entry.note || '\u2014'}</td>
              </tr>
            );
          })
        )}
      </TableWrap>
    </section>
  );
}

export default function Transactions() {
  const { isStaff } = useLibrary();

  return (
    <section className="view">
      <PageHead eyebrow="Circulation" title="Transactions">
        Log stock arriving on the shelf or copies going out to borrowers. Every entry updates the
        catalog and the ledger below.
      </PageHead>

      {/* Staff change stock; members borrow books. */}
      {isStaff ? (
        <>
          <StaffPanel />
          <LoansPanel />
        </>
      ) : (
        <>
          <MemberOrderPanel />
          <BorrowedPanel />
        </>
      )}

      <HistorySection />
    </section>
  );
}
