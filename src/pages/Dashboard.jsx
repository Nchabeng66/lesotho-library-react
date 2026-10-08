// Shows library totals and books that need restocking.
import { useMemo } from 'react';
import { useLibrary } from '../context/LibraryContext.jsx';
import BookCard from '../components/BookCard.jsx';
import { PageHead } from '../components/uiComponents.jsx';
import { isFree, isLowStock } from '../library/helpers.js';

function StatStrip() {
  const { books, users } = useLibrary();

  // Recalculates these totals when the books or members change.
  const stats = useMemo(() => {
    const lowStock = books.filter(isLowStock).length;
    return [
      { num: books.length, label: 'Titles catalogued' },
      { num: books.reduce((sum, b) => sum + b.quantity, 0), label: 'Copies in stock' },
      { num: lowStock, label: 'Titles low on stock', warn: lowStock > 0 },
      { num: users.length, label: 'Registered users' },
    ];
  }, [books, users]);

  return (
    <section className="stat-strip" aria-label="Library statistics">
      {stats.map((s) => (
        <div key={s.label} className={`stat-card${s.warn ? ' warn' : ''}`}>
          <span className="stat-num">{s.num}</span>
          <span className="stat-label">{s.label}</span>
        </div>
      ))}
    </section>
  );
}

function BookGrid({ books, emptyMessage }) {
  if (books.length === 0) {
    return (
      <div className="card-grid">
        <p className="text-soft">{emptyMessage}</p>
      </div>
    );
  }
  // Shows books with fewer copies first.
  const sorted = [...books].sort((a, b) => a.quantity - b.quantity);

  return (
    <div className="card-grid">
      {sorted.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { books } = useLibrary();

  const empty = books.length === 0;
  const freeBooks = books.filter(isFree);
  const paidBooks = books.filter((b) => !isFree(b));
  const emptyCatalogMessage =
    'No books catalogued yet. Add your first title on the Book Management page.';

  return (
    <section className="view">
      <PageHead eyebrow="Overview" title="Dashboard">
        Live snapshot of the catalog. Titles running low on stock are stamped{' '}
        <span className="stamp reorder" style={{ transform: 'none' }}>
          Reorder
        </span>{' '}
        and float to the top.
      </PageHead>

      <StatStrip />

      <section className="section">
        <h2 className="section-title">Free Books</h2>
        <BookGrid
          books={freeBooks}
          emptyMessage={empty ? emptyCatalogMessage : 'No free titles catalogued yet.'}
        />
      </section>

      <section className="section">
        <h2 className="section-title">Paid Books</h2>
        <BookGrid
          books={paidBooks}
          emptyMessage={empty ? emptyCatalogMessage : 'No paid titles catalogued yet.'}
        />
      </section>
    </section>
  );
}
