const { spawn } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlUrl = 'file:///C:/Users/11/Desktop/PC/shahrivar/17/17/index.html';

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9226',
  '--user-data-dir=C:\\Users\\11\\AppData\\Local\\Temp\\chrome-test-profile-4',
  htmlUrl
]);

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9226/json');
    const tabs = await res.json();
    const targetTab = tabs.find(t => t.url.includes('index.html'));

    if (targetTab && targetTab.webSocketDebuggerUrl) {
      const ws = new WebSocket(targetTab.webSocketDebuggerUrl);
      ws.onopen = () => {
        ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 2,
            method: 'Runtime.evaluate',
            params: {
              expression: `(() => {
                const modal = document.getElementById('sld-modal');
                const btn = document.getElementById('btn-open-sld');
                if (btn) btn.click();
                return {
                  modalExists: !!modal,
                  modalClass: modal ? modal.className : null,
                  btnExists: !!btn,
                  hasSLDSchematic: typeof window.SLDSchematic !== 'undefined',
                  sldContainer: !!document.getElementById('sld-container')
                };
              })()`,
              returnByValue: true
            }
          }));
        }, 1200);
      };

      ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === 2) console.log('Inspect click:', JSON.stringify(msg.result?.result?.value));
      };

      setTimeout(() => {
        ws.close();
        chrome.kill();
      }, 3000);
    }
  } catch(e) {
    console.log(e.message);
    chrome.kill();
  }
}, 1000);
