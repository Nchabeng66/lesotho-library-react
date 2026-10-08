// Lists the library's linked online books.
import { useLibrary } from '../context/LibraryContext.jsx';
import OnlineBookCard from '../components/OnlineBookCard.jsx';
import { PageHead } from '../components/uiComponents.jsx';

export default function OnlineBooks() {
  const { onlineBooks } = useLibrary();

  return (
    <section className="view">
      <PageHead eyebrow="Digital Access" title="Online Books">
        Titles the library links to online &mdash; always free to read, no purchase required. Log in with
        your membership to open them.
      </PageHead>

      <section className="section">
        <div className="card-grid">
          {onlineBooks.length === 0 ? (
            <p className="text-soft">No online books linked yet.</p>
          ) : (
            onlineBooks.map((book) => <OnlineBookCard key={book.id} book={book} />)
          )}
        </div>
      </section>
    </section>
  );
}
