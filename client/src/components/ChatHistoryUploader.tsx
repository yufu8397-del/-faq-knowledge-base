import React, { useState } from 'react';
import './ChatHistoryUploader.css';
import { extractQAFromChatHistory, bulkCreateFAQs } from '../api';

interface QAPair {
  question: string;
  answer: string;
  confidence?: number;
  questionAuthor?: string;
  answerAuthor?: string;
}

interface ChatHistoryUploaderProps {
  onSuccess: () => void;
  categories: string[];
}

const ChatHistoryUploader: React.FC<ChatHistoryUploaderProps> = ({ onSuccess, categories }) => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedPairs, setExtractedPairs] = useState<QAPair[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPairs, setSelectedPairs] = useState<Set<number>>(new Set());

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setExtractedPairs([]);
      setSelectedPairs(new Set());
    }
  };

  const handleExtract = async () => {
    if (!file) {
      alert('ファイルを選択してください');
      return;
    }

    setIsExtracting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('adminToken');
      const baseUrl = process.env.REACT_APP_API_URL || 
        (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:3001/api');
      
      const response = await fetch(`${baseUrl}/extract-qa`, {
        method: 'POST',
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {},
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setExtractedPairs(data.pairs);
        // すべて選択状態にする
        setSelectedPairs(new Set(data.pairs.map((_: any, index: number) => index)));
        alert(`${data.count}件の質問と回答のペアを抽出しました`);
      } else {
        alert('抽出に失敗しました: ' + data.error);
      }
    } catch (error) {
      console.error('抽出エラー:', error);
      alert('抽出中にエラーが発生しました');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleToggleSelect = (index: number) => {
    const newSelected = new Set(selectedPairs);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedPairs(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPairs.size === extractedPairs.length) {
      setSelectedPairs(new Set());
    } else {
      setSelectedPairs(new Set(extractedPairs.map((_, index) => index)));
    }
  };

  const handleSave = async () => {
    const pairsToSave = extractedPairs.filter((_, index) => selectedPairs.has(index));
    
    if (pairsToSave.length === 0) {
      alert('追加する項目を選択してください');
      return;
    }

    setIsSaving(true);
    try {
      const response = await bulkCreateFAQs(pairsToSave, selectedCategory);
      
      if (response.success) {
        alert(`${response.successCount}件のFAQを追加しました`);
        setExtractedPairs([]);
        setFile(null);
        setSelectedPairs(new Set());
        onSuccess();
      } else {
        alert('保存に失敗しました');
      }
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存中にエラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="chat-history-uploader">
      <h3>📄 チャット履歴から自動抽出</h3>
      <p className="description">
        LINEのトーク履歴などのチャット履歴をアップロードすると、質問と回答を自動抽出してFAQに追加できます。
      </p>

      <div className="upload-section">
        <input
          type="file"
          accept=".txt,.csv"
          onChange={handleFileChange}
          className="file-input"
        />
        <button
          onClick={handleExtract}
          disabled={!file || isExtracting}
          className="extract-button"
        >
          {isExtracting ? '抽出中...' : '📤 質問と回答を抽出'}
        </button>
      </div>

      {extractedPairs.length > 0 && (
        <div className="extracted-pairs">
          <div className="pairs-header">
            <h4>抽出結果: {extractedPairs.length}件</h4>
            <div className="actions">
              <button onClick={handleSelectAll} className="select-all-button">
                {selectedPairs.size === extractedPairs.length ? 'すべて解除' : 'すべて選択'}
              </button>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="category-select"
              >
                <option value="">カテゴリを選択（オプション）</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSave}
                disabled={selectedPairs.size === 0 || isSaving}
                className="save-button"
              >
                {isSaving ? '保存中...' : `✅ ${selectedPairs.size}件をFAQに追加`}
              </button>
            </div>
          </div>

          <div className="pairs-list">
            {extractedPairs.map((pair, index) => (
              <div
                key={index}
                className={`pair-item ${selectedPairs.has(index) ? 'selected' : ''}`}
                onClick={() => handleToggleSelect(index)}
              >
                <input
                  type="checkbox"
                  checked={selectedPairs.has(index)}
                  onChange={() => handleToggleSelect(index)}
                  className="pair-checkbox"
                />
                <div className="pair-content">
                  <div className="pair-question">
                    <strong>Q:</strong> {pair.question}
                  </div>
                  <div className="pair-answer">
                    <strong>A:</strong> {pair.answer}
                  </div>
                  {pair.confidence && (
                    <div className="pair-confidence">
                      信頼度: {(pair.confidence * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHistoryUploader;
