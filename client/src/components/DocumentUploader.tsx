import React, { useState } from 'react';
import './DocumentUploader.css';
import { uploadDocument, getCategories } from '../api';

interface DocumentUploaderProps {
  onSuccess: () => void;
  categories: string[];
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onSuccess, categories }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'text/plain' || selectedFile.name.endsWith('.txt')) {
        setFile(selectedFile);
        if (!title) {
          setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
        }
        setError('');
      } else {
        setError('テキストファイル（.txt）のみアップロードできます');
        setFile(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title || (!content && !file)) {
      setError('タイトルとコンテンツ（またはファイル）が必要です');
      return;
    }

    setIsUploading(true);

    try {
      await uploadDocument({
        title,
        content: content || undefined,
        category: category || undefined,
        tags: tags || undefined,
        file: file || undefined,
      });

      setSuccess('ドキュメントが追加されました！');
      setTitle('');
      setContent('');
      setCategory('');
      setTags('');
      setFile(null);
      
      setTimeout(() => {
        onSuccess();
        setSuccess('');
      }, 1500);
    } catch (error: any) {
      setError(error.message || 'アップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="document-uploader">
      <h3>📄 ドキュメントを追加</h3>
      <p className="uploader-description">
        テキストを直接入力するか、.txtファイルをアップロードしてコンテンツを蓄積できます
      </p>

      <form onSubmit={handleSubmit} className="uploader-form">
        <div className="form-group">
          <label htmlFor="doc-title">タイトル *</label>
          <input
            id="doc-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ドキュメントのタイトル"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="doc-category">カテゴリ（任意）</label>
          <select
            id="doc-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">選択してください</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="doc-tags">タグ（任意、カンマ区切り）</label>
          <input
            id="doc-tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="例: 重要, 基本, 手順"
          />
        </div>

        <div className="form-group">
          <label htmlFor="doc-content">コンテンツ（直接入力）</label>
          <textarea
            id="doc-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="ドキュメントの内容を入力..."
            rows={8}
          />
        </div>

        <div className="form-group">
          <label htmlFor="doc-file">または、ファイルをアップロード（.txt）</label>
          <input
            id="doc-file"
            type="file"
            accept=".txt,text/plain"
            onChange={handleFileChange}
          />
          {file && (
            <div className="file-info">
              <span>📎 {file.name} ({(file.size / 1024).toFixed(2)} KB)</span>
            </div>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="form-actions">
          <button type="submit" className="submit-button" disabled={isUploading}>
            {isUploading ? 'アップロード中...' : '📤 ドキュメントを追加'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentUploader;
