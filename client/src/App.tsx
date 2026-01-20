import React, { useState, useEffect } from 'react';
import './App.css';
import SearchBar from './components/SearchBar';
import FAQList from './components/FAQList';
import FAQForm from './components/FAQForm';
import Stats from './components/Stats';
import ChatHistoryUploader from './components/ChatHistoryUploader';
import { FAQ, Category } from './types';
import { searchFAQs, getFAQs, getCategories, getStats } from './api';

const App: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [searchResults, setSearchResults] = useState<FAQ[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showChatUploader, setShowChatUploader] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadFAQs();
    loadCategories();
    loadStats();
  }, [selectedCategory]);

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
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchFAQs(query);
      setSearchResults(results);
    } catch (error) {
      console.error('検索に失敗しました:', error);
      setSearchResults([]);
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

  return (
    <div className="App">
      <header className="App-header">
        <h1>📚 FAQ ナレッジベース</h1>
        <p>よくある質問を検索・管理できます</p>
      </header>

      <div className="App-container">
        <div className="App-sidebar">
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
        </div>

        <div className="App-main">
          <SearchBar onSearch={handleSearch} />
          
          {showForm && (
            <FAQForm
              onSuccess={handleFAQAdded}
              onCancel={() => setShowForm(false)}
              categories={categories}
            />
          )}

          {showChatUploader && (
            <ChatHistoryUploader
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
          />
        </div>
      </div>
    </div>
  );
};

export default App;
