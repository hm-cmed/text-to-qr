# 長文QR 分割・復元ツール v1.2 (GitHub Pages / PWA)

日本語・英語混合の長文を複数のQRコードへ分割し、USB HID型QRリーダーで順不同に読み込んで元の文章へ復元する、静的Webアプリです。

## 特徴

- サーバー側処理なし。HTML / CSS / JavaScriptだけで動作します。
- 入力した文章・QR読取結果・復元文をサーバーへ送信しません。
- OQ2形式はQR搬送データを英大文字・数字中心にし、US/JISキーボード配列差による記号置換を避けます。
- 初回オンラインアクセス後、Service Workerがアプリ本体をキャッシュします。以後はオフラインでも起動できます。
- PWA対応ブラウザでは「アプリとしてインストール」できます。
- QRの順不同読み取り、重複スキャン、欠番表示、CRC32整合性確認、TXT保存に対応します。

## GitHub Pagesへの公開方法（最も簡単）

1. GitHubで新しいリポジトリを作成します（例: `longtext-qr-tool`）。
2. **このフォルダの中身を、階層を変えずにリポジトリ直下へすべて入れてください。**
3. `main` ブランチへCommit / Pushします。
4. GitHubのリポジトリで **Settings → Pages** を開きます。
5. **Build and deployment → Source: Deploy from a branch** を選びます。
6. Branchを **main**、Folderを **/(root)** にしてSaveします。
7. 公開URL `https://<username>.github.io/<repository>/` を開きます。
8. 初回に「✓ オフライン利用の準備ができました」と表示されれば成功です。
9. 一度ページを正常に開いたあと、Wi-Fiを切る等して同じURLを再度開き、オフライン動作を確認してください。

> `index.html` は公開元の最上位に必要です。`.nojekyll` もそのまま置いてください。

## リポジトリ直下の構成

```text
/
├─ index.html
├─ app.js
├─ style.css
├─ service-worker.js
├─ manifest.webmanifest
├─ .nojekyll
├─ README.md
├─ SAMPLE_TEXT.txt
├─ icons/
│  ├─ icon-192.png
│  ├─ icon-512.png
│  └─ icon-512-maskable.png
└─ vendor/
   └─ qrcode_local.js
```

## オフライン動作の仕組み

初回アクセス時、`service-worker.js` がアプリ本体（HTML / CSS / JavaScript / QRエンジン / manifest / icons）をブラウザのCache Storageへ保存します。2回目以降、ネットワークが利用できない場合は保存済みファイルから起動します。

**入力文章や復元文章はService Workerのキャッシュ対象ではありません。** ページを閉じると入力内容は保存されません。

## 更新時の注意

Webアプリを更新した場合は、`service-worker.js` の `CACHE_NAME` を新しい値へ変更してください。例:

```js
const CACHE_NAME = 'longtext-qr-pwa-v1-2-1';
```

これにより旧キャッシュが削除され、新しいファイルへ更新されます。

## USB QRリーダー

- USB HID Keyboard mode
- 末尾サフィックス Enter 推奨
- IMEは半角英数入力を推奨
- OQ2ではQR内部の搬送文字にキーボード配列差の影響を受けやすい記号を使いません。

## セキュリティ・プライバシー

- 本アプリ自体にフォーム送信、Web API送信、アクセス解析、広告、外部CDNはありません。
- GitHub Pagesから取得するのはアプリの静的ファイルだけです。
- QRコードは暗号化ではありません。QR画像を閲覧できる人は内容を復号できます。機密情報・個人情報を扱う場合は組織の規程に従ってください。

## ローカルファイルとして開く場合

`index.html` を直接ダブルクリックしてQR作成・復元の基本機能は利用できます。ただしService Workerは通常 `file://` では利用できないため、PWA/オフラインキャッシュ機能の確認はGitHub PagesなどHTTPS環境で行ってください。
