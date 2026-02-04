# Weekly Report Functions

## 首次設定 (Setup)

在使用之前，請確保已安裝相關依賴並登入 Firebase：

```bash
npm install
npx firebase login
```

(若遇到 401 Unauthorized 錯誤，請執行 `npx firebase login --reauth` 重新登入)

## 開發與部署指令

### 預覽 (NPM Dev)

```bash
npm run dev
```

用於啟動 Cloud Functions 本地模擬器 (等同 `firebase emulators:start`)。

### 部署 (NPM Deploy)

```bash
npm run deploy
```

用於部署到 Google Cloud (等同 `firebase deploy --only functions`)。

## 自救指南 / 常見問題 (Troubleshooting)

### HTTP Error: 401, Request had invalid authentication credentials

如果您在執行 `npm run deploy` 時遇到類似以下的錯誤：

> Error: Request to https://cloudresourcemanager.googleapis.com/v1/projects/... had HTTP Error: 401, Request had invalid authentication credentials.

這通常是因為本地的 Google/Firebase 憑證已過期，或是您切換過 Google 帳號導致授權失效。請執行以下指令重新登入即可解決：

```bash
npx firebase login --reauth
```
