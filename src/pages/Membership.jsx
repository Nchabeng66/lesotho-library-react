// Lets people sign in, apply, and manage member accounts.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext.jsx';
import {
  EmptyRow,
  Field,
  PageHead,
  PasswordInput,
  Stamp,
  TableWrap,
} from '../components/uiComponents.jsx';
import {
  CURRENCY,
  LESOTHO_DISTRICTS,
  LOGIN_ERROR_MESSAGES,
  MIN_MEMBER_AGE,
} from '../library/constants.js';
import { formatDate, nextMembershipId, onlyDigits, stripDigits } from '../library/helpers.js';
import { validateSignupForm, validateUserForm } from '../library/validation.js';

const BLANK_SIGNUP = {
  name: '',
  idNumber: '',
  age: '',
  district: LESOTHO_DISTRICTS[0],
  address: '',
  password: '',
  confirm: '',
};

const BLANK_USER = { name: '', idNumber: '', role: 'Member', password: '' };

// Shows the member sign-in form.


function LoginPanel({ onSwitch }) {
  const { authenticateMember, loginMember, showToast } = useLibrary();
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    const result = authenticateMember(idNumber, password);

    if (!result.ok) {
      setError(LOGIN_ERROR_MESSAGES[result.reason] || 'Could not log in.');
      return;
    }

    setError('');
    setIdNumber('');
    setPassword('');
    loginMember(result.user.id);
    showToast(`Welcome back, ${result.user.name.split(' ')[0]}!`);
    navigate('/');
  }

  return (
    <section className="mode-panel gate-wrap">
      <form className="form-panel gate-form" onSubmit={handleSubmit} noValidate>
        <div className="gate-head">
          <div className="gate-icon">M</div>
          <h2 className="gate-title">Member Log In</h2>
          <p className="gate-sub">Enter your national ID number and password to access your account.</p>
        </div>

        <div className="field">
          <label htmlFor="field-login-id">National ID Number</label>
          <input
            id="field-login-id"
            type="text"
            inputMode="numeric"
            placeholder="Enter your national ID number"
            value={idNumber}
            onChange={(e) => setIdNumber(onlyDigits(e.target.value))}
            autoComplete="username"
          />
        </div>

        <div className="field">
          <label htmlFor="field-login-password">Password</label>
          <PasswordInput
            id="field-login-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
        </div>

        <span className="field-error">{error}</span>

        <div className="form-actions gate-actions">
          <button type="submit" className="btn btn-primary btn-block">Log In</button>
        </div>

        <p className="gate-switch">
          Not a member yet?{' '}
          <button type="button" className="link-btn" onClick={() => onSwitch('signup')}>
            Apply for membership
          </button>
        </p>
      </form>
    </section>
  );
}

// Lets a visitor apply to become a member.


function SignupPanel({ onSwitch }) {
  const { users, requestSignup, showToast } = useLibrary();
  const [form, setForm] = useState(BLANK_SIGNUP);
  const [errors, setErrors] = useState({});

  const change = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  function handleSubmit(e) {
    e.preventDefault();
    const found = validateSignupForm(form, users);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    requestSignup({
      name: form.name.trim(),
      idNumber: form.idNumber.trim(),
      age: Number(form.age),
      district: form.district,
      address: form.address.trim(),
      password: form.password,
    });

    setForm(BLANK_SIGNUP);
    setErrors({});
    showToast('Application submitted \u2014 a librarian will review it.');
    onSwitch('login');
  }

  return (
    <section className="mode-panel">
      <div className="signup-layout">
        <form className="form-panel signup-form" onSubmit={handleSubmit} noValidate>
          <div className="gate-head" style={{ textAlign: 'left', marginBottom: 18 }}>
            <h2 className="section-title" style={{ marginTop: 0 }}>Apply for Membership</h2>
            <p className="gate-sub" style={{ margin: 0 }}>
              Fill in your details below. A librarian will review and approve your application.
            </p>
          </div>

          <p className="form-subhead">
            <span className="form-subhead-num">1</span> Personal Details
          </p>
          <div className="form-grid">
            <Field label="Full Name" htmlFor="field-su-name" error={errors.name}>
              <input
                id="field-su-name"
                name="name"
                type="text"
                placeholder="e.g. Palesa Mokoena"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: stripDigits(e.target.value) }))}
                autoComplete="name"
              />
            </Field>
            <Field label="ID Number" htmlFor="field-su-id" error={errors.idNumber}>
              <input
                id="field-su-id"
                name="idNumber"
                type="text"
                inputMode="numeric"
                placeholder="National ID number"
                value={form.idNumber}
                onChange={(e) => setForm((p) => ({ ...p, idNumber: onlyDigits(e.target.value) }))}
                autoComplete="off"
              />
            </Field>
            <Field label="Age" htmlFor="field-su-age" error={errors.age}>
              <input
                id="field-su-age"
                name="age"
                type="number"
                min="0"
                step="1"
                placeholder="Years"
                value={form.age}
                onChange={change}
                autoComplete="off"
              />
            </Field>
          </div>

          <p className="form-subhead">
            <span className="form-subhead-num">2</span> Address &amp; District
          </p>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="field-su-district">District</label>
              <select id="field-su-district" name="district" value={form.district} onChange={change}>
                {LESOTHO_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <Field
              label="Home Address"
              htmlFor="field-su-address"
              error={errors.address}
              style={{ gridColumn: 'span 2' }}
            >
              <input
                id="field-su-address"
                name="address"
                type="text"
                placeholder="Street / village and town"
                value={form.address}
                onChange={change}
                autoComplete="street-address"
              />
            </Field>
          </div>

          <p className="form-subhead">
            <span className="form-subhead-num">3</span> Account Security
          </p>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="field-su-password">Choose a Password</label>
              <PasswordInput
                id="field-su-password"
                name="password"
                autoComplete="new-password"
                placeholder="At least 4 characters"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              />
              <span className="field-error">{errors.password || ''}</span>
            </div>
            <div className="field">
              <label htmlFor="field-su-confirm">Confirm Password</label>
              <PasswordInput
                id="field-su-confirm"
                name="confirm"
                autoComplete="new-password"
                placeholder="Re-enter password"
                value={form.confirm}
                onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
              />
              <span className="field-error">{errors.confirm || ''}</span>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-block">Submit Application</button>
          </div>

          <p className="gate-switch">
            Already a member?{' '}
            <button type="button" className="link-btn" onClick={() => onSwitch('login')}>
              Log in instead
            </button>
          </p>
        </form>

        <aside className="requirements-card">
          <div className="gate-icon gate-icon-req">i</div>
          <h3>Membership requirements</h3>
          <ul>
            <li>Must be <strong>{MIN_MEMBER_AGE}</strong> years or older</li>
            <li>Must live in Lesotho &mdash; any of the 10 districts</li>
          </ul>
          <p className="text-soft">
            Applications are reviewed by a librarian. You&apos;ll be able to log in once approved.
          </p>
        </aside>
      </div>
    </section>
  );
}


// Shows details for the signed-in member.


function ProfilePanel() {
  const { currentUser, logoutMember } = useLibrary();
  const navigate = useNavigate();
  if (!currentUser) return null;

  return (
    <section className="mode-panel gate-wrap">
      <div className="form-panel profile-card">
        <div className="gate-icon">{currentUser.name.charAt(0).toUpperCase()}</div>
        <h2 style={{ margin: '4px 0 2px', fontFamily: 'var(--font-display)' }}>{currentUser.name}</h2>
        <p className="text-soft">{currentUser.role}</p>
        <dl className="profile-meta">
          <dt>Membership ID</dt>
          <dd className="mono">{currentUser.membershipId || '\u2014'}</dd>
          <dt>Status</dt>
          <dd>{currentUser.status}</dd>
        </dl>
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              logoutMember();
              navigate('/members');
            }}
          >
            Log Out
          </button>
        </div>
      </div>
    </section>
  );
}


// Lets an admin approve or reject new applications.

function CheckBadge({ passed, label }) {
  return <Stamp tone={passed ? '' : 'reorder'}>{passed ? '\u2713' : '\u2717'} {label}</Stamp>;
}

function PendingList() {
  const { pendingUsers, approveUser, rejectUser, meetsRequirements, showToast } = useLibrary();

  if (pendingUsers.length === 0) {
    return (
      <div className="approval-list">
        <p className="text-soft">No applications waiting for review.</p>
      </div>
    );
  }

  return (
    <div className="approval-list">
      {pendingUsers.map((user) => {
        const { ageOk, districtOk } = meetsRequirements(user);
        return (
          <article className="approval-card" key={user.id}>
            <div className="approval-head">
              <h3>{user.name}</h3>
              <span className="mono text-soft">{user.idNumber}</span>
            </div>
            <div className="approval-meta">
              <span><strong>Age: </strong>{user.age}</span>
              <span><strong>District: </strong>{user.district}</span>
              <span><strong>Address: </strong>{user.address}</span>
            </div>
            <div className="approval-checks">
              <CheckBadge passed={ageOk} label={`${MIN_MEMBER_AGE}+`} />
              <CheckBadge passed={districtOk} label="Lesotho resident" />
            </div>
            <div className="row-actions">
              <button
                type="button"
                className="btn btn-primary btn-small"
                onClick={() => {
                  approveUser(user.id);
                  showToast(`${user.name} approved \u2014 membership ID assigned.`);
                }}
              >
                Approve
              </button>
              <button
                type="button"
                className="btn btn-danger btn-small"
                onClick={() => {
                  if (!window.confirm(`Reject ${user.name}'s application?`)) return;
                  rejectUser(user.id);
                  showToast('Application rejected.');
                }}
              >
                Reject
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}


// Lets an admin review book payment proofs.


function ProofLink({ request }) {
  const isImage = (request.proofFileType || '').startsWith('image/');

  if (isImage) {
    return (
      <a href={request.proofFileData} target="_blank" rel="noopener noreferrer">
        <img className="proof-thumb" src={request.proofFileData} alt={`Proof of payment from ${request.userName}`} />
      </a>
    );
  }

  return (
    <a className="btn btn-outline btn-small" href={request.proofFileData} target="_blank" rel="noopener noreferrer">
      View File ({request.proofFileName})
    </a>
  );
}

function PurchasesList() {
  const { pendingPurchases, approvePurchase, rejectPurchase, showToast } = useLibrary();

  if (pendingPurchases.length === 0) {
    return (
      <div className="approval-list">
        <p className="text-soft">No payments waiting for review.</p>
      </div>
    );
  }

  return (
    <div className="approval-list">
      {pendingPurchases.map((request) => (
        <article className="approval-card" key={request.id}>
          <div className="approval-head">
            <h3>{request.bookTitle}</h3>
            <span className="mono text-soft">{CURRENCY}{request.amount}</span>
          </div>
          <div className="approval-meta">
            <span><strong>Buyer: </strong>{request.userName}</span>
            <span><strong>Submitted: </strong>{formatDate(request.requestedAt)}</span>
          </div>
          <div style={{ margin: '4px 0 12px' }}>
            <ProofLink request={request} />
          </div>
          <div className="row-actions">
            <button
              type="button"
              className="btn btn-primary btn-small"
              onClick={() => {
                approvePurchase(request.id);
                showToast(`Access to "${request.bookTitle}" granted to ${request.userName}.`);
              }}
            >
              Approve
            </button>
            <button
              type="button"
              className="btn btn-danger btn-small"
              onClick={() => {
                if (!window.confirm(`Reject this payment from ${request.userName}?`)) return;
                rejectPurchase(request.id);
                showToast('Payment rejected.');
              }}
            >
              Reject
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

// Lets an admin add, change, or remove members.


function MembersAdmin() {
  const { users, addUser, updateUser, removeUser, showToast } = useLibrary();
  const [form, setForm] = useState(BLANK_USER);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);

  const editingUser = editingId ? users.find((u) => u.id === editingId) : null;

  const change = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  function reset() {
    setForm(BLANK_USER);
    setErrors({});
    setEditingId(null);
  }

  function startEdit(user) {
    setEditingId(user.id);
    setForm({ name: user.name, idNumber: user.idNumber, role: user.role, password: '' });
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const found = validateUserForm(form, users, editingId);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const payload = {
      name: form.name.trim(),
      idNumber: form.idNumber.trim(),
      role: form.role,
    };
    if (form.password) payload.password = form.password;

    if (editingId) {
      updateUser(editingId, payload);
      showToast('User updated.');
    } else {
      // Members added here are approved right away.
      addUser({ ...payload, membershipId: nextMembershipId(users) });
      showToast('User registered.');
    }
    reset();
  }

  function handleDelete(user) {
    if (!window.confirm(`Remove "${user.name}" from the register? This cannot be undone.`)) return;
    removeUser(user.id);
    if (editingId === user.id) reset();
    showToast('User removed.');
  }

  const statusTone = { approved: '', pending: 'reorder', rejected: 'reorder' };

  return (
    <>
      <section className="section" style={{ marginTop: 0 }}>
        <h2 className="section-title">
          {editingUser ? `Editing "${editingUser.name}"` : 'Register a New User'}
        </h2>
        <p className="text-soft" style={{ marginTop: -8 }}>
          For walk-in members an admin has already verified in person. They&apos;re approved immediately.
        </p>
        <form className="form-panel" onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <Field label="Full Name" htmlFor="field-name" error={errors.name}>
              <input
                id="field-name"
                name="name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: stripDigits(e.target.value) }))}
                autoComplete="off"
              />
            </Field>
            <Field label="ID Number" htmlFor="field-idnum" error={errors.idNumber}>
              <input
                id="field-idnum"
                name="idNumber"
                type="text"
                inputMode="numeric"
                value={form.idNumber}
                onChange={(e) => setForm((p) => ({ ...p, idNumber: onlyDigits(e.target.value) }))}
                autoComplete="off"
              />
            </Field>
            <div className="field">
              <label htmlFor="field-role">Role</label>
              <select id="field-role" name="role" value={form.role} onChange={change}>
                <option value="Member">Member</option>
                <option value="Librarian">Librarian</option>
              </select>
            </div>
            <Field label="Password" htmlFor="field-password-admin" error={errors.password}>
              <input
                id="field-password-admin"
                name="password"
                type="password"
                value={form.password}
                onChange={change}
                autoComplete="new-password"
              />
            </Field>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Save Changes' : 'Add User'}
            </button>
            {editingId && (
              <button type="button" className="btn btn-outline" onClick={reset}>Cancel Edit</button>
            )}
          </div>
        </form>
      </section>

      <section className="section">
        <h2 className="section-title">All Members</h2>
        <TableWrap headers={['Name', 'Membership ID', 'Role', 'Status', 'Actions']}>
          {users.length === 0 ? (
            <EmptyRow colSpan={5}>No users registered yet &mdash; add one using the form above.</EmptyRow>
          ) : (
            users.map((user) => (
              <tr key={user.id}>
                <td><strong>{user.name}</strong></td>
                <td className="mono">{user.membershipId || '\u2014'}</td>
                <td>
                  <Stamp tone={user.role === 'Librarian' ? '' : 'neutral'}>{user.role}</Stamp>
                </td>
                <td>
                  <Stamp tone={statusTone[user.status] || ''}>{user.status}</Stamp>
                </td>
                <td>
                  <div className="row-actions">
                    <button type="button" className="btn btn-outline btn-small" onClick={() => startEdit(user)}>
                      Edit
                    </button>
                    <button type="button" className="btn btn-danger btn-small" onClick={() => handleDelete(user)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </TableWrap>
      </section>
    </>
  );
}


// Shows the admin sign-in and tools.


function AdminPanel({ onSwitch }) {
  const { isAdmin, loginAdmin, logoutAdmin, pendingUsers, pendingPurchases } = useLibrary();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState('pending');
  const navigate = useNavigate();

  function handleLogin(e) {
    e.preventDefault();
    if (loginAdmin(password)) {
      setError('');
      setPassword('');
    } else {
      setError('Incorrect password. Try again.');
    }
  }

  if (!isAdmin) {
    return (
      <section className="mode-panel">
        <div className="gate-wrap">
          <form className="form-panel gate-form" onSubmit={handleLogin} noValidate>
            <div className="gate-head">
              <div className="gate-icon gate-icon-admin">A</div>
              <h2 className="gate-title">Administrator</h2>
              <p className="gate-sub">
                Staff access only &mdash; enter the admin password to manage the catalog and members.
              </p>
            </div>
            <div className="field">
              <label htmlFor="field-password">Admin Password</label>
              <PasswordInput
                id="field-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
              />
              <span className="field-error">{error}</span>
            </div>
            <div className="form-actions gate-actions">
              <button type="submit" className="btn btn-primary btn-block">Log In</button>
            </div>
            <p className="gate-switch">
              Library member?{' '}
              <button type="button" className="link-btn" onClick={() => onSwitch('login')}>
                Log in here
              </button>
            </p>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="mode-panel">
      <div className="session-bar">
        <span>Signed in as Administrator</span>
        <button
          type="button"
          className="btn btn-outline btn-small"
          onClick={() => {
            logoutAdmin();
            navigate('/members');
          }}
        >
          Log Out
        </button>
      </div>

      <div className="admin-tabs">
        <button
          type="button"
          className={`admin-tab${tab === 'pending' ? ' active' : ''}`}
          onClick={() => setTab('pending')}
        >
          Pending Approvals <span className="tab-count">{pendingUsers.length}</span>
        </button>
        <button
          type="button"
          className={`admin-tab${tab === 'purchases' ? ' active' : ''}`}
          onClick={() => setTab('purchases')}
        >
          Book Purchases <span className="tab-count">{pendingPurchases.length}</span>
        </button>
        <button
          type="button"
          className={`admin-tab${tab === 'members' ? ' active' : ''}`}
          onClick={() => setTab('members')}
        >
          Members
        </button>
      </div>

      <div className="admin-tab-panel">
        {tab === 'pending' && <PendingList />}
        {tab === 'purchases' && <PurchasesList />}
        {tab === 'members' && <MembersAdmin />}
      </div>
    </section>
  );
}


// Shows the right membership screen.


export default function Membership() {
  const { currentUser, isAdmin, showToast } = useLibrary();
  // Remembers which membership screen is open.
  const [mode, setMode] = useState(() => (isAdmin ? 'admin' : 'login'));

  function switchMode(next) {
    // Members cannot open admin tools.
    if (next === 'admin' && currentUser) {
      showToast('Members cannot access the Administrator area.');
      return;
    }
    setMode(next);
  }

  const tabs = [
    { key: 'login', label: 'Member Log In' },
    { key: 'signup', label: 'Sign Up' },
    { key: 'admin', label: 'Administrator' },
  ];

  return (
    <section className="view">
      <PageHead eyebrow="Membership" title="Membership">
        Join the library, sign in to your account, or manage members as an administrator.
      </PageHead>

      {/* Signed-in members see their profile instead of these tabs. */}
      {!currentUser && (
        <div className="mode-tabs" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              className={`mode-tab${mode === t.key ? ' active' : ''}`}
              onClick={() => switchMode(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {currentUser ? (
        <ProfilePanel />
      ) : (
        <>
          {mode === 'login' && <LoginPanel onSwitch={switchMode} />}
          {mode === 'signup' && <SignupPanel onSwitch={switchMode} />}
          {mode === 'admin' && <AdminPanel onSwitch={switchMode} />}
        </>
      )}
    </section>
  );
}
