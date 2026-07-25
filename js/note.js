// ============================================
// note 最新記事をカードに流し込む（/api/news から取得）
//
// 対象: [data-note-card="N"] を持つカード。N は取得記事の 0 始まり index。
//   カード内の [data-note-date] [data-note-title] [data-note-excerpt] [data-note-thumb]
//   だけを書き換える（DOM構造・CSSは触らない）。
// フォールバック: 取得失敗・記事不足時はHTMLの静的カードをそのまま残す。
// ============================================
(function () {
  var cards = document.querySelectorAll('[data-note-card]');
  if (!cards.length) return;

  fetch('/api/news')
    .then(function (r) { if (!r.ok) throw new Error('api'); return r.json(); })
    .then(function (data) {
      var items = (data && data.items) || [];
      cards.forEach(function (card) {
        var i = parseInt(card.getAttribute('data-note-card'), 10);
        var item = items[i];
        if (!item) return; // 記事数がカード数に満たない場合は静的カードを残す

        var date = card.querySelector('[data-note-date]');
        var title = card.querySelector('[data-note-title]');
        var excerpt = card.querySelector('[data-note-excerpt]');
        var thumb = card.querySelector('[data-note-thumb]');

        if (date && item.date) date.textContent = item.date;
        if (title && item.title) title.textContent = item.title;
        if (excerpt && item.excerpt) excerpt.textContent = item.excerpt + '…';
        if (thumb && item.thumbnail) thumb.setAttribute('src', item.thumbnail);

        if (item.link) {
          card.style.cursor = 'pointer';
          card.addEventListener('click', function () {
            window.open(item.link, '_blank', 'noopener');
          });
        }
      });
    })
    .catch(function () { /* 静的カードを維持 */ });
})();
