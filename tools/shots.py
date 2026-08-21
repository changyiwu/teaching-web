"""收 canvas 畫面的小伺服器，讓 Agent 看得到自己畫了什麼。

Browser pane 沒有顯示在畫面上時 `screenshot` 會逾時（頁面不合成畫格），
但 `canvas.toDataURL()` 隨時都能拿到像素。這支就負責把那串 data URL 存成 PNG。

用法：

    python tools/shots.py                 # 存到 tools/_shots/，埠 8766
    python tools/shots.py 8080 out_dir    # 換埠與輸出目錄

頁面端（在 Browser pane 的 console 或 javascript_tool 裡執行）：

    const send = (name, c) => fetch('http://127.0.0.1:8766/', {
      method: 'POST', body: name + '|' + c.toDataURL('image/png')
    }).then(r => r.text());
    await send('canvas-equiv', document.getElementById('canvas-equiv'));

存出來是 `shot_<name>.png`。

**判讀前一定要先疊底色**：canvas 收回來是透明底，直接 `convert('RGB')` 會把
半透明填色變成全彩（`rgba(52,211,153,0.18)` 會變亮綠），文字跟底色同色就整片消失，
看起來像 bug 其實是截圖流程的錯。教材頁的卡片底色約為 `(23, 32, 50)`：

    bg = Image.new('RGBA', im.size, (23, 32, 50, 255))
    Image.alpha_composite(bg, im).convert('RGB')
"""

import base64
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8766
OUT = os.path.abspath(sys.argv[2]) if len(sys.argv) > 2 else \
    os.path.join(os.path.dirname(os.path.abspath(__file__)), '_shots')


class ShotHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length).decode('utf-8')
        name, _, data_url = body.partition('|')
        if not data_url or ',' not in data_url:
            self.send_response(400)
            self._cors()
            self.end_headers()
            self.wfile.write(b'expected "<name>|<dataURL>"')
            return

        raw = base64.b64decode(data_url.split(',', 1)[1])
        safe = ''.join(ch for ch in name if ch.isalnum() or ch in '-_.') or 'shot'
        path = os.path.join(OUT, f'shot_{safe}.png')
        with open(path, 'wb') as fp:
            fp.write(raw)
        print(f'saved {path} ({len(raw) // 1024} KB)')

        self.send_response(200)
        self._cors()
        self.end_headers()
        self.wfile.write(b'ok')

    def _cors(self):
        # 頁面是從 nostore.py 的埠載入的，跟這支不同源，要放行
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', '*')

    def log_message(self, *args):
        pass


def main():
    os.makedirs(OUT, exist_ok=True)
    print(f'shot receiver on http://127.0.0.1:{PORT} -> {OUT}')
    ThreadingHTTPServer(('127.0.0.1', PORT), ShotHandler).serve_forever()


if __name__ == '__main__':
    main()
