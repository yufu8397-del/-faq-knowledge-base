import React, { useState } from 'react';
import './FAQItem.css';
import { FAQ, Category } from '../types';
import { updateFAQ, deleteFAQ, markHelpful } from '../api';
import FAQForm from './FAQForm';

interface FAQItemProps {
  faq: FAQ;
  onUpdate: () => void;
  onDelete: () => void;
  categories: Category[];
}

const FAQItem: React.FC<FAQItemProps> = ({ faq, onUpdate, onDelete, categories }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDelete = async () => {
    if (window.confirm('このFAQを削除してもよろしいですか？')) {
      try {
        await deleteFAQ(faq.id);
        onDelete();
      } catch (error) {
        console.error('削除に失敗しました:', error);
        alert('削除に失敗しました');
      }
    }
  };

  const handleHelpful = async () => {
    try {
      await markHelpful(faq.id);
      onUpdate();
    } catch (error) {
      console.error('評価の更新に失敗しました:', error);
    }
  };

  const handleUpdateSuccess = () => {
    setIsEditing(false);
    onUpdate();
  };

  if (isEditing) {
    return (
      <div className="faq-item editing">
        <FAQForm
          faq={faq}
          onSuccess={handleUpdateSuccess}
          onCancel={() => setIsEditing(false)}
          categories={categories}
        />
      </div>
    );
  }

  return (
    <div className="faq-item">
      <div className="faq-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="faq-question">
          <span className="question-icon">{isExpanded ? '📖' : '📄'}</span>
          <h3>{faq.question}</h3>
        </div>
        <div className="faq-meta">
          {faq.category && <span className="category-badge">{faq.category}</span>}
          <span className="expand-icon">{isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="faq-content">
          <div className="faq-answer">
            <p>{faq.answer}</p>
          </div>

          {faq.tags && (
            <div className="faq-tags">
              {faq.tags.split(',').map((tag, index) => (
                <span key={index} className="tag">#{tag.trim()}</span>
              ))}
            </div>
          )}

          <div className="faq-footer">
            <div className="faq-stats">
              <span>👁️ {faq.view_count}回閲覧</span>
              <span>👍 {faq.helpful_count}人が役に立った</span>
            </div>
            <div className="faq-actions">
              <button className="helpful-button" onClick={handleHelpful}>
                👍 役に立った
              </button>
              <button className="edit-button" onClick={() => setIsEditing(true)}>
                ✏️ 編集
              </button>
              <button className="delete-button" onClick={handleDelete}>
                🗑️ 削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FAQItem;
