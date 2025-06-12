const http = require('http');
const axios = require('axios');

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1382727180081168456/ovdPi1XN2d80MxTePGGLk32ZjLKJaW4NCS5m7y08rmgKnOFsQPMgvNHBTh7ZGsiu0mjP'; // 여기에 실제 웹훅 주소 입력
const CHECK_INTERVAL = 60 * 1000; // 60초마다 체크

let hasSentOnlineAlert = false;
let hasSentDownAlert = false;

async function sendDiscordNotification(message) {
  try {
    await axios.post(DISCORD_WEBHOOK_URL, {
      content: message,
    });
  } catch (error) {
    console.error('디스코드 알림 전송 실패:', error.message);
  }
}

async function isMapleStatusOnline() {
  try {
    const response = await axios.get('https://maplestatus.info/en/maplestory/global');
    return response.data.includes('Online');
  } catch (error) {
    console.warn('maplestatus.info 접속 실패:', error.message);
    return null; // 실패했음을 의미
  }
}

async function isSouthPerryOnline() {
  try {
    const response = await axios.get('https://www.southperry.net/stat.php');
    return response.data.includes('ONLINE');
  } catch (error) {
    console.warn('southperry.net 접속 실패:', error.message);
    return null;
  }
}

async function checkServerStatus() {
  let isOnline = await isMapleStatusOnline();

  if (isOnline === null) {
    isOnline = await isSouthPerryOnline();

    if (isOnline === null) {
      console.log('⚠️ 두 상태 사이트 모두 접속 실패');
      await sendDiscordNotification('⚠️ 서버 상태 사이트에 접속할 수 없습니다.');
      return;
    }
  }

  if (isOnline) {
    console.log('✅ 서버는 온라인입니다.');
    if (!hasSentOnlineAlert) {
      await sendDiscordNotification('✅ 메이플스토리 서버가 온라인입니다!');
      hasSentOnlineAlert = true;
      hasSentDownAlert = false;
    }
  } else {
    console.log('❌ 서버는 오프라인입니다.');
    if (!hasSentDownAlert) {
      await sendDiscordNotification('❌ 메이플스토리 서버가 아직 오프라인입니다.');
      hasSentDownAlert = true;
      hasSentOnlineAlert = false;
    }
  }
}

setInterval(checkServerStatus, CHECK_INTERVAL);
checkServerStatus();

// 웹서버 시작 (한글 및 이모지 깨짐 방지 설정 포함)
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('✅ 웹서버가 실행 중입니다.');
});

server.listen(process.env.PORT || 3000, () => {
  console.log('웹서버가 실행되었습니다.');
});
