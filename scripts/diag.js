const { spawn } = require('child_process');

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9229',
  '--user-data-dir=C:\\Users\\11\\AppData\\Local\\Temp\\chrome-test-p-9229',
  'file:///C:/Users/11/Desktop/PC/shahrivar/17/17/index.html'
]);

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9229/json');
    const tabs = await res.json();
    console.log('Tabs:', tabs.map(t => ({ title: t.title, url: t.url, type: t.type })));
    const tab = tabs.find(t => t.url.includes('index.html'));
    if (tab) {
      const ws = new WebSocket(tab.webSocketDebuggerUrl);
      ws.onopen = () => {
        ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
        ws.send(JSON.stringify({ id: 2, method: 'Console.enable' }));
        ws.send(JSON.stringify({ id: 3, method: 'Page.enable' }));
        
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 10,
            method: 'Runtime.evaluate',
            params: {
              expression: `({
                readyState: document.readyState,
                scripts: Array.from(document.scripts).map(s => s.src),
                bodyChildren: document.body.children.length,
                windowKeys: Object.keys(window).filter(k => k.includes('SLD') || k.includes('PERSIAN') || k.includes('sound') || k.includes('Sim') || k.includes('Scene3D')),
                hasSLDElement: !!document.getElementById('sld-interactive-container')
              })`,
              returnByValue: true
            }
          }));
        }, 1500);
      };
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === 10) {
          console.log('Result:', JSON.stringify(msg.result?.result?.value, null, 2));
        }
        if (msg.method === 'Console.messageAdded') {
          console.log('Console:', msg.params.message.text);
        }
        if (msg.method === 'Runtime.exceptionThrown') {
          console.log('Runtime Exception:', msg.params.exceptionDetails?.text, msg.params.exceptionDetails?.exception?.description);
        }
      };
      setTimeout(() => { ws.close(); chrome.kill(); }, 4000);
    }
  } catch (err) {
    console.error(err);
    chrome.kill();
  }
}, 1200);
