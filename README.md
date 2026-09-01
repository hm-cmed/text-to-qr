# 長文QR 分割・復元ツール v1.2.1 (GitHub Pages / PWA / Flat Upload版)

日本語・英語混合の長文を複数のQRコードへ分割し、USB HID型QRリーダーで順不同に読み込んで元の文章へ復元する静的Webアプリです。

## この版の重要な変更

GitHubのWeb画面にある **Add file → Upload files** から、全ファイルをまとめてドラッグ＆ドロップしても動くように、サブフォルダを廃止しました。

`index.html`、QR生成エンジン、アイコンなど、すべてをリポジトリ直下に置きます。

## GitHub Pagesへの公開方法

1. このZIPをPCで展開します。
2. 展開後の**中身をすべて選択**します。ZIPファイルそのものはアップロードしません。
3. GitHubリポジトリで **Add file → Upload files** を選択します。
4. 選択した全ファイルをドラッグ＆ドロップします。
5. Commit changesします。
6. **Settings → Pages → Build and deployment** を開きます。
7. Sourceを **Deploy from a branch**、Branchを **main**、Folderを **/(root)** にしてSaveします。
8. 数分待ってGitHub Pagesの公開URLを開きます。
9. 初回に「オフライン利用の準備ができました」と表示されればPWAキャッシュも準備完了です。

## リポジトリ直下の正しい構成

```text
/
├─ index.html
├─ app.js
├─ style.css
├─ service-worker.js
├─ manifest.webmanifest
├─ qrcode_local.js
├─ icon-192.png
├─ icon-512.png
├─ icon-512-maskable.png
├─ .nojekyll
├─ README.md
└─ SAMPLE_TEXT.txt
```

**フォルダはありません。** `qrcode_local.js` が `index.html` と同じ階層にあることが重要です。

## 既にv1.2を公開した場合

このv1.2.1のファイルを追加・上書きしたあと、古いPWAキャッシュが残る場合があります。まずページで `Ctrl + Shift + R` を押してください。それでも古い版が表示される場合は、Chrome/Edgeのサイトデータを削除して再読み込みしてください。

Service Workerのキャッシュ名は `longtext-qr-pwa-v1-2-1` に更新済みです。

## 特徴

- サーバー側処理なし。HTML / CSS / JavaScriptのみ。
- 入力文章・QR読取結果・復元文をサーバーへ送信しません。
- OQ2形式はQR搬送データを英大文字・数字中心にし、US/JISキーボード配列差による記号置換を避けます。
- 初回オンラインアクセス後、Service Workerがアプリ本体をキャッシュし、以後はオフラインでも起動できます。
- QRの順不同読み取り、重複スキャン、欠番表示、CRC32整合性確認、TXT保存に対応します。

## USB QRリーダー

- USB HID Keyboard mode
- 末尾サフィックス Enter 推奨
- IMEは半角英数入力を推奨

## セキュリティ・プライバシー

本アプリ自体にフォーム送信、Web API送信、アクセス解析、広告、外部CDNはありません。QRコードは暗号化ではないため、機密情報・個人情報の取扱いは組織の規程に従ってください。
