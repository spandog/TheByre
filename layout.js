(function () {
  // Turned off for now while email sending (DNS/SMTP) is being sorted, so
  // the site works without needing a sign-in link to arrive. Flip this
  // back to true once that's done — nothing else needs to change.
  const GATE_ENABLED = false;

  const PAGE = document.body.dataset.page || 'home';
  const PAGE_TITLES = {
    home: 'Mongewell Byre',
    calendar: 'Calendar',
    shopping: 'Shopping list',
    clubs: 'Clubs',
    school: 'School',
    holidays: 'Holidays',
    todo: 'To do',
  };
  const NAV_ITEMS = [
    { key: 'home', href: 'index.html', icon: 'home', label: 'Home' },
    { key: 'calendar', href: 'calendar.html', icon: 'calendar', label: 'Calendar' },
    { key: 'shopping', href: 'shopping.html', icon: 'basket', label: 'Shopping' },
    { key: 'todo', href: 'todo.html', icon: 'checklist', label: 'To do' },
    { key: 'clubs', href: 'clubs.html', icon: 'dumbbell', label: 'Clubs' },
    { key: 'school', href: 'school.html', icon: 'backpack', label: 'School' },
    { key: 'holidays', href: 'holidays.html', icon: 'suitcase', label: 'Holidays' },
  ];

  function buildHeader() {
    const el = document.getElementById('app-header');
    if (!el) return;
    const navItem = NAV_ITEMS.find(i => i.key === PAGE);
    el.innerHTML =
      '<div class="brand">' +
      '<div class="brand-row"><span class="brand-badge">' + icon(navItem ? navItem.icon : 'home', 18) + '</span>' +
      '<div><p class="eyebrow">' + (PAGE === 'home' ? "Today's date" : 'Family hub') + '</p>' +
      '<h1 id="headerTitle">' + PAGE_TITLES[PAGE] + '</h1></div></div></div>' +
      '<nav class="top-links">' + NAV_ITEMS.map(i =>
        '<a href="' + i.href + '" data-active="' + (i.key === PAGE) + '">' + i.label + '</a>'
      ).join('') + '</nav>' +
      '<div class="auth-widget" id="authWidget"></div>';

    if (PAGE === 'home') {
      const d = new Date();
      document.getElementById('headerTitle').textContent =
        d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    }
  }

  function buildNav() {
    const el = document.getElementById('app-nav');
    if (!el) return;
    el.innerHTML = '<div class="tabs-inner">' + NAV_ITEMS.map(i =>
      '<a class="tab-btn" href="' + i.href + '" data-active="' + (i.key === PAGE) + '">' +
      '<span class="icon">' + icon(i.icon, 18) + '</span>' + i.label + '</a>'
    ).join('') + '</div>';
  }

  function buildAuthGate() {
    const el = document.getElementById('authGate');
    if (!el) return;
    if (!GATE_ENABLED) { el.style.display = 'none'; return; }
    el.innerHTML =
      '<div class="gate-badge">' + icon('home', 26) + '</div>' +
      '<h2>Mongewell Byre</h2>' +
      '<p class="gate-sub">Sign in to see the calendar, shopping list and everything else. Nothing on here shows before that.</p>' +
      '<form id="gateForm">' +
      '<input type="email" id="gateEmail" placeholder="Your email address" autocomplete="email" required>' +
      '<button type="submit" class="btn primary" id="gateSubmit">Send sign-in link</button>' +
      '</form>' +
      '<p class="gate-status" id="gateStatus"></p>';

    document.getElementById('gateForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!window.sb) return;
      const email = document.getElementById('gateEmail').value.trim();
      if (!email) return;
      const btn = document.getElementById('gateSubmit');
      const status = document.getElementById('gateStatus');
      btn.disabled = true;
      btn.textContent = 'Sending…';
      const { error } = await window.sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.href },
      });
      btn.disabled = false;
      btn.textContent = 'Send sign-in link';
      status.textContent = error ? error.message : 'Check that inbox for a sign-in link.';
    });
  }

  function setLocked(locked) {
    document.body.classList.toggle('gate-locked', GATE_ENABLED && locked);
  }

  function buildAuthWidget() {
    const el = document.getElementById('authWidget');
    if (!el) return;
    if (!window.sb) {
      el.innerHTML = '<span class="who">Not connected</span>';
      setLocked(false); // nothing to gate against if Supabase isn't configured yet
      return;
    }
    window.sb.auth.getUser().then(({ data }) => {
      renderAuth(data && data.user);
    });
    window.sb.auth.onAuthStateChange((_event, session) => {
      renderAuth(session && session.user);
    });

    async function renderAuth(user) {
      setLocked(!user);
      if (user) {
        let bellHtml = '';
        if (typeof notificationsStatus === 'function') {
          const status = await notificationsStatus();
          if (status === 'default') bellHtml = '<button id="notifyBtn">Enable notifications</button>';
        }
        el.innerHTML = '<span class="who">' + escapeHtml(user.email) + '</span>' + bellHtml + '<button id="signOutBtn">Sign out</button>';
        document.getElementById('signOutBtn').addEventListener('click', () => window.sb.auth.signOut());
        const notifyBtn = document.getElementById('notifyBtn');
        if (notifyBtn) {
          notifyBtn.addEventListener('click', async () => {
            notifyBtn.textContent = 'Enabling…';
            const ok = await subscribeToPush();
            notifyBtn.textContent = ok ? 'Notifications on' : 'Enable notifications';
            if (ok) notifyBtn.disabled = true;
          });
        }
      } else {
        if (GATE_ENABLED) {
          el.innerHTML = '';
        } else {
          el.innerHTML = '<button id="signInBtn">Sign in</button>';
          document.getElementById('signInBtn').addEventListener('click', () => {
            const email = window.prompt('Email address:');
            if (!email) return;
            window.sb.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href } })
              .then(({ error }) => {
                alert(error ? ('Could not send the link: ' + error.message) : 'Check that inbox for a sign-in link.');
              });
          });
        }
      }
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    buildHeader();
    buildNav();
    buildAuthGate();
    buildAuthWidget();
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
})();
