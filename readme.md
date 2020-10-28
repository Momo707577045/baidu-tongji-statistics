# 百度统计 API 接入的坑及 access_token 生成工具

## 两种账号模式
- 「百度商业账号」：面向百度推广、百度网盟、百度联盟、百度统计、百度司南等账号，可以理解为面向企业用户。
- 「百度账户」：面向百度搜索、百度贴吧、百度云盘、百度知道、百度文库等产品，面向一般个体用户。
- 两种账户系统不一样，不互通。网上教程与类库，针对的是「百度商业账号」，针对「百度账户」的教程几乎没有。
- 本文介绍的是「百度账户」的接入方式。

  ![](http://upyun.luckly-mjw.cn/Assets/baidu-statistics/001.png)

## 两种账户系统使用的调用凭证不同
- 「百度商业账号」
  - 调用接口使用的是「token」
  - 「token」在「百度统计-数据导出服务」页面，点击「立即开通」，由系统自动生成。

    ![](http://upyun.luckly-mjw.cn/Assets/baidu-statistics/003.png)

- 「百度账户」
  - 在「百度统计-数据导出服务」页没有「立即开通」的按钮。
  - 调用接口使用的是「access_token」，而不是「token」
  - 「access_token」需要经过 oauth/2.0 协议生成。

    ![](http://upyun.luckly-mjw.cn/Assets/baidu-statistics/002.jpeg)

## access_token 生成过程
*首次换取 access_token 的过程，需要在浏览器端完成，无法纯服务器端完成*
- 【第零步】
  - 在「[百度开发者中心](http://developer.baidu.com/console#app/project)」中创建工程，获得 apiKey 与 secretKey

      ![](http://upyun.luckly-mjw.cn/Assets/baidu-statistics/004.jpeg)
      ![](http://upyun.luckly-mjw.cn/Assets/baidu-statistics/008.png)

- 【第一步】在浏览器中，访问这个链接 ```http://openapi.baidu.com/oauth/2.0/authorize?response_type=code&client_id=${apiKey}&redirect_uri=${redirect_uri}&scope=basic&display=popup```
  - 浏览器将重定向到百度授权的页面，用户进行登录授权
- 【第二步】用户登录授权，输入账号密码授权
  - 授权成功后，将重定向到 redirect_uri 中，并在 URL 中携带 code 参数。
  - redirect_uri 地址，需要在「安全设置」中配置
  - 这一步需要在浏览器中完成，无法脱离浏览器，靠纯服务器完成。

    ![](http://upyun.luckly-mjw.cn/Assets/baidu-statistics/009.png)
- 【第三步】通过 code 换取 access_token
  - 访问这个链接```http://openapi.baidu.com/oauth/2.0/token?grant_type=authorization_code&code=${code}&client_id=${apiKey}&client_secret=${secretKey}&redirect_uri=${redirect_uri}```
  - 返回只是一个包含「access_token」与「refresh_token」的 json

    ![](http://upyun.luckly-mjw.cn/Assets/baidu-statistics/006.png)

- 【刷新 access_token 】通过 access_token
  - access_token 的有效期是一个月，refresh_token 是十年。
  - 通过「apiKey」「secretKey」与「refresh_token」可调用接口刷新「access_token」与「refresh_token」。
  - 无需再经由服务器。
- 【总结】
  - 除去首次获取「access_token」外，后续接口调用，以及「access_token」的刷新，均可在服务器端完成。需要再经由浏览器。
- 【注意】
  - redirect_uri 与百度统计的网站域名没有关系。只校验是否在「安全设置」中配置过。除此以外，没有限制（内网地址都行）。
  - redirect_uri 只在「第一步」「第三步」中使用，只用于首次换取 access_token，只使用一次。刷新 access_token 不需要用到。


## redirect_uri 保存不生效的坑
- 笔者偶现 redirect_uri 保存不生效，实际生效的仍是之前填的回调地址。
- 可新开项目即可解决该问题。


## [access_token 生成器](http://blog.luckly-mjw.cn/tool-show/baidu-statistics/index.html)
> 鉴于只有初次创建 access_token 的过程才会到浏览器，且后续情况 redirect_uri 都是无意义的。故首次获取 access_token 的过程是不可复用，只需一次的。笔者将该步骤封装成工具，供获取 access_token 使用。
使用方式
- 将工具链接```http://blog.luckly-mjw.cn/tool-show/baidu-statistics/index.html```填入「安全设置」中。redirect_uri 只用于回调，无域名限制，无安全风险。

  ![](http://upyun.luckly-mjw.cn/Assets/baidu-statistics/007.png)
- 填入「API Key」「Secret Key」，仅用于后续将 code 换取为 access_token。只保存在 localStorage，获取成功后清除。不经过接口，不会上传到云端。可查阅源码验证，无安全风险。
- 点击按钮，即可完成 access_token 获取，将获取后的 「access_token」 与 「refresh_token」保存至服务器。即可永久刷新，正常调用接口。

  ![](http://upyun.luckly-mjw.cn/Assets/baidu-statistics/005.png)

## [项目地址](https://github.com/Momo707577045/baidu-tongji-statistics)

## 本地部署生成器
- 若不放心工具的使用，可下载 node 后端脚本，启动服务器完成该过程
- 【第零步】[下载脚本](http://upyun.luckly-mjw.cn/Assets/baidu-statistics/index.js)，并填入「API Key」「Secret Key」
- 【第一步】执行```node index.js```，启动脚本
- 【第二步】将本地 URL ```http://127.0.0.1:10005/```填入「安全设置」中
  ![](http://upyun.luckly-mjw.cn/Assets/baidu-statistics/012.png)

- 【第三步】在浏览器中方式```http://127.0.0.1:10005/getCode```，即可获取 access_token
  ![](http://upyun.luckly-mjw.cn/Assets/baidu-statistics/011.png)
  ![](http://upyun.luckly-mjw.cn/Assets/baidu-statistics/010.png)

## [接口调试官方地址](https://tongji.baidu.com/api/debug/#)
- access_token 获取成功后，可通过该工具，测试 access_token 的有效性，并验证接口调用结果。


## 完结撒花，感谢阅读。
![](http://upyun.luckly-mjw.cn/Assets/baidu-statistics/013.jpeg)










































































