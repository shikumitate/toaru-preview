// ============================================
// note 最新記事をカードに流し込む（/api/news から取得）
//
// 対象: [data-note-card="N"] を持つカード。N は取得記事の 0 始まり index。
//   カード内の [data-note-date] [data-note-title] [data-note-excerpt] [data-note-thumb]
//   だけを書き換える（DOM構造・CSSは触らない）。
// フォールバック: 取得失敗・記事不足時はHTMLの静的カードをそのまま残す。
//
// サムネイル: note の RSS は記事によって <media:thumbnail> を持たない。
//   その場合、HTMLベタ書きの静的画像（＝過去の別記事の絵）が残ると
//   「最新記事なのに絵だけ古い」状態になるため、とあるのロゴに差し替える。
// ============================================
(function () {
  var cards = document.querySelectorAll('[data-note-card]');
  if (!cards.length) return;

  // サムネなし記事用のプレースホルダ（ヘッダーと同じロゴマーク）
  var LOGO_SRC = 'images/045fe9c1-6d6a-4776-a452-a813eab86640.jpg';
  var LOGO_BG = '#ffffff'; // ロゴjpgが透過を持たず白地なので、余白も白で揃える

  // 静的カードの img は「横長枠に合わせて絶対配置＋107%幅」で切り抜く前提。
  // 正方形ロゴをその指定のまま入れると引き伸ばされるので、枠内に収める指定へ切り替える。
  function showLogo(thumb) {
    thumb.setAttribute('src', LOGO_SRC);
    thumb.setAttribute('alt', 'とある株式会社');
    thumb.style.position = 'absolute';
    thumb.style.left = '0';
    thumb.style.top = '0';
    thumb.style.width = '100%';
    thumb.style.height = '100%';
    thumb.style.objectFit = 'contain';
    thumb.style.padding = '8px';
    thumb.style.boxSizing = 'border-box';
    thumb.style.backgroundColor = LOGO_BG;
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
            // 画像URLが死んでいた場合もロゴに退避する
            thumb.onerror = function () { thumb.onerror = null; showLogo(thumb); };
            thumb.setAttribute('src', item.thumbnail);
          } else {
            showLogo(thumb); // サムネなし記事は古い静的画像を残さずロゴを出す
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
