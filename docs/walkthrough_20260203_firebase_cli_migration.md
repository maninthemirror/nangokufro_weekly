# 遷移至 Firebase CLI 部署模式 Walkthrough

## 變更項目

- **新增** `firebase.json`: 定義 Cloud Functions 的部署配置 (Runtime: nodejs24, Source: .)。
- **新增** `.firebaserc`: 設定專案別名 (default: msgtest-d13ce)。
- **新增** `firebase.json`: 定義 Cloud Functions 的部署配置 (Runtime: nodejs24, Source: .)。
- **新增** `.firebaserc`: 設定專案別名 (default: msgtest-d13ce)。
- **更新** `package.json`:
  - 新增 NPM Scripts `dev` 與 `deploy`。
  - 安裝 `firebase-tools` 為 devDependency，確保指令可用。

## 部署方式

現在您可以使用以下任一方式部署：

1. **使用 NPM Scripts (推薦)**:
   - 本地測試 (Emulator):
     ```bash
     npm run dev
     ```
   - 部署到 Cloud:
     ```bash
     npm run deploy
     ```

2. **使用 Firebase CLI**:
   ```bash
   firebase deploy --only functions
   ```

## 檔案列表

- [firebase.json](file:///Users/effy/Documents/南國FRO/weekly/nangokufro_weekly/firebase.json)
- [.firebaserc](file:///Users/effy/Documents/南國FRO/weekly/nangokufro_weekly/.firebaserc)
- [deploy.sh](file:///Users/effy/Documents/南國FRO/weekly/nangokufro_weekly/deploy.sh)
