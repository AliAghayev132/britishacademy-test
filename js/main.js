/* ============================================================
   British Academy — shared interactions (vanilla JS)
   Every feature is guarded, so one file serves every page:
   an init only runs when its elements exist on the page.
   ============================================================ */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initLoader();
    initProgressBar();
    initHeaderSpacer();
    initMobileNav();
    initActiveNav();
    initHomeFx();
    initWhatsAppBranches();
    initReveal();
    initHeroWords();
    initHeroChips();
    initCategoryPills();
    initMarquee();
    initPartners();
    initFaq();
    initSearch();
    initApplyModal();
    initLangToggle();
    initBlogFilter();
    initCertCarousel();
    initVideos();
  });

  /* ---------- Loader (home) ---------- */
  function initLoader() {
    var bar = document.getElementById('ba-loadbar');
    var loader = document.getElementById('ba-loader');
    if (bar) requestAnimationFrame(function () { bar.style.width = '100%'; });
    if (loader) {
      setTimeout(function () {
        loader.style.opacity = '0';
        setTimeout(function () { loader.style.display = 'none'; }, 600);
      }, 1100);
    }
  }

  /* ---------- Scroll progress bar ---------- */
  function initProgressBar() {
    var prog = document.getElementById('ba-progress');
    if (!prog) return;
    function onScroll() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Fixed header spacer sizing ---------- */
  function initHeaderSpacer() {
    var fh = document.querySelector('.ba-fixhead');
    var sp = document.getElementById('ba-hspace');
    if (!fh || !sp) return;
    function size() { sp.style.height = fh.offsetHeight + 'px'; }
    window.addEventListener('resize', size);
    size();
    setTimeout(size, 300);
  }

  /* ---------- Homepage FX: stagger, count-up, hero parallax ---------- */
  function initHomeFx() {
    if (!document.body.classList.contains('ba-home')) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Staggered reveal for .ba-sg containers
    var groups = document.querySelectorAll('.ba-sg');
    if (groups.length && !reduce && 'IntersectionObserver' in window) {
      document.body.classList.add('ba-fx');
      // once a child's entry animation ends, release it so hover transforms work
      document.addEventListener('animationend', function (e) {
        if (e.animationName === 'ba-in') e.target.style.animation = 'none';
      });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        });
      }, { threshold: 0, rootMargin: '0px 0px -12% 0px' });
      groups.forEach(function (g) {
        Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty('--i', i); });
        // keyboard users: reveal a group instantly when focus enters it
        g.addEventListener('focusin', function () {
          g.classList.add('is-in');
          Array.prototype.forEach.call(g.children, function (c) { c.style.animation = 'none'; });
        });
      });
      // hold the reveal until the loader has fully faded, so the entrance is seen
      var revealWait = document.getElementById('ba-loader') ? 1650 : 0;
      setTimeout(function () { groups.forEach(function (g) { io.observe(g); }); }, revealWait);
    }

    // Count-up hero stats
    var nums = document.querySelectorAll('[data-count]');
    if (nums.length && !reduce) {
      var fmt = function (n) {
        var s = String(Math.round(n));
        return s.length > 3 ? s.slice(0, -3) + ' ' + s.slice(-3) : s;
      };
      var run = function (el) {
        var target = parseInt(el.getAttribute('data-count'), 10);
        var suffix = el.getAttribute('data-suffix') || '';
        // lock the width while the static final text is still in place, so the row doesn't jitter
        el.style.minWidth = Math.ceil(el.getBoundingClientRect().width) + 'px';
        var t0 = null, dur = 1400;
        function tick(t) {
          if (!t0) t0 = t;
          var p = Math.min(1, (t - t0) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = fmt(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      };
      // start after the loader fully fades so the animation is actually seen
      setTimeout(function () { nums.forEach(run); }, document.getElementById('ba-loader') ? 1650 : 200);
    }

    // Gentle mouse parallax on hero chips
    var hero = document.querySelector('.ba-hero');
    if (hero && !reduce && window.matchMedia('(pointer: fine)').matches) {
      var layers = [];
      hero.querySelectorAll('[data-chip]').forEach(function (chip, i) {
        var wrap = chip.parentElement;
        layers.push({ el: wrap, base: wrap.style.transform || '', depth: 7 + (i % 3) * 6 });
      });
      var raf = 0;
      hero.addEventListener('pointermove', function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          var r = hero.getBoundingClientRect();
          var nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
          var ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
          layers.forEach(function (l) {
            l.el.style.transform = 'translate3d(' + (nx * l.depth).toFixed(1) + 'px,' + (ny * l.depth).toFixed(1) + 'px,0) ' + l.base;
          });
        });
      });
      hero.addEventListener('pointerleave', function () {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        layers.forEach(function (l) { l.el.style.transform = l.base; });
      });
    }
  }

  /* ---------- WhatsApp branch selector (click → pick branch) ---------- */
  function initWhatsAppBranches() {
    var wa = document.querySelector('.ba-wa');
    if (!wa) return;
    // Filial siyahısı — tools/build.mjs-dəki BRANCHES ilə eyni saxla
    var branches = [
      { name: 'Mərkəz — Caspian Plaza', wa: '994552124151' },
      { name: 'Nərimanov filialı', wa: '994552124152' },
      { name: 'Xətai filialı', wa: '994552124153' },
      { name: 'Yasamal filialı', wa: '994552124154' }
    ];
    var waIcon = '<span class="ba-wa-pop-ic"><svg viewBox="0 0 32 32" width="17" height="17" fill="#fff"><path d="M16 .5C7.4.5.5 7.4.5 16c0 2.8.7 5.5 2.1 7.9L.4 31.6l7.9-2.1c2.3 1.3 4.9 1.9 7.6 1.9 8.6 0 15.5-6.9 15.5-15.5S24.6.5 16 .5z"></path></svg></span>';
    var pop = document.createElement('div');
    pop.className = 'ba-wa-pop';
    pop.setAttribute('role', 'menu');
    pop.innerHTML = '<div class="ba-wa-pop-h">Filial seç · WhatsApp</div>' +
      branches.map(function (b) {
        return '<a href="https://wa.me/' + b.wa + '" target="_blank" rel="noopener" role="menuitem">' + waIcon + '<span>' + b.name + '</span></a>';
      }).join('');
    document.body.appendChild(pop);

    wa.setAttribute('aria-haspopup', 'true');
    wa.setAttribute('aria-expanded', 'false');
    function setOpen(open) {
      pop.classList.toggle('open', open);
      wa.classList.toggle('is-open', open);
      wa.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    wa.addEventListener('click', function (e) {
      e.preventDefault();
      setOpen(!pop.classList.contains('open'));
    });
    pop.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
    document.addEventListener('click', function (e) {
      if (!pop.contains(e.target) && !wa.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  }

  /* ---------- Mobile navigation drawer ---------- */
  function initMobileNav() {
    var burger = document.querySelector('.ba-burger');
    var drawer = document.getElementById('ba-mnav');
    if (!burger || !drawer) return;
    function set(open) {
      drawer.classList.toggle('open', open);
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    }
    burger.addEventListener('click', function () { set(!drawer.classList.contains('open')); });
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { set(false); });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  }

  /* ---------- Active nav highlight ---------- */
  function initActiveNav() {
    var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('.ba-nav .ba-nav-item').forEach(function (item) {
      var match = false;
      item.querySelectorAll('a').forEach(function (a) {
        var href = (a.getAttribute('href') || '').split('#')[0].split('/').pop().toLowerCase();
        if (href && href === here) match = true;
      });
      if (match) item.classList.add('is-active');
    });
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    var els = document.querySelectorAll('.ba-reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Hero rotating words ---------- */
  function initHeroWords() {
    var words = document.querySelectorAll('.ba-rot-word');
    if (!words.length) return;
    var heroPal = ['#4F5BF0', '#3D5AF0', '#5B49E8', '#6C4DF0', '#2E6BE6', '#0EA5A0', '#E0533D', '#8B3DF0', '#1E9E8A', '#4338CA'];
    document.documentElement.style.setProperty('--hero-bg', heroPal[Math.floor(Math.random() * heroPal.length)]);
    var wi = -1, prev = -1;
    function cycle() {
      wi = (wi + 1) % words.length;
      words.forEach(function (w, i) {
        if (i === wi) { w.style.opacity = '1'; w.style.transform = 'translate(-50%,0) rotateX(0deg)'; }
        else if (i === prev) { w.style.opacity = '0'; w.style.transform = 'translate(-50%,-80%) rotateX(80deg)'; }
        else { w.style.opacity = '0'; w.style.transform = 'translate(-50%,80%) rotateX(-80deg)'; }
      });
      prev = wi;
    }
    cycle();
    setInterval(cycle, 3000);
  }

  /* ---------- Hero floating chips (random pick) ---------- */
  function initHeroChips() {
    var slots = document.querySelectorAll('[data-chip]');
    if (!slots.length) return;
    var pool = ['Salam', 'Hello', 'Привет', 'Hallo', 'Hola', 'Ciao', 'Merhaba', 'Bonjour', 'Guten Tag', 'IELTS 7.0', 'TOEFL', 'SAT', 'A1 → C1', 'Speaking', 'Fluent'];
    for (var k = pool.length - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)); var t = pool[k]; pool[k] = pool[j]; pool[j] = t; }
    slots.forEach(function (el, i) { el.textContent = pool[i % pool.length]; });
  }

  /* ---------- Category pills random highlight ---------- */
  function initCategoryPills() {
    var pills = document.querySelectorAll('.ba-pill-cat');
    if (!pills.length) return;
    var palette = ['#FF5A3C', '#12B5A5', '#7C4DFF', '#2E6BE6', '#FF3D8B', '#F5A524', '#22B07D', '#0EA5E9'];
    var prevPill = null;
    function reset(el) {
      if (!el) return;
      el.style.background = '#fff';
      el.style.color = '#1B1B26';
      var ic = el.querySelector('.ba-pill-ic');
      if (ic) ic.style.color = 'var(--accent)';
    }
    setInterval(function () {
      reset(prevPill);
      var el = pills[Math.floor(Math.random() * pills.length)];
      var color = palette[Math.floor(Math.random() * palette.length)];
      el.style.background = color;
      el.style.color = '#fff';
      var ic = el.querySelector('.ba-pill-ic');
      if (ic) ic.style.color = '#fff';
      prevPill = el;
    }, 1600);
  }

  /* ---------- Marquee ---------- */
  function initMarquee() {
    var el = document.getElementById('ba-mq');
    if (!el) return;
    var mx = 0;
    function step() {
      if (el.scrollWidth > 0) {
        var w = el.scrollWidth / 2;
        el.style.transform = 'translateX(' + (-(mx % w)) + 'px)';
      }
      mx += 0.6;
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- Partner tiles radial hover ---------- */
  function initPartners() {
    var tiles = document.querySelectorAll('.ba-partner');
    if (!tiles.length) return;
    tiles.forEach(function (tile) {
      var ov = tile.querySelector('.ba-pov');
      if (!ov) return;
      function place(e) {
        var r = tile.getBoundingClientRect();
        var size = Math.max(r.width, r.height) * 2.5;
        ov.style.width = size + 'px';
        ov.style.height = size + 'px';
        ov.style.left = (e.clientX - r.left - size / 2) + 'px';
        ov.style.top = (e.clientY - r.top - size / 2) + 'px';
      }
      tile.addEventListener('mouseenter', function (e) { place(e); requestAnimationFrame(function () { ov.style.transform = 'scale(1)'; }); });
      tile.addEventListener('mouseleave', function () { ov.style.transform = 'scale(0)'; });
    });
  }

  /* ---------- FAQ accordion ---------- */
  function initFaq() {
    var items = document.querySelectorAll('.ba-faq');
    if (!items.length) return;
    function setOpen(item, open) {
      var body = item.querySelector('.ba-faq-body');
      var sign = item.querySelector('.ba-faq-sign');
      var head = item.querySelector('.ba-faq-q');
      if (head) head.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        // measure so long answers are never clipped
        body.style.maxHeight = (body.scrollHeight + 20) + 'px';
        body.style.opacity = '1';
        if (sign) sign.textContent = '–';
      } else {
        body.style.maxHeight = '0px';
        body.style.opacity = '0';
        if (sign) sign.textContent = '+';
      }
    }
    items.forEach(function (item, idx) {
      var head = item.querySelector('.ba-faq-q');
      var body = item.querySelector('.ba-faq-body');
      if (!head || !body) return;
      // make the question row operable by keyboard + announce its state
      if (!body.id) body.id = 'ba-faq-body-' + idx;
      head.setAttribute('role', 'button');
      head.setAttribute('tabindex', '0');
      head.setAttribute('aria-controls', body.id);
      setOpen(item, idx === 0);
      function toggle() {
        var isOpen = body.style.opacity === '1';
        items.forEach(function (o) { setOpen(o, false); });
        if (!isOpen) setOpen(item, true);
      }
      head.addEventListener('click', toggle);
      head.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); toggle(); }
      });
    });
    // re-measure the open panel when the viewport reflows
    window.addEventListener('resize', function () {
      items.forEach(function (item) {
        var body = item.querySelector('.ba-faq-body');
        if (body && body.style.opacity === '1') {
          body.style.maxHeight = 'none';
          body.style.maxHeight = (body.scrollHeight + 20) + 'px';
        }
      });
    });
  }

  /* ---------- Search overlay ---------- */
  function initSearch() {
    var overlay = document.getElementById('ba-search-overlay');
    if (!overlay) return;
    var input = document.getElementById('ba-search-input');
    var resultsBox = document.getElementById('ba-search-results');
    var emptyBox = document.getElementById('ba-search-empty');

    var index = [
      { title: 'İngilis dili kursu', type: 'Kurs', href: 'ingilis-dili-kursu.html' },
      { title: 'Biznes İngilis dili kursu', type: 'Kurs', href: 'biznes-ingilis-dili-kursu.html' },
      { title: 'Hüquqşünaslar üçün İngilis dili', type: 'Kurs', href: 'huquqsunaslar-ingilis-dili-kursu.html' },
      { title: 'Otel və Turizm üçün İngilis dili', type: 'Kurs', href: 'otel-turizm-ingilis-dili-kursu.html' },
      { title: 'Alman dili kursu', type: 'Kurs', href: 'alman-dili-kursu.html' },
      { title: 'Rus dili kursu', type: 'Kurs', href: 'rus-dili-kursu.html' },
      { title: 'İspan dili kursu', type: 'Kurs', href: 'ispan-dili-kursu.html' },
      { title: 'İtalyan dili kursu', type: 'Kurs', href: 'italyan-dili-kursu.html' },
      { title: 'Fransız dili kursu', type: 'Kurs', href: 'fransiz-dili-kursu.html' },
      { title: 'IELTS & Pre-IELTS', type: 'İmtahan', href: 'ielts.html' },
      { title: 'TOEFL & Pre-TOEFL', type: 'İmtahan', href: 'toefl.html' },
      { title: 'OET', type: 'İmtahan', href: 'oet.html' },
      { title: 'TOEIC', type: 'İmtahan', href: 'toeic.html' },
      { title: 'SAT & Pre-SAT', type: 'İmtahan', href: 'sat.html' },
      { title: 'Duolingo', type: 'İmtahan', href: 'duolingo.html' },
      { title: 'TOLES', type: 'İmtahan', href: 'toles.html' },
      { title: 'Conversation Club', type: 'Praktika', href: 'conversation-club.html' },
      { title: 'Workshop', type: 'Praktika', href: 'workshop.html' },
      { title: 'TEFL Kursları', type: 'Sertifikat', href: 'tefl-kurslari.html' },
      { title: 'MS Office proqramları', type: 'Kompüter', href: 'ms-office.html' },
      { title: 'Peşəkar Excel kursu', type: 'Kompüter', href: 'pesekar-excel-kursu.html' },
      { title: 'Mühasibatlıq və 1C kursu', type: 'Karyera', href: 'muhasibatliq-1c-kursu.html' },
      { title: 'HR & Kargüzarlıq kursu', type: 'Karyera', href: 'hr-karguzarliq-kursu.html' },
      { title: 'Uşaqlar üçün İngilis dili', type: 'Uşaq', href: 'usaq-ingilis-dili.html' },
      { title: 'Uşaqlar üçün Rus dili', type: 'Uşaq', href: 'usaq-rus-dili.html' },
      { title: 'Uşaqlar üçün Məntiq', type: 'Uşaq', href: 'usaq-mentiq.html' },
      { title: 'Dinləmə günü', type: 'Tələbələrə özəl', href: 'dinleme-gunu.html' },
      { title: 'Film günü', type: 'Tələbələrə özəl', href: 'film-gunu.html' },
      { title: 'Almaniya', type: 'Xaricdə', href: 'xaricde-almaniya.html' },
      { title: 'Türkiyə', type: 'Xaricdə', href: 'xaricde-turkiye.html' },
      { title: 'Polşa', type: 'Xaricdə', href: 'xaricde-polsa.html' },
      { title: 'Kanada', type: 'Xaricdə', href: 'xaricde-kanada.html' },
      { title: 'İngiltərə', type: 'Xaricdə', href: 'xaricde-ingiltere.html' },
      { title: 'Gürcüstan', type: 'Xaricdə', href: 'xaricde-gurcustan.html' },
      { title: 'Taqaüd Proqramları', type: 'Proqram', href: 'taqaud-proqramlari.html' },
      { title: 'Xaricdə təhsil', type: 'Səhifə', href: 'xaricde-tehsil.html' },
      { title: 'Dil Kursları', type: 'Səhifə', href: 'dil-kurslari.html' },
      { title: 'Əlaqə', type: 'Səhifə', href: 'elaqe.html' }
    ];

    function render(q) {
      q = (q || '').trim().toLowerCase();
      var list = q ? index.filter(function (it) { return it.title.toLowerCase().indexOf(q) !== -1; }) : index.slice(0, 6);
      resultsBox.innerHTML = '';
      list.forEach(function (it) {
        var a = document.createElement('a');
        a.href = it.href;
        a.className = 'ba-course';
        a.style.cssText = 'display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 16px; border:1px solid #ECEDF2; border-radius:14px; background:#fff; transition:.18s;';
        a.innerHTML =
          '<span style="display:flex; align-items:center; gap:12px;">' +
            '<span style="width:38px; height:38px; border-radius:10px; background:var(--accent-soft); color:var(--accent); display:grid; place-items:center; flex:none;">◎</span>' +
            '<span style="font-weight:600; font-size:16px; color:#1C1C26;">' + it.title + '</span>' +
          '</span>' +
          '<span style="font-size:11.5px; font-weight:700; color:#9A9AA6; letter-spacing:.06em; text-transform:uppercase; white-space:nowrap;">' + it.type + '</span>';
        resultsBox.appendChild(a);
      });
      emptyBox.style.display = (q.length > 0 && list.length === 0) ? 'block' : 'none';
    }

    function open() {
      overlay.style.display = 'block';
      render('');
      setTimeout(function () { if (input) input.focus(); }, 30);
    }
    function close() { overlay.style.display = 'none'; if (input) input.value = ''; }

    document.querySelectorAll('[data-open-search]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); open(); });
    });
    overlay.querySelectorAll('[data-close-search]').forEach(function (b) {
      b.addEventListener('click', close);
    });
    if (input) input.addEventListener('input', function () { render(input.value); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  /* ---------- Apply modal ---------- */
  function initApplyModal() {
    var modal = document.getElementById('ba-apply-modal');
    if (!modal) return;
    var sel = modal.querySelector('#ba-apply-select');
    var selLabel = modal.querySelector('#ba-apply-select-label');
    var selMenu = modal.querySelector('#ba-apply-menu');

    function open() { modal.style.display = 'flex'; }
    function close() { modal.style.display = 'none'; if (selMenu) selMenu.style.display = 'none'; }

    document.querySelectorAll('[data-open-apply]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); open(); });
    });
    modal.querySelectorAll('[data-close-apply]').forEach(function (b) {
      b.addEventListener('click', close);
    });
    // clicking the dim backdrop closes; clicking the dialog does not
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });

    if (sel && selMenu) {
      sel.addEventListener('click', function (e) {
        e.stopPropagation();
        selMenu.style.display = (selMenu.style.display === 'block') ? 'none' : 'block';
      });
      selMenu.querySelectorAll('.ba-sel-opt').forEach(function (opt) {
        opt.addEventListener('click', function (e) {
          e.stopPropagation();
          selLabel.textContent = opt.textContent;
          selLabel.style.color = '#14141C';
          selMenu.style.display = 'none';
        });
      });
      document.addEventListener('click', function () { selMenu.style.display = 'none'; });
    }

    var form = modal.querySelector('#ba-apply-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        close();
        alert('Müraciətin qəbul edildi! Tezliklə səninlə əlaqə saxlayacağıq.');
        form.reset();
        if (selLabel) { selLabel.textContent = 'Nəyə müraciət edirsən?'; selLabel.style.color = '#9A9AA6'; }
      });
    }
  }

  /* ---------- Language toggle (top bar) ---------- */
  function initLangToggle() {
    var groups = document.querySelectorAll('[data-langs]');
    if (!groups.length) return;
    groups.forEach(function (group) {
      var btns = group.querySelectorAll('[data-lang]');
      btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          btns.forEach(function (b) {
            b.style.background = 'transparent';
            b.style.color = 'rgba(255,255,255,.65)';
          });
          btn.style.background = 'var(--accent)';
          btn.style.color = '#fff';
        });
      });
    });
  }

  /* ---------- Blog category filter ---------- */
  function initBlogFilter() {
    var chips = document.querySelectorAll('[data-blog-chip]');
    if (!chips.length) return;
    var posts = document.querySelectorAll('[data-post-cat]');
    var empty = document.getElementById('bl-empty');
    function apply(cat) {
      var shown = 0;
      posts.forEach(function (p) {
        var match = (cat === 'Hamısı' || p.getAttribute('data-post-cat') === cat);
        p.style.display = match ? '' : 'none';
        if (match) shown++;
      });
      if (empty) empty.style.display = shown === 0 ? 'block' : 'none';
    }
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) {
          c.style.background = '#fff';
          c.style.color = '#4C4C58';
          c.style.borderColor = '#E4E6EF';
        });
        chip.style.background = 'var(--accent)';
        chip.style.color = '#fff';
        chip.style.borderColor = 'var(--accent)';
        apply(chip.getAttribute('data-blog-chip'));
      });
    });
  }

  /* ---------- Certificate carousel (teacher page) ---------- */
  function initCertCarousel() {
    var row = document.getElementById('tp-certs');
    if (!row) return;
    document.querySelectorAll('.tp-arrow').forEach(function (ar) {
      ar.addEventListener('click', function () {
        row.scrollBy({ left: parseInt(ar.getAttribute('data-dir'), 10) * 336, behavior: 'smooth' });
      });
    });
  }

  /* ---------- Simulated video players ---------- */
  function initVideos() {
    var cards = document.querySelectorAll('[data-video]');
    if (!cards.length) return;

    function fmt(s) {
      s = Math.max(0, Math.round(s));
      var m = Math.floor(s / 60), ss = s % 60;
      return ('0' + m).slice(-2) + ':' + ('0' + ss).slice(-2);
    }

    cards.forEach(function (card) {
      var fill = card.querySelector('.v-fill');
      var timeEl = card.querySelector('.v-time');
      var center = card.querySelector('.v-play');
      var dur = parseInt(card.getAttribute('data-dur') || '30', 10);
      var time0 = timeEl ? timeEl.textContent : '00:00';
      var iv = null;

      function showPlayIcons(playing) {
        card.querySelectorAll('.v-ic-play').forEach(function (e) { e.style.display = playing ? 'none' : ''; });
        card.querySelectorAll('.v-ic-pause').forEach(function (e) { e.style.display = playing ? '' : 'none'; });
      }
      function reset() {
        card.setAttribute('data-playing', '0');
        card.setAttribute('data-frac', '0');
        if (fill) { fill.style.transition = 'none'; fill.style.width = '0%'; }
        if (center) { center.style.opacity = ''; center.style.pointerEvents = ''; }
        showPlayIcons(false);
        if (timeEl) timeEl.textContent = time0;
        if (iv) { clearInterval(iv); iv = null; }
      }
      function toggle() {
        var playing = card.getAttribute('data-playing') === '1';
        if (!playing) {
          card.setAttribute('data-playing', '1');
          if (center) { center.style.opacity = '0'; center.style.pointerEvents = 'none'; }
          showPlayIcons(true);
          var sf = parseFloat(card.getAttribute('data-frac') || '0');
          if (fill) {
            fill.style.transition = 'width ' + (dur * (1 - sf)) + 's linear';
            void fill.offsetWidth;
            fill.style.width = '100%';
          }
          var start = Date.now();
          iv = setInterval(function () {
            var frac = sf + (Date.now() - start) / 1000 / dur;
            if (frac >= 1) frac = 1;
            card.setAttribute('data-frac', frac);
            if (timeEl) timeEl.textContent = fmt(dur * frac);
            if (frac >= 1) reset();
          }, 200);
        } else {
          card.setAttribute('data-playing', '0');
          if (iv) { clearInterval(iv); iv = null; }
          var track = card.querySelector('.v-track');
          if (fill) {
            var w = getComputedStyle(fill).width;
            fill.style.transition = 'none';
            fill.style.width = w;
            if (track && track.clientWidth) card.setAttribute('data-frac', parseFloat(w) / track.clientWidth);
          }
          if (center) { center.style.opacity = ''; center.style.pointerEvents = ''; }
          showPlayIcons(false);
        }
      }

      card.querySelectorAll('.v-play, .v-mini').forEach(function (b) {
        b.addEventListener('click', function (e) { e.preventDefault(); toggle(); });
      });
      var fs = card.querySelector('.v-fs');
      if (fs) fs.addEventListener('click', function () {
        if (document.fullscreenElement) { if (document.exitFullscreen) document.exitFullscreen(); }
        else if (card.requestFullscreen) card.requestFullscreen();
      });
      var mute = card.querySelector('.v-mute');
      if (mute) mute.addEventListener('click', function () {
        var muted = mute.getAttribute('data-muted') === '1';
        mute.setAttribute('data-muted', muted ? '0' : '1');
        var on = mute.querySelector('.v-ic-vol'); var off = mute.querySelector('.v-ic-mute');
        if (on) on.style.display = muted ? '' : 'none';
        if (off) off.style.display = muted ? 'none' : '';
      });
    });
  }

})();
