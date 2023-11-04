import { t } from "@/lang/i18n";

export const configData: {
  [key: string]: {
    desc: string;
    config: object;
  };
} = {
  "bungeecord/config.yml": {
    desc: t(
      "此配置适用于 BungeeCord 群组服务端软件，但由于此配置文件略微有些复杂，大部分配置只能进行简单修改，建议您使用文件在线管理功能编辑此文件。"
    ),
    config: {
      prevent_proxy_connections: t(
        "是否向 Mojang 发送玩家 IP 数据以阻止使用了代理的玩家进入服务器"
      ),
      listeners: [
        {
          query_port: t("UDP查询端口"),
          motd: t(
            "当仅有一个默认服务器时，服务器将会显示给玩家的 Motd。当 ping_passthrough 被开启时，此项无效"
          ),
          tab_list: t("连接到服务器的玩家的 TAB 列表所显示的内容格式"),
          query_enabled: t("是否开启 UDP 查询"),
          proxy_protocol: t("是否开启对 HAProxy 的支持"),
          forced_hosts: t("端口转发设置"),
          ping_passthrough: t("是否开启 ping 穿透"),
          priorities: t("优先级设置"),
          bind_local_address: t("是否显示 BungeeCord 正在监听的 IP 地址"),
          host: t("监听的 IP 地址和端口"),
          max_players: t(
            "玩家客户端将会显示的最大玩家数，默认值为 1。此项只作为装饰，并未真实的最大玩家数设置"
          ),
          tab_size: t("显示在 TAB 列表上的最大玩家数量"),
          force_default_server: t("每次玩家进入服务器时，是否强制将玩家传送到默认服务器中")
        }
      ],
      remote_ping_cache: t(
        "BungeeCord 应在多长时间内以毫秒为单位使用服务器Ping的缓存结果而不是手动Ping它们以获取玩家数量，输入 -1 禁用"
      ),
      network_compression_threshold: "",
      permissions: {
        default: t("默认用户组权限"),
        admin: t("管理员用户组权限")
      },
      log_pings: t("是否在控制台记录玩家客户端向 BungeeCord 发起 ping 请求的记录"),
      connection_throttle: t("断开时间"),
      connection_throttle_limit: t("断开次数"),
      server_connect_timeout: t("连接超时时间"),
      timeout: t("超时时间"),
      player_limit: t("整个 BungeeCord 实例能够接受的最大玩家数量，默认值为 -1，即不限数量"),
      ip_forward: t("是否启用 IP 追踪"),
      groups: t("权限组设置"),
      remote_ping_timeout: t(
        "BungeeCord 将在多长时间内以毫秒为单位尝试对服务器进行Ping以获取玩家数量，然后取消连接"
      ),
      log_commands: t("是否在控制台记录玩家输入的指令（仅记录 BungeeCord 指令）"),
      stats: t("用于统计目的，请不要更改或删除"),
      online_mode: t("正版验证"),
      forge_support: t("是否启用对 Forge 的支持"),
      disabled_commands: t("禁用的指令"),
      servers: t("下游服务端设置，只有在此处设置过的下游服务器才可被连接")
    }
  }
};
