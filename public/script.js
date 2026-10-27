// Surabaya Cafe API — landing page script

(function () {
  'use strict';

  const BASE = location.origin;

  document.getElementById('code-curl').textContent =
    'curl "' + BASE + '/api/cafes?area=Surabaya%20Pusat&limit=5"';

  fetch(BASE + '/api/stats')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      document.getElementById('stat-total').textContent = d.total;
      document.getElementById('stat-areas').textContent = Object.keys(d.areas).length;
    })
    .catch(function () {});

  fetch(BASE + '/api/cafes?limit=1')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var sample = d.data && d.data[0];
      if (sample) {
        document.getElementById('sample-response').textContent =
          JSON.stringify(sample, null, 2);
      }
    })
    .catch(function () {
      document.getElementById('sample-response').textContent =
        'Contoh data tidak bisa dimuat.';
    });

  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var el = document.getElementById(btn.getAttribute('data-target'));
      navigator.clipboard.writeText(el.textContent).then(function () {
        btn.textContent = 'Tersalin';
        setTimeout(function () { btn.textContent = 'Salin'; }, 1500);
      });
    });
  });
})();
