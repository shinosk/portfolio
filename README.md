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

## 公開手順（Xserver / trunknode.jp のサブフォルダ）

1. FTP または「ファイル管理」で、公開ディレクトリの下にサブフォルダを作る。  
   例：`/home/<サーバーID>/trunknode.jp/public_html/portfolio/`
2. そのフォルダに以下をアップロードする。
   - `index.html`
   - `assets/`（フォルダごと）
   - `.htaccess`
3. `.htaccess` の「HTTPS へのリダイレクト」ブロックのコメント（`#`）を外す。

> `.htaccess` は先頭がドットのため、FTP クライアントの設定で「隠しファイルを表示」を有効にしてください。

### サブフォルダ名について

現在 `index.html` の `canonical` / OGP は **`https://trunknode.jp/portfolio/`** を前提に書いています。
別のフォルダ名で公開する場合は、`index.html` 冒頭の以下3か所を書き換えてください。

- `<link rel="canonical">`
- `<meta property="og:url">` / `<meta property="og:image">`
- JSON-LD の `"url"`

サイト内のパスはすべて相対指定なので、フォルダ名を変えても表示は崩れません。

### robots.txt について

`robots.txt` はドメイン直下（`https://trunknode.jp/robots.txt`）に置いたものだけが有効です。
サブフォルダ公開なので、このリポジトリの `robots.txt` はアップロードせず、
内容を TrunkNode 本体側の `robots.txt` に統合してください。

## 画像の追加

### プロフィール写真（推奨）

**`assets/img/profile.jpg` に画像を置くだけ**で、ヒーローが自動的に2カラム
（左：テキスト／右：写真）に切り替わります。ファイルが無い場合は写真の枠ごと
非表示になり、1カラムのまま崩れません（`assets/js/main.js` が判定しています）。

- 推奨：縦長（4:5 前後）、横 900px 以上、JPEG
- 表示位置は `assets/css/style.css` の `.hero__media img` の
  `object-position: center 22%;` で調整できます（顔の位置に合わせて数値を変更）

### OGP画像

`assets/img/ogp.png`（1200×630px）を置くと、SNSでシェアされたときの
サムネイルになります。未設置でもサイト自体は正常に動きます。

## 未設定のまま残しているもの

| 箇所 | 状態 |
| --- | --- |
| プロフィール写真 | `assets/img/profile.jpg` 未設置（無くても表示は崩れません） |
| OGP画像 | `assets/img/ogp.png` 未設置 |
| SNSリンク | 未掲載。必要なら Contact の「関連サイト」に追加してください |
| Works のサムネイル | 色面のプレースホルダ（実際の画面キャプチャに差し替え可） |
| 公開フォルダ名 | `portfolio` を仮定（上記「サブフォルダ名について」参照） |

## 掲載内容のメモ

- 連絡先はモードで切り替わります  
  就活モード → `t25046tt@aitech.ac.jp` ／ 事業モード → `shimba@trunknode.jp`
- 「これから伸ばすところ」（AIなしでのコーディング経験）は**就活モードのみ**表示され、
  事業モードでは進め方の説明に差し替わります。
- アルバイト（塾講師リーダー／飲食店）のカードは就活モードのみ表示されます。

## カスタマイズ

- **色を変える**：`assets/css/style.css` 冒頭の `--accent` を変更すると、サイト全体のアクセントカラーが変わります。
- **セクションの並び順を変える**：`style.css` の「7. Mode switching」で、モードごとに `order` を指定しています。
- **モード限定の要素**：`class="only-career"` は就活モードのみ、`class="only-business"` は事業モードのみ表示されます。
- **モードで文言を変える**：`<span data-mode-text="career">…</span>` と `<span data-mode-text="business">…</span>` を並べて書きます。
