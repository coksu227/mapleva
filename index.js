// index.js
const express = require('express');
const fetch = require('node-fetch');
const app = express();

const PORT = process.env.PORT || 3000;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK; // 디스코드 웹훅 URL
const CHECK_INTERVAL = 60 * 1000; // 60초
const maplestatusURL = 'https://maplestatus.info/en/maplestory/global';
const fallbackURL = 'https://www.southperry.net/stat.php';

let lastOnline = false;
let alertSent = false;
let alertStopped = false;

async function checkServers() {
  try {
    // 첫번째 사이트 시도
    let res = await fetch(maplestatusURL);
    if (!res.ok) throw new Error('Primary site down');
    let text = await res.text();

    // 서버 3개가 모두 온라인인지 체크 (예: 로그인서버 3개)
    const onlineCount = (text.match(/Login Server.+Online/g) || []).length;
    const allOnline = (onlineCount >= 3);

    if (allOnline && !lastOnline && !alertStopped) {
      sendDiscordAlert('서버가 Online 상태입니다!');
      alertSent = true;
    }
    lastOnline = allOnline;
  } catch (e1) {
    try {
      // fallback 사이트 시도
      let res2 = await fetch(fallbackURL);
      if (!res2.ok) throw new Error('Fallback site down');
      let text2 = await res2.text();
      // fallback에서는 단순 텍스트 체크 가능 (예: "Online" 단어가 있는지)
      const allOnline = text2.includes('Online');

      if (allOnline && !lastOnline && !alertStopped) {
        sendDiscordAlert('서버가 Online 상태입니다! (Fallback)');
        alertSent = true;
      }
      lastOnline = allOnline;
    } catch (e2) {
      if (!alertSent && !alertStopped) {
        sendDiscordAlert('서버 상태 확인 불가! 두 사이트 모두 접속 불가입니다.');
        alertSent = true;
      }
      lastOnline = false;
    }
  }
}

function sendDiscordAlert(message) {
  fetch(DISCORD_WEBHOOK, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      content: message
    })
  }).catch(console.error);
}

// 서버 상태 주기적 체크
setInterval(checkServers, CHECK_INTERVAL);
checkServers();

// 간단한 웹서버 (알림 끄기, 테스트 등 향후 추가 가능)
app.get('/',
