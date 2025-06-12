const axios = require('axios');
const http = require('http');

const WEBHOOK_URL = '너의 웹훅 주소를 여기 붙여넣기';
const CHECK_INTERVAL = 60 * 1000; // 60초
let notified = false;

async function checkServerStatus() {
  let status = 'unknown';

  try {
    const res = await axios.get('https://maplestatus.info/en/maplestory/global');
    if (res.data.includes('Login: Online')) {
      status = 'online';
    } else {
      status = 'offline';
    }
  } catch (e1) {
    try {
      const res2 = await axios.get('https://www.southperry.net/stat.php');
      if (res2.data.includes('Login: Online')) {
        status = 'online';
      } else {
        status = 'offline';
      }
    } catch (e2) {
      status = 'error';
    }
  }

  if (status === 'online' && !notified) {
    await axios.post(WEBHOOK_URL, { content: '✅ 서버가 온라인입니다!' });
    notified = true;
  } else if (status === 'offline') {
    notified = false;
  } else if (status === 'error') {
    await axios.post(WEBHOOK_URL, { content: '⚠️ 서버 상태 사이트에 접속할 수 없습니다.' });
  }

  console.log(`[${new Date().toLocaleTimeString()}] 상태: ${status}`);
}

setInterval(checkServerStatus, CHECK_INTERVAL);
checkServerStatus();

// Render가 종료하지 않도록 웹서버 유지
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('서버 모니터링 도구가 실행 중입니다.');
}).listen(process.env.PORT || 3000, () => {
  console.log('웹서버가 실행되었습니다.');
});
