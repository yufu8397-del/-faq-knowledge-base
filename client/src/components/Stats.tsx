import React from 'react';
import './Stats.css';

interface StatsProps {
  stats: {
    totalFaqs: number;
    totalSearches: number;
    foundSearches: number;
    successRate: string;
  } | null;
}

const Stats: React.FC<StatsProps> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="stats-container">
        <h3>📊 統計情報</h3>
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="stats-container">
      <h3>📊 統計情報</h3>
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-value">{stats.totalFaqs}</div>
          <div className="stat-label">登録FAQ数</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.totalSearches}</div>
          <div className="stat-label">検索回数</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.foundSearches}</div>
          <div className="stat-label">見つかった検索</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats.successRate}%</div>
          <div className="stat-label">成功率</div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
