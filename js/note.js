// ============================================
// note 最新記事をカードに流し込む（/api/news から取得）
//
// 対象: [data-note-card="N"] を持つカード。N は取得記事の 0 始まり index。
//   カード内の [data-note-date] [data-note-title] [data-note-excerpt] [data-note-thumb]
//   だけを書き換える（DOM構造・CSSは触らない）。
// フォールバック: 取得失敗・記事不足時はHTMLの静的カードをそのまま残す。
//
// サムネイル: note の RSS は記事によって <media:thumbnail> を持たない。
//   その場合はロゴで穴埋めせず、写真欄ごと非表示にしてテキストだけのカードにする
//   （2026-08-25・カズキタレビュー「写真ないことがあるなら削るの方が結局いい」）。
// ============================================
(function () {
  var cards = document.querySelectorAll('[data-note-card]');
  if (!cards.length) return;

  // サムネなし記事は写真欄（トップ=.news-card-thumb／事業案内=.note-thumb-frame）ごと消す
  function hideThumbArea(thumb) {
    var frame = thumb.closest('.news-card-thumb, .note-thumb-frame');
    if (frame) frame.style.display = 'none';
  }

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
        if (thumb) {
          if (item.thumbnail) {
            // 画像URLが死んでいた場合も写真欄ごと畳む
            thumb.onerror = function () { thumb.onerror = null; hideThumbArea(thumb); };
            thumb.setAttribute('src', item.thumbnail);
          } else {
            hideThumbArea(thumb); // サムネなし記事は写真欄ごと非表示（ロゴ穴埋めはしない）
          }
        }

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
