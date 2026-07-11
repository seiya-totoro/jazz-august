// Firebase Realtime Databaseを使う場合だけ、この値をFirebaseの設定に差し替えてください。
// nullのままだと、ローカル試作用としてlocalStorageに保存されます。
window.SWINGBEANS_FIREBASE_CONFIG = null;

// 例:
// window.SWINGBEANS_FIREBASE_CONFIG = {
//   apiKey: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
//   authDomain: "your-project.firebaseapp.com",
//   databaseURL: "https://your-project-default-rtdb.asia-southeast1.firebasedatabase.app",
//   projectId: "your-project",
//   storageBucket: "your-project.appspot.com",
//   messagingSenderId: "000000000000",
//   appId: "1:000000000000:web:xxxxxxxxxxxxxxxxxxxxxx",
// };

// 同じFirebaseプロジェクト内で保存場所を変えたい場合だけ変更します。
window.SWINGBEANS_FIREBASE_ROOT = "swingbeans/2026-08";
