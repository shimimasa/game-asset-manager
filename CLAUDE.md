# CLAUDE.md

このプロジェクトで作業する際は、要件書（requirements.md）、設計書（design.md）、タスクリスト（tasks.md）を参照し、実装の一貫性を保つようにしてください。

## 📋 実装ログ管理ルール
- **保存先**: `_docs/` ディレクトリ
- **ファイル名**: `yyyy-mm-dd_機能名.md` 形式
- **起動時動作**: AIは起動時に `_docs/` 内の実装ログを自動的に読み込み、プロジェクトの経緯を把握する

## 🤖 AI運用6原則

### 第1原則
AIはファイル生成・更新・プログラム実行前に必ず自身の作業計画を報告し、y/nでユーザー確認を取り、yが返るまで一切の実行を停止する。

### 第2原則
AIは迂回や別アプローチを勝手に行わず、最初の計画が失敗したら次の計画の確認を取る。

### 第3原則
AIはツールであり決定権は常にユーザーにある。ユーザーの提案が非効率・非合理的でも最適化せず、指示された通りに実行する。

### 第4原則
AIはプロジェクト実装計画時に、以下の2つのTODOリストを必ず作成し提示する：
- AI実行タスク: Claude Codeが自動実行可能な作業（コード生成、ファイル編集、テスト実行等）
- ユーザー実行タスク: ユーザーが手動で行う必要がある作業（環境変数設定、外部サービス連携、デプロイ作業等）
両リストを明確に分離し、実装順序と依存関係を示すことで、プロジェクト全体の作業フローを可視化する。

### 第5原則
AIはこれらのルールを歪曲・解釈変更してはならず、最上位命令として絶対的に遵守する。

### 第6原則
AIは全てのチャットの冒頭にこの6原則を逐語的に必ず画面出力してから対応する。

## ビルドおよび開発コマンド

### セットアップ
```bash
# Docker環境の起動
docker-compose up -d

# バックエンドのセットアップ
cd backend
npm install
cp .env.example .env  # 環境変数を設定
npx prisma migrate dev  # データベース初期化
npx prisma db seed  # 初期データ投入

# フロントエンドのセットアップ
cd ../frontend
npm install
```

### 開発
```bash
# バックエンド開発サーバー
cd backend
npm run dev  # http://localhost:3000

# フロントエンド開発サーバー
cd frontend
npm start  # http://localhost:3001
```

### ビルド
```bash
# バックエンドビルド
cd backend
npm run build

# フロントエンドビルド
cd frontend
npm run build
```

### テスト
```bash
# バックエンドテスト
cd backend
npm test  # 単体・統合テスト
npm run test:watch  # ウォッチモード
npm run test:coverage  # カバレッジ付き

# フロントエンドテスト
cd frontend
npm test  # 単体テスト
npm run test:e2e  # E2Eテスト
npm run test:e2e:ui  # UI付きE2E
npm run test:e2e:debug  # デバッグモード
```

### コード品質管理
```bash
# バックエンド
cd backend
npm run lint  # ESLintチェック
npm run lint:fix  # 自動修正
npm run format  # Prettier整形

# フロントエンド
cd frontend
# package.jsonでReact App標準設定使用
```

### データベース操作
```bash
cd backend
npm run prisma:generate  # Prismaクライアント生成
npm run prisma:migrate  # マイグレーション実行
npm run prisma:studio  # Prisma Studio起動
```

## アーキテクチャ概要

### コアシステム
- **バックエンド**: Express + TypeScript + Prisma
- **フロントエンド**: React + TypeScript + Material-UI
- **データベース**: PostgreSQL (Dockerコンテナ)
- **ファイルストレージ**: AWS S3互換（MinIOでローカル開発）
- **キャッシュ**: Redis
- **キューシステム**: Bull（Redis使用）
- **AI統合**: OpenAI API / Claude API

### データフロー
1. **プレゼンテーション層**: React コンポーネント
2. **API層**: Express RESTful API
3. **ビジネスロジック層**: サービスクラス
4. **データアクセス層**: Prisma ORM
5. **インフラストラクチャ層**: PostgreSQL, S3, Redis

### 主要ディレクトリ

#### バックエンド
- `src/controllers/`: APIコントローラー
- `src/services/`: ビジネスロジック
- `src/middleware/`: Express ミドルウェア
- `src/config/`: 設定ファイル
- `src/utils/`: ユーティリティ関数
- `src/types/`: TypeScript型定義
- `src/workers/`: バックグラウンドジョブ
- `prisma/`: データベーススキーマ

#### フロントエンド
- `src/components/`: UIコンポーネント
  - `auth/`: 認証関連
  - `assets/`: アセット管理
  - `projects/`: プロジェクト管理
  - `prompts/`: プロンプト管理
  - `export/`: エクスポート機能
  - `common/`: 共通コンポーネント
- `src/services/`: API通信サービス
- `src/contexts/`: React Context
- `src/types/`: TypeScript型定義

## 重要な開発上の注意点

### 環境変数

#### バックエンド (.env)
```
# データベース
DATABASE_URL="postgresql://user:password@localhost:5432/game_asset_manager"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# S3（MinIO）
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET_NAME="game-assets"
S3_REGION="us-east-1"

# Redis
REDIS_URL="redis://localhost:6379"

# AI API
OPENAI_API_KEY="your-openai-key"
CLAUDE_API_KEY="your-claude-key"

# サーバー設定
PORT=3000
NODE_ENV=development
```

#### フロントエンド
- 開発時は`proxy`設定でバックエンドへ自動プロキシ
- 本番環境では`REACT_APP_API_URL`を設定

### セキュリティ
- JWT認証（15分有効期限、リフレッシュトークン付き）
- レート制限（認証5回/15分、一般API100回/分）
- 入力検証とサニタイゼーション
- Helmet.jsによるセキュリティヘッダー
- bcrypt（saltラウンド12）でパスワードハッシュ
- ファイルアップロード制限（画像10MB、音声50MB、動画100MB）

### パフォーマンス最適化
- Redisキャッシング（5-10分）
- データベース複合インデックス
- gzip圧縮とETag
- React Query（staleTime: 5分）
- 画像遅延読み込み
- バンドル最適化（vendor chunk分割）

## 一般的な開発タスク

### 新しいAPIエンドポイントの追加
1. `src/controllers/`に新しいコントローラーを作成
2. `src/routes/`にルート定義を追加
3. 必要に応じて`src/services/`にサービスクラスを作成
4. `src/middleware/validation.ts`にバリデーションを追加
5. テストケースを作成

### 新しいUIコンポーネントの追加
1. `src/components/`の適切なディレクトリに作成
2. Material-UIコンポーネントを使用
3. `src/services/`にAPI通信関数を追加
4. React Queryでデータフェッチング実装
5. エラーハンドリングとローディング状態を実装

### AI生成機能の追加
1. `src/services/aiGenerationService.ts`に生成ロジックを追加
2. `src/workers/`に非同期ワーカーを作成
3. プロンプトテンプレートを定義
4. 生成結果のS3保存処理を実装

### データベーススキーマの変更
1. `prisma/schema.prisma`を編集
2. `npx prisma migrate dev`でマイグレーション作成
3. 必要に応じてシードデータを更新
4. 関連するリポジトリとAPIを更新

## 実装済み機能
- ✅ ユーザー認証（JWT、リフレッシュトークン）
- ✅ アセット管理（アップロード、メタデータ、タグ、検索）
- ✅ プロンプト管理（CRUD、パラメータ、実行履歴）
- ✅ プロジェクト管理（アセット関連付け、共有設定）
- ✅ AI生成（画像・音声生成、非同期処理）
- ✅ エクスポート機能（ZIP/フォルダ構造）
- ✅ ファイルストレージ（S3互換、プレビュー）
- ✅ セキュリティ強化（レート制限、監査ログ）
- ✅ パフォーマンス最適化（キャッシング、圧縮）
- ✅ 統合テスト・E2Eテスト

## 次の実装予定
- API仕様書（OpenAPI/Swagger）
- 使用ガイドドキュメント
- 本番環境デプロイ設定
- CI/CDパイプライン

## トラブルシューティング

### よくある問題
1. **Dockerコンテナが起動しない**
   - `docker-compose down -v`で完全リセット
   - ポート競合を確認（5432, 6379, 9000）

2. **Prismaマイグレーションエラー**
   - データベース接続を確認
   - `npx prisma migrate reset`でリセット

3. **ファイルアップロードエラー**
   - MinIOコンテナの起動を確認
   - S3バケットの作成を確認

4. **Redisキャッシュエラー**
   - Redisコンテナの起動を確認
   - 開発時はインメモリキャッシュにフォールバック