import React, { useState } from 'react';
import './FAQList.css';
import FAQItem from './FAQItem';
import { FAQ, Category } from '../types';

interface FAQListProps {
  faqs: FAQ[];
  isSearching: boolean;
  onUpdate: () => void;
  onDelete: () => void;
  categories: Category[];
}

const FAQList: React.FC<FAQListProps> = ({ faqs, isSearching, onUpdate, onDelete, categories }) => {
  if (isSearching && faqs.length === 0) {
    return (
      <div className="faq-list-container">
        <div className="no-results">
          <p>😔 該当するFAQが見つかりませんでした</p>
          <p className="no-results-hint">新しいFAQを追加するか、別のキーワードで検索してみてください</p>
        </div>
      </div>
    );
  }

  if (!isSearching && faqs.length === 0) {
    return (
      <div className="faq-list-container">
        <div className="no-results">
          <p>📝 まだFAQが登録されていません</p>
          <p className="no-results-hint">最初のFAQを追加してみましょう！</p>
        </div>
      </div>
    );
  }

  return (
    <div className="faq-list-container">
      <div className="faq-list-header">
        <h2>{isSearching ? `検索結果: ${faqs.length}件` : `全FAQ: ${faqs.length}件`}</h2>
      </div>
      <div className="faq-list">
        {faqs.map((faq) => (
          <FAQItem
            key={faq.id}
            faq={faq}
            onUpdate={onUpdate}
            onDelete={onDelete}
            categories={categories}
          />
        ))}
      </div>
    </div>
  );
};

export default FAQList;
