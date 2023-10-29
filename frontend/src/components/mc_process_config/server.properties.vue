<script setup lang="ts">
import { t } from "@/lang/i18n";
import LineOption from "@/components/LineOption.vue";
import { getDescriptionByTitle } from "@/tools/common";

const props = defineProps<{
  config: Object;
}>();

const description = {
  "require-resource-pack": t("是否需要资源包"),
  "enable-jmx-monitoring": t("是否启用 JMX 监视"),
  "sync-chunk-writes": t("是否启用同步区块写入"),
  "generator-settings": t("用于自定义超平坦世界的生成，不生成超平坦世界请留空"),
  "allow-nether": t("是否允许下界（包括地狱）"),
  "level-name": t("世界（地图）名称 不要使用中文"),
  "enable-query": t("是否允许使用 GameSpy4 协议的服务器监听器"),
  "allow-flight": t("是否允许玩家飞行（在任何游戏模式下）"),
  "server-port": t("服务器端口（若服务器有更高级的设置，此选项可能会失效）"),
  "level-type": t(
    "地图的生成类型（默认：default，超平坦：flat，放大的世界：amplified，巨型生物群系：largeBiomes）"
  ),
  "enable-rcon": t("是否允许远程访问服务器控制台（RCON）"),
  "force-gamemode": t("强制玩家加入时为默认游戏模式"),
  "level-seed": t("地图种子 默认留空"),
  "server-ip": t("服务器ip，若不绑定请留空"),
  "max-build-height": t("玩家在服务器放置方块的最高高度"),
  "spawn-npcs": t("是否生成村民"),
  "white-list": t("是否开启白名单"),
  "spawn-animals": t("是否生成动物"),
  "snooper-enabled": t("启用数据采集"),
  hardcore: t("极限模式（死后自动封禁）"),
  "texture-pack": t("材质包"),
  "online-mode": t("在线（正版）验证"),
  pvp: t("是否允许玩家互相攻击"),
  "enforce-secure-profile": t("如果开启，则没有 Mojang 签名公钥的玩家将无法连接到服务器。"),
  difficulty: t("游戏难度（peaceful, easy, normal,hard）"),
  "player-idle-timeout": t("允许的挂机时间，单位为分钟 超过限制后自动踢出服务器"),
  gamemode: t("游戏模式（survival，creative，adventure，spectator）"),
  "max-players": t("服务器最大玩家数限制"),
  "spawn-monsters": t("生成攻击型生物（怪物）"),
  "view-distance": t("服务器发送给客户端的数据量，决定玩家能设置的视野"),
  "generate-structures": t("生成世界时生成结构（如村庄）禁止后地牢和地下要塞仍然生成"),
  motd: t("服务器信息展示 若使用 ColorMotd 等插件可留空该选项"),
  "op-permission-level": t("OP 权限等级 (1-4)"),
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
    "通过将该值进行 2x+1 的运算来决定出生点的保护半径，设置为0将只保护出生点下方那一个方块。"
  ),
  "max-chained-neighbor-updates": t("在跳过其他更新之前限制连续临近更新的数量。负值移除限制。"),
  "enable-status": t(
    "使服务器在服务器列表中显示为在线。如果设置为否，它将抑制来自客户端的回复。这意味着它将显示为脱机，但仍将接受连接。"
  ),
  "resource-pack-prompt": t(
    "可选，添加一个自定义消息，当使用require-resource-pack时，将显示在资源包提示窗口上。"
  ),
  "hide-online-players": t("是否隐藏在线人数"),
  "entity-broadcast-range-percentage": t("控制客户端最远可见实体距离，可以适当优化缩小距离。"),
  "simulation-distance": t(
    "设置生物实体与玩家之间的最大距离，以便服务器更新，以玩家每个方向的块为单位(半径)。如果实体在这个半径之外，那么它们将不会被服务器发送，也不会被玩家看到。"
  ),
  "rate-limit": t("当玩家客户端发送多少数据包总量时会被踢出，0代表关闭"),
  "previews-chat": t(
    "如果设置为是，将启用聊天预览。如果启用，服务器禁止用户使用vpn或代理；如果禁用，服务器不阻止用户使用vpn或代理。"
  ),
  "text-filtering-config": t("文本过滤规则配置文件（可能工作不正常）")
};
</script>

<template>
  <a-col :span="24">
    <CardPanel style="height: 100%">
      <template #body>
        <a-typography>
          <a-typography-title :level="5">{{ t("关于配置兼容与翻译") }}</a-typography-title>
          <a-typography-paragraph>
            {{
              t(
                "此界面由开源社区开发者开发与翻译，若翻译发现错误可前往开源社区进行反馈。配置文件部分设置因版本和服务端类型不同会有些许变化，某些配置文件子元素过于复杂，可能会导致配置项值无法正常显示，如遇到不正常的配置项值切勿进行修改。若对配置文件要进行更为详细的配置，建议前往文件在线管理功能进行文件编辑。"
              )
            }}
          </a-typography-paragraph>
        </a-typography>
        <a-typography>
          <a-typography-title :level="5">{{ t("关于配置文件") }}</a-typography-title>
          <a-typography-paragraph>
            {{
              t(
                "此配置文件为 Minecraft 服务端的 EULA（最终用户许可协议），您必须同意此协议才可以正常运行服务端软件，如果您发现此设置并不是“是”状态，那么请立即修改。"
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
