# Asset Manager Backend

ゲーム開発用アセット管理・生成サービスのバックエンドAPI

## 環境設定

### 必要なソフトウェア
- Node.js v18以上
- Docker Desktop
- PostgreSQL 14以上（Dockerを使用しない場合）
- Redis 6以上（Dockerを使用しない場合）

### セットアップ手順

1. 環境変数の設定
```bash
cp .env.example .env
# .envファイルを編集して必要な値を設定
```

2. Dockerコンテナの起動
```bash
cd ../docker
docker-compose up -d
```

3. 依存関係のインストール
```bash
npm install
```

4. データベースのマイグレーション
```bash
npm run prisma:migrate
```

5. 開発サーバーの起動
```bash
npm run dev
```

## 利用可能なスクリプト

- `npm run dev` - 開発サーバーの起動（ホットリロード有効）
- `npm run build` - TypeScriptのビルド
- `npm start` - プロダクションサーバーの起動
- `npm run lint` - ESLintの実行
- `npm run format` - Prettierでコードフォーマット
- `npm run prisma:generate` - Prismaクライアントの生成
- `npm run prisma:migrate` - データベースマイグレーション
- `npm run prisma:studio` - Prisma Studioの起動

## API エンドポイント

### ヘルスチェック
- `GET /health` - APIの稼働状況確認

### 認証 (実装予定)
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン
- `POST /api/auth/refresh` - トークンリフレッシュ

### アセット管理 (実装予定)
- `POST /api/assets/upload` - アセットアップロード
- `GET /api/assets` - アセット一覧取得
- `GET /api/assets/:id` - アセット詳細取得
- `PUT /api/assets/:id` - アセット更新
- `DELETE /api/assets/:id` - アセット削除