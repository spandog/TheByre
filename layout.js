(function () {
  const PAGE = document.body.dataset.page || 'home';
  const PAGE_TITLES = {
    home: 'Mongewell Byre',
    calendar: 'Calendar',
    shopping: 'Shopping list',
    clubs: 'Clubs',
    school: 'School',
    holidays: 'Holidays',
  };
  const NAV_ITEMS = [
    { key: 'home', href: 'index.html', icon: 'home', label: 'Home' },
    { key: 'calendar', href: 'calendar.html', icon: 'calendar', label: 'Calendar' },
    { key: 'shopping', href: 'shopping.html', icon: 'basket', label: 'Shopping' },
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
      '<span class="icon">' + icon(i.icon, 20) + '</span>' + i.label + '</a>'
    ).join('') + '</div>';
  }

  function buildAuthWidget() {
    const el = document.getElementById('authWidget');
    if (!el) return;
    if (!window.sb) {
      el.innerHTML = '<span class="who">Not connected</span>';
      return;
    }
    window.sb.auth.getUser().then(({ data }) => {
      renderAuth(data && data.user);
    });
    window.sb.auth.onAuthStateChange((_event, session) => {
      renderAuth(session && session.user);
    });

    function renderAuth(user) {
      if (user) {
        el.innerHTML = '<span class="who">' + escapeHtml(user.email) + '</span><button id="signOutBtn">Sign out</button>';
        document.getElementById('signOutBtn').addEventListener('click', () => window.sb.auth.signOut());
      } else {
        el.innerHTML = '<button id="signInBtn">Sign in</button>';
        document.getElementById('signInBtn').addEventListener('click', promptSignIn);
      }
    }
  }

  function promptSignIn() {
    const email = window.prompt('Family email address:');
    if (!email) return;
    window.sb.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href } })
      .then(({ error }) => {
        if (error) { alert('Could not send the link: ' + error.message); return; }
        alert('Check that inbox for a sign-in link.');
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    buildHeader();
    buildNav();
    buildAuthWidget();
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
})();
