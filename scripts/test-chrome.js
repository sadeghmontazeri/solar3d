const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlUrl = 'file:///C:/Users/11/Desktop/PC/shahrivar/17/17/index.html';

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9225',
  '--window-size=1600,900',
  '--user-data-dir=C:\\Users\\11\\AppData\\Local\\Temp\\chrome-test-profile-3',
  htmlUrl
]);

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9225/json');
    const tabs = await res.json();
    const targetTab = tabs.find(t => t.url.includes('index.html'));

    if (targetTab && targetTab.webSocketDebuggerUrl) {
      const ws = new WebSocket(targetTab.webSocketDebuggerUrl);
      ws.onopen = () => {
        ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
        ws.send(JSON.stringify({ id: 2, method: 'Page.enable' }));

        // Check DOM state
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 10,
            method: 'Runtime.evaluate',
            params: {
              expression: `({
                title: document.title,
                hudSbyBadge: !!document.getElementById('hud-sby-badge'),
                sbyPosText: document.getElementById('hud-sby-pos')?.textContent,
                troubleshootBtn: !!document.getElementById('btn-open-troubleshooting'),
                fatsatBtn: !!document.getElementById('btn-open-fatsat'),
                sldBtn: !!document.getElementById('btn-open-sld')
              })`,
              returnByValue: true
            }
          }));
        }, 500);

        // Click open SLD
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 20,
            method: 'Runtime.evaluate',
            params: {
              expression: `(function() {
                const btn = document.getElementById('btn-open-sld');
                if (btn) btn.click();
                const modal = document.getElementById('sld-modal');
                const svg = document.getElementById('sld-svg-canvas');
                return {
                  modalOpen: modal ? modal.classList.contains('open') : false,
                  svgPresent: !!svg,
                  nodesCount: document.querySelectorAll('.sld-component-node').length
                };
              })()`,
              returnByValue: true
            }
          }));
        }, 1200);

        // Take a screenshot of the SLD view
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 30,
            method: 'Page.captureScreenshot',
            params: { format: 'png' }
          }));
        }, 2000);
      };

      ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === 10) console.log('DOM Elements check:', msg.result?.result?.value);
        if (msg.id === 20) console.log('SLD Click Evaluation:', msg.result?.result?.value);
        if (msg.id === 30 && msg.result && msg.result.data) {
          const buffer = Buffer.from(msg.result.data, 'base64');
          fs.writeFileSync('scripts/screenshot-test.png', buffer);
          console.log('Saved screenshot to scripts/screenshot-test.png (size:', buffer.length, 'bytes)');
        }
      };

      setTimeout(() => {
        ws.close();
        chrome.kill();
      }, 3500);
    }
  } catch(e) {
    console.log('Error:', e.message);
    chrome.kill();
  }
}, 1500);
