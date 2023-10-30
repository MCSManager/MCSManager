<script setup lang="ts">
import { t } from "@/lang/i18n";
import LineOption from "@/components/LineOption.vue";
import { getDescriptionByTitle } from "@/tools/common";

const props = defineProps<{
  config: Object;
}>();

const description = {
  "server-name": t("服务器名称"),
  "allow-cheats": t("是否允许使用类似命令的作弊手段"),
  "server-portv6": t("服务器端口（IPv6）"),
  "tick-distance": t("停止加载区块的距离（允许值：4，12）"),
  "max-threads": t("服务端使用的最大线程数（0则不限制）"),
  "default-player-permission-level": t(
    "默认玩家权限等级（游客: visitor | 会员: member | 管理员: operator"
  ),
  "texturepack-required": t("强制客户端加载服务端资源包"),
  "content-log-file-enabled": t("是否将错误内容记录到日志文件中"),
  "compression-threshold": t("要压缩的原始网络有效负载的最小大小"),
  "server-authoritative-movement": t("是否启用服务端权威性移动"),
  "player-movement-score-threshold": t("报告异常行为之前所需的数据不一致的数量"),
  "enable-lan-visibility": t("开启局域网可见"),
  "compression-algorithm": t("压缩算法"),
  "player-movement-action-direction-threshold": t("玩家运动方向阈值"),
  "chat-restriction": t("聊天限制"),
  "disable-player-interaction": t("禁用玩家互动"),
  "client-side-chunk-generation-enabled": t("启用客户端块生成"),
  "player-movement-distance-threshold": t("在检测到异常行为之前，服务端与客户端数值之差"),
  "player-movement-duration-threshold-in-ms": t(
    "服务端和客户端位置的时间长度可能不同步 (在 server-authoritative-movement 选项为 false 时失效)"
  ),
  "correct-player-movement": t("是否在移动值超过阈值时，将客户端的玩家位置校正为服务端玩家的位置"),
  "server-authoritative-block-breaking": t("是否启用服务端权威性挖掘"),
  "generator-settings": t("用于自定义超平坦世界的生成，不生成超平坦世界请留空"),
  "allow-nether": t("是否允许下界（包括地狱）"),
  "level-name": t("世界（地图）名称 不要使用中文"),
  "enable-query": t("是否允许使用 GameSpy4 协议的服务器监听器"),
  "allow-flight": t("是否允许玩家飞行（在任何游戏模式下）"),
  "server-port": t("服务器端口"),
  "level-type": t("地图的生成类型（默认：default，超平坦：flat）"),
  "enable-rcon": t("是否允许远程访问服务器控制台（RCON）"),
  "force-gamemode": t("强制玩家加入时为默认游戏模式"),
  "level-seed": t("地图种子 默认留空"),
  "server-ip": t("服务器 IP，若不绑定请留空"),
  "max-build-height": t("玩家在服务器放置方块的最高高度"),
  "spawn-npcs": t("是否生成村民"),
  "white-list": t("是否开启白名单（旧版）"),
  "allow-list": t("是否开启白名单（新版）"),
  "spawn-animals": t("是否生成动物"),
  "snooper-enabled": t("启用数据采集"),
  hardcore: t("极限模式（死后自动封禁）"),
  "texture-pack": t("材质包"),
  "online-mode": t("在线正版验证"),
  pvp: t("是否允许玩家互相攻击"),
  difficulty: t("游戏难度（peaceful, easy, normal,hard）"),
  "player-idle-timeout": t("允许的挂机时间，单位为分钟 超过限制后自动踢出服务器"),
  gamemode: t("游戏模式（survival，creative，adventure，spectator）"),
  "max-players": t("服务器最大玩家数限制"),
  "spawn-monsters": t("生成攻击型生物（怪物）"),
  "view-distance": t("服务器发送给客户端的数据量，决定玩家能设置的视野"),
  "generate-structures": t("生成世界时生成结构（如村庄）禁止后地牢和地下要塞仍然生成"),
  motd: t("服务器信息展示 若使用 ColorMotd 等插件可留空该选项"),
  "op-permission-level": t("OP权限等级 (1-4)"),
  "announce-player-achievements": t("玩家获得成就时，是否在服务器聊天栏显示（是否允许其装X）"),
  "network-compression-threshold": t("网络压缩阈值"),
  "resource-pack-sha1": t("资源包的 SHA-1 值，必须为小写十六进制，不是必填选项"),
  "enable-command-block": t("启用命令方块"),
  "resource-pack": t("统一资源标识符 (URI) 指向一个资源包。玩家可选择是否使用"),
  "max-world-size": t("最大世界大小"),
  "function-permission-level": t("设定函数的默认权限等级"),
  "max-tick-time": t("设置每个 Tick 花费的最大毫秒数"),
  "prevent-proxy-connections": t("是否允许玩家使用网络代理进入服务器"),
  "rcon.port": t("设置 RCON 远程访问的端口号"),
  "rcon.password": t("设置 RCON 远程访问的密码（参见 enable-rcon）"),
  "query.port": t("设置监听服务器的端口号（参见 enable-rcon）"),
  "use-native-transport": t("是否使用针对 Linux 平台的数据包收发优化 [ 仅 Linux ]"),
  debug: t("调试模式"),
  "broadcast-rcon-to-ops": t("向 OP 广播 RCON 信息"),
  "broadcast-console-to-ops": t("向 OP 广播服务器控制台信息"),
  "enforce-whitelist": t("在服务器上强制使用白名单"),
  "spawn-protection": t(
    "通过将该值进行 2x+1 的运算来决定出生点的保护半径，设置为0将只保护出生点下方那一个方块"
  ),
  "block-network-ids-are-hashes": t(
    "服务器将发送经过哈希处理的块网络 ID，而不是从 0 开始递增的 ID"
  ),
  "disable-custom-skins": t("禁用玩家在 Minecraft 商店之外或游戏内资源之外定制的皮肤"),
  "server-build-radius-ratio": t(
    '如果设置为 "Disabled"，服务器将动态计算生成玩家的视野，并将其余部分分配给客户端进行构建。仅在启用 client-side-chunk-generation-enabled 时有效。'
  )
};
</script>

<template>
  <a-col :span="24">
    <CardPanel style="height: 100%">
      <template #body>
        <a-typography>
          <a-typography-title :level="5">{{ t("关于配置文件") }}</a-typography-title>
          <a-typography-paragraph>
            {{
              t(
                "此配置文件为基岩版专用服务器主要配置文件，基岩版服务器绝大部分配置都在此配置文件进行设置，例如服务器端口，人数，视距和限制参数等。"
              )
            }}
          </a-typography-paragraph>
        </a-typography>
      </template>
    </CardPanel>
  </a-col>

  <a-col :span="24">
    <CardPanel style="height: 100%">
      <template #body>
        <!-- 根据一层 Map 对象遍历所有选项 -->
        <div v-for="(item, index) in config" :key="index">
          <!-- 选项标题与选项传值,组件会自动判断其值类型采用不同组件  -->
          <LineOption :option-value="config" :option-key="index">
            <!-- 选项标题 -->
            <template #title>{{ index }}</template>
            <!-- 选项中文解释 -->
            <template #info>{{ getDescriptionByTitle(description, index) }}</template>
          </LineOption>
        </div>
      </template>
    </CardPanel>
  </a-col>
</template>
