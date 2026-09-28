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
    bins: 'Bins',
    contacts: 'Contacts',
    more: 'More',
  };
  // Full list: used for page titles, the desktop top-link row, and working
  // out which icon a page's header badge should show.
  const NAV_ITEMS = [
    { key: 'home', href: 'index.html', icon: 'home', label: 'Home' },
    { key: 'calendar', href: 'calendar.html', icon: 'calendar', label: 'Calendar' },
    { key: 'shopping', href: 'shopping.html', icon: 'basket', label: 'Shopping' },
    { key: 'todo', href: 'todo.html', icon: 'checklist', label: 'To do' },
    { key: 'clubs', href: 'clubs.html', icon: 'dumbbell', label: 'Clubs' },
    { key: 'school', href: 'school.html', icon: 'backpack', label: 'School' },
    { key: 'holidays', href: 'holidays.html', icon: 'suitcase', label: 'Holidays' },
    { key: 'bins', href: 'bins.html', icon: 'bin', label: 'Bins' },
    { key: 'contacts', href: 'contacts.html', icon: 'contact', label: 'Contacts' },
    { key: 'more', href: 'more.html', icon: 'more', label: 'More' },
  ];
  // Short list: the five tabs that actually appear in the mobile bottom
  // bar. Everything else lives one tap away, under More.
  const SECONDARY_KEYS = ['clubs', 'school', 'holidays', 'bins', 'contacts'];
  const MOBILE_TABS = [
    { key: 'home', href: 'index.html', icon: 'home', label: 'Home' },
    { key: 'calendar', href: 'calendar.html', icon: 'calendar', label: 'Calendar' },
    { key: 'shopping', href: 'shopping.html', icon: 'basket', label: 'Shopping' },
    { key: 'todo', href: 'todo.html', icon: 'checklist', label: 'To do' },
    { key: 'more', href: 'more.html', icon: 'more', label: 'More' },
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
      '<nav class="top-links">' + NAV_ITEMS.filter(i => i.key !== 'more').map(i =>
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
    const onSecondary = SECONDARY_KEYS.indexOf(PAGE) !== -1;
    el.innerHTML = '<div class="tabs-inner">' + MOBILE_TABS.map(i => {
      const active = i.key === 'more' ? onSecondary : (i.key === PAGE);
      return '<a class="tab-btn" href="' + i.href + '" data-active="' + active + '">' +
        '<span class="icon">' + icon(i.icon, 20) + '</span>' + i.label + '</a>';
    }).join('') + '</div>';
  }

  // Two-step sign-in: email in, then the 6-digit code from the email typed
  // straight back in. No link is involved, so it works inside the installed
  // app (a link would open in the browser, which on iOS has separate storage).
  function renderSignInFlow(box, onDone) {
    let email = '';
    function stepEmail(msg) {
      box.innerHTML =
        '<form class="signin-form">' +
        '<input type="email" class="si-email" placeholder="Your email address" autocomplete="email" required>' +
        '<button type="submit" class="btn primary si-btn">Send me a code</button>' +
        '</form><p class="gate-status si-status">' + (msg || '') + '</p>';
      box.querySelector('.signin-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!window.sb) return;
        email = box.querySelector('.si-email').value.trim();
        if (!email) return;
        const btn = box.querySelector('.si-btn');
        btn.disabled = true; btn.textContent = 'Sending…';
        const { error } = await window.sb.auth.signInWithOtp({ email });
        if (error) { stepEmail(escapeHtml(error.message)); return; }
        stepCode();
      });
    }
    function stepCode(msg) {
      box.innerHTML =
        '<form class="signin-form">' +
        '<p class="gate-sub" style="margin:0 0 4px">We have emailed a code to ' + escapeHtml(email) + '. Enter it here.</p>' +
        '<input type="text" class="si-code" inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="Code from the email" required>' +
        '<button type="submit" class="btn primary si-btn">Sign in</button>' +
        '<button type="button" class="btn ghost si-back">Use a different email</button>' +
        '</form><p class="gate-status si-status">' + (msg || '') + '</p>';
      box.querySelector('.si-back').addEventListener('click', () => stepEmail());
      box.querySelector('.signin-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = box.querySelector('.si-code').value.trim();
        if (!token) return;
        const btn = box.querySelector('.si-btn');
        btn.disabled = true; btn.textContent = 'Checking…';
        const { error } = await window.sb.auth.verifyOtp({ email, token, type: 'email' });
        if (error) { stepCode('That code did not work. Check it and try again.'); return; }
        if (onDone) onDone();
      });
    }
    stepEmail();
  }

  function buildAuthGate() {
    const el = document.getElementById('authGate');
    if (!el) return;
    if (!GATE_ENABLED) { el.style.display = 'none'; return; }
    el.innerHTML =
      '<div class="gate-badge">' + icon('home', 26) + '</div>' +
      '<h2>Mongewell Byre</h2>' +
      '<p class="gate-sub">Sign in to see the calendar, shopping list and everything else. Nothing on here shows before that.</p>' +
      '<div id="gateFlow" style="width:100%;max-width:320px"></div>';
    renderSignInFlow(document.getElementById('gateFlow'));
  }

  function openSignInSheet() {
    const back = document.createElement('div');
    back.className = 'sheet-backdrop';
    back.innerHTML = '<div class="sheet"><h3>Sign in</h3><div id="sheetFlow" style="margin-top:12px"></div>' +
      '<div class="sheet-row"><button class="btn ghost" id="sheetClose">Close</button></div></div>';
    document.body.appendChild(back);
    const close = () => back.remove();
    back.querySelector('#sheetClose').addEventListener('click', close);
    renderSignInFlow(back.querySelector('#sheetFlow'), close);
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
          document.getElementById('signInBtn').addEventListener('click', openSignInSheet);
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
