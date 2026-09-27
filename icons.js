// A small set of hand-drawn-feel line icons, 24x24, stroke-based so they
// inherit colour from CSS (currentColor) and stay crisp at any size.
// Used instead of emoji throughout, since emoji render inconsistently
// across platforms (notably Windows).
window.ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9"/><path d="M10 20v-6h4v6"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5.5" width="16" height="15" rx="2"/><path d="M4 10h16"/><path d="M8 3.5v3.5M16 3.5v3.5"/><path d="M8.5 14h.01M12 14h.01M15.5 14h.01M8.5 17h.01M12 17h.01"/></svg>',
  basket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5.5 10 8 4.5M18.5 10 16 4.5"/><path d="M4 10h16l-1.4 9.1a2 2 0 0 1-2 1.7H7.4a2 2 0 0 1-2-1.7L4 10Z"/><path d="M9.5 14v3M12 14v3M14.5 14v3"/></svg>',
  dumbbell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8v8M4.5 10v4M18 8v8M19.5 10v4M8 12h8"/></svg>',
  backpack: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4h6a1 1 0 0 1 1 1v1.2c1.7.5 3 2.2 3 4.3v8a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18.5v-8c0-2.1 1.3-3.8 3-4.3V5a1 1 0 0 1 1-1Z"/><path d="M9 4v3.5h6V4"/><path d="M9 13h6v6H9z"/><path d="M8 10.5h1M15 10.5h1"/></svg>',
  suitcase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="7.5" width="17" height="12" rx="1.5"/><path d="M9 7.5V5.8a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7.5"/><path d="M3.5 12.5h17"/><path d="M11 12.5v2h2v-2"/></svg>',
  cake: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v2.2M9.8 5.3a1.4 1.4 0 1 0 2.4 0M4.5 20h15M5.5 20v-6a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v6M8 12v-1.6c0-.9.6-1.6 1.4-2M12 12v-1.6c0-.9.6-1.6 1.4-2M16 12v-1.6c0-.9.6-1.6 1.4-2"/><path d="M5.5 16h13"/></svg>',
  rings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="14" r="4.2"/><circle cx="15" cy="14" r="4.2"/><path d="M10 6.5 12 4l2 2.5"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.4 7-11.5A7 7 0 0 0 5 9.5C5 14.6 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.3"/></svg>',
  fork: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3v6a2 2 0 0 0 2 2v10M7 3v6M10 3v6M13 3c0 3-1.5 5-1.5 7 0 1.4.9 2 1.5 2v9"/><path d="M18 3c-1.4 0-2.5 1.8-2.5 5s1.1 5 2.5 5V21"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>',
  checklist: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 6.5 6 8l3-3M4.5 13.5 6 15l3-3M4.5 20.5 6 22l3-3"/><path d="M11.5 7h8M11.5 14h8M11.5 21h8" stroke-linecap="round"/></svg>',
  bin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6.5 7 7.3 20a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7"/><path d="M10 11v6M14 11v6"/></svg>',
  contact: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="3.5" width="15" height="17" rx="2"/><circle cx="12" cy="10" r="2.6"/><path d="M8 17c.7-2 2.2-3 4-3s3.3 1 4 3"/></svg>',
  more: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="5" cy="12" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="19" cy="12" r="1.9"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h3l1.5 4.5-2 1.5a10 10 0 0 0 5.5 5.5l1.5-2L20 15v3a2 2 0 0 1-2 2C10.8 20 4 13.2 4 6a2 2 0 0 1 2-2Z"/></svg>',
  tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4h6a2 2 0 0 1 2 2v6L11 21l-8-8L12 4Z"/><circle cx="14.5" cy="9.5" r="1.4"/></svg>',
};

// Renders one icon at a given pixel size (defaults to 1em so it matches
// surrounding text without extra CSS).
function icon(name, size) {
  const svg = window.ICONS[name];
  if (!svg) return '';
  const dim = size ? ('width:' + size + 'px;height:' + size + 'px') : 'width:1em;height:1em';
  return '<span class="icon-glyph" style="display:inline-flex;' + dim + ';vertical-align:middle">' + svg + '</span>';
}
