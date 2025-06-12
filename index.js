const express = require('express');
const axios = require('axios');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 10000;

// 디스코드 웹훅 주소 (실제 값으로 바꾸세요)
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1382727180081168456/ovdPi1XN2d80MxTePGGLk32ZjLKJaW4NCS5m7y08rmgKnOFsQPMgvNHBTh7ZGsiu0mjP';

// axios 인스턴스 (southperry.net SSL 검증 무시용)
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false,  // SSL 인증서 무시
  }),
});

// 서버 상태 체크 함수
async function checkServerStatus() {
  let serverOnline = false;
  let maplestatusError = null;
  let southperryError = null;

  // 1. maplestatus.info 요청 (User-Agent 헤더 포함)
  try {
    const response = await axios.get('https://maplestatus.info/en/maplestory/global', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                      'Chrome/115.0.0.0 Safari/537.36',
      },
    });
    // 여기서 응답 데이터로 서버 상태 확인 로직 넣기 (예: response.data)
    if (response.status === 200) {
      serverOnline = true;  // 임시로 true 처리
    }
  } catch (error) {
    maplestatusError = error;
    console.log(`maplestatus.info 접속 실패: ${error.message}`);
  }

  // 2. fallback southperry.net 요청 (SSL 검증 무시)
  if (!serverOnline) {
    try {
      const response = await axiosInstance.get('https://www.southperry.net/stat.php');
      if (response.status === 200) {
        serverOnline = true;
      }
    } catch (error) {
      southperryError = error;
      console.log(`southperry.net 접속 실패: ${error.message}`);
    }
  }

  // 3. 두 사이트 모두 실패 시 알림 보내기
  if (!serverOnline) {
    console.log('⚠️ 두 상태 사이트 모두 접속 실패');
    await sendDiscordNotification('⚠️ 서버 상태 사이트에 접속할 수 없습니다.');
  } else {
    console.log('서버가 온라인 상태입니다.');
  }
}

// 디스코드 알림 함수
async function sendDiscordNotification(message) {
  try {
    await axios.post(DISCORD_WEBHOOK_URL, {
      content: message,
    });
  } catch (error) {
    console.error('디스코드 알림 전송 실패:', error.message);
  }
}

// 1분마다 서버 상태 체크
setInterval(checkServerStatus, 60 * 1000);

app.listen(PORT, () => {
  console.log('웹서버가 실행되었습니다.');
  checkServerStatus(); // 서버 실행 시 한 번 체크
});

