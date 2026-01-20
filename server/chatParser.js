// チャット履歴から質問と回答を抽出するパーサー

/**
 * LINEのトーク履歴から質問と回答のペアを抽出
 * @param {string} text - チャット履歴のテキスト
 * @returns {Array} 質問と回答のペアの配列
 */
function parseLineChatHistory(text) {
  const pairs = [];
  const lines = text.split('\n');
  
  let currentQuestion = null;
  let currentAnswer = null;
  let currentQuestionAuthor = null;
  let currentAnswerAuthor = null;
  
  // 質問パターン（「？」で終わる、疑問詞で始まるなど）
  const questionPatterns = [
    /[？?]$/,  // 「？」で終わる
    /^(何|どう|なぜ|なんで|どこ|いつ|誰|どの|どんな|いくつ)/,  // 疑問詞で始まる
    /(どうすれば|どうしたら|どうやったら|何で|なぜ|なんで)/,  // 疑問表現を含む
    /(できますか|できます？|可能ですか|可能？|できますか？)/,  // 可能かどうかを尋ねる
    /(って何|とは何|ってどういう|って何ですか)/,  // 説明を求める
  ];
  
  // 回答パターン（質問の後に続くメッセージ）
  const answerIndicators = [
    /^(かしこまりました|了解|わかりました|承知|OK|了解しました)/,
    /^(はい|いいえ|そうです|違います)/,
    /^(自分|私|僕|俺)/,  // 一人称で始まる（回答の可能性が高い）
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 空行はスキップ
    if (!line) continue;
    
    // 日時行をスキップ
    if (/^\d{4}\/\d{2}\/\d{2}/.test(line)) continue;
    
    // メッセージ行を解析（形式: 時刻\t名前\tメッセージ）
    const messageMatch = line.match(/^(\d{2}:\d{2})\t([^\t]+)\t(.+)$/);
    if (!messageMatch) {
      // 複数行メッセージの続きの可能性
      if (currentQuestion && !currentAnswer) {
        currentAnswer = (currentAnswer || '') + '\n' + line;
      }
      continue;
    }
    
    const [, time, author, message] = messageMatch;
    const messageText = message.trim();
    
    // 質問かどうかを判定
    const isQuestion = questionPatterns.some(pattern => pattern.test(messageText));
    
    // 回答かどうかを判定
    const isAnswer = answerIndicators.some(pattern => pattern.test(messageText)) ||
                     (currentQuestion && !isQuestion && messageText.length > 10);
    
    if (isQuestion) {
      // 前の質問と回答を保存
      if (currentQuestion && currentAnswer) {
        pairs.push({
          question: currentQuestion,
          answer: currentAnswer,
          questionAuthor: currentQuestionAuthor,
          answerAuthor: currentAnswerAuthor,
          confidence: 0.8
        });
      }
      
      // 新しい質問を開始
      currentQuestion = messageText;
      currentQuestionAuthor = author;
      currentAnswer = null;
      currentAnswerAuthor = null;
    } else if (currentQuestion && isAnswer) {
      // 回答を追加
      if (!currentAnswer) {
        currentAnswer = messageText;
        currentAnswerAuthor = author;
      } else {
        currentAnswer += '\n' + messageText;
      }
    } else if (currentQuestion && !currentAnswer && messageText.length > 20) {
      // 質問の直後の長いメッセージは回答の可能性が高い
      currentAnswer = messageText;
      currentAnswerAuthor = author;
    }
    
    // 次の質問が来たら、前のペアを保存
    if (isQuestion && currentQuestion && currentAnswer && currentQuestion !== messageText) {
      pairs.push({
        question: currentQuestion,
        answer: currentAnswer,
        questionAuthor: currentQuestionAuthor,
        answerAuthor: currentAnswerAuthor,
        confidence: 0.7
      });
      currentQuestion = messageText;
      currentQuestionAuthor = author;
      currentAnswer = null;
      currentAnswerAuthor = null;
    }
  }
  
  // 最後のペアを保存
  if (currentQuestion && currentAnswer) {
    pairs.push({
      question: currentQuestion,
      answer: currentAnswer,
      questionAuthor: currentQuestionAuthor,
      answerAuthor: currentAnswerAuthor,
      confidence: 0.8
    });
  }
  
  return pairs;
}

/**
 * テキストから質問と回答を抽出（汎用）
 * @param {string} text - テキスト
 * @returns {Array} 質問と回答のペアの配列
 */
function extractQAFromText(text) {
  // LINE形式を試す
  if (text.includes('\t') && /^\d{2}:\d{2}\t/.test(text.split('\n').find(line => line.trim()))) {
    return parseLineChatHistory(text);
  }
  
  // その他の形式（シンプルなテキスト）
  const pairs = [];
  const lines = text.split('\n').filter(line => line.trim());
  
  let currentQuestion = null;
  let currentAnswer = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 質問パターン
    const isQuestion = /[？?]$/.test(line) || 
                      /^(何|どう|なぜ|なんで|どこ|いつ|誰|どの|どんな)/.test(line) ||
                      /(どうすれば|どうしたら|できますか|可能ですか)/.test(line);
    
    if (isQuestion && line.length > 5) {
      // 前のペアを保存
      if (currentQuestion && currentAnswer) {
        pairs.push({
          question: currentQuestion,
          answer: currentAnswer,
          confidence: 0.6
        });
      }
      
      currentQuestion = line;
      currentAnswer = null;
    } else if (currentQuestion && line.length > 10) {
      // 回答として追加
      if (!currentAnswer) {
        currentAnswer = line;
      } else {
        currentAnswer += '\n' + line;
      }
    }
  }
  
  // 最後のペアを保存
  if (currentQuestion && currentAnswer) {
    pairs.push({
      question: currentQuestion,
      answer: currentAnswer,
      confidence: 0.6
    });
  }
  
  return pairs;
}

module.exports = {
  parseLineChatHistory,
  extractQAFromText
};
