# Walkthrough: 修正 WordPress 重複發佈問題 (日期區間版)

## 問題描述

使用者回報文章重複發佈。為避免因標題變動（如選手名不同）導致重複檢查失效，我們將判斷依據放寬為「日期區間」。

## 解決方案

在 `compileToWordpress.js` 中調整檢查邏輯：

1. **Search**: 使用起始日期 (`date_range[0]`) 搜尋 WordPress 文章。
2. **Validator**: 檢查搜尋到的文章標題，是否**同時包含**「起始日期」與「結束日期」。
3. **Action**: 若符合上述條件，判定為重複，跳過發佈。

## 代碼變更

```javascript
// steps/compileToWordpress.js

// 1. 使用起始日期搜尋
const checkRes = await fetch(`.../posts?search=${date_range[0]}...`);

if (checkRes.ok) {
  const found = await checkRes.json();
  // 2. 檢查是否同時包含起始與結束日期
  const exists = found.some(
    (p) =>
      p.title.rendered.includes(date_range[0]) &&
      p.title.rendered.includes(date_range[1]),
  );

  if (exists) {
    console.log(
      `...Article exists (Date Match: ${date_range[0]}~${date_range[1]})...`,
    );
    return { ok: true, skipped: true };
  }
}
```

## Logs

同樣可透過 [Cloud Run Logs](https://console.cloud.google.com/run/detail/asia-east1/runweeklypipeline/logs?project=msgtest-d13ce) 查看是否有 "Article exists" 的紀錄。
