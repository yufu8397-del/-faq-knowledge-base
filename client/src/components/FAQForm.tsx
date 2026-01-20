import React, { useState, useEffect } from 'react';
import './FAQForm.css';
import { FAQ, Category } from '../types';
import { createFAQ, updateFAQ } from '../api';

interface FAQFormProps {
  faq?: FAQ;
  onSuccess: () => void;
  onCancel: () => void;
  categories: Category[];
}

const FAQForm: React.FC<FAQFormProps> = ({ faq, onSuccess, onCancel, categories }) => {
  const [question, setQuestion] = useState(faq?.question || '');
  const [answer, setAnswer] = useState(faq?.answer || '');
  const [category, setCategory] = useState(faq?.category || '');
  const [tags, setTags] = useState(faq?.tags || '');
  const [newCategory, setNewCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim() || !answer.trim()) {
      alert('質問と回答を入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      const tagsArray = tags.split(',').map(t => t.trim()).filter(t => t);
      
      if (faq) {
        await updateFAQ(faq.id, {
          question: question.trim(),
          answer: answer.trim(),
          category: category || null,
          tags: tagsArray.join(','),
        });
      } else {
        await createFAQ({
          question: question.trim(),
          answer: answer.trim(),
          category: category || null,
          tags: tagsArray.join(','),
        });
      }
      onSuccess();
    } catch (error) {
      console.error('保存に失敗しました:', error);
      alert('保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategory(newCategory.trim());
      setNewCategory('');
    }
  };

  return (
    <div className="faq-form-container">
      <form onSubmit={handleSubmit} className="faq-form">
        <h3>{faq ? 'FAQを編集' : '新しいFAQを追加'}</h3>

        <div className="form-group">
          <label htmlFor="question">質問 *</label>
          <input
            id="question"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="例: サムネイルのサイズは？"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="answer">回答 *</label>
          <textarea
            id="answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="回答を入力してください..."
            rows={6}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">カテゴリ</label>
          <div className="category-input-group">
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">カテゴリを選択</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <div className="new-category-input">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="新しいカテゴリ名"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="add-category-button"
              >
                追加
              </button>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="tags">タグ（カンマ区切り）</label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="例: サムネイル, サイズ, 画像"
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="cancel-button"
            disabled={isSubmitting}
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? '保存中...' : faq ? '更新' : '追加'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FAQForm;
