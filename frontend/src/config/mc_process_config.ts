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
    desc: "",
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
  }
  //   "velocity/velocity.toml": {},
  //   "mcdr/permission.yml": {},
  //   "mcdr/config.yml": {},
  //   "geyser/config.yml": {},
  //   "paper/paper-world-defaults.yml": {},
  //   "paper/paper-global.yml": {},
  //   "mohist/mohist.yml": {},
  //   "paper/paper.yml": {},
};
