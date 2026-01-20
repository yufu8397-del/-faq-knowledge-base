const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ミドルウェア
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 本番環境でReactアプリの静的ファイルを配信
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// データベースの初期化
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

// データベーステーブルの作成
db.serialize(() => {
  // まずメインテーブルを作成
  db.run(`CREATE TABLE IF NOT EXISTS faqs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0
  )`, (err) => {
    if (err) {
      console.error('faqsテーブルの作成エラー:', err);
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS search_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query TEXT NOT NULL,
    found INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('search_logsテーブルの作成エラー:', err);
    }
  });

  // 全文検索用のインデックス作成（faqsテーブルの後に作成）
  db.run(`CREATE VIRTUAL TABLE IF NOT EXISTS faqs_fts USING fts5(
    question,
    answer,
    category,
    tags,
    content='faqs',
    content_rowid='id'
  )`, (err) => {
    if (err) {
      console.error('faqs_ftsテーブルの作成エラー:', err);
    }
  });

  // FTS5テーブルとメインテーブルの同期用トリガー
  db.run(`CREATE TRIGGER IF NOT EXISTS faqs_fts_insert AFTER INSERT ON faqs BEGIN
    INSERT INTO faqs_fts(rowid, question, answer, category, tags)
    VALUES (new.id, new.question, new.answer, new.category, new.tags);
  END`, (err) => {
    if (err) {
      console.error('faqs_fts_insertトリガーの作成エラー:', err);
    }
  });

  db.run(`CREATE TRIGGER IF NOT EXISTS faqs_fts_delete AFTER DELETE ON faqs BEGIN
    INSERT INTO faqs_fts(faqs_fts, rowid, question, answer, category, tags)
    VALUES('delete', old.id, old.question, old.answer, old.category, old.tags);
  END`, (err) => {
    if (err) {
      console.error('faqs_fts_deleteトリガーの作成エラー:', err);
    }
  });

  db.run(`CREATE TRIGGER IF NOT EXISTS faqs_fts_update AFTER UPDATE ON faqs BEGIN
    INSERT INTO faqs_fts(faqs_fts, rowid, question, answer, category, tags)
    VALUES('delete', old.id, old.question, old.answer, old.category, old.tags);
    INSERT INTO faqs_fts(rowid, question, answer, category, tags)
    VALUES (new.id, new.question, new.answer, new.category, new.tags);
  END`, (err) => {
    if (err) {
      console.error('faqs_fts_updateトリガーの作成エラー:', err);
    }
    
    // 既存データをFTS5に同期（最後に実行）
    db.run(`INSERT OR IGNORE INTO faqs_fts(rowid, question, answer, category, tags)
      SELECT id, question, answer, category, tags FROM faqs`, (err) => {
      if (err) {
        console.error('既存データの同期エラー:', err);
      } else {
        console.log('データベースの初期化が完了しました');
      }
    });
  });
});

// API ルート

// 全FAQ取得
app.get('/api/faqs', (req, res) => {
  const { category, limit = 50, offset = 0 } = req.query;
  let query = 'SELECT * FROM faqs';
  const params = [];

  if (category) {
    query += ' WHERE category = ?';
    params.push(category);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// FAQ検索
app.get('/api/faqs/search', (req, res) => {
  const { q } = req.query;
  
  if (!q || q.trim() === '') {
    return res.json([]);
  }

  // 全文検索クエリ
  const searchQuery = `
    SELECT 
      f.*,
      rank
    FROM faqs_fts fts
    JOIN faqs f ON fts.rowid = f.id
    WHERE faqs_fts MATCH ?
    ORDER BY rank
    LIMIT 20
  `;

  // 検索ログを記録
  db.run('INSERT INTO search_logs (query) VALUES (?)', [q]);

  db.all(searchQuery, [q], (err, rows) => {
    if (err) {
      // FTS5のエラーを処理（無効なクエリの場合）
      if (err.message.includes('malformed')) {
        // フォールバック: LIKE検索
        const fallbackQuery = `
          SELECT * FROM faqs
          WHERE question LIKE ? OR answer LIKE ?
          ORDER BY created_at DESC
          LIMIT 20
        `;
        const searchTerm = `%${q}%`;
        db.all(fallbackQuery, [searchTerm, searchTerm], (err2, rows2) => {
          if (err2) {
            return res.status(500).json({ error: err2.message });
          }
          // 検索ログを更新
          db.run('UPDATE search_logs SET found = ? WHERE id = (SELECT MAX(id) FROM search_logs)', 
            [rows2.length > 0 ? 1 : 0]);
          res.json(rows2);
        });
      } else {
        return res.status(500).json({ error: err.message });
      }
    } else {
      // 検索ログを更新
      db.run('UPDATE search_logs SET found = ? WHERE id = (SELECT MAX(id) FROM search_logs)', 
        [rows.length > 0 ? 1 : 0]);
      
      // 閲覧数を増やす
      rows.forEach(row => {
        db.run('UPDATE faqs SET view_count = view_count + 1 WHERE id = ?', [row.id]);
      });
      
      res.json(rows);
    }
  });
});

// 特定のFAQ取得
app.get('/api/faqs/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM faqs WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'FAQ not found' });
    }
    // 閲覧数を増やす
    db.run('UPDATE faqs SET view_count = view_count + 1 WHERE id = ?', [id]);
    res.json(row);
  });
});

// FAQ作成
app.post('/api/faqs', (req, res) => {
  const { question, answer, category, tags } = req.body;
  
  if (!question || !answer) {
    return res.status(400).json({ error: 'Question and answer are required' });
  }

  const tagsStr = Array.isArray(tags) ? tags.join(',') : tags || '';

  db.run(
    'INSERT INTO faqs (question, answer, category, tags) VALUES (?, ?, ?, ?)',
    [question, answer, category || null, tagsStr],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, question, answer, category, tags: tagsStr });
    }
  );
});

// FAQ更新
app.put('/api/faqs/:id', (req, res) => {
  const { id } = req.params;
  const { question, answer, category, tags } = req.body;
  
  if (!question || !answer) {
    return res.status(400).json({ error: 'Question and answer are required' });
  }

  const tagsStr = Array.isArray(tags) ? tags.join(',') : tags || '';

  db.run(
    'UPDATE faqs SET question = ?, answer = ?, category = ?, tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [question, answer, category || null, tagsStr, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'FAQ not found' });
      }
      res.json({ id, question, answer, category, tags: tagsStr });
    }
  );
});

// FAQ削除
app.delete('/api/faqs/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM faqs WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'FAQ not found' });
    }
    res.json({ message: 'FAQ deleted successfully' });
  });
});

// 役に立ったカウントを増やす
app.post('/api/faqs/:id/helpful', (req, res) => {
  const { id } = req.params;
  db.run('UPDATE faqs SET helpful_count = helpful_count + 1 WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Helpful count updated' });
  });
});

// カテゴリ一覧取得
app.get('/api/categories', (req, res) => {
  db.all('SELECT DISTINCT category FROM faqs WHERE category IS NOT NULL AND category != ""', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows.map(row => row.category));
  });
});

// 検索ログ取得（管理者用）
app.get('/api/search-logs', (req, res) => {
  const { limit = 100 } = req.query;
  db.all(
    'SELECT * FROM search_logs ORDER BY created_at DESC LIMIT ?',
    [parseInt(limit)],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// 統計情報取得
app.get('/api/stats', (req, res) => {
  db.get('SELECT COUNT(*) as total FROM faqs', (err, totalRow) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    db.get('SELECT COUNT(*) as total_searches FROM search_logs', (err2, searchRow) => {
      if (err2) {
        return res.status(500).json({ error: err2.message });
      }
      
      db.get('SELECT COUNT(*) as found_searches FROM search_logs WHERE found = 1', (err3, foundRow) => {
        if (err3) {
          return res.status(500).json({ error: err3.message });
        }
        
        res.json({
          totalFaqs: totalRow.total,
          totalSearches: searchRow.total_searches,
          foundSearches: foundRow.found_searches,
          successRate: searchRow.total_searches > 0 
            ? ((foundRow.found_searches / searchRow.total_searches) * 100).toFixed(2) 
            : 0
        });
      });
    });
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
  console.log(`APIエンドポイント: http://localhost:${PORT}/api`);
});
