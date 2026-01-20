const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { extractQAFromText } = require('./chatParser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ミドルウェア
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ファイルアップロード用の設定
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB制限
});

// 本番環境でReactアプリの静的ファイルを配信
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// JWT秘密鍵（環境変数から取得、なければデフォルト）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // 本番環境では環境変数で設定

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

  // 管理者パスワードのハッシュ化と保存（初回のみ）
  db.get('SELECT COUNT(*) as count FROM admin_settings', (err, row) => {
    if (err) {
      // テーブルが存在しない場合は作成
      db.run(`CREATE TABLE IF NOT EXISTS admin_settings (
        id INTEGER PRIMARY KEY,
        password_hash TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, () => {
        // 初期パスワードをハッシュ化して保存
        const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
        db.run('INSERT OR IGNORE INTO admin_settings (id, password_hash) VALUES (1, ?)', [hash]);
      });
    } else if (row.count === 0) {
      // テーブルは存在するがデータがない場合
      const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
      db.run('INSERT INTO admin_settings (id, password_hash) VALUES (1, ?)', [hash]);
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

  // ドキュメントテーブルの作成
  db.run(`CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('documentsテーブルの作成エラー:', err);
    }
  });

  // ドキュメント用の全文検索インデックス
  db.run(`CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
    title,
    content,
    category,
    tags,
    content='documents',
    content_rowid='id'
  )`, (err) => {
    if (err) {
      console.error('documents_ftsテーブルの作成エラー:', err);
    }
  });

  // ドキュメントFTS5のトリガー
  db.run(`CREATE TRIGGER IF NOT EXISTS documents_fts_insert AFTER INSERT ON documents BEGIN
    INSERT INTO documents_fts(rowid, title, content, category, tags)
    VALUES (new.id, new.title, new.content, new.category, new.tags);
  END`, (err) => {
    if (err) {
      console.error('documents_fts_insertトリガーの作成エラー:', err);
    }
  });

  db.run(`CREATE TRIGGER IF NOT EXISTS documents_fts_delete AFTER DELETE ON documents BEGIN
    INSERT INTO documents_fts(documents_fts, rowid, title, content, category, tags)
    VALUES('delete', old.id, old.title, old.content, old.category, old.tags);
  END`, (err) => {
    if (err) {
      console.error('documents_fts_deleteトリガーの作成エラー:', err);
    }
  });

  db.run(`CREATE TRIGGER IF NOT EXISTS documents_fts_update AFTER UPDATE ON documents BEGIN
    INSERT INTO documents_fts(documents_fts, rowid, title, content, category, tags)
    VALUES('delete', old.id, old.title, old.content, old.category, old.tags);
    INSERT INTO documents_fts(rowid, title, content, category, tags)
    VALUES (new.id, new.title, new.content, new.category, new.tags);
  END`, (err) => {
    if (err) {
      console.error('documents_fts_updateトリガーの作成エラー:', err);
    } else {
      // 既存データをFTS5に同期
      db.run(`INSERT OR IGNORE INTO documents_fts(rowid, title, content, category, tags)
        SELECT id, title, content, category, tags FROM documents`, (err) => {
        if (err) {
          console.error('既存ドキュメントデータの同期エラー:', err);
        }
      });
    }
  });
});

// 認証ミドルウェア
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: '認証が必要です' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: '管理者権限が必要です' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: '無効なトークンです' });
  }
};

// API ルート

// 管理者ログイン
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: 'パスワードが必要です' });
  }
  
  db.get('SELECT password_hash FROM admin_settings WHERE id = 1', (err, row) => {
    if (err || !row) {
      return res.status(500).json({ error: '認証エラーが発生しました' });
    }
    
    const isValid = bcrypt.compareSync(password, row.password_hash);
    
    if (isValid) {
      // トークンの有効期限を7日間に設定（長期間ログイン状態を維持）
      const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ success: true, token, role: 'admin' });
    } else {
      res.status(401).json({ error: 'パスワードが正しくありません' });
    }
  });
});

// 認証状態の確認
app.get('/api/auth/check', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.json({ authenticated: false, role: 'guest' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ authenticated: true, role: decoded.role });
  } catch (error) {
    res.json({ authenticated: false, role: 'guest' });
  }
});

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

// FAQ作成（管理者のみ）
app.post('/api/faqs', authenticateAdmin, (req, res) => {
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

// FAQ更新（管理者のみ）
app.put('/api/faqs/:id', authenticateAdmin, (req, res) => {
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

// FAQ削除（管理者のみ）
app.delete('/api/faqs/:id', authenticateAdmin, (req, res) => {
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

// チャット履歴から質問と回答を抽出（管理者のみ）
// 認証チェックを先に行う
app.post('/api/extract-qa', authenticateAdmin, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'ファイルがアップロードされていません' });
    }
    
    const text = req.file.buffer.toString('utf-8');
    const pairs = extractQAFromText(text);
    
    res.json({
      success: true,
      count: pairs.length,
      pairs: pairs
    });
  } catch (error) {
    console.error('抽出エラー:', error);
    res.status(500).json({ error: error.message });
  }
});

// 抽出した質問と回答を一括でFAQに追加（管理者のみ）
// ドキュメント検索（全員が利用可能）
app.get('/api/documents/search', (req, res) => {
  const { q } = req.query;
  
  if (!q || q.trim() === '') {
    return res.json([]);
  }

  // 全文検索クエリ（抜粋を取得）
  const searchQuery = `
    SELECT 
      d.*,
      rank,
      snippet(documents_fts, 2, '<mark>', '</mark>', '...', 64) as content_snippet
    FROM documents_fts fts
    JOIN documents d ON fts.rowid = d.id
    WHERE documents_fts MATCH ?
    ORDER BY rank
    LIMIT 5
  `;

  db.all(searchQuery, [q], (err, rows) => {
    if (err) {
      // FTS5のエラーを処理（無効なクエリの場合）
      if (err.message.includes('malformed')) {
        // フォールバック: LIKE検索
        const fallbackQuery = `
          SELECT 
            *,
            substr(content, 1, 200) || '...' as content_snippet
          FROM documents
          WHERE title LIKE ? OR content LIKE ?
          ORDER BY created_at DESC
          LIMIT 5
        `;
        const searchTerm = `%${q}%`;
        db.all(fallbackQuery, [searchTerm, searchTerm], (err2, rows2) => {
          if (err2) {
            return res.status(500).json({ error: err2.message });
          }
          res.json(rows2);
        });
      } else {
        return res.status(500).json({ error: err.message });
      }
    } else {
      res.json(rows);
    }
  });
});

// ドキュメント一覧（管理者のみ）
app.get('/api/documents', authenticateAdmin, (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  
  const query = `
    SELECT * FROM documents
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  
  db.all(query, [parseInt(limit), parseInt(offset)], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// ドキュメントアップロード（管理者のみ）
app.post('/api/documents', authenticateAdmin, upload.single('file'), (req, res) => {
  let title = req.body.title || '';
  let content = req.body.content || '';
  const category = req.body.category || null;
  const tags = req.body.tags || null;

  // ファイルアップロードの場合
  if (req.file) {
    const fileContent = req.file.buffer.toString('utf-8');
    if (!title) {
      // ファイル名からタイトルを生成
      title = req.file.originalname.replace(/\.[^/.]+$/, '');
    }
    content = fileContent;
  }

  if (!title || !content) {
    return res.status(400).json({ error: 'タイトルとコンテンツが必要です' });
  }

  const query = `
    INSERT INTO documents (title, content, category, tags)
    VALUES (?, ?, ?, ?)
  `;

  db.run(query, [title, content, category, tags], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ 
      id: this.lastID, 
      title, 
      content, 
      category, 
      tags,
      message: 'ドキュメントが追加されました' 
    });
  });
});

// ドキュメント削除（管理者のみ）
app.delete('/api/documents/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM documents WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'ドキュメントが見つかりません' });
    }
    res.json({ message: 'ドキュメントが削除されました' });
  });
});

app.post('/api/faqs/bulk', authenticateAdmin, (req, res) => {
  const { pairs, category } = req.body;
  
  if (!Array.isArray(pairs) || pairs.length === 0) {
    return res.status(400).json({ error: '質問と回答のペアが必要です' });
  }
  
  const results = [];
  let successCount = 0;
  let errorCount = 0;
  let processedCount = 0;
  
  db.serialize(() => {
    const stmt = db.prepare('INSERT INTO faqs (question, answer, category, tags) VALUES (?, ?, ?, ?)');
    
    pairs.forEach((pair, index) => {
      if (!pair.question || !pair.answer) {
        errorCount++;
        results.push({ index, success: false, error: '質問または回答が空です' });
        processedCount++;
        if (processedCount === pairs.length) {
          stmt.finalize();
          res.json({
            success: true,
            total: pairs.length,
            successCount,
            errorCount,
            results
          });
        }
        return;
      }
      
      stmt.run(
        pair.question.trim(),
        pair.answer.trim(),
        category || pair.category || null,
        pair.tags || '',
        function(err) {
          processedCount++;
          if (err) {
            errorCount++;
            results.push({ index, success: false, error: err.message });
          } else {
            successCount++;
            results.push({ 
              index, 
              success: true, 
              id: this.lastID,
              question: pair.question,
              answer: pair.answer
            });
          }
          
          // 最後の処理が終わったら結果を返す
          if (processedCount === pairs.length) {
            stmt.finalize();
            res.json({
              success: true,
              total: pairs.length,
              successCount,
              errorCount,
              results
            });
          }
        }
      );
    });
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
  console.log(`APIエンドポイント: http://localhost:${PORT}/api`);
  if (process.env.NODE_ENV === 'production') {
    console.log('本番モードで実行中');
  }
});
