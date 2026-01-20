import React, { useState, useEffect } from 'react';
import './App.css';
import SearchBar from './components/SearchBar';
import FAQList from './components/FAQList';
import FAQForm from './components/FAQForm';
import Stats from './components/Stats';
import ChatHistoryUploader from './components/ChatHistoryUploader';
import Login from './components/Login';
import DocumentResults from './components/DocumentResults';
import DocumentUploader from './components/DocumentUploader';
import { FAQ, Category } from './types';
import { searchFAQs, getFAQs, getCategories, getStats, checkAuth, searchDocuments, Document } from './api';

const App: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [searchResults, setSearchResults] = useState<FAQ[]>([]);
  const [documentResults, setDocumentResults] = useState<Document[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showChatUploader, setShowChatUploader] = useState(false);
  const [showDocumentUploader, setShowDocumentUploader] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [stats, setStats] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuthentication();
    loadFAQs();
    loadCategories();
    loadStats();
  }, [selectedCategory]);

  const checkAuthentication = async () => {
    setIsCheckingAuth(true);
    try {
      const auth = await checkAuth();
      if (auth.authenticated && auth.role === 'admin') {
        setIsAdmin(true);
      } else {
        // トークンが無効な場合は削除
        localStorage.removeItem('adminToken');
        setIsAdmin(false);
      }
    } catch (error) {
      localStorage.removeItem('adminToken');
      setIsAdmin(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLoginSuccess = (token: string) => {
    localStorage.setItem('adminToken', token);
    setIsAdmin(true);
    setShowForm(false);
    setShowChatUploader(false);
    setShowDocumentUploader(false);
    setShowAdminLogin(false);
    loadFAQs();
    loadCategories();
    loadStats();
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAdmin(false);
    setShowForm(false);
    setShowChatUploader(false);
    setShowDocumentUploader(false);
    setShowAdminLogin(false);
    setSearchResults([]);
    setDocumentResults([]);
    setIsSearching(false);
    loadFAQs();
    loadCategories();
    loadStats();
  };

  const loadFAQs = async () => {
    try {
      const data = await getFAQs(selectedCategory);
      setFaqs(data);
    } catch (error) {
      console.error('FAQの読み込みに失敗しました:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error('カテゴリの読み込みに失敗しました:', error);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch (error) {
      console.error('統計情報の読み込みに失敗しました:', error);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      setDocumentResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // FAQ検索とドキュメント検索を並行実行
      const [faqResults, docResults] = await Promise.all([
        searchFAQs(query),
        searchDocuments(query)
      ]);
      setSearchResults(faqResults);
      setDocumentResults(docResults);
    } catch (error) {
      console.error('検索に失敗しました:', error);
      setSearchResults([]);
      setDocumentResults([]);
    }
  };

  const handleFAQAdded = () => {
    loadFAQs();
    loadCategories();
    loadStats();
    setShowForm(false);
  };

  const handleFAQUpdated = () => {
    loadFAQs();
    loadStats();
  };

  const handleFAQDeleted = () => {
    loadFAQs();
    loadStats();
  };

  const displayFAQs = isSearching ? searchResults : faqs;

  // 認証チェック中
  if (isCheckingAuth) {
    return (
      <div className="App">
        <div className="loading">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="header-main">
            <h1>❓ よくある質問</h1>
            <p>質問を入力すると、過去の回答から自動で見つけます</p>
          </div>
          <div className="header-actions">
            {isAdmin ? (
              <div className="admin-controls">
                <span className="admin-badge">管理者モード</span>
                <button onClick={handleLogout} className="logout-button-small">
                  ログアウト
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowAdminLogin(!showAdminLogin)} 
                className="admin-login-link"
              >
                管理者ログイン
              </button>
            )}
          </div>
        </div>
      </header>

      <div className={`App-container ${isAdmin ? 'has-sidebar' : ''}`}>
        {isAdmin && (
          <div className="App-sidebar admin-sidebar">
            <Stats stats={stats} />
            
            <div className="category-filter">
              <h3>カテゴリで絞り込み</h3>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setIsSearching(false);
                  setSearchResults([]);
                }}
              >
                <option value="">すべて</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="add-faq-button"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? '✕ 閉じる' : '+ 新しいFAQを追加'}
            </button>

            <button
              className="chat-upload-button"
              onClick={() => setShowChatUploader(!showChatUploader)}
            >
              {showChatUploader ? '✕ 閉じる' : '📄 チャット履歴から自動抽出'}
            </button>

            <button
              className="document-upload-button"
              onClick={() => setShowDocumentUploader(!showDocumentUploader)}
            >
              {showDocumentUploader ? '✕ 閉じる' : '📚 ドキュメントを追加'}
            </button>
          </div>
        )}

        <div className="App-main">
          <SearchBar onSearch={handleSearch} />
          
          {!isAdmin && showAdminLogin && (
            <div className="admin-login-compact">
              <Login onLoginSuccess={handleLoginSuccess} />
            </div>
          )}
          
          {isAdmin && showForm && (
            <FAQForm
              onSuccess={handleFAQAdded}
              onCancel={() => setShowForm(false)}
              categories={categories}
            />
          )}

          {isAdmin && showChatUploader && (
            <ChatHistoryUploader
              onSuccess={handleFAQAdded}
              categories={categories}
            />
          )}

          {isAdmin && showDocumentUploader && (
            <DocumentUploader
              onSuccess={handleFAQAdded}
              categories={categories}
            />
          )}

          <FAQList
            faqs={displayFAQs}
            isSearching={isSearching}
            onUpdate={handleFAQUpdated}
            onDelete={handleFAQDeleted}
            categories={categories}
            isAdmin={isAdmin}
          />

          <DocumentResults
            documents={documentResults}
            isSearching={isSearching}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
