// ============================================
// note RSS を毎回サーバー側で取得して返す Vercel Serverless Function
//
// エンドポイント: /api/news
// 仕組み: アクセス時に note の RSS を取得・パースして JSON で返す。
//         Vercel のエッジで s-maxage 秒キャッシュ（＝note記事が出れば自動反映）。
//         手動の node 実行は不要。これが「自動更新」の実体。
//
// ローカル(file:// / python http.server)では動かない。Vercel本番 or `vercel dev` で動作。
// フロント側は取得失敗時、HTMLにベタ書きされた静的カードをそのまま残す（フォールバック）。
// ============================================

// とある専用 note アカウント（https://note.com/toallinc・2026-07-22受領）
const RSS_URL = 'https://note.com/toallinc/rss';
const LIMIT = 3;
// エッジキャッシュ: 1時間は即返し、24時間以内は古い値を返しつつ裏で更新
const CACHE = 's-maxage=3600, stale-while-revalidate=86400';

function pick(regex, text) {
  const m = text.match(regex);
  return m ? m[1].trim() : '';
}
function stripHtml(html) {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}
function formatDate(rfc2822) {
  const d = new Date(rfc2822);
  if (isNaN(d)) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

export default async function handler(req, res) {
  try {
    const r = await fetch(RSS_URL);
    if (!r.ok) {
      res.status(502).json({ items: [], error: `RSS HTTP ${r.status}` });
      return;
    }
    const xml = await r.text();
    const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
    const items = blocks.slice(0, LIMIT).map((block) => {
      const descRaw = pick(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/, block);
      return {
        title: pick(/<title>([\s\S]*?)<\/title>/, block),
        link: pick(/<link>([\s\S]*?)<\/link>/, block),
        date: formatDate(pick(/<pubDate>([\s\S]*?)<\/pubDate>/, block)),
        thumbnail: pick(/<media:thumbnail>([\s\S]*?)<\/media:thumbnail>/, block),
        excerpt: stripHtml(descRaw).replace(/続きをみる$/, '').trim().slice(0, 100),
      };
    });
    res.setHeader('Cache-Control', CACHE);
    res.status(200).json({ items });
  } catch (e) {
    res.status(500).json({ items: [], error: String(e) });
  }
}
