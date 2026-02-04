const kanjiMap = {
  '関': '關',
  '黒': '黑',
  '将': '將',
  '顕': '顯',
  '邉': '邊',
  '竜': '龍',
  '弥': '彌',
  'ノ': '之',
  '辺': '邊',
  '薫': '薰',
  '学': '學',
  '戸': '戶',
  '髙': '高',
  '沢': '澤',
  '斎': '齋',
  '斉': '齊',
  '広': '廣',
  '浜': '濱',
  '内': '內',
  '国': '國',
  '塚': '塚',      // 不轉「冢」
  '吉': '吉',      // ⚠ 日文「吉」≠ 中文「吉」字形差異（但通常不轉）
  '万': '萬',
  '与': '與',
  '豊': '豐',
  '徳': '德',
  '礼': '禮',
  '寿': '壽',
  '実': '實',
  '会': '會',
  '伝': '傳',
  '仏': '佛',
  '仮': '假',
  '価': '價',
  '桜': '櫻',
  '円': '圓',
  '鉄': '鐵',
  '鉱': '礦',
  '銀': '銀',
  '奥': '奧',
  '沢': '澤',
  'イクンヒョン' : '李勤烔',
  'チョンソンリョン' : '鄭成龍'
};

/**
 * 展開「々」為前一個字元
 * @param {string} text
 * @returns {string}
 */
function expandIterationMark(text) {
  if (!text.includes('々')) return text;
  
  let result = '';
  // 遍歷當前字串
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '々' && result.length > 0) {
      // 取結果集中的最後一個字來重複
      result += result[result.length - 1];
    } else {
      result += char;
    }
  }
  return result;
}

/**
 * 將字串中的日文漢字轉換為繁體中文
 * @param {string} text 
 * @returns {string}
 */
export function convertText(text) {
  if (!text) return text;
  
  // 1. 先處理疊字符號 (々)
  let result = expandIterationMark(text);
  
  // 2. 處理漢字轉換
  for (const [jp, zh] of Object.entries(kanjiMap)) {
    // 使用全域取代
    result = result.split(jp).join(zh);
  }
  return result;
}

/**
 * 處理週報資料，針對 title_zh, title_zh_short, summary_zh, tags 進行轉換
 * @param {Object} data - finished_YYYYMMDD.json 的資料物件
 * @returns {Object} 處理後的資料物件 (會直接修改傳入的物件或回傳新物件，此處選擇直接修改)
 */
export function processWeeklyData(data) {
  // 處理 title_zh_short (Array)
  if (Array.isArray(data.title_zh_short)) {
    data.title_zh_short = data.title_zh_short.map(t => convertText(t));
  }

  // 處理 tags (Array) - 特殊邏輯：保留原文 + 新增轉換後
  if (Array.isArray(data.tags)) {
    const newTags = new Set(data.tags);
    data.tags.forEach(tag => {
      const converted = convertText(tag);
      if (converted !== tag) {
        newTags.add(converted);
      }
    });
    data.tags = Array.from(newTags);
  }

  // 處理 A, B, C 區塊 (Array of Objects)
  ['A', 'B', 'C'].forEach(section => {
      if (Array.isArray(data[section])) {
          data[section].forEach(item => {
              if (item.title_zh) {
                  item.title_zh = convertText(item.title_zh);
              }
              if (item.summary_zh) {
                  item.summary_zh = convertText(item.summary_zh);
              }
          });
      }
  });

  return data;
}
