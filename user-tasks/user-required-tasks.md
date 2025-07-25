# ユーザー実行タスク一覧

このドキュメントは、ゲームアセット管理・生成サービスの開発において、Claude Codeでは自動化できず、ユーザーが手動で実行する必要がある作業をまとめたものです。

## 📋 タスク概要

ユーザーが手動で行う必要がある作業は、主に以下の9つのカテゴリに分類されます：

1. 開発環境構築・初期設定
2. Docker環境設定
3. データベース設定（PostgreSQL）
4. 外部サービス設定（AWS S3、Redis）
5. AI API設定（OpenAI、Suno）
6. 環境変数設定
7. SSL証明書・セキュリティ設定
8. テスト・検証作業
9. デプロイメント・運用設定

---

## 1. 開発環境構築・初期設定

### 1.1 Node.jsとnpmのインストール
- **作業内容**: Node.js（v16以上推奨）とnpmのインストール
- **確認コマンド**:
  ```bash
  node --version
  npm --version
  ```
- **理由**: Node.js/TypeScriptプロジェクトの実行に必要

### 1.2 Dockerのインストール
- **作業内容**: Docker DesktopまたはDocker Engineのインストール
- **確認コマンド**:
  ```bash
  docker --version
  docker-compose --version
  ```
- **理由**: PostgreSQL、Redis、MinIOコンテナの実行に必要
- **参考URL**: https://docs.docker.com/get-docker/

### 1.3 Git初期化
- **作業内容**: Gitリポジトリの初期化
- **実行コマンド**:
  ```bash
  git init
  git add .
  git commit -m "Initial commit"
  ```

---

## 2. Docker環境設定

### 2.1 docker-compose.ymlの確認と起動
- **作業内容**: Docker Composeファイルの設定確認と起動
- **実行コマンド**:
  ```bash
  docker-compose up -d
  ```
- **起動するサービス**:
  - PostgreSQL（ポート5432）
  - Redis（ポート6379）
  - MinIO（ポート9000/9001）

### 2.2 ポート競合の確認
- **確認事項**: 以下のポートが使用されていないか確認
  - 3000（バックエンド）
  - 3001（フロントエンド）
  - 5432（PostgreSQL）
  - 6379（Redis）
  - 9000/9001（MinIO）
- **対処法**: 競合する場合は.envファイルでポート番号を変更

### 2.3 MinIO初期設定
- **作業内容**: MinIOコンソールでバケット作成
- **手順**:
  1. http://localhost:9001 にアクセス
  2. デフォルト認証情報でログイン（minioadmin/minioadmin）
  3. `game-assets`バケットを作成
  4. パブリックアクセスポリシーを設定（開発環境のみ）

---

## 3. データベース設定（PostgreSQL）

### 3.1 初期データベースの作成
- **作業内容**: game_asset_managerデータベースの作成確認
- **接続情報**:
  ```
  Host: localhost
  Port: 5432
  Username: user
  Password: password
  Database: game_asset_manager
  ```

### 3.2 Prismaマイグレーション
- **作業内容**: データベーススキーマの適用
- **実行コマンド**:
  ```bash
  cd backend
  npx prisma migrate dev
  npx prisma db seed  # 初期データ投入
  ```

### 3.3 データベースバックアップ設定（本番環境）
- **作業内容**: 定期バックアップの設定
- **推奨**: 日次バックアップ、7日間保持

---

## 4. 外部サービス設定（AWS S3、Redis）

### 4.1 AWS S3設定（本番環境）
- **作業内容**: S3バケットの作成と設定
- **手順**:
  1. AWS ConsoleでS3バケットを作成
  2. バケット名: `your-game-assets-bucket`
  3. リージョンを選択（例：ap-northeast-1）
  4. バケットポリシーでCORS設定
  5. IAMユーザーを作成してアクセスキーを取得

### 4.2 S3 CORSポリシー設定
- **設定内容**:
  ```json
  [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedOrigins": ["http://localhost:3001", "https://yourdomain.com"],
      "ExposeHeaders": ["ETag"]
    }
  ]
  ```

### 4.3 Redis設定（本番環境）
- **選択肢**:
  - AWS ElastiCache
  - Redis Cloud
  - 自己管理Redis
- **推奨設定**: 永続化有効、自動フェイルオーバー

---

## 5. AI API設定（OpenAI、Suno）

### 5.1 OpenAI APIキーの取得
- **作業内容**: DALL-E API用のキー取得
- **手順**:
  1. [OpenAI Platform](https://platform.openai.com/)にアクセス
  2. APIキーを作成
  3. 使用制限を設定（月額上限）
- **料金**: DALL-E 3は$0.040～$0.120/画像

### 5.2 音声生成API設定
- **選択肢**:
  - Suno API（音楽生成）
  - ElevenLabs（音声合成）
  - Mubert API（BGM生成）
- **注意**: 各サービスの利用規約とライセンスを確認

### 5.3 API使用量監視
- **設定項目**:
  - 月次使用量上限の設定
  - 使用量アラート（80%到達時）
  - APIキーのローテーション計画

---

## 6. 環境変数設定

### 6.1 バックエンド環境変数（.env）
- **作業内容**: `.env.example`をコピーして設定
- **実行コマンド**:
  ```bash
  cd backend
  cp .env.example .env
  ```
- **設定項目**:
  ```env
  # データベース
  DATABASE_URL="postgresql://user:password@localhost:5432/game_asset_manager"
  
  # JWT
  JWT_SECRET="your-secret-key-here"  # 32文字以上のランダム文字列
  JWT_EXPIRES_IN="15m"
  JWT_REFRESH_EXPIRES_IN="7d"
  
  # S3（開発：MinIO、本番：AWS S3）
  S3_ENDPOINT="http://localhost:9000"  # 本番: 不要
  S3_ACCESS_KEY="minioadmin"           # 本番: AWS Access Key
  S3_SECRET_KEY="minioadmin"           # 本番: AWS Secret Key
  S3_BUCKET_NAME="game-assets"
  S3_REGION="us-east-1"                # 本番: 実際のリージョン
  
  # Redis
  REDIS_URL="redis://localhost:6379"
  
  # AI API
  OPENAI_API_KEY="sk-..."              # OpenAIから取得
  CLAUDE_API_KEY="sk-ant-..."          # Anthropicから取得（オプション）
  
  # サーバー設定
  PORT=3000
  NODE_ENV=development                  # 本番: production
  ```

### 6.2 フロントエンド環境変数
- **開発環境**: package.jsonのproxyで自動設定
- **本番環境**: 
  ```env
  REACT_APP_API_URL=https://api.yourdomain.com
  ```

### 6.3 秘密情報の管理
- **重要**: 
  - `.env`ファイルは`.gitignore`に追加
  - 本番環境では環境変数管理サービスを使用
  - JWTシークレットは強力なランダム文字列を使用

---

## 7. SSL証明書・セキュリティ設定

### 7.1 HTTPS設定（本番環境）
- **選択肢**:
  - Let's Encrypt（無料）
  - 有料SSL証明書
- **設定場所**: 
  - リバースプロキシ（Nginx/Apache）
  - ロードバランサー
  - CDN（CloudFlare等）

### 7.2 セキュリティヘッダー設定
- **Helmet.js設定確認**:
  - Content Security Policy
  - X-Frame-Options
  - X-Content-Type-Options
  - Strict-Transport-Security

### 7.3 レート制限の調整
- **デフォルト設定**:
  - 認証API: 5回/15分
  - 一般API: 100回/分
- **本番環境**: 実際の使用状況に応じて調整

---

## 8. テスト・検証作業

### 8.1 ローカル環境での動作確認
- **確認項目**:
  - ファイルアップロード（画像・音声）
  - AI生成機能
  - ファイルダウンロード
  - 認証フロー

### 8.2 パフォーマンステスト
- **テスト項目**:
  - 大容量ファイル（100MB）のアップロード
  - 同時アップロード（10ファイル）
  - API応答時間
- **ツール**: Apache Bench、JMeter

### 8.3 セキュリティテスト
- **確認項目**:
  - SQLインジェクション対策
  - XSS対策
  - ファイルアップロードの検証
  - 認証・認可の確認

### 8.4 ブラウザ互換性テスト
- **対象ブラウザ**:
  - Chrome（最新版）
  - Firefox（最新版）
  - Safari（最新版）
  - Edge（最新版）

### 8.5 負荷テスト（本番環境前）
- **目標**:
  - 同時接続: 100ユーザー
  - ファイルストレージ: 1TB
  - 月間API呼び出し: 100万回

---

## 9. デプロイメント・運用設定

### 9.1 ホスティング環境の選定
- **バックエンド選択肢**:
  - AWS EC2/ECS
  - Google Cloud Run
  - Heroku
  - DigitalOcean
- **フロントエンド選択肢**:
  - Vercel
  - Netlify
  - AWS CloudFront + S3

### 9.2 CI/CDパイプライン設定
- **GitHub Actions設定例**:
  - 自動テスト実行
  - Docker イメージビルド
  - 本番環境へのデプロイ
- **必要なシークレット設定**:
  - デプロイ先の認証情報
  - 環境変数

### 9.3 監視・ログ設定
- **監視項目**:
  - サーバーリソース（CPU、メモリ、ディスク）
  - APIエラー率
  - ファイルストレージ使用量
  - AI API使用量
- **推奨ツール**:
  - Datadog
  - New Relic
  - CloudWatch（AWS）

### 9.4 バックアップ戦略
- **バックアップ対象**:
  - PostgreSQLデータベース
  - S3ファイルストレージ
  - アプリケーション設定
- **頻度**: 日次バックアップ、週次フルバックアップ

### 9.5 ドメイン・DNS設定
- **作業内容**:
  - ドメイン取得
  - DNSレコード設定（A、CNAME）
  - サブドメイン設定（api.yourdomain.com）

---

## 📝 実行順序の推奨

### Phase 1: ローカル開発環境（1-2日）
1. 開発環境構築（セクション1）
2. Docker環境設定（セクション2）
3. データベース設定（セクション3）
4. 環境変数設定（セクション6）

### Phase 2: 外部サービス統合（2-3日）
1. AI API設定（セクション5）
2. MinIO設定（開発環境）
3. 基本機能の動作確認（セクション8.1）

### Phase 3: 開発・テスト（2-3週間）
1. 開発作業（Claude Codeと並行）
2. 各種テスト実施（セクション8）

### Phase 4: 本番環境準備（1週間）
1. AWS S3設定（セクション4.1）
2. SSL証明書設定（セクション7）
3. デプロイメント設定（セクション9）
4. 監視・運用体制整備

---

## 🔄 継続的な作業

- AI API使用量とコストの監視
- ファイルストレージ使用量の監視
- セキュリティアップデート
- データベースメンテナンス
- ユーザーフィードバックへの対応

---

## 📌 重要な注意事項

1. **APIキー管理**: 環境変数で管理し、絶対にコミットしない
2. **ファイルサイズ制限**: 画像10MB、音声50MB、動画100MBに設定済み
3. **レート制限**: API使用量に応じて適切に調整
4. **バックアップ**: 定期的なバックアップとリストア手順の確認
5. **コスト管理**: AI APIとストレージのコストを定期的に確認

---

このドキュメントは、プロジェクトの進行に応じて更新される可能性があります。
最終更新日: 2025-07-25