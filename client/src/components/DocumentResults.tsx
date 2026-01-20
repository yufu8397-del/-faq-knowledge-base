import React from 'react';
import './DocumentResults.css';
import { Document } from '../api';

interface DocumentResultsProps {
  documents: Document[];
  isSearching: boolean;
}

const DocumentResults: React.FC<DocumentResultsProps> = ({ documents, isSearching }) => {
  if (!isSearching || documents.length === 0) {
    return null;
  }

  return (
    <div className="document-results-container">
      <div className="document-results-header">
        <h2>📄 関連ドキュメント: {documents.length}件</h2>
        <p className="document-results-subtitle">蓄積されたコンテンツから関連する情報を表示しています</p>
      </div>
      <div className="document-list">
        {documents.map((doc) => (
          <div key={doc.id} className="document-item">
            <div className="document-header">
              <h3 className="document-title">{doc.title}</h3>
              {doc.category && (
                <span className="document-category">{doc.category}</span>
              )}
            </div>
            <div 
              className="document-content"
              dangerouslySetInnerHTML={{ 
                __html: doc.content_snippet || doc.content.substring(0, 300) + '...' 
              }}
            />
            {doc.tags && (
              <div className="document-tags">
                {doc.tags.split(',').map((tag, idx) => (
                  <span key={idx} className="document-tag">{tag.trim()}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentResults;
