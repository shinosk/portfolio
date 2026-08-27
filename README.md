# Portfolio Site

静的HTML/CSS/JS で構成した個人ポートフォリオサイトです。ビルド不要・そのままサーバーにアップロードして公開できます。

## 特徴

- **表示モード切替**：ヘッダー右上のスイッチで「就活・採用の方へ」／「お仕事のご相談（TrunkNode）」を切り替え。セクションの並び順・見出し・本文が相手に合わせて変わります。
- 選んだモードは `localStorage` に保存され、次回アクセス時も維持されます。
- URL パラメータでもモードを指定可能。**営業用に `?mode=business` 付きのURLを送れば、事業モードで開きます**。
- レスポンシブ対応、OS のダークモードに自動追従。
- スクロール連動のフェードイン、スクロールスパイ（現在地のナビ強調）。
- 構造化データ（JSON-LD）・OGP・robots.txt を同梱。

## ディレクトリ構成

```
.
├── index.html          … ページ本体（文言はすべてここ）
├── .htaccess           … Xserver 向け設定（gzip・キャッシュ・HTTPS化）
├── robots.txt
└── assets/
    ├── css/style.css   … スタイル
    ├── js/main.js      … モード切替・メニュー・アニメーション
    └── img/favicon.svg … ファビコン
```

## 公開手順（Xserver）

1. サーバーパネルでドメインを追加し、SSL（無料独自SSL）を有効化する。
2. FTP または「ファイル管理」で、以下のファイルを公開ディレクトリ  
   `/home/<サーバーID>/<ドメイン>/public_html/` にアップロードする。
   - `index.html`
   - `assets/`（フォルダごと）
   - `.htaccess`
   - `robots.txt`
3. SSL の反映を確認したら、`.htaccess` の「HTTPS へのリダイレクト」ブロックのコメント（`#`）を外して再アップロードする。

> `.htaccess` は先頭がドットのため、FTP クライアントの設定で「隠しファイルを表示」を有効にしてください。

## 公開前に差し替えるもの

`index.html` 内の `▼要差し替え` コメントの箇所です。

| 箇所 | 現在の値 | 差し替え内容 |
| --- | --- | --- |
| `<title>` / OGP / JSON-LD / フッター | `氏名未設定` | お名前（漢字・ローマ字） |
| ヘッダーのロゴ | `Portfolio` | お名前のローマ字表記など |
| `canonical` / `og:url` / `robots.txt` | `https://example.com/` | 実際の公開URL |
| `og:image` | `assets/img/ogp.png` | OGP画像（1200×630px の PNG を用意） |
| Contact のメールリンク | `example@example.com` | 連絡用メールアドレス |
| Contact の SNS リンク | `#` | X / Instagram / GitHub などのURL |
| History の年次 | `20XX` | 実際の年（西暦） |
| Hero の学年表記 | `3年` | 現在の学年 |

## カスタマイズ

- **色を変える**：`assets/css/style.css` 冒頭の `--accent` を変更すると、サイト全体のアクセントカラーが変わります。
- **セクションの並び順を変える**：`style.css` の「7. Mode switching」で、モードごとに `order` を指定しています。
- **モード限定の要素**：`class="only-career"` は就活モードのみ、`class="only-business"` は事業モードのみ表示されます。
- **モードで文言を変える**：`<span data-mode-text="career">…</span>` と `<span data-mode-text="business">…</span>` を並べて書きます。
