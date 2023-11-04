import { t } from "@/lang/i18n";

export const configData: {
  [key: string]: {
    desc: string;
    config: object;
  };
} = {
  "common/server.properties": {
    desc: t(
      "此配置文件为 Bukkit 类或其他衍生类服务端常见的配置文件，包含了绝大部分的服务端设置，例如服务器端口，最大人数，玩家视距和正版验证等。"
    ),
    config: {
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
    }
  },
  "common/eula.txt": {
    desc: t(
      "此配置文件为 Minecraft 服务端的 EULA（最终用户许可协议），您必须同意此协议才可以正常运行服务端软件，如果您发现此设置并不是“是”状态，那么请立即修改。"
    ),
    config: {
      eula: t("是否同意 Minecraft EULA协议，如果您要启动 Minecraft 服务器，则此选项是必须开启")
    }
  },
  "bukkit/bukkit.yml": {
    desc: t(
      "此配置文件为 Bukkit 类或其他衍生类服务端常见的配置文件，一般情况下，此配置文件无需过多修改，您可以根据翻译进行适当调节，但如果使用 Bukkit 衍生类服务端软件，可能这个配置文件将是无效的。"
    ),
    config: {
      settings: {
        "allow-end": t("是否开启末地"),
        "warn-on-overload": t("服务器过载警告"),
        "permissions-file": t("自定义权限文件的名字"),
        "update-folder": t(
          "插件更新文件夹，放进新版本插件的文件夹名字，这个文件夹会在服务器重新启动时自动更新插件"
        ),
        "plugin-profiling": t("允许使用命令 /timings。用于测量插件为事件所花费的时间"),
        "connection-throttle": t("客户端在最近一次连接尝试后，在允许再次连接之前的间隔"),
        "query-plugins": t("在 MCSM 内置控制台查询时，服务器是否返回插件列表"),
        "deprecated-verbose": t("当插件注册已弃用事件时，服务器是否显示警告"),
        "shutdown-message": t("服务器关闭后游戏客户端提示的信息"),
        "minimum-api": t("防止加载具有不兼容 API 的插件"),
        "use-map-color-cache": t("使用缓存来存储地图颜色")
      },
      "spawn-limits": {
        monsters: t("每个世界可以产生的怪物数量"),
        animals: t("每个世界可以产生的动物数量"),
        "water-animals": t("每个世界可以产生的水生动物的数量"),
        "water-ambient": "",
        ambient: t("可以按世界生成的周围生物（又名蝙蝠）的数量")
      },
      "chunk-gc": {
        "period-in-ticks": t("每个大区块垃圾回收之间的 Tick")
      },
      "ticks-per": {
        "animal-spawns": t(
          "每 Tick 尝试生成一次动物，值为 400 表示服务器将尝试在每 400 Ticks 尝试生成一次动物，值小于 0 将重置为 Minecraft 的默认值"
        ),
        "monster-spawns": t("每 Tick 尝试生成一次怪物，同上"),
        autosave: t(
          "自动保存，值 6000 表示服务器将尝试每 5 分钟自动保存一次世界。注: 过小可能会导致服务器卡顿"
        ),
        "water-spawns": "",
        "water-ambient-spawns": "",
        "ambient-spawns": ""
      },
      aliases: t("简化指令文件")
    }
  },
  "bds/server.properties": {
    desc: t(
      "此配置文件为基岩版专用服务器主要配置文件，基岩版服务器绝大部分配置都在此配置文件进行设置，例如服务器端口，人数，视距和限制参数等。"
    ),
    config: {
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
      "correct-player-movement": t(
        "是否在移动值超过阈值时，将客户端的玩家位置校正为服务端玩家的位置"
      ),
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
    }
  },
  "bukkit/spigot.yml": {
    desc: t("此配置文件为 Spigot 类或其他衍生类服务端常见的配置文件"),
    config: {
      settings: {
        debug: t("是否启用调试模式"),
        "user-cache-size": t("用户缓存大小"),
        "player-shuffle": t("玩家洗牌"),
        "netty-threads": t("Netty线程数"),
        "log-villager-deaths": t("记录村民死亡事件到日志"),
        "log-named-deaths": t("记录具名实体死亡事件到日志"),
        attribute: {
          maxHealth: {
            max: t("最大生命值")
          },
          movementSpeed: {
            max: t("最大移动速度")
          },
          attackDamage: {
            max: t("最大攻击伤害")
          }
        },
        "save-user-cache-on-stop-only": t("仅在服务器停止时保存用户缓存"),
        "moved-too-quickly-multiplier": t("过快移动的倍数"),
        "moved-wrongly-threshold": t("错误移动的阈值"),
        "sample-count": t("样本数量"),
        bungeecord: t("是否启用BungeeCord支持"),
        "timeout-time": t("超时时间"),
        "restart-on-crash": t("服务器崩溃时是否自动重启"),
        "restart-script": t("重启脚本路径")
      },
      messages: {
        whitelist: t("您未被加入白名单！"),
        "unknown-command": t('未知命令。输入 "/help" 获取帮助。'),
        "server-full": t("服务器已满！"),
        "outdated-client": t("客户端过旧！请使用 {0}"),
        "outdated-server": t("服务器过旧！当前版本为 {0}"),
        restart: t("服务器正在重新启动")
      },
      advancements: {
        "disable-saving": t("是否禁用进度保存")
      },
      commands: {
        log: t("是否记录命令到日志"),
        "tab-complete": t("选项卡完成"),
        "send-namespaced": t("是否发送命名空间命令"),
        "silent-commandblock-console": t("是否静默命令方块控制台")
      },
      players: {
        "disable-saving": t("是否禁用玩家数据保存")
      },
      "world-settings": {
        default: {
          "below-zero-generation-in-existing-chunks": t("在现有区块中生成零以下的地形"),
          "end-portal-sound-radius": t("末地传送门音效半径"),
          "wither-spawn-sound-radius": t("凋零生成音效半径"),
          "zombie-aggressive-towards-villager": t("僵尸对村民敌对"),
          "hanging-tick-frequency": t("悬挂方块更新频率"),
          "enable-zombie-pigmen-portal-spawns": t("是否启用僵尸猪灵的传送门生成"),
          "dragon-death-sound-radius": t("末影龙死亡音效半径"),
          "merge-radius": {
            item: t("物品合并半径"),
            exp: t("经验球合并半径")
          },
          "nerf-spawner-mobs": t("减弱刷怪笼生成的生物"),
          "simulation-distance": t("模拟距离"),
          "mob-spawn-range": t("生物生成范围"),
          "view-distance": t("视距"),
          "item-despawn-rate": t("物品消失速度"),
          "arrow-despawn-rate": t("箭消失速度"),
          "trident-despawn-rate": t("三叉戟消失速度"),
          "thunder-chance": t("雷击概率"),
          growth: {
            "cactus-modifier": t("仙人掌生长速度"),
            "cane-modifier": t("甘蔗生长速度"),
            "melon-modifier": t("西瓜生长速度"),
            "mushroom-modifier": t("蘑菇生长速度"),
            "pumpkin-modifier": t("南瓜生长速度"),
            "sapling-modifier": t("树苗生长速度"),
            "beetroot-modifier": t("甜菜根生长速度"),
            "carrot-modifier": t("胡萝卜生长速度"),
            "potato-modifier": t("土豆生长速度"),
            "torchflower-modifier": t("火把花生长速度"),
            "wheat-modifier": t("小麦生长速度"),
            "netherwart-modifier": t("地狱疣生长速度"),
            "vine-modifier": t("藤蔓生长速度"),
            "cocoa-modifier": t("可可豆生长速度"),
            "bamboo-modifier": t("竹子生长速度"),
            "sweetberry-modifier": t("甜浆果生长速度"),
            "kelp-modifier": t("海带生长速度"),
            "twistingvines-modifier": t("扭曲藤蔓生长速度"),
            "weepingvines-modifier": t("哭泣藤蔓生长速度"),
            "cavevines-modifier": t("洞穴藤蔓生长速度"),
            "glowberry-modifier": t("发光浆果生长速度"),
            "pitcherplant-modifier": t("捕虫草生长速度")
          },
          "ticks-per": {
            "hopper-transfer": t("漏斗传输刻度"),
            "hopper-check": t("漏斗检查刻度")
          },
          "hopper-amount": t("漏斗数量"),
          "hopper-can-load-chunks": t("漏斗是否可加载区块"),
          "entity-tracking-range": {
            players: t("玩家追踪范围"),
            animals: t("动物追踪范围"),
            monsters: t("怪物追踪范围"),
            misc: t("其他实体追踪范围"),
            display: t("显示实体追踪范围"),
            other: t("其他追踪范围")
          },
          "entity-activation-range": {
            animals: t("动物激活范围"),
            monsters: t("怪物激活范围"),
            raiders: t("袭击者激活范围"),
            misc: t("其他实体激活范围"),
            water: t("水中实体激活范围"),
            villagers: t("村民激活范围"),
            "flying-monsters": t("飞行怪物激活范围"),
            "wake-up-inactive": {
              "animals-max-per-tick": t("每tick唤醒的动物数量上限"),
              "animals-every": t("每隔多少ticks唤醒一次动物"),
              "animals-for": t("唤醒动物的持续ticks"),
              "monsters-max-per-tick": t("每tick唤醒的怪物数量上限"),
              "monsters-every": t("每隔多少ticks唤醒一次怪物"),
              "monsters-for": t("唤醒怪物的持续ticks"),
              "villagers-max-per-tick": t("每tick唤醒的村民数量上限"),
              "villagers-every": t("每隔多少ticks唤醒一次村民"),
              "villagers-for": t("唤醒村民的持续ticks"),
              "flying-monsters-max-per-tick": t("每tick唤醒的飞行怪物数量上限"),
              "flying-monsters-every": t("每隔多少ticks唤醒一次飞行怪物"),
              "flying-monsters-for": t("唤醒飞行怪物的持续ticks")
            },
            "villagers-work-immunity-after": t("村民在工作后免疫时间"),
            "villagers-work-immunity-for": t("村民免疫时间的持续ticks"),
            "villagers-active-for-panic": t("村民激活时间以触发惊恐"),
            "tick-inactive-villagers": t("是否tick非激活的村民"),
            "ignore-spectators": t("忽略观众实体")
          },
          "seed-village": t("村庄种子"),
          "seed-desert": t("沙漠种子"),
          "seed-igloo": t("冰屋种子"),
          "seed-jungle": t("丛林种子"),
          "seed-swamp": t("沼泽种子"),
          "seed-monument": t("海底神殿种子"),
          "seed-shipwreck": t("沉船种子"),
          "seed-ocean": t("海洋种子"),
          "seed-outpost": t("哨站种子"),
          "seed-endcity": t("末地城种子"),
          "seed-slime": t("史莱姆块种子"),
          "seed-nether": t("下界种子"),
          "seed-mansion": t("森林府邸种子"),
          "seed-fossil": t("化石种子"),
          "seed-portal": t("传送门种子"),
          "seed-ancientcity": t("古代城市种子"),
          "seed-trailruins": t("痕迹废墟种子"),
          "seed-buriedtreasure": t("埋藏宝藏种子"),
          "seed-mineshaft": t("地牢种子"),
          "seed-stronghold": t("要塞种子"),
          "max-tnt-per-tick": t("每tick的TNT数量上限"),
          hunger: {
            "jump-walk-exhaustion": t("跳跃和行走的饥饿值耗尽"),
            "jump-sprint-exhaustion": t("跳跃和奔跑的饥饿值耗尽"),
            "combat-exhaustion": t("战斗的饥饿值耗尽"),
            "regen-exhaustion": t("恢复的饥饿值耗尽"),
            "swim-multiplier": t("游泳的饥饿值耗尽倍数"),
            "sprint-multiplier": t("冲刺的饥饿值耗尽倍数"),
            "other-multiplier": t("其他活动的饥饿值耗尽倍数")
          },
          "max-tick-time": {
            tile: t("方块处理的最大ticks"),
            entity: t("实体处理的最大ticks")
          },
          verbose: t("是否启用详细输出")
        }
      },
      "config-version": t("配置版本"),
      stats: {
        "disable-saving": t("是否禁用统计数据保存"),
        "forced-stats": t("强制统计数据")
      }
    }
  },

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
  },
  "paper/paper.yml": {
    desc: t(
      "此配置文件为 paper 类或其他衍生类服务端常见的配置文件，他拓展了 Spigot 配置文件上的不足之处。"
    ),
    config: {
      _version: t("配置文件版本，一般情况下不要修改，修改后可能影响服务器正常运行"),
      "block-updates": {
        "disable-chorus-plant-updates": t("禁用唱片植物更新"),
        "disable-mushroom-block-updates": t("禁用蘑菇方块更新"),
        "disable-noteblock-updates": t("禁用音符盒更新"),
        "disable-tripwire-updates": t("禁用绊线更新")
      },
      "chunk-loading-advanced": {
        "auto-config-send-distance": t("自动配置发送距离"),
        "player-max-concurrent-chunk-generates": t("玩家最大同时生成区块数"),
        "player-max-concurrent-chunk-loads": t("玩家最大同时加载区块数")
      },
      "chunk-loading-basic": {
        "player-max-chunk-generate-rate": t("玩家最大区块生成速率"),
        "player-max-chunk-load-rate": t("玩家最大区块加载速率"),
        "player-max-chunk-send-rate": t("玩家最大区块发送速率")
      },
      "chunk-system": {
        "gen-parallelism": t("生成并行度"),
        "io-threads": t("IO线程数"),
        "worker-threads": t("工作线程数")
      },
      collisions: {
        "enable-player-collisions": t("启用玩家碰撞"),
        "send-full-pos-for-hard-colliding-entities": t("对于硬碰撞实体发送完整位置信息")
      },
      commands: {
        "fix-target-selector-tag-completion": t("修复目标选择器标签补全"),
        "suggest-player-names-when-null-tab-completions": t("在Tab键补全为空时建议玩家名"),
        "time-command-affects-all-worlds": t("时间命令是否影响所有世界")
      },
      console: {
        "enable-brigadier-completions": t("启用Brigadier命令补全"),
        "enable-brigadier-highlighting": t("启用Brigadier语法高亮"),
        "has-all-permissions": t("是否拥有所有权限")
      },
      "item-validation": {
        book: {
          author: t("书籍作者ID"),
          page: t("书籍页数ID"),
          title: t("书籍标题ID")
        },
        "book-size": {
          "page-max": t("书籍最大页数"),
          "total-multiplier": t("书籍总体积乘数")
        },
        "display-name": t("物品显示名称ID"),
        "lore-line": t("物品描述行数ID"),
        "resolve-selectors-in-books": t("解析书籍中的选择器")
      },
      logging: {
        "deobfuscate-stacktraces": t("反混淆堆栈跟踪信息")
      },
      messages: {
        kick: {
          "authentication-servers-down": t("认证服务器不可用提示"),
          "connection-throttle": t("连接限速提示"),
          "flying-player": t("飞行玩家踢出提示"),
          "flying-vehicle": t("飞行载具踢出提示")
        },
        "no-permission": t("无权限执行命令提示"),
        "use-display-name-in-quit-message": t("退出消息中使用显示名称")
      },
      misc: {
        "chat-threads": {
          "chat-executor-core-size": t("聊天执行核心线程数"),
          "chat-executor-max-size": t("聊天执行最大线程数")
        },
        "compression-level": t("压缩等级"),
        "fix-entity-position-desync": t("修复实体位置不同步问题"),
        "load-permissions-yml-before-plugins": t("在插件之前加载permissions.yml"),
        "max-joins-per-tick": t("每tick最大连接数"),
        "region-file-cache-size": t("区块文件缓存大小"),
        "strict-advancement-dimension-check": t("严格检查维度的进度"),
        "use-alternative-luck-formula": t("使用替代的Luck计算公式"),
        "use-dimension-type-for-custom-spawners": t("自定义刷怪笼是否使用维度类型")
      },
      "packet-limiter": {
        "all-packets": {
          action: t("所有数据包处理方式"),
          interval: t("数据包处理时间间隔"),
          "max-packet-rate": t("最大数据包处理速率")
        },
        "kick-message": t("超出数据包处理速率的踢出消息"),
        overrides: {
          ServerboundPlaceRecipePacket: {
            action: t("PlaceRecipePacket数据包处理方式"),
            interval: t("PlaceRecipePacket数据包处理时间间隔"),
            "max-packet-rate": t("PlaceRecipePacket最大数据包处理速率")
          }
        }
      },
      "player-auto-save": {
        "max-per-tick": t("每tick最大玩家自动保存数"),
        rate: t("玩家自动保存速率")
      },
      proxies: {
        "bungee-cord": {
          "online-mode": t("BungeeCord是否启用在线模式")
        },
        "proxy-protocol": t("是否启用代理协议"),
        velocity: {
          enabled: t("Velocity是否启用"),
          "online-mode": t("Velocity是否启用在线模式"),
          secret: t("Velocity代理密钥")
        }
      },
      scoreboards: {
        "save-empty-scoreboard-teams": t("保存空记分板队伍"),
        "track-plugin-scoreboards": t("跟踪插件记分板")
      },
      "spam-limiter": {
        "incoming-packet-threshold": t("入站数据包阈值"),
        "recipe-spam-increment": t("合成表滥用增量"),
        "recipe-spam-limit": t("合成表滥用上限"),
        "tab-spam-increment": t("Tab键滥用增量"),
        "tab-spam-limit": t("Tab键滥用上限")
      },
      timings: {
        enabled: t("是否启用Timings"),
        "hidden-config-entries": t("隐藏的配置项"),
        "history-interval": t("历史记录间隔"),
        "history-length": t("历史记录长度"),
        "server-name": t("服务器名称"),
        "server-name-privacy": t("服务器名称隐私设置"),
        url: t("Timings报告URL"),
        verbose: t("Timings详细输出")
      },
      "unsupported-settings": {
        "allow-grindstone-overstacking": t("允许磨砂机超出堆叠上限"),
        "allow-headless-pistons": t("允许无头活塞"),
        "allow-permanent-block-break-exploits": t("允许永久方块破坏漏洞"),
        "allow-piston-duplication": t("允许活塞复制"),
        "compression-format": t("压缩格式"),
        "perform-username-validation": t("执行用户名验证")
      },
      watchdog: {
        "early-warning-delay": t("预警延迟"),
        "early-warning-every": t("每隔多少时间发出一次预警")
      }
    }
  },
  "paper/paper-global.yml": {
    desc: t(
      "此配置文件为 paper 类或其他衍生类服务端常见的配置文件，他拓展了 spigot 配置文件上的不足之处。"
    ),
    config: {
      _version: t("配置文件版本，一般情况下不要修改，修改后可能影响服务器正常运行"),
      "block-updates": {
        "disable-chorus-plant-updates": t("禁用唱片植物更新"),
        "disable-mushroom-block-updates": t("禁用蘑菇方块更新"),
        "disable-noteblock-updates": t("禁用音符盒更新"),
        "disable-tripwire-updates": t("禁用绊线更新")
      },
      "chunk-loading-advanced": {
        "auto-config-send-distance": t("自动配置发送距离"),
        "player-max-concurrent-chunk-generates": t("玩家最大同时生成区块数"),
        "player-max-concurrent-chunk-loads": t("玩家最大同时加载区块数")
      },
      "chunk-loading-basic": {
        "player-max-chunk-generate-rate": t("玩家最大区块生成速率"),
        "player-max-chunk-load-rate": t("玩家最大区块加载速率"),
        "player-max-chunk-send-rate": t("玩家最大区块发送速率")
      },
      "chunk-system": {
        "gen-parallelism": t("生成并行度"),
        "io-threads": t("IO线程数"),
        "worker-threads": t("工作线程数")
      },
      collisions: {
        "enable-player-collisions": t("启用玩家碰撞"),
        "send-full-pos-for-hard-colliding-entities": t("对于硬碰撞实体发送完整位置信息")
      },
      commands: {
        "fix-target-selector-tag-completion": t("修复目标选择器标签补全"),
        "suggest-player-names-when-null-tab-completions": t("在Tab键补全为空时建议玩家名"),
        "time-command-affects-all-worlds": t("时间命令是否影响所有世界")
      },
      console: {
        "enable-brigadier-completions": t("启用Brigadier命令补全"),
        "enable-brigadier-highlighting": t("启用Brigadier语法高亮"),
        "has-all-permissions": t("是否拥有所有权限")
      },
      "item-validation": {
        book: {
          author: t("书籍作者ID"),
          page: t("书籍页数ID"),
          title: t("书籍标题ID")
        },
        "book-size": {
          "page-max": t("书籍最大页数"),
          "total-multiplier": t("书籍总体积乘数")
        },
        "display-name": t("物品显示名称ID"),
        "lore-line": t("物品描述行数ID"),
        "resolve-selectors-in-books": t("解析书籍中的选择器")
      },
      logging: {
        "deobfuscate-stacktraces": t("反混淆堆栈跟踪信息")
      },
      messages: {
        kick: {
          "authentication-servers-down": t("认证服务器不可用提示"),
          "connection-throttle": t("连接限速提示"),
          "flying-player": t("飞行玩家踢出提示"),
          "flying-vehicle": t("飞行载具踢出提示")
        },
        "no-permission": t("无权限执行命令提示"),
        "use-display-name-in-quit-message": t("退出消息中使用显示名称")
      },
      misc: {
        "chat-threads": {
          "chat-executor-core-size": t("聊天执行核心线程数"),
          "chat-executor-max-size": t("聊天执行最大线程数")
        },
        "compression-level": t("压缩等级"),
        "fix-entity-position-desync": t("修复实体位置不同步问题"),
        "load-permissions-yml-before-plugins": t("在插件之前加载permissions.yml"),
        "max-joins-per-tick": t("每tick最大连接数"),
        "region-file-cache-size": t("区块文件缓存大小"),
        "strict-advancement-dimension-check": t("严格检查维度的进度"),
        "use-alternative-luck-formula": t("使用替代的Luck计算公式"),
        "use-dimension-type-for-custom-spawners": t("自定义刷怪笼是否使用维度类型")
      },
      "packet-limiter": {
        "all-packets": {
          action: t("所有数据包处理方式"),
          interval: t("数据包处理时间间隔"),
          "max-packet-rate": t("最大数据包处理速率")
        },
        "kick-message": t("超出数据包处理速率的踢出消息"),
        overrides: {
          ServerboundPlaceRecipePacket: {
            action: t("PlaceRecipePacket数据包处理方式"),
            interval: t("PlaceRecipePacket数据包处理时间间隔"),
            "max-packet-rate": t("PlaceRecipePacket最大数据包处理速率")
          }
        }
      },
      "player-auto-save": {
        "max-per-tick": t("每tick最大玩家自动保存数"),
        rate: t("玩家自动保存速率")
      },
      proxies: {
        "bungee-cord": {
          "online-mode": t("BungeeCord是否启用在线模式")
        },
        "proxy-protocol": t("是否启用代理协议"),
        velocity: {
          enabled: t("Velocity是否启用"),
          "online-mode": t("Velocity是否启用在线模式"),
          secret: t("Velocity代理密钥")
        }
      },
      scoreboards: {
        "save-empty-scoreboard-teams": t("保存空记分板队伍"),
        "track-plugin-scoreboards": t("跟踪插件记分板")
      },
      "spam-limiter": {
        "incoming-packet-threshold": t("入站数据包阈值"),
        "recipe-spam-increment": t("合成表滥用增量"),
        "recipe-spam-limit": t("合成表滥用上限"),
        "tab-spam-increment": t("Tab键滥用增量"),
        "tab-spam-limit": t("Tab键滥用上限")
      },
      timings: {
        enabled: t("是否启用Timings"),
        "hidden-config-entries": t("隐藏的配置项"),
        "history-interval": t("历史记录间隔"),
        "history-length": t("历史记录长度"),
        "server-name": t("服务器名称"),
        "server-name-privacy": t("服务器名称隐私设置"),
        url: t("Timings报告URL"),
        verbose: t("Timings详细输出")
      },
      "unsupported-settings": {
        "allow-grindstone-overstacking": t("允许磨砂机超出堆叠上限"),
        "allow-headless-pistons": t("允许无头活塞"),
        "allow-permanent-block-break-exploits": t("允许永久方块破坏漏洞"),
        "allow-piston-duplication": t("允许活塞复制"),
        "compression-format": t("压缩格式"),
        "perform-username-validation": t("执行用户名验证")
      },
      watchdog: {
        "early-warning-delay": t("预警延迟"),
        "early-warning-every": t("每隔多少时间发出一次预警")
      }
    }
  },
  "paper/paper-world-defaults.yml": {
    desc: t(
      "PaperSpigot 服务端软件全局配置文件，能够进一步的配置高级参数以及更具体化的游戏设置，对整体性能有极大的决定效果"
    ),
    config: {
      _version: t("配置文件版本，一般情况下不要修改，修改后可能影响服务器正常运行"),
      anticheat: {
        "anti-xray": {
          enabled: t("启用反透视功能"),
          "engine-mode": t("反透视引擎模式"),
          "hidden-blocks": t("反透视隐藏方块列表"),
          "lava-obscures": t("岩浆遮挡视线"),
          "max-block-height": t("最大方块高度"),
          "replacement-blocks": t("替换方块列表"),
          "update-radius": t("更新半径"),
          "use-permission": t("使用权限控制")
        },
        obfuscation: {
          items: {
            "hide-durability": t("隐藏耐久度"),
            "hide-itemmeta": t("隐藏物品元数据"),
            "hide-itemmeta-with-visual-effects": t("隐藏带视觉效果的物品元数据")
          }
        }
      },
      chunks: {
        "auto-save-interval": t("自动保存间隔"),
        "delay-chunk-unloads-by": t("延迟区块卸载时间"),
        "entity-per-chunk-save-limit": t("每区块实体保存数量限制"),
        "fixed-chunk-inhabited-time": t("固定区块居住时间"),
        "flush-regions-on-save": t("保存时刷新区域"),
        "max-auto-save-chunks-per-tick": t("每tick最大自动保存区块数"),
        "prevent-moving-into-unloaded-chunks": t("阻止移动到未加载的区块")
      },
      collisions: {
        "allow-player-cramming-damage": t("允许玩家拥挤伤害"),
        "allow-vehicle-collisions": t("允许载具碰撞"),
        "fix-climbing-bypassing-cramming-rule": t("修复攀爬规则绕过拥挤限制"),
        "max-entity-collisions": t("最大实体碰撞数"),
        "only-players-collide": t("仅玩家碰撞")
      },
      entities: {
        "armor-stands": {
          "do-collision-entity-lookups": t("盔甲架碰撞实体查找"),
          tick: t("盔甲架刻....（？我也不知道啥意思）")
        },
        behavior: {
          "allow-spider-world-border-climbing": t("允许蜘蛛越过世界边界"),
          "baby-zombie-movement-modifier": t("小僵尸移动修正"),
          "disable-chest-cat-detection": t("禁用箱子上的猫检测"),
          "disable-creeper-lingering-effect": t("禁用爬行者残留效果"),
          "disable-player-crits": t("禁用玩家暴击"),
          behavior: {
            "door-breaking-difficulty": {
              husk: t("尸壳在什么难度下会破门"),
              vindicator: t("恶魂在什么难度下会破门"),
              zombie: t("僵尸在什么难度下会破门"),
              zombie_villager: t("僵尸村民在什么难度下会破门"),
              zombified_piglin: t("僵尸化猪灵在什么难度下会破门")
            },
            "ender-dragons-death-always-places-dragon-egg": t("末影龙死亡总是生成龙蛋"),
            "experience-merge-max-value": t("经验合并最大值"),
            "mobs-can-always-pick-up-loot": {
              skeletons: t("骷髅"),
              zombies: t("僵尸")
            },
            "nerf-pigmen-from-nether-portals": t("通过下界传送门限制僵尸猪灵"),
            "parrots-are-unaffected-by-player-movement": t("鹦鹉不受玩家移动影响"),
            "phantoms-do-not-spawn-on-creative-players": t("创造模式玩家不受幻翼袭击"),
            "phantoms-only-attack-insomniacs": t("幻翼仅攻击失眠者"),
            "phantoms-spawn-attempt-max-seconds": t("幻翼产生最大秒数"),
            "phantoms-spawn-attempt-min-seconds": t("幻翼产生最小秒数"),
            "piglins-guard-chests": t("猪灵守卫箱子"),
            "pillager-patrols": {
              disable: t("是否禁用掠夺者"),
              "spawn-chance": t("生成几率"),
              "spawn-delay": {
                "per-player": t("生成延迟-每玩家"),
                ticks: t("生成延迟-刻")
              },
              start: {
                day: t("开始时间-天"),
                "per-player": t("开始-每玩家")
              }
            },
            "player-insomnia-start-ticks": t("玩家失眠开始刻数"),
            "should-remove-dragon": t("是否移除末影龙"),
            "spawner-nerfed-mobs-should-jump": t("受限制刷怪笼的生物是否跳跃"),
            "zombie-villager-infection-chance": t("僵尸村民感染几率"),
            "zombies-target-turtle-eggs": t("僵尸是否攻击海龟蛋"),
            entities: {
              "armor-stands": {
                "do-collision-entity-lookups": t("装甲架碰撞实体查询"),
                tick: t("刻")
              },
              behavior: {
                "allow-spider-world-border-climbing": t("允许蜘蛛越过世界边界攀爬"),
                "baby-zombie-movement-modifier": t("婴儿僵尸移动调整"),
                "disable-chest-cat-detection": t("禁用箱子猫检测"),
                "disable-creeper-lingering-effect": t("禁用爬行者持续效果"),
                "disable-player-crits": t("禁用玩家暴击")
              },
              "entities-target-with-follow-range": t("实体根据跟随范围选择目标"),
              markers: {
                tick: t("刻")
              },
              "mob-effects": {
                "immune-to-wither-effect": {
                  wither: t("凋零"),
                  "wither-skeleton": t("凋零骷髅")
                },
                "spiders-immune-to-poison-effect": t("蜘蛛免疫中毒效果"),
                "undead-immune-to-certain-effects": t("不死生物免疫特定效果")
              },
              sniffer: {
                "boosted-hatch-time": t("提升孵化时间"),
                "hatch-time": t("孵化时间")
              },
              spawning: {
                "all-chunks-are-slime-chunks": t("所有区块都是史莱姆区块"),
                "alt-item-despawn-rate": {
                  enabled: t("启用"),
                  items: {
                    cobblestone: t("圆石")
                  }
                },
                "count-all-mobs-for-spawning": t("计算所有生物用于生成"),
                "creative-arrow-despawn-rate": t("创造模式箭矢消失速率"),
                "despawn-ranges": {
                  ambient: {
                    hard: t("困难"),
                    soft: t("简单")
                  },
                  axolotls: {
                    hard: t("困难"),
                    soft: t("简单")
                  },
                  creature: {
                    hard: t("困难"),
                    soft: t("简单")
                  }
                }
              },
              "tracking-range-y": {
                animal: t("动物"),
                display: t("显示"),
                enabled: t("启用"),
                misc: t("其他"),
                monster: t("怪物"),
                other: t("其他"),
                player: t("玩家")
              }
            }
          }
        },
        "entities-target-with-follow-range": t("跟随范围内的实体是否被目标选择器选中")
      },
      environment: {
        "disable-explosion-knockback": t("禁用爆炸后退效果"),
        "disable-ice-and-snow": t("禁用冰雪效果"),
        "disable-teleportation-suffocation-check": t("禁用传送窒息检查")
      },
      scoreboards: {
        "allow-non-player-entities-on-scoreboards": t("允许非玩家实体在记分板上"),
        "use-vanilla-world-scoreboard-name-coloring": t("使用原版世界记分板名称颜色")
      },
      spawn: {
        "allow-using-signs-inside-spawn-protection": t("允许在重生保护区域内使用告示牌"),
        "keep-spawn-loaded": t("保持重生点加载"),
        "keep-spawn-loaded-range": t("重生点加载范围")
      },
      "tick-rates": {
        behavior: {
          villager: {
            validatenearbypoi: t("村民附近POI验证时间")
          }
        }
      },
      "unsupported-settings": {
        "fix-invulnerable-end-crystal-exploit": t("修复无敌末影水晶漏洞")
      }
    }
  },
  "mohist/mohist.yml": {
    desc: t("mohist.yml 服务端配置文件"),
    config: {
      mohist: {
        lang: t("语言"),
        check_update: t("检查更新"),
        libraries: {
          check: t("检查 libraries"),
          downloadsource: t("libraries 下载源")
        },
        "installation-finished": t("是否安装完成")
      }
    }
  },
  "velocity/velocity.toml": {
    desc: t(
      "Velocity 群组服务端的重要配置文件，可以进行分布式管理，节点控制等，但此配置文件较为复杂，此处仅供简单的配置和操作"
    ),
    config: {
      "config-version": t("配置版本。不要更改这个"),
      bind: t("代理应绑定到哪个端口？默认情况下，我们将绑定到端口25577上的所有地址。"),
      motd: t(
        "应该是MOTD是什么？当玩家将您的服务器添加到服务器列表时，将显示此信息。仅接受MiniMessage格式。"
      ),
      "show-max-players": t("最大玩家数应该显示什么？（Velocity不支持在线玩家数上限。）"),
      "online-mode": t("我们是否应该使用Mojang对玩家进行身份验证？默认情况下，此选项打开。"),
      "force-key-authentication": t("代理是否应强制实施新的公钥安全标准？默认情况下，此选项打开。"),
      "prevent-client-proxy-connections": t(
        "如果此代理发送的客户端的ISP/AS与Mojang的身份验证服务器发送的不同，将踢出玩家。"
      ),
      "player-info-forwarding-mode": t("我们是否应将IP地址和其他数据转发到后端服务器？"),
      "forwarding-secret-file": t(
        "如果您使用modern或BungeeGuard IP转发，请在此处配置包含唯一密钥的文件。"
      ),
      "announce-forge": t("是否宣布您的服务器是否支持Forge。"),
      "kick-existing-players": t(
        "如果启用（默认为false）并且代理处于在线模式，则Velocity将踢出任何现有的在线玩家，如果尝试进行重复连接。"
      ),
      "ping-passthrough": t("应该将服务器列表ping请求传递到后端服务器吗？"),
      "enable-player-address-logging": t(
        "如果未启用（默认为true），则在日志中玩家的IP地址将被替换为<ip address withheld>。"
      ),
      servers: t("在此处配置您的服务器。每个键表示服务器的名称，值表示要连接的服务器的IP地址。"),
      try: t("在玩家登录或被服务器踢出时，应尝试哪些服务器的顺序。"),
      "forced-hosts": t("在此处配置您的强制主机。"),
      advanced: t("高级选项"),
      "compression-threshold": t(
        "在我们压缩它之前，Minecraft数据包的大小必须是多大。将其设置为零将压缩所有数据包，将其设置为-1将完全禁用压缩。"
      ),
      "compression-level": t("应该执行多少压缩（从0-9）。默认值为-1，使用默认级别6。"),
      "login-ratelimit": t(
        "在最后一次连接后，客户端允许多快连接？默认情况下，这是三秒。通过将其设置为0来禁用此功能。"
      ),
      "connection-timeout": t("在此处为连接超时指定自定义超时。默认值为五秒。"),
      "read-timeout": t("在此处为连接指定读取超时。默认值为30秒。"),
      "haproxy-protocol": t(
        "启用与HAProxy的PROXY协议的兼容性。如果您不知道这是用来做什么的，请不要启用它。"
      ),
      "tcp-fast-open": t("在代理上启用TCP快速打开支持。要求代理在Linux上运行。"),
      "bungee-plugin-message-channel": t("在Velocity上启用BungeeCord插件消息通道支持。"),
      "show-ping-requests": t("显示来自客户端的ping请求。"),
      "failover-on-unexpected-server-disconnect": t(
        "默认情况下，Velocity将尝试优雅地处理用户对服务器的连接意外丢失，而不是断开连接。"
      ),
      "announce-proxy-commands": t("声明1.13+客户端的代理命令。"),
      "log-command-executions": t("启用命令的日志记录。"),
      "log-player-connections": t("启用玩家连接的日志记录。"),
      query: t("查询"),
      enabled: t("是否启用响应GameSpy 4查询响应。"),
      port: t("如果查询已启用，查询协议应监听的端口是多少？"),
      map: t("报告给查询服务的地图名称。"),
      "show-plugins": t("默认情况下，查询响应中是否应显示插件。")
    }
  },
  "geyser/config.yml": {
    desc: t(
      "Geyser 独立版服务端软件配置文件，拥有基本的服务器参数设定（如端口，最大玩家数等）并且也可以设定服务端细节参数（区块缓存，线程数等）"
    ),
    config: {
      bedrock: {
        port: t("监听端口"),
        "clone-remote-port": t("使用与 Java 版相同的端口"),
        motd1: t("服务器的 MOTD。如果“passthrough-motd”设置为true，则无关紧要"),
        motd2: t("第二行 MOTD"),
        "server-name": t("将发送到JAVA客户端的服务器名称。这在暂停菜单和设置菜单中都可见。"),
        "compression-level": t(
          "压缩到基岩版客户端的网络流量。数字越高，CPU使用量越大，但使用的带宽越小。-1或9以下没有任何影响。设置为-1以禁用。"
        ),
        "enable-proxy-protocol": t(
          "是否为客户端启用PROXY协议。除非在Geyser实例前面运行UDP反向代理，否则您不希望启用此功能。"
        )
      },

      remote: {
        address: t("Java服务器的IP地址"),
        port: t("Java服务器的端口"),
        "auth-type": t("服务器身份验证类型。可以是offline、online或floodgate。"),
        "allow-password-authentication": t(
          "通过Geyser允许基于密码的身份验证方法。仅在在线模式下有用。"
        ),
        "use-proxy-protocol": t("连接到服务器时是否启用PROXY协议。"),
        "forward-hostname": t("将基岩版客户端用于连接到Java服务器的主机名转发")
      },

      "floodgate-key-file": t(
        "Floodgate使用加密以确保从授权源使用。这应该指向Floodgate生成的公钥（BungeeCord、Spigot或Velocity）"
      ),
      "saved-user-logins": t(
        "仅对在线模式身份验证类型。保存应在登录后保存其Java帐户的基岩版玩家列表。"
      ),
      "pending-authentication-timeout": t("在用户授权Geyser访问其Microsoft帐户时等待的秒数。"),
      "command-suggestions": t(
        "在第一次打开命令提示符时，基岩版客户端可能会冻结。禁用此功能将阻止发送命令建议并解决基岩版客户端的冻结。"
      ),
      "passthrough-motd": t("转发远程服务器的MOTD到基岩版玩家。"),
      "passthrough-protocol-name": t("转发服务器协议名称（例如BungeeCord [X.X]，Paper 1.X）。"),
      "passthrough-player-counts": t("转发远程服务器的玩家计数和最大玩家数到基岩版玩家。"),
      "legacy-ping-passthrough": t(
        "启用LEGACY ping passthrough。除非您的MOTD或玩家计数未正确显示，否则无需启用此选项。"
      ),
      "ping-passthrough-interval": t("以秒为单位的ping远程服务器的间隔。"),
      "forward-player-ping": t(
        "是否将玩家ping转发到服务器。启用此选项将允许基岩版玩家具有更准确的ping，但也可能导致玩家更容易超时。"
      ),
      "max-players": t("最大连接玩家数。"),
      "debug-mode": t("是否通过控制台发送调试消息。"),
      "allow-third-party-capes": t("允许第三方披风可见。"),
      "allow-third-party-ears": t("允许第三方deadmau5耳朵可见。"),
      "show-cooldown": t("是否发送虚假的冷却指示。"),
      "show-coordinates": t("控制是否向玩家显示坐标。"),
      "disable-bedrock-scaffolding": t("是否阻止基岩版玩家执行脚手架式搭桥。"),
      "emote-offhand-workaround": t("执行任何表情时，是否将副手和主手物品互换。"),
      "default-locale": t("如果我们没有客户端请求的语言，则使用的默认语言。"),
      "cache-images": t("指定将图像缓存到磁盘以节省从互联网下载它们的时间的秒数。0表示禁用。"),
      "allow-custom-skulls": t("允许显示自定义头颅。"),
      "max-visible-custom-skulls": t("每个玩家显示的最大自定义头颅数。"),
      "custom-skull-render-distance": t("在玩家周围以块为单位显示自定义头颅的半径。"),
      "add-non-bedrock-items": t("是否添加在基岩版版中本来不存在的任何物品和方块。"),
      "above-bedrock-nether-building": t(
        "通过将Nether维度ID更改为End ID来解决基岩版无法在Y坐标127以上方建筑的问题。"
      ),
      "force-resource-packs": t("是否强制客户端加载所有资源包。"),
      "xbox-achievements-enabled": t("是否启用Xbox成就。"),
      "log-player-ip-addresses": t("服务器是否记录玩家的IP地址。"),
      "notify-on-new-bedrock-update": t(
        "是否提醒控制台和操作员有新的 Geyser 版本支持 Bedrock 版本而此 Geyser 版本不支持的 Bedrock 版本"
      ),
      "unusable-space-block": t("在基岩版玩家库存中标记不可用插槽的物品。"),

      metrics: {
        enabled: t("是否向 Geyser 上报匿名数据"),
        uuid: t("此服务器的 UUID ，请勿修改")
      },
      "scoreboard-packet-threshold": t("更新积分板的阈值，每秒多少个Scoreboard数据包。"),
      "enable-proxy-connections": t("允许来自ProxyPass和Waterdog的连接。"),
      mtu: t("互联网支持的最大MTU为1492，但可能会导致数据包分段问题。"),
      "use-direct-connection": t("是否连接到Java服务器而无需创建TCP连接。"),
      "disable-compression": t("是否尝试为基岩版玩家禁用压缩。"),
      "config-version": t("配置文件版本，修改后可能导致不可预测的问题。建议不要修改此项。")
    }
  }
  //   "mcdr/permission.yml": {},
  //   "mcdr/config.yml": {},
};
