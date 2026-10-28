/**
 * 云朵巡线员 (xunxianyuan.org) - IndexNow 自动广播推送脚本
 * 规范支持: IndexNow API (Bing / Yandex / Seznam / Naver 等搜索引擎联合索引)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const HOST = 'xunxianyuan.org';
const KEY = '4854070e4a6a46ff9fbdb2f690adf334';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

// 从 sitemap.xml 提取所有需要广播的 URL 列表
function getUrlsFromSitemap() {
  const sitemapPath = path.join(__dirname, 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) {
    console.error('❌ 未找到 sitemap.xml 文件！');
    process.exit(1);
  }

  const content = fs.readFileSync(sitemapPath, 'utf8');
  const locRegex = /<loc>(https?:\/\/[^<]+)<\/loc>/g;
  const urls = [];
  let match;

  while ((match = locRegex.exec(content)) !== null) {
    const url = match[1].trim();
    if (!urls.includes(url)) {
      urls.push(url);
    }
  }

  return urls;
}

// 封装发送 IndexNow 请求
function submitToIndexNow(endpointHost, payload) {
  return new Promise((resolve) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: endpointHost,
      port: 443,
      path: '/indexnow',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent': 'CloudPatrol-IndexNow-Agent/1.0'
      },
      timeout: 10000
    };

    console.log(`📡 正在向 ${endpointHost} 发送 IndexNow 广播...`);

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 202) {
          console.log(`✅ [${endpointHost}] 提交成功: HTTP ${res.statusCode} ${res.statusCode === 200 ? 'OK' : 'Accepted'}`);
        } else {
          console.warn(`⚠️ [${endpointHost}] 响应状态: HTTP ${res.statusCode} (响应内容: ${body.trim() || '空'})`);
        }
        resolve({ host: endpointHost, status: res.statusCode, body });
      });
    });

    req.on('error', (err) => {
      console.error(`❌ [${endpointHost}] 请求异常:`, err.message);
      resolve({ host: endpointHost, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      console.error(`⏳ [${endpointHost}] 请求超时！`);
      resolve({ host: endpointHost, error: 'Timeout' });
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('=== [云朵巡线员] IndexNow 全站 URL 即时广播 ===\n');

  const urls = getUrlsFromSitemap();
  console.log(`📋 从 sitemap.xml 成功提取 ${urls.length} 个核心 URL:`);
  urls.forEach((u, i) => console.log(`   ${i + 1}. ${u}`));
  console.log(`\n🔑 验证密钥: ${KEY}`);
  console.log(`📍 密钥地址: ${KEY_LOCATION}\n`);

  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls
  };

  // 广播目标节点（官方集中分发网关与 Bing 专有接口）
  const endpoints = [
    'api.indexnow.org',
    'www.bing.com'
  ];

  for (const endpoint of endpoints) {
    await submitToIndexNow(endpoint, payload);
  }

  console.log('\n🎉 IndexNow 广播操作完成！搜索引擎爬虫将在数分钟至数小时内响应抓取。');
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
