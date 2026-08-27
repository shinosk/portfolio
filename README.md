# Portfolio Site — 榛葉多翼

静的HTML/CSS/JS で構成した個人ポートフォリオサイトです。ビルド不要、そのままサーバーにアップロードして公開できます。

## 特徴

### 表示モード切替

ヘッダー右上で「就活・採用の方へ」／「お仕事のご相談」を切り替えます。切り替えると

- セクションの並び順
- 見出し・本文（AIなしでのコーディング経験など、就活でだけ伝えたい内容）
- 連絡先メールアドレス（大学 / TrunkNode）
- Services やアルバイトなど、モード固有のセクション

がまとめて入れ替わります。選択は `localStorage` に保存され、次回も維持されます。

URL パラメータでも指定できるので、**営業用に `?mode=business` 付きのURLを送れば、相手の画面は事業モードで開きます**。

セクション番号（01, 02…）は、DOM順ではなく**画面上の並び順**を見て JavaScript が振り直しています。モードを変えても番号が飛びません。

### そのほか

- レスポンシブ対応、OS のダークモードに自動追従
- スクロールスパイ（現在地のナビ強調）
- 構造化データ（JSON-LD）・OGP を同梱

## デザインの考え方

紙面（エディトリアル）を下敷きにしています。方針は3つ。

1. **カードと影を使わない。** 情報は 1px の罫線と余白だけで区切ります。
2. **左に小さなラベル、右に本文。** 見出しも各行も同じ位置（`--label-col`）で揃えることで、ページ全体に縦のリズムが出ます。
3. **色は紙・墨・朱の3色だけ。** 見出しは明朝（Zen Old Mincho）、本文はゴシック（Zen Kaku Gothic New）、英数字とラベルは等幅（IBM Plex Mono）。

色や余白を変えるときは `assets/css/style.css` 冒頭の `:root` を触ってください。

| 変数 | 役割 |
| --- | --- |
| `--paper` / `--paper-2` | 地の色 |
| `--ink` / `--ink-2` / `--ink-3` | 文字（濃い順） |
| `--rule` / `--rule-2` | 罫線 |
| `--accent` | 朱。番号・下線・リンクの矢印だけに使う |
| `--label-col` | 左ラベル列の幅 |

## ディレクトリ構成

```
.
├── index.html          … ページ本体（文言はすべてここ）
├── .htaccess           … Xserver 向け設定（gzip・キャッシュ・HTTPS化）
├── robots.txt
└── assets/
    ├── css/style.css   … スタイル
    ├── js/main.js      … モード切替・採番・メニュー・アニメーション
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

**決められたファイル名で置くだけ**で表示されます。ファイルが無い場合は枠ごと非表示になり、
レイアウトは崩れません（`assets/js/main.js` が読み込みの成否を見て判定しています）。

| ファイル | 表示される場所 | 推奨 |
| --- | --- | --- |
| `assets/img/profile.jpg` | トップの右側（置くと2カラムに切り替わる） | 縦長 4:5、横900px以上 |
| `assets/img/works-kbf.jpg` | Works 01 掛川バンドフェスティバル | 横長、横1200px程度 |
| `assets/img/works-nest.jpg` | Works 02 掛川MusicNest | 同上 |
| `assets/img/works-sns.jpg` | Works 03 SNS依存予防アプリ | スマホ画面のキャプチャ |
| `assets/img/works-alarm.jpg` | Works 04 アラームアプリ | 同上 |
| `assets/img/ogp.png` | SNSシェア時のサムネイル | 1200×630px |

プロフィール写真の表示位置は `style.css` の `.hero__media img` にある
`object-position: center 22%;` で調整できます（顔の位置に合わせて数値を変更）。

## 未設定のまま残しているもの

- 上記の画像すべて
- SNSリンク（未掲載。必要なら Contact の「関連サイト」に追加）
- 公開フォルダ名の確定（`portfolio` を仮定）

## 掲載内容のメモ

- 連絡先はモードで切り替わります  
  就活モード → `t25046tt@aitech.ac.jp` ／ 事業モード → `shimba@trunknode.jp`
- 「これから伸ばすところ」（AIなしでのコーディング経験）は**就活モードのみ**表示され、
  事業モードでは進め方の説明に差し替わります。
- アルバイト（塾講師リーダー／飲食店）は就活モードのみ表示されます。
