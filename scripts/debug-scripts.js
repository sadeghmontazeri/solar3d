const { spawn } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlUrl = 'file:///C:/Users/11/Desktop/PC/shahrivar/17/17/index.html';

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9227',
  '--user-data-dir=C:\\Users\\11\\AppData\\Local\\Temp\\chrome-test-profile-5',
  htmlUrl
]);

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9227/json');
    const tabs = await res.json();
    const targetTab = tabs.find(t => t.url.includes('index.html'));

    if (targetTab && targetTab.webSocketDebuggerUrl) {
      const ws = new WebSocket(targetTab.webSocketDebuggerUrl);
      ws.onopen = () => {
        ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
        ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
        
        // Evaluate loading of sld-schematic.js
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 3,
            method: 'Runtime.evaluate',
            params: {
              expression: `(() => {
                try {
                  return {
                    scripts: Array.from(document.querySelectorAll('script')).map(s => s.src),
                    sldType: typeof window.SLDSchematic,
                    soundType: typeof window.soundEngine,
                    dbType: typeof window.PERSIAN_ELECTRICAL_DB
                  };
                } catch(e) {
                  return { error: e.message };
                }
              })()`,
              returnByValue: true
            }
          }));
        }, 800);
      };

      ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.method === 'Runtime.exceptionThrown') {
          console.error('[EXCEPTION]', JSON.stringify(msg.params.exceptionDetails));
        }
        if (msg.id === 3) {
          console.log('Script status:', msg.result?.result?.value);
        }
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
