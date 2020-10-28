const fs = require('fs'); // 文件系统
const http = require('http'); // http 请求工具类
const https = require('https'); // https 请求工具类

const port = 10005;//设置端口号
const API_KEY = '' // 填入 API_KEY
const SECRCT_KEY = '' // 填入 SECRCT_KEY
const REDIRECT_URI = `http://127.0.0.1:` + port + '/'
const tokenFilePath = __dirname + '/token.json'

//创建http服务端
const server = http.createServer(function (request, response) {
  response.writeHead(200, {
    'Content-Type': 'text/plain;charset=utf-8', // 解决中文乱码
    "Access-Control-Allow-Origin": "*", // 解决跨域
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "PUT,POST,GET,DELETE,OPTIONS",
  })

  if (request.url === '/getCode') { // 访问根域名，重定向，访问百度统计获取 code 的接口
    response.writeHead(302, { 'Location': `http://openapi.baidu.com/oauth/2.0/authorize?response_type=code&client_id=${API_KEY}&redirect_uri=${REDIRECT_URI}&scope=basic&display=popup` });
    response.end();
  } else if (request.url.indexOf('/?code=') > -1) { // 获得 code
    const CODE = request.url.split('/?code=')[1]
    http.get(`http://openapi.baidu.com/oauth/2.0/token?grant_type=authorization_code&code=${CODE}&client_id=${API_KEY}&client_secret=${SECRCT_KEY}&redirect_uri=${REDIRECT_URI}`, (res) => {
      res.on('data', (dataStr) => {
        fs.writeFileSync(tokenFilePath, dataStr, 'utf8');
        response.write(JSON.stringify({
          message: 'token 获取成功',
          data: JSON.parse(dataStr)
        }));
        response.end();
      });
    });
  } else if (request.url.indexOf('/getToken') > -1) { // 获得 token
    try {
      const { ctime } = fs.statSync(tokenFilePath)
      const tokenObj = JSON.parse(fs.readFileSync(tokenFilePath)) || {};
      if (ctime.getTime() + tokenObj.expires_in * 1000 < new Date().getTime()) { // 过期，重定向到刷新接口
        response.writeHead(302, { 'Location': `/refreshToken` });
        response.end();
      } else {
        response.write(JSON.stringify({ token: tokenObj.access_token }));
        response.end();
      }
    } catch (e) {
      response.write(e.toString());
      response.end();
    }
  } else if (request.url.indexOf('/refreshToken') > -1) { // 刷新token
    try {
      const tokenObj = JSON.parse(fs.readFileSync(tokenFilePath)) || {};
      http.get(`http://openapi.baidu.com/oauth/2.0/token?grant_type=refresh_token&refresh_token=${tokenObj.refresh_token}&client_id=${API_KEY}&client_secret=${SECRCT_KEY}`, (res) => {
        res.on('data', (dataStr) => {
          fs.writeFileSync(tokenFilePath, dataStr, 'utf8');
          response.write(JSON.stringify({
            message: 'token 更新成功',
            token: JSON.parse(dataStr).access_token
          }));
          response.end();
        });
      });
    } catch (e) {
      response.write(e.toString());
      response.end();
    }
  } else if (request.url.indexOf('/getSite') > -1) { // 获取所有站点
    try {
      const tokenObj = JSON.parse(fs.readFileSync(tokenFilePath)) || {};
      https.get(`https://openapi.baidu.com/rest/2.0/tongji/config/getSiteList?access_token=${tokenObj.access_token}`, (res) => {
        res.on('data', (dataStr) => {
          fs.writeFileSync(tokenFilePath, dataStr, 'utf8');
          response.write(JSON.stringify({
            message: '站点列表获取成功',
            token: JSON.parse(dataStr)
          }));
          response.end();
        });
      });
    } catch (e) {
      response.write(e.toString());
      response.end();
    }
  } else if (request.url.indexOf('/getData?siteId=') > -1) { // 获取统计数据
    const targetSiteId = request.url.split('siteId=')[1]
    try {
      const date = new Date()
      const endDateStr = '' + date.getFullYear() + (date.getMonth() + 1) + date.getDate()
      const tokenObj = JSON.parse(fs.readFileSync(tokenFilePath)) || {};
      let dataStr = ''
      https.get(`https://openapi.baidu.com/rest/2.0/tongji/report/getData?access_token=${tokenObj.access_token}&site_id=${targetSiteId}&method=overview/getTimeTrendRpt&start_date=20200101&end_date=${endDateStr}&metrics=pv_count,visitor_count,ip_count`, (res) => {
        res.addListener('data', function (postChunk) {dataStr += postChunk});//接受全部参数
        res.addListener('end', function () {
          const data = JSON.parse(dataStr)
          const result = {
            daySum: 0,
            ipSum: 0,
            pvSum: 0,
            uvSum: 0,
            todayPvSum: 0
          }
          data.result.items[1].forEach((item) => {
            if (item[0] !== '--') {
              result.daySum++
              result.pvSum += item[0]
              result.uvSum += item[1]
              result.ipSum += item[2]
              result.todayPvSum = item[0]
            }
          })
          response.write(JSON.stringify({
            message: '数据获取成功',
            data: result,
          }));
          response.end();
        });
      });
    } catch (e) {
      response.write(e.toString());
      response.end();
    }
  } else {
    response.write(JSON.stringify({ message: '无匹配路由' }));
    response.end();
  }
});
server.listen(port);//监听端口号
console.log('http server run in port:' + port);
