# 故障排除：Firebase 401 Unauthorized 錯誤

## 任務摘要

解決了在執行 `npm run deploy` 時遇到的 HTTP 401 Unauthorized 錯誤。此錯誤是由於 Google/Firebase 認證憑證過期或帳號切換導致的。

## 變更內容

### 文件更新

- **[README.md](file:///Users/effy/Documents/南國FRO/weekly/nangokufro_weekly/README.md)**: 新增了「自救指南 / 常見問題 (Troubleshooting)」章節，詳細說明錯誤原因及解決方案。

## 驗證結果

- **手動驗證**: 使用者執行了 `firebase login --reauth` 重新登入後，再次執行 `npm run deploy` 成功部署 Cloud Functions。

## 解決方案

當遇到以下錯誤時：

> Error: Request to https://cloudresourcemanager.googleapis.com/v1/projects/... had HTTP Error: 401, Request had invalid authentication credentials.

請執行以下指令重新認證：

```bash
npx firebase login --reauth
```
