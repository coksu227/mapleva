import express from 'express';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 10000;

// 여기에 실제 디스코드 웹훅 주소 넣으세요!
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1382727180081168456/ovdPi1XN2d80MxTePGGLk32ZjLKJaW4NCS5m7y08rmgKnOFsQPMgvNHBTh7ZGsiu0mjP';

let lastStatus = null;
let alertSent = false;
let lastRequestTime = 0;
const REQUEST_INTERVAL = 30 * 1000; // 30초

// CORS 설정 (필요하면 활성화)
// import cors from 'cors';
// app.use(cors());

app.get('/', (req, res) => {
  res.send(`
    <h1>메이플 서버 모니터</h1>
    <p>서버 상태를 확인 중입니다.</p>
    <p>API: <a href="/status">/status</a></p>
  `);
});

// 서버 상태 확인 API
app.get('/status', async (req, res) => {
  try {
    const now = Date.now();
    if (now - lastRequestTime < REQUEST_INTERVAL) {
      // 너무 잦은 호출 제한
      return res.status(429).json({ error: 'Too Many Requests' });
    }
    lastRequestTime = now;

    const status = await checkServerStatus();
    res.json({ status });
  } catch (error) {
    res.status(500).json({ error: error.message || '서버 상태 확인 실패' });
  }
});

async function checkServerStatus() {
  // maplestatus.info 기본 시도
  try {
    const res = await axios.get('https://maplestatus.info/en/maplestory/global', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      httpsAgent: new (await import('https')).Agent({ rejectUnauthorized: false }),
      timeout: 8000,
    });
    if (res.status === 200 && res.data.includes('Online')) {
      updateAlert(false);
      return 'online';
    } else {
      // fallback으로 southperry.net 시도
      return await checkFallback();
    }
  } catch (err) {
    return await checkFallback();
  }
}

async function checkFallback() {
  try {
    const res = await axios.get('https://www.southperry.net/stat.php', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      httpsAgent: new (await import('https')).Agent({ rejectUnauthorized: false }),
      timeout: 8000,
    });
    if (res.status === 200 && res.data.includes('ONLINE')) {
      updateAlert(false);
      return 'online';
    } else {
      updateAlert(true);
      return 'offline';
    }
  } catch (err) {
    updateAlert(true);
    return 'offline';
  }
}

async function updateAlert(isOffline) {
  if (isOffline && !alertSent) {
    alertSent = true;
    await sendDiscordAlert('⚠️ 서버 상태 사이트에 접속할 수 없습니다.');
  }
  if (!isOffline && alertSent) {
    alertSent = false;
    await sendDiscordAlert('✅ 서버 상태 사이트가 정상입니다.');
  }
}

async function sendDiscordAlert(message) {
  if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL === 'https://discord.com/api/webhooks/your_webhook_url_here') {
    console.log('Discord webhook URL이 설정되지 않았습니다.');
    return;
  }
  try {
    await axios.post(
      DISCORD_WEBHOOK_URL,
      { content: message },
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log('Discord 알림 전송:', message);
  } catch (err) {
    console.error('Discord 알림 전송 실패:', err.message);
  }
}

app.listen(PORT, () => {
  console.log(`웹서버가 실행되었습니다. 포트: ${PORT}`);
});
