# 🎌 動畫歌曲猜猜看

聽一段日本動畫的 OP／ED／劇場版主題曲，從四個選項中猜出是哪一部動畫。音樂使用 Apple Music（iTunes Search API）提供的官方 30 秒試聽，以網頁內建播放器播放——沒有廣告，手機鎖定畫面也只會顯示題號、不會洩漏歌名。

## 玩法

- **難度**：簡單（15 秒）／普通（10 秒）／困難（5 秒）
- **片段位置**：從 30 秒試聽（通常是副歌附近）中隨機擷取，避開開頭淡入與結尾淡出
- **題數**：5、10、20 題
- **題庫**：全部、經典（～2009）、近年（2010～），共 85 首、68 部作品
- 同一部作品的不同歌曲不會同時出現在選項中
- 計分：答對 100 分 + 速度加分（最多 100）+ 連擊加分；各難度最高分存在瀏覽器中
- 快捷鍵：`1`–`4` 作答、`R` 再聽一次、`Enter` 下一題
- 作答後揭曉作品名、曲名與歌手並繼續播放試聽，附 Apple Music 與 YouTube 連結
- **播放除錯**：載入慢會自動重試、顯示「點我播放」按鈕；試聽網址失效時自動向 Apple 重新查詢，仍失敗就換下一首。頁尾「🐞 播放有問題？」（或網址加 `?debug`）可查看播放狀態、事件記錄、失敗過的歌，並一鍵複製診斷資訊
- **分享成績圖**：結算頁可產生 IG 限時動態尺寸（1080×1920）的成績圖，含 QR Code
- **邀請朋友挑戰**：產生挑戰連結（`?d=難度&q=題目索引&s=分數&c=答對數&n=名字`），朋友打開後用同一組題目、同樣難度作答，結算時顯示勝負。因為連結用的是 `songs.js` 的索引，新增歌曲請只加在陣列最後面

## 本機執行

建議透過 http 開啟：

```powershell
python -m http.server 8000
```

然後開啟 <http://localhost:8000>。部署：GitHub Settings → Pages → 選擇 `main` 分支。

## 檔案

| 檔案 | 說明 |
| --- | --- |
| `index.html` | 頁面結構（開始／遊戲／結算三個畫面） |
| `style.css` | 樣式，支援手機版 |
| `game.js` | 遊戲邏輯、音檔播放與除錯面板 |
| `share.js` | IG 成績分享圖 |
| `songs.js` | 題庫：台灣譯名、日文原名、曲名、歌手、年份、類型、Apple Music 試聽、YouTube 影片 ID |
| `tools/find_previews.mjs` | 為每首歌搜尋 Apple Music 試聽（輸出 `tools/previews.json` 供人工檢查） |
| `tools/` 其他 | 題庫製作工具：候選清單、YouTube 影片搜尋 |

## 新增題目

在 `songs.js` 的 `SONGS` 陣列**最後面**加一筆：

```js
{"zh":"台灣譯名","en":"日文原名","track":"曲名","composer":"歌手","year":2024,"type":"op",
 "appleId":1234567890,"preview":"https://audio-ssl.itunes.apple.com/…m4a","appleUrl":"https://music.apple.com/jp/…","youtubeId":"影片ID"}
```

`type` 為 `op`、`ed` 或 `movie`。同一部作品的 `en` 必須一致（用來判斷答案與避免重複選項）。`appleId`／`preview`／`appleUrl` 可用 `node tools/find_previews.mjs` 查詢（iTunes API 有每分鐘約 20 次的限制，腳本會自動放慢），查完請人工確認比對到的是原唱版本。

---

歌曲試聽由 Apple Music 提供，版權屬原權利人所有，本專案僅供娛樂與學習用途。
