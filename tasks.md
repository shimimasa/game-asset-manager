# 実装計画

- [ ] 1. プロジェクト基盤とデータベース設定
  - Node.js/Express プロジェクトの初期化とTypeScript設定
  - PostgreSQL データベースとPrisma ORM の設定
  - 基本的なプロジェクト構造とフォルダ組織の作成
  - _要件: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1_

- [ ] 2. データモデルとスキーマ実装
  - [ ] 2.1 Prisma スキーマファイルの作成
    - User, Asset, Prompt, Project モデルの定義
    - モデル間のリレーションシップ設定
    - データベースマイグレーションファイルの生成
    - _要件: 1.1, 2.1, 3.1, 4.1_

  - [ ] 2.2 TypeScript型定義の作成
    - データモデルに対応するTypeScriptインターフェースの実装
    - API レスポンス・リクエスト型の定義
    - エラーハンドリング用の型定義
    - _要件: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1_

- [ ] 3. 認証システムの実装
  - [ ] 3.1 JWT認証ミドルウェアの作成
    - ユーザー登録・ログイン機能の実装
    - JWT トークン生成・検証ロジック
    - 認証ミドルウェアの作成とテスト
    - _要件: 全要件（ユーザー認証が必要）_

- [ ] 4. ファイルストレージシステムの実装
  - [ ] 4.1 AWS S3統合の設定
    - S3 クライアント設定とバケット作成
    - ファイルアップロード・ダウンロード機能
    - サムネイル生成機能（画像用）
    - _要件: 1.1, 1.4_

  - [ ] 4.2 ファイル処理ユーティリティの作成
    - ファイル形式検証とメタデータ抽出
    - 画像リサイズとサムネイル生成
    - 音声ファイルの波形データ生成
    - _要件: 1.1, 1.4, 1.5_

- [ ] 5. アセット管理API の実装
  - [ ] 5.1 アセットCRUD操作の実装
    - アセットアップロード エンドポイント（POST /api/assets/upload）
    - アセット一覧取得 エンドポイント（GET /api/assets）
    - アセット詳細取得・更新・削除 エンドポイント
    - _要件: 1.1, 1.2, 1.3_

  - [ ] 5.2 アセット検索・フィルタリング機能
    - 検索エンドポイント（GET /api/assets/search）の実装
    - タグ・カテゴリ・ファイル名による検索ロジック
    - ページネーションとソート機能
    - _要件: 1.2, 6.2, 6.3_

- [ ] 6. プロンプト管理システムの実装
  - [ ] 6.1 プロンプトCRUD操作の実装
    - プロンプト作成・取得・更新・削除 API
    - プロンプトカテゴリ管理機能
    - 使用統計とバージョン履歴の記録
    - _要件: 2.1, 2.2, 2.3, 2.4_

  - [ ] 6.2 プロンプト実行システムの実装
    - プロンプト実行エンドポイント（POST /api/prompts/:id/execute）
    - 生成ジョブの状態管理とキューイング
    - 生成結果とプロンプトの自動リンク機能
    - _要件: 2.4, 2.5_

- [ ] 7. AI生成サービス統合
  - [ ] 7.1 画像生成API統合
    - OpenAI DALL-E API との統合実装
    - 画像生成パラメータの処理
    - 生成進行状況の追跡とエラーハンドリング
    - _要件: 3.1, 3.3, 3.4, 3.5_

  - [ ] 7.2 音声生成API統合
    - Suno API または類似サービスとの統合
    - 音声生成パラメータの処理
    - 生成完了後の自動保存機能
    - _要件: 3.2, 3.3, 3.4, 3.5_

- [ ] 8. プロジェクト管理システムの実装
  - [ ] 8.1 プロジェクトCRUD操作
    - プロジェクト作成・取得・更新・削除 API
    - プロジェクト-アセット関連付け機能
    - プロジェクト間でのアセット共有機能
    - _要件: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 9. エクスポート機能の実装
  - [ ] 9.1 アセットエクスポートシステム
    - 複数アセット選択とアーカイブ生成
    - ファイル形式変換機能（画像・音声）
    - マニフェストファイル生成
    - _要件: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 10. React フロントエンド基盤の構築
  - [ ] 10.1 React プロジェクト初期化
    - Create React App with TypeScript の設定
    - Material-UI とルーティングの設定
    - 認証コンテキストとプロテクトルートの実装
    - _要件: 全要件（UI基盤）_

  - [ ] 10.2 共通コンポーネントの作成
    - レイアウトコンポーネント（Header, Sidebar, Main）
    - 共通UIコンポーネント（Button, Modal, Loading）
    - エラーハンドリングコンポーネント
    - _要件: 全要件（UI基盤）_

- [ ] 11. アセット管理UIの実装
  - [ ] 11.1 AssetLibrary コンポーネント
    - アセット一覧表示のグリッドレイアウト
    - 検索・フィルタリング機能のUI
    - アセットプレビュー機能（画像サムネイル、音声プレーヤー）
    - _要件: 1.2, 1.3, 1.4, 1.5_

  - [ ] 11.2 AssetUpload コンポーネント
    - ドラッグ&ドロップファイルアップロード
    - アップロード進行状況表示
    - メタデータ入力フォーム（タグ、カテゴリ）
    - _要件: 1.1, 6.1_

- [ ] 12. プロンプト管理UIの実装
  - [ ] 12.1 PromptManager コンポーネント
    - プロンプト作成・編集フォーム
    - 保存されたプロンプトの一覧表示
    - プロンプト実行とリアルタイム進行状況表示
    - _要件: 2.1, 2.2, 2.3, 3.5_

- [ ] 13. プロジェクト管理UIの実装
  - [ ] 13.1 ProjectManager コンポーネント
    - プロジェクト作成・編集フォーム
    - プロジェクト一覧とアセット関連付けUI
    - プロジェクト間でのアセット共有インターフェース
    - _要件: 4.1, 4.2, 4.3, 4.4_

- [ ] 14. エクスポート機能UIの実装
  - [ ] 14.1 ExportManager コンポーネント
    - アセット選択とエクスポート設定UI
    - ファイル形式・品質設定オプション
    - エクスポート進行状況とダウンロードリンク
    - _要件: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 15. 統合テストとE2Eテストの実装
  - [ ] 15.1 バックエンドAPI統合テスト
    - 全エンドポイントの動作確認テスト
    - データベース操作の統合テスト
    - 外部サービス（AI API）のモックテスト
    - _要件: 全要件_

  - [ ] 15.2 フロントエンドE2Eテスト
    - Playwright を使用したユーザーフローテスト
    - アセットアップロードからエクスポートまでの完全フロー
    - エラーケースとエッジケースのテスト
    - _要件: 全要件_