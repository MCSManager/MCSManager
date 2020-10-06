/**
 *【使用前必读】
 * 这里是 MCSM 面板的重要细节配置文件，可以修改许多核心功能与细节功能；
 * 比如，终端实时刷新时间间隔，端口监听，日志缓存，等等。
 * 若您不理解某些配置的意思，请切勿随意改动，以下默认配置均为测试后的最佳配置，
 * 但是若您熟悉这些细节，您可以修改绝大部分设置，需要重启面板生效。
 *
 *
 *【无计算机语言基础者请阅读】
 * 文本值，双引号之间是文本描述（字符串），类似于 "UTF-8" ，"Hello" 等等；
 * 真假值, true 代表准许 false 代表禁止；
 * 数字值，直接书写即可,无需双引号，列如 1,2,3,5.565,20000,5555 等；
 * 注释，纯属用来看的，毫无作用 // 代表单行注释；
 *
 * 请放心，这不是要你书写计算机语言，而是进行十分简单的编辑；
 * 当然你可以选择不改动此文件。
 *
 *
 * 项目尽可能在 UTF8 编码环境中运行。
 *
 *
 * 【配置开始，谨慎修改】
 */

//HTTP 服务监听端口
MCSERVER.localProperty.http_port = 23333;

//HTTP 服务监听ip, 默认 0.0.0.0 | 可不填
MCSERVER.localProperty.http_ip = "";

//是否开启 FTP 服务
//此功能默认为关闭，不建议开启，目前FTP在大量用户使用时可能会出现问题
//使用在线文件管理可以代替此功能
//如必须使用，请使用主流FTP客户端连接，并防火墙开启20010~20200端口。
MCSERVER.localProperty.ftp_is_allow = false;

//FTP 服务监听端口
MCSERVER.localProperty.ftp_port = 10022;

//FTP 服务监听ip, 默认 0.0.0.0 | 可不填
MCSERVER.localProperty.ftp_ip = "";

//FTP 被动模式端口范围
//你可能需要对你的服务器防火墙进行设置, 开放这个端口段来确保 FTP 传输数据的正常工作
//开始范围
MCSERVER.localProperty.ftp_start_port = 20010;
//结束范围
MCSERVER.localProperty.ftp_end_port = 20200;

//控制台实时刷新频率 单位毫秒 默认 1000 毫秒
//建议在 1000 毫秒 与 3000 毫秒之选择
MCSERVER.localProperty.console_send_times = 1000;

//控制台一次性发送的数据最大限制
//数据最大限制 单位KB | 默认 28 KB
MCSERVER.localProperty.console_max_out = 28;

//是否开启 gzip 静态文件压缩，但是如果你使用反向代理或某 HTTP 服务自带的gzip，请关闭它
MCSERVER.localProperty.is_gzip = true;

//是否准许跨域请求，如果准许，将失去一部分安全性，但是你二次开发可能需要
MCSERVER.localProperty.is_allow_csrf = false;

//登录页面 URL，我们有两个登录页面，你可以选择其一，或自己选择
//我们设计了 3 个不同的登录界面供你选择
// /public/login/    /public/login2/    /public/login3/
MCSERVER.localProperty.login_url = "/public/login/";

//日志文件记录的最大大小。默认是 1MB
//大小越大，储存的日志内容越多，但是对服务器硬盘要求也会略微变大。
//单位 MB | 推荐 1~5 MB 之间
MCSERVER.localProperty.terminalQueue_max_size = 1;

//控制数据中心 数据刷新频率 单位毫秒
//默认 2000 毫秒
MCSERVER.localProperty.data_center_times = 2000;

//是否准许本控制面板使用自定义参数 | 默认准许使用
//注意! 此功能既可以让你的控制面板尝试更多姿势 (包括 WebShell)
//注意! 也会让其他别有用心的管理员 (只有管理员有权使用)，入侵你的宿主机
MCSERVER.localProperty.customize_commande = true;

//Session Cookie 与 Login 管理器最大时间
//意味着,第一次登录之后,这段时间内是可以不需要输入密码就可以登录的。
//超过这段时间后,访问需要重新登录
//单位 分钟 | 默认 240 分钟
MCSERVER.localProperty.session_max_age = 240;

//每个服务器拥有的最大计划任务数量
//默认 10 个
MCSERVER.localProperty.schedule_max = 10;

//所有用户总数，最高解压缩任务上限
//默认最大同时解压1个压缩文件，多余的会排队进行
MCSERVER.localProperty.max_eac_task_limit = 1;

//是否禁止 /api/* 公开接口获取 | 默认不禁止
//这不利于你二次开发，对接或使用，但是会更加的安全
MCSERVER.localProperty.allow_status_api = false;

/**
 *【配置结束，重启面板生效】
 * 若重启面板报错，说明您修改格式有误，请备份并删除此文件，面板会重新生成新文件。
 */
