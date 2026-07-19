# SwingBeans 8月 出席・曲管理

Google Apps Script版を軽くするための、静的Webアプリ版の試作品です。

構成は次の想定です。

- ローカル試作: `localStorage`
- 公開版: GitHub Pages + Firebase Realtime Database

Firebase設定を入れない状態では、ブラウザ内だけに保存されます。`firebase-config.js` を設定すると、全員で同じRealtime Databaseを読み書きします。

## ファイル

- `index.html`: 画面
- `styles.css`: 見た目
- `app.js`: アプリ本体
- `firebase-config.js`: Firebase設定

## ローカルで確認

このフォルダで静的サーバーを起動します。

```bash
python3 -m http.server 4180
```

ブラウザで開きます。

```text
http://localhost:4180
```

このままでは `localStorage` 保存です。全員共有はされません。

## データ設計

Firebase Realtime Databaseでは、初回起動時に次の形で作られます。

```text
swingbeans
  2026-08
    members
    dates
    songs
    attendance
      M01
        D01: "◎"
    songMembers
      S2
        M01: true
        M19: false
```

出席記号の計算は次の通りです。

- `◎`: 1
- `○`: 0.1
- `△`: 0
- `×`: 0
- 空欄: 0

## Firebase Realtime Databaseの作成

1. Firebase Consoleでプロジェクトを作成
2. `Realtime Database` を作成
3. ロケーションを選ぶ
4. テスト中は以下のようなルールにする

```json
{
  "rules": {
    "swingbeans": {
      "2026-08": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

このルールはURLを知っている人が読み書きできます。LINEでサークル内共有する試作品向けです。外部に広く公開する場合は、匿名ログインなどを追加してください。

## Firebase設定を入れる

Firebase Consoleのプロジェクト設定からWebアプリ設定をコピーし、`firebase-config.js` の `null` を置き換えます。

```js
window.SWINGBEANS_FIREBASE_CONFIG = {
  apiKey: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:xxxxxxxxxxxxxxxxxxxxxx",
};

window.SWINGBEANS_FIREBASE_ROOT = "swingbeans/2026-08";
```

## GitHub Pagesで公開

1. GitHubで新しいリポジトリを作成
2. このフォルダの中身をリポジトリにアップロード
3. GitHubの `Settings > Pages` を開く
4. `Deploy from a branch` を選択
5. Branchを `main`、フォルダを `/root` にする
6. 表示されたURLをLINEで共有

例:

```text
https://ユーザー名.github.io/リポジトリ名/
```

## 運用メモ

- メンバー名とパートだけを扱います。
- 団体の場所や大学名は画面に出していません。
- スマホでLINEから開く前提で、ボタンを大きめにしています。
- 出席入力は8月の全日分を用意しています。
- 曲メンバーは、参加する曲を押して切り替えます。
- 日程一覧では、おすすめ練習カレンダー、曲ごとのあつい日付TOP3、日付ごとの曲順を見られます。
- 保存後、Firebase版ではほかの端末にもほぼ即時反映されます。

## もし初期データを作り直したい場合

Realtime Databaseで `swingbeans/2026-08` を削除してからページを再読み込みすると、初期データが再作成されます。
