(function () {
  'use strict';

  const counter = document.querySelector('[data-visitor-counter]');
  const value = document.querySelector('[data-visitor-total]');
  if (!counter || !value) return;

  fetch('/api/visits', {
    method: 'POST',
    cache: 'no-store',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' }
  })
    .then((response) => {
      if (!response.ok) throw new Error('Visitor counter unavailable.');
      return response.json();
    })
    .then((data) => {
      if (!Number.isFinite(Number(data.total))) throw new Error('Invalid visitor count.');
      value.textContent = Number(data.total).toLocaleString('en-US');
      counter.hidden = false;
    })
    .catch(() => {
      counter.hidden = true;
    });
})();
