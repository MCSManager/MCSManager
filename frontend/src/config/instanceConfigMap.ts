import { t } from "@/lang/i18n";

export const configData: {
  [key: string]: {
    desc: string;
    config: Record<string, any>;
  };
} = {
  "common/server.properties": {
    desc: t("TXT_CODE_c3022e22"),
    config: {
      "require-resource-pack": t("TXT_CODE_bdd4fe65"),
      "enable-jmx-monitoring": t("TXT_CODE_68a15ebb"),
      "sync-chunk-writes": t("TXT_CODE_4b20289c"),
      "generator-settings": t("TXT_CODE_88427611"),
      "allow-nether": t("TXT_CODE_b12787d7"),
      "level-name": t("TXT_CODE_c2a8378b"),
      "enable-query": t("TXT_CODE_1155db3a"),
      "allow-flight": t("TXT_CODE_97f5701e"),
      "server-port": t("TXT_CODE_4cef8979"),
      "level-type": t("TXT_CODE_9f28d67b"),
      "enable-rcon": t("TXT_CODE_83914d85"),
      "force-gamemode": t("TXT_CODE_7284c68e"),
      "level-seed": t("TXT_CODE_d7a7a095"),
      "server-ip": t("TXT_CODE_692957"),
      "max-build-height": t("TXT_CODE_2054155a"),
      "spawn-npcs": t("TXT_CODE_a6a04fa3"),
      "white-list": t("TXT_CODE_dd002fae"),
      "spawn-animals": t("TXT_CODE_58939ea7"),
      "snooper-enabled": t("TXT_CODE_e5b0feda"),
      hardcore: t("TXT_CODE_2debc7ae"),
      "texture-pack": t("TXT_CODE_c62a8fa1"),
      "online-mode": t("TXT_CODE_4306a0d0"),
      pvp: t("TXT_CODE_b214a52d"),
      "enforce-secure-profile": t("TXT_CODE_cbb958f2"),
      difficulty: t("TXT_CODE_da234f4f"),
      "player-idle-timeout": t("TXT_CODE_cafe41ab"),
      gamemode: t("TXT_CODE_deaf423c"),
      "max-players": t("TXT_CODE_b642de88"),
      "spawn-monsters": t("TXT_CODE_5bb8f14"),
      "view-distance": t("TXT_CODE_711d4763"),
      "generate-structures": t("TXT_CODE_2c4d586f"),
      motd: t("TXT_CODE_56ff18c1"),
      "op-permission-level": t("TXT_CODE_52eff9c3"),
      "announce-player-achievements": t("TXT_CODE_68a6aec5"),
      "network-compression-threshold": t("TXT_CODE_7cc196b9"),
      "resource-pack-sha1": t("TXT_CODE_6353e235"),
      "enable-command-block": t("TXT_CODE_97ff044f"),
      "resource-pack": t("TXT_CODE_95bdc950"),
      "max-world-size": t("TXT_CODE_738bc836"),
      "function-permission-level": t("TXT_CODE_791a4c9b"),
      "max-tick-time": t("TXT_CODE_61dd421d"),
      "prevent-proxy-connections": t("TXT_CODE_b16fc7a6"),
      "rcon.port": t("TXT_CODE_2a1fc6cc"),
      "rcon.password": t("TXT_CODE_1a0ab98b"),
      "query.port": t("TXT_CODE_e60567a8"),
      "use-native-transport": t("TXT_CODE_3df4beaf"),
      debug: t("TXT_CODE_c745cf56"),
      "broadcast-rcon-to-ops": t("TXT_CODE_ffebf0bf"),
      "broadcast-console-to-ops": t("TXT_CODE_ed0e3963"),
      "enforce-whitelist": t("TXT_CODE_1fc10e3b"),
      "spawn-protection": t("TXT_CODE_a8b0dfab"),
      "max-chained-neighbor-updates": t("TXT_CODE_a6878a01"),
      "enable-status": t("TXT_CODE_ffca72ed"),
      "resource-pack-prompt": t("TXT_CODE_b37e6938"),
      "hide-online-players": t("TXT_CODE_82c331f"),
      "entity-broadcast-range-percentage": t("TXT_CODE_dec6550e"),
      "simulation-distance": t("TXT_CODE_c871d8c8"),
      "rate-limit": t("TXT_CODE_b6697d36"),
      "previews-chat": t("TXT_CODE_ece2dd18"),
      "text-filtering-config": t("TXT_CODE_db815f4a")
    }
  },
  "common/eula.txt": {
    desc: t("TXT_CODE_bf8ae6c8"),
    config: {
      eula: t("TXT_CODE_ee01df88")
    }
  },
  "bukkit/bukkit.yml": {
    desc: t("TXT_CODE_fb23339d"),
    config: {
      settings: {
        "allow-end": t("TXT_CODE_bd7152f7"),
        "warn-on-overload": t("TXT_CODE_354409b6"),
        "permissions-file": t("TXT_CODE_2908dac"),
        "update-folder": t("TXT_CODE_da8bb476"),
        "plugin-profiling": t("TXT_CODE_50aa56a1"),
        "connection-throttle": t("TXT_CODE_2f07d608"),
        "query-plugins": t("TXT_CODE_caf10268"),
        "deprecated-verbose": t("TXT_CODE_9867da6b"),
        "shutdown-message": t("TXT_CODE_6071bd0b"),
        "minimum-api": t("TXT_CODE_9df68e04"),
        "use-map-color-cache": t("TXT_CODE_59a76359")
      },
      "spawn-limits": {
        monsters: t("TXT_CODE_12413b31"),
        animals: t("TXT_CODE_83856178"),
        "water-animals": t("TXT_CODE_b08f61c5"),
        "water-ambient": "",
        ambient: t("TXT_CODE_10eeb359")
      },
      "chunk-gc": {
        "period-in-ticks": t("TXT_CODE_53aec8c6")
      },
      "ticks-per": {
        "animal-spawns": t("TXT_CODE_4c55b6c7"),
        "monster-spawns": t("TXT_CODE_62dbf117"),
        autosave: t("TXT_CODE_7a830c68"),
        "water-spawns": "",
        "water-ambient-spawns": "",
        "ambient-spawns": ""
      },
      aliases: t("TXT_CODE_80766ddc")
    }
  },
  "bds/server.properties": {
    desc: t("TXT_CODE_ad14bcf3"),
    config: {
      "server-name": t("TXT_CODE_e81c77bc"),
      "allow-cheats": t("TXT_CODE_69ad6852"),
      "server-portv6": t("TXT_CODE_e057798f"),
      "tick-distance": t("TXT_CODE_a2c8c88a"),
      "max-threads": t("TXT_CODE_fc7ac5ea"),
      "default-player-permission-level": t("TXT_CODE_50511e8f"),
      "texturepack-required": t("TXT_CODE_c671927e"),
      "content-log-file-enabled": t("TXT_CODE_281c9d37"),
      "compression-threshold": t("TXT_CODE_ec6341cb"),
      "server-authoritative-movement": t("TXT_CODE_91734638"),
      "player-movement-score-threshold": t("TXT_CODE_a674a475"),
      "enable-lan-visibility": t("TXT_CODE_e65d2d1a"),
      "compression-algorithm": t("TXT_CODE_9b8f02fd"),
      "player-movement-action-direction-threshold": t("TXT_CODE_d4b35741"),
      "chat-restriction": t("TXT_CODE_d0fd83bf"),
      "disable-player-interaction": t("TXT_CODE_9a6e35e4"),
      "client-side-chunk-generation-enabled": t("TXT_CODE_4b610194"),
      "player-movement-distance-threshold": t("TXT_CODE_bca67837"),
      "player-movement-duration-threshold-in-ms": t("TXT_CODE_483d379"),
      "correct-player-movement": t("TXT_CODE_3036d123"),
      "server-authoritative-block-breaking": t("TXT_CODE_fe95b79a"),
      "generator-settings": t("TXT_CODE_88427611"),
      "allow-nether": t("TXT_CODE_b12787d7"),
      "level-name": t("TXT_CODE_c2a8378b"),
      "enable-query": t("TXT_CODE_1155db3a"),
      "allow-flight": t("TXT_CODE_97f5701e"),
      "server-port": t("TXT_CODE_a379038f"),
      "level-type": t("TXT_CODE_d00c21bb"),
      "enable-rcon": t("TXT_CODE_83914d85"),
      "force-gamemode": t("TXT_CODE_7284c68e"),
      "level-seed": t("TXT_CODE_d7a7a095"),
      "server-ip": t("TXT_CODE_87e448ae"),
      "max-build-height": t("TXT_CODE_2054155a"),
      "spawn-npcs": t("TXT_CODE_a6a04fa3"),
      "white-list": t("TXT_CODE_8fe9c7f7"),
      "allow-list": t("TXT_CODE_e13a6529"),
      "spawn-animals": t("TXT_CODE_58939ea7"),
      "snooper-enabled": t("TXT_CODE_e5b0feda"),
      hardcore: t("TXT_CODE_2debc7ae"),
      "texture-pack": t("TXT_CODE_c62a8fa1"),
      "online-mode": t("TXT_CODE_e96a055e"),
      pvp: t("TXT_CODE_b214a52d"),
      difficulty: t("TXT_CODE_da234f4f"),
      "player-idle-timeout": t("TXT_CODE_cafe41ab"),
      gamemode: t("TXT_CODE_deaf423c"),
      "max-players": t("TXT_CODE_b642de88"),
      "spawn-monsters": t("TXT_CODE_5bb8f14"),
      "view-distance": t("TXT_CODE_711d4763"),
      "generate-structures": t("TXT_CODE_2c4d586f"),
      motd: t("TXT_CODE_56ff18c1"),
      "op-permission-level": t("TXT_CODE_405d1f28"),
      "announce-player-achievements": t("TXT_CODE_68a6aec5"),
      "network-compression-threshold": t("TXT_CODE_7cc196b9"),
      "resource-pack-sha1": t("TXT_CODE_6353e235"),
      "enable-command-block": t("TXT_CODE_97ff044f"),
      "resource-pack": t("TXT_CODE_95bdc950"),
      "max-world-size": t("TXT_CODE_738bc836"),
      "function-permission-level": t("TXT_CODE_791a4c9b"),
      "max-tick-time": t("TXT_CODE_61dd421d"),
      "prevent-proxy-connections": t("TXT_CODE_b16fc7a6"),
      "rcon.port": t("TXT_CODE_2a1fc6cc"),
      "rcon.password": t("TXT_CODE_1a0ab98b"),
      "query.port": t("TXT_CODE_e60567a8"),
      "use-native-transport": t("TXT_CODE_3df4beaf"),
      debug: t("TXT_CODE_c745cf56"),
      "broadcast-rcon-to-ops": t("TXT_CODE_ffebf0bf"),
      "broadcast-console-to-ops": t("TXT_CODE_ed0e3963"),
      "enforce-whitelist": t("TXT_CODE_1fc10e3b"),
      "spawn-protection": t("TXT_CODE_1d7a8617"),
      "block-network-ids-are-hashes": t("TXT_CODE_faa6656a"),
      "disable-custom-skins": t("TXT_CODE_979b9aaf"),
      "server-build-radius-ratio": t("TXT_CODE_f174dee0")
    }
  },
  "bukkit/spigot.yml": {
    desc: t("TXT_CODE_6514e191"),
    config: {
      settings: {
        debug: t("TXT_CODE_bac2d713"),
        "user-cache-size": t("TXT_CODE_962f4288"),
        "player-shuffle": t("TXT_CODE_1ceefd70"),
        "netty-threads": t("TXT_CODE_ff8431c1"),
        "log-villager-deaths": t("TXT_CODE_397667ff"),
        "log-named-deaths": t("TXT_CODE_c6ecc182"),
        attribute: {
          maxHealth: {
            max: t("TXT_CODE_b34f9eee")
          },
          movementSpeed: {
            max: t("TXT_CODE_fd665d32")
          },
          attackDamage: {
            max: t("TXT_CODE_a66ea585")
          }
        },
        "save-user-cache-on-stop-only": t("TXT_CODE_cad62df3"),
        "moved-too-quickly-multiplier": t("TXT_CODE_eccd1c6c"),
        "moved-wrongly-threshold": t("TXT_CODE_c0a49b60"),
        "sample-count": t("TXT_CODE_9b5dcfdd"),
        bungeecord: t("TXT_CODE_72d36de"),
        "timeout-time": t("TXT_CODE_628f6851"),
        "restart-on-crash": t("TXT_CODE_741fdde4"),
        "restart-script": t("TXT_CODE_6be8dbe7")
      },
      messages: {
        whitelist: t("TXT_CODE_8b8c52f"),
        "unknown-command": t("TXT_CODE_51bb7e9f"),
        "server-full": t("TXT_CODE_1c7a8f47"),
        "outdated-client": t("TXT_CODE_912ec943"),
        "outdated-server": t("TXT_CODE_4c714a4f"),
        restart: t("TXT_CODE_192b48f0")
      },
      advancements: {
        "disable-saving": t("TXT_CODE_188c7493")
      },
      commands: {
        log: t("TXT_CODE_62c62825"),
        "tab-complete": t("TXT_CODE_47d09eea"),
        "send-namespaced": t("TXT_CODE_3790ec90"),
        "silent-commandblock-console": t("TXT_CODE_16b4f026")
      },
      players: {
        "disable-saving": t("TXT_CODE_458df26d")
      },
      "world-settings": {
        default: {
          "below-zero-generation-in-existing-chunks": t("TXT_CODE_e89c5ccb"),
          "end-portal-sound-radius": t("TXT_CODE_96e6bf5d"),
          "wither-spawn-sound-radius": t("TXT_CODE_193f5347"),
          "zombie-aggressive-towards-villager": t("TXT_CODE_38091a03"),
          "hanging-tick-frequency": t("TXT_CODE_94bcd51b"),
          "enable-zombie-pigmen-portal-spawns": t("TXT_CODE_a08f261e"),
          "dragon-death-sound-radius": t("TXT_CODE_5f0eafe5"),
          "merge-radius": {
            item: t("TXT_CODE_ed9bfc6c"),
            exp: t("TXT_CODE_34071701")
          },
          "nerf-spawner-mobs": t("TXT_CODE_311b2d6b"),
          "simulation-distance": t("TXT_CODE_903dfe61"),
          "mob-spawn-range": t("TXT_CODE_c848a459"),
          "view-distance": t("TXT_CODE_c32bc4b3"),
          "item-despawn-rate": t("TXT_CODE_8fac56fb"),
          "arrow-despawn-rate": t("TXT_CODE_47071ef6"),
          "trident-despawn-rate": t("TXT_CODE_615be555"),
          "thunder-chance": t("TXT_CODE_3183c301"),
          growth: {
            "cactus-modifier": t("TXT_CODE_a92a298e"),
            "cane-modifier": t("TXT_CODE_2759226f"),
            "melon-modifier": t("TXT_CODE_5338b335"),
            "mushroom-modifier": t("TXT_CODE_4c841d3"),
            "pumpkin-modifier": t("TXT_CODE_c0ce588"),
            "sapling-modifier": t("TXT_CODE_6fac9e82"),
            "beetroot-modifier": t("TXT_CODE_37f5901"),
            "carrot-modifier": t("TXT_CODE_f60ca79d"),
            "potato-modifier": t("TXT_CODE_193297ed"),
            "torchflower-modifier": t("TXT_CODE_47dd244a"),
            "wheat-modifier": t("TXT_CODE_1135828"),
            "netherwart-modifier": t("TXT_CODE_43984628"),
            "vine-modifier": t("TXT_CODE_143f213e"),
            "cocoa-modifier": t("TXT_CODE_be236019"),
            "bamboo-modifier": t("TXT_CODE_e5839f71"),
            "sweetberry-modifier": t("TXT_CODE_cd045236"),
            "kelp-modifier": t("TXT_CODE_39abde23"),
            "twistingvines-modifier": t("TXT_CODE_950c0d7a"),
            "weepingvines-modifier": t("TXT_CODE_62c88f3a"),
            "cavevines-modifier": t("TXT_CODE_27efff22"),
            "glowberry-modifier": t("TXT_CODE_925af648"),
            "pitcherplant-modifier": t("TXT_CODE_768c6fa9")
          },
          "ticks-per": {
            "hopper-transfer": t("TXT_CODE_16da1c76"),
            "hopper-check": t("TXT_CODE_be1f9806")
          },
          "hopper-amount": t("TXT_CODE_7f31b67d"),
          "hopper-can-load-chunks": t("TXT_CODE_8cfa8c1e"),
          "entity-tracking-range": {
            players: t("TXT_CODE_179e8e0"),
            animals: t("TXT_CODE_4a95255b"),
            monsters: t("TXT_CODE_159f0203"),
            misc: t("TXT_CODE_ea46baee"),
            display: t("TXT_CODE_b0f5847f"),
            other: t("TXT_CODE_317e0cc1")
          },
          "entity-activation-range": {
            animals: t("TXT_CODE_606da66a"),
            monsters: t("TXT_CODE_3f678132"),
            raiders: t("TXT_CODE_c2cef2d"),
            misc: t("TXT_CODE_c0be39df"),
            water: t("TXT_CODE_1ed0031c"),
            villagers: t("TXT_CODE_704a8b5d"),
            "flying-monsters": t("TXT_CODE_75c04302"),
            "wake-up-inactive": {
              "animals-max-per-tick": t("TXT_CODE_9364ec40"),
              "animals-every": t("TXT_CODE_1adaa4f4"),
              "animals-for": t("TXT_CODE_8f809a5"),
              "monsters-max-per-tick": t("TXT_CODE_cc6ecb18"),
              "monsters-every": t("TXT_CODE_7cf70670"),
              "monsters-for": t("TXT_CODE_df903498"),
              "villagers-max-per-tick": t("TXT_CODE_8343c177"),
              "villagers-every": t("TXT_CODE_e4e975f0"),
              "villagers-for": t("TXT_CODE_dd20e5c3"),
              "flying-monsters-max-per-tick": t("TXT_CODE_814a3c64"),
              "flying-monsters-every": t("TXT_CODE_ad6c5d03"),
              "flying-monsters-for": t("TXT_CODE_d9829f9c")
            },
            "villagers-work-immunity-after": t("TXT_CODE_fabc6a75"),
            "villagers-work-immunity-for": t("TXT_CODE_e98816c2"),
            "villagers-active-for-panic": t("TXT_CODE_ecf93b03"),
            "tick-inactive-villagers": t("TXT_CODE_b3190a77"),
            "ignore-spectators": t("TXT_CODE_29b7eca5")
          },
          "seed-village": t("TXT_CODE_39a3ba38"),
          "seed-desert": t("TXT_CODE_fb00a910"),
          "seed-igloo": t("TXT_CODE_c8572f16"),
          "seed-jungle": t("TXT_CODE_27f641c1"),
          "seed-swamp": t("TXT_CODE_8d5d8e26"),
          "seed-monument": t("TXT_CODE_1a8cf808"),
          "seed-shipwreck": t("TXT_CODE_e7ad77f0"),
          "seed-ocean": t("TXT_CODE_9df0f923"),
          "seed-outpost": t("TXT_CODE_10430e01"),
          "seed-endcity": t("TXT_CODE_8366db5a"),
          "seed-slime": t("TXT_CODE_f28ded80"),
          "seed-nether": t("TXT_CODE_2f900008"),
          "seed-mansion": t("TXT_CODE_555b3625"),
          "seed-fossil": t("TXT_CODE_313db7d2"),
          "seed-portal": t("TXT_CODE_be26bb3c"),
          "seed-ancientcity": t("TXT_CODE_fcee1fa0"),
          "seed-trailruins": t("TXT_CODE_51df891f"),
          "seed-buriedtreasure": t("TXT_CODE_6c7970df"),
          "seed-mineshaft": t("TXT_CODE_a6f5af58"),
          "seed-stronghold": t("TXT_CODE_1e08ca6b"),
          "max-tnt-per-tick": t("TXT_CODE_37d67b69"),
          hunger: {
            "jump-walk-exhaustion": t("TXT_CODE_5d563196"),
            "jump-sprint-exhaustion": t("TXT_CODE_4c38bb42"),
            "combat-exhaustion": t("TXT_CODE_c3ec4dc8"),
            "regen-exhaustion": t("TXT_CODE_cbe0fc07"),
            "swim-multiplier": t("TXT_CODE_e66f4ae"),
            "sprint-multiplier": t("TXT_CODE_937b42e6"),
            "other-multiplier": t("TXT_CODE_27fd08b9")
          },
          "max-tick-time": {
            tile: t("TXT_CODE_dd2cef06"),
            entity: t("TXT_CODE_25924d5a")
          },
          verbose: t("TXT_CODE_ba4f41ba")
        }
      },
      "config-version": t("TXT_CODE_8f3582d7"),
      stats: {
        "disable-saving": t("TXT_CODE_1f224bef"),
        "forced-stats": t("TXT_CODE_74c46351")
      }
    }
  },
  "bungeecord/config.yml": {
    desc: t("TXT_CODE_4fd13f18"),
    config: {
      prevent_proxy_connections: t("TXT_CODE_f435b042"),
      listeners: [
        {
          query_port: t("TXT_CODE_fe80882d"),
          motd: t("TXT_CODE_db04e635"),
          tab_list: t("TXT_CODE_afb7259b"),
          query_enabled: t("TXT_CODE_4d124f78"),
          proxy_protocol: t("TXT_CODE_d11cc3e1"),
          forced_hosts: t("TXT_CODE_b1fd3eb1"),
          ping_passthrough: t("TXT_CODE_7166a969"),
          priorities: t("TXT_CODE_a112cff4"),
          bind_local_address: t("TXT_CODE_b1d709bc"),
          host: t("TXT_CODE_c03297d4"),
          max_players: t("TXT_CODE_b5afc7e"),
          tab_size: t("TXT_CODE_157e06a9"),
          force_default_server: t("TXT_CODE_1fbf74d9")
        }
      ],
      remote_ping_cache: t("TXT_CODE_8a5274c1"),
      network_compression_threshold: "",
      permissions: {
        default: t("TXT_CODE_f0dc2530"),
        admin: t("TXT_CODE_a4757fec")
      },
      log_pings: t("TXT_CODE_1a6bacc6"),
      connection_throttle: t("TXT_CODE_78aa511"),
      connection_throttle_limit: t("TXT_CODE_22b2a206"),
      server_connect_timeout: t("TXT_CODE_978491ec"),
      timeout: t("TXT_CODE_628f6851"),
      player_limit: t("TXT_CODE_5b323a2"),
      ip_forward: t("TXT_CODE_9d982f06"),
      groups: t("TXT_CODE_ad5107bc"),
      remote_ping_timeout: t("TXT_CODE_4f0b822b"),
      log_commands: t("TXT_CODE_3354b56e"),
      stats: t("TXT_CODE_2418225f"),
      online_mode: t("TXT_CODE_b5a3a6ca"),
      forge_support: t("TXT_CODE_91507ef3"),
      disabled_commands: t("TXT_CODE_44a472a5"),
      servers: t("TXT_CODE_661c66fa")
    }
  },
  "paper/paper.yml": {
    desc: t("TXT_CODE_f8ef0c45"),
    config: {
      _version: t("TXT_CODE_d7ad19af"),
      "block-updates": {
        "disable-chorus-plant-updates": t("TXT_CODE_64282335"),
        "disable-mushroom-block-updates": t("TXT_CODE_86ab6e1e"),
        "disable-noteblock-updates": t("TXT_CODE_de61c48c"),
        "disable-tripwire-updates": t("TXT_CODE_e7cb14e2")
      },
      "chunk-loading-advanced": {
        "auto-config-send-distance": t("TXT_CODE_3969cb6b"),
        "player-max-concurrent-chunk-generates": t("TXT_CODE_179eb7ce"),
        "player-max-concurrent-chunk-loads": t("TXT_CODE_3897eb89")
      },
      "chunk-loading-basic": {
        "player-max-chunk-generate-rate": t("TXT_CODE_af11ca2a"),
        "player-max-chunk-load-rate": t("TXT_CODE_8dd7bc1a"),
        "player-max-chunk-send-rate": t("TXT_CODE_1dc16497")
      },
      "chunk-system": {
        "gen-parallelism": t("TXT_CODE_40ee4eaf"),
        "io-threads": t("TXT_CODE_7d197c39"),
        "worker-threads": t("TXT_CODE_7b8f01b5")
      },
      collisions: {
        "enable-player-collisions": t("TXT_CODE_a519b5ff"),
        "send-full-pos-for-hard-colliding-entities": t("TXT_CODE_84d56d69")
      },
      commands: {
        "fix-target-selector-tag-completion": t("TXT_CODE_c059faee"),
        "suggest-player-names-when-null-tab-completions": t("TXT_CODE_859b2d24"),
        "time-command-affects-all-worlds": t("TXT_CODE_e01e51f3")
      },
      console: {
        "enable-brigadier-completions": t("TXT_CODE_bb98d45"),
        "enable-brigadier-highlighting": t("TXT_CODE_871feca"),
        "has-all-permissions": t("TXT_CODE_dfa27a93")
      },
      "item-validation": {
        book: {
          author: t("TXT_CODE_e641b54c"),
          page: t("TXT_CODE_7ce3c6e"),
          title: t("TXT_CODE_e8d9c341")
        },
        "book-size": {
          "page-max": t("TXT_CODE_684eb7e3"),
          "total-multiplier": t("TXT_CODE_66b01c4e")
        },
        "display-name": t("TXT_CODE_b251fa6d"),
        "lore-line": t("TXT_CODE_143e55cb"),
        "resolve-selectors-in-books": t("TXT_CODE_bb9657ff")
      },
      logging: {
        "deobfuscate-stacktraces": t("TXT_CODE_f5feed4e")
      },
      messages: {
        kick: {
          "authentication-servers-down": t("TXT_CODE_d0c78699"),
          "connection-throttle": t("TXT_CODE_e7a42e0e"),
          "flying-player": t("TXT_CODE_fdd8effa"),
          "flying-vehicle": t("TXT_CODE_c135338")
        },
        "no-permission": t("TXT_CODE_27b7102a"),
        "use-display-name-in-quit-message": t("TXT_CODE_15022f3e")
      },
      misc: {
        "chat-threads": {
          "chat-executor-core-size": t("TXT_CODE_cd40249d"),
          "chat-executor-max-size": t("TXT_CODE_da782f63")
        },
        "compression-level": t("TXT_CODE_743ed87f"),
        "fix-entity-position-desync": t("TXT_CODE_7f0daff7"),
        "load-permissions-yml-before-plugins": t("TXT_CODE_5a280280"),
        "max-joins-per-tick": t("TXT_CODE_90edf4ad"),
        "region-file-cache-size": t("TXT_CODE_ff2c2f20"),
        "strict-advancement-dimension-check": t("TXT_CODE_8d6e5b1f"),
        "use-alternative-luck-formula": t("TXT_CODE_ef676a8f"),
        "use-dimension-type-for-custom-spawners": t("TXT_CODE_3f5a2028")
      },
      "packet-limiter": {
        "all-packets": {
          action: t("TXT_CODE_2203d4ff"),
          interval: t("TXT_CODE_36b878dc"),
          "max-packet-rate": t("TXT_CODE_2645196f")
        },
        "kick-message": t("TXT_CODE_b355c681"),
        overrides: {
          ServerboundPlaceRecipePacket: {
            action: t("TXT_CODE_312cd9f0"),
            interval: t("TXT_CODE_2db37427"),
            "max-packet-rate": t("TXT_CODE_3d4e1594")
          }
        }
      },
      "player-auto-save": {
        "max-per-tick": t("TXT_CODE_2a84466d"),
        rate: t("TXT_CODE_63a4602e")
      },
      proxies: {
        "bungee-cord": {
          "online-mode": t("TXT_CODE_2fb7e284")
        },
        "proxy-protocol": t("TXT_CODE_f5cbef5c"),
        velocity: {
          enabled: t("TXT_CODE_ab839970"),
          "online-mode": t("TXT_CODE_f2d5dd5"),
          secret: t("TXT_CODE_7f8f267f")
        }
      },
      scoreboards: {
        "save-empty-scoreboard-teams": t("TXT_CODE_d649b01e"),
        "track-plugin-scoreboards": t("TXT_CODE_13aa13dd")
      },
      "spam-limiter": {
        "incoming-packet-threshold": t("TXT_CODE_f59bbcef"),
        "recipe-spam-increment": t("TXT_CODE_d6321094"),
        "recipe-spam-limit": t("TXT_CODE_b10cbef0"),
        "tab-spam-increment": t("TXT_CODE_76c66252"),
        "tab-spam-limit": t("TXT_CODE_11f8cc36")
      },
      timings: {
        enabled: t("TXT_CODE_28bf8a1b"),
        "hidden-config-entries": t("TXT_CODE_56516e92"),
        "history-interval": t("TXT_CODE_ea579dec"),
        "history-length": t("TXT_CODE_13dfc5cb"),
        "server-name": t("TXT_CODE_e81c77bc"),
        "server-name-privacy": t("TXT_CODE_9ac035d0"),
        url: t("TXT_CODE_f8f3218a"),
        verbose: t("TXT_CODE_afd43f2")
      },
      "unsupported-settings": {
        "allow-grindstone-overstacking": t("TXT_CODE_39e7fa63"),
        "allow-headless-pistons": t("TXT_CODE_59b1cb55"),
        "allow-permanent-block-break-exploits": t("TXT_CODE_bc3e529c"),
        "allow-piston-duplication": t("TXT_CODE_f86b456a"),
        "compression-format": t("TXT_CODE_e06c1cea"),
        "perform-username-validation": t("TXT_CODE_1fe2257b")
      },
      watchdog: {
        "early-warning-delay": t("TXT_CODE_c1507dd6"),
        "early-warning-every": t("TXT_CODE_ea8aaf1b")
      }
    }
  },
  "purpur/purpur.yml": {
    desc: t("TXT_CODE_da76ea07"),
    config: {
      verbose: t("TXT_CODE_81cabec"),
      "config-version": t("TXT_CODE_c32eb04a"),
      settings: {
        "block-fall-multipliers": {
          "minecraft:brown_bed": {
            distance: t("TXT_CODE_e40ddc99")
          },
          "minecraft:lime_bed": {
            distance: t("TXT_CODE_1b518dd0")
          },
          "minecraft:yellow_bed": {
            distance: t("TXT_CODE_8175818c")
          },
          "minecraft:black_bed": {
            distance: t("TXT_CODE_8da44b20")
          },
          "minecraft:orange_bed": {
            distance: t("TXT_CODE_998d1dec")
          },
          "minecraft:green_bed": {
            distance: t("TXT_CODE_44f46508")
          },
          "minecraft:blue_bed": {
            distance: t("TXT_CODE_b36630b3")
          },
          "minecraft:cyan_bed": {
            distance: t("TXT_CODE_a5bdf2d8")
          },
          "minecraft:gray_bed": {
            distance: t("TXT_CODE_f130e34a")
          },
          "minecraft:white_bed": {
            distance: t("TXT_CODE_7db580c1")
          },
          "minecraft:hay_block": {
            distance: t("TXT_CODE_4c9dd2b4")
          },
          "minecraft:red_bed": {
            distance: t("TXT_CODE_f5e3c97e")
          },
          "minecraft:pink_bed": {
            distance: t("TXT_CODE_9e1657b")
          },
          "minecraft:light_blue_bed": {
            distance: t("TXT_CODE_6253ecce")
          },
          "minecraft:purple_bed": {
            distance: t("TXT_CODE_845b8bd8")
          },
          "minecraft:magenta_bed": {
            distance: t("TXT_CODE_9eb5dd12")
          },
          "minecraft:light_gray_bed": {
            distance: t("TXT_CODE_20053f37")
          }
        },
        command: {
          uptime: {
            format: t("TXT_CODE_b75e6388"),
            day: t("TXT_CODE_2de4c590"),
            days: t("TXT_CODE_816ae222"),
            hour: t("TXT_CODE_3752d436"),
            hours: t("TXT_CODE_bec552ee"),
            minute: t("TXT_CODE_80747f11"),
            minutes: t("TXT_CODE_1b78c12e"),
            second: t("TXT_CODE_b3796a8"),
            seconds: t("TXT_CODE_a94e89ef")
          },
          gamemode: {
            "requires-specific-permission": t("TXT_CODE_2b524bbf")
          },
          tpsbar: {
            title: t("TXT_CODE_e4cf9ca3"),
            overlay: t("TXT_CODE_dc370276"),
            "fill-mode": t("TXT_CODE_f021f43a"),
            "progress-color": {
              good: t("TXT_CODE_7d3d97ec"),
              medium: t("TXT_CODE_47491a7e"),
              low: t("TXT_CODE_8fac22fc")
            },
            "text-color": {
              good: t("TXT_CODE_52f96ff0"),
              medium: t("TXT_CODE_125812c9"),
              low: t("TXT_CODE_2428b9c0")
            },
            "tick-interval": t("TXT_CODE_fe592df1")
          },
          rambar: {
            title: t("TXT_CODE_90b596a8"),
            overlay: t("TXT_CODE_dc370276"),
            "progress-color": {
              good: t("TXT_CODE_82b18ea4"),
              medium: t("TXT_CODE_1b82883f"),
              low: t("TXT_CODE_cdf1a25")
            },
            "text-color": {
              good: t("TXT_CODE_27ee6bf8"),
              medium: t("TXT_CODE_ddec29cf"),
              low: t("TXT_CODE_598f2d02")
            },
            "tick-interval": t("TXT_CODE_fe592df1")
          },
          compass: {
            title: t("TXT_CODE_a463be37"),
            overlay: t("TXT_CODE_dc370276"),
            "progress-color": t("TXT_CODE_98742e5f"),
            percent: t("TXT_CODE_e8293f96"),
            "tick-interval": t("TXT_CODE_fe592df1")
          },
          "hide-hidden-players-from-entity-selector": t("TXT_CODE_7eb0f9fd"),
          "allow-water-placement-in-the-end": t("TXT_CODE_55a62de"),
          "use-alternate-keepalive": t("TXT_CODE_c42a1b9b")
        },
        "tps-catchup": t("TXT_CODE_b8c40ce0"),
        "server-mod-name": t("TXT_CODE_b89285d3"),
        "fix-projectile-looting-transfer": t("TXT_CODE_93afb039"),
        "blast-resistance-overrides": t("TXT_CODE_7a318185"),
        "clamp-attributes": t("TXT_CODE_fd9d9eeb"),
        "limit-armor": t("TXT_CODE_8631c629"),
        "username-valid-characters": t("TXT_CODE_f0de6bb8"),
        "lagging-threshold": t("TXT_CODE_fe463ea3"),
        "fix-network-serialized-items-in-creative": t("TXT_CODE_9c2250b7"),
        "disable-give-dropping": t("TXT_CODE_51ff8e5b"),
        "player-deaths-always-show-item": t("TXT_CODE_b36320e1"),
        "register-minecraft-debug-commands": t("TXT_CODE_3ef08433"),
        "startup-commands": t("TXT_CODE_4d8e959e"),
        "bee-count-payload": t("TXT_CODE_5f1ae9ca"),
        messages: {
          "afk-broadcast-away": t("TXT_CODE_478717e2"),
          "afk-broadcast-back": t("TXT_CODE_7dd469fa"),
          "afk-broadcast-use-display-name": t("TXT_CODE_6546b287"),
          "afk-tab-list-prefix": t("TXT_CODE_56c42793"),
          "afk-tab-list-suffix": t("TXT_CODE_42a7759b"),
          "cannot-ride-mob": t("TXT_CODE_4f21b52"),
          "dont-run-with-scissors": t("TXT_CODE_f5689a76"),
          "ping-command-output": t("TXT_CODE_669eb0ff"),
          "uptime-command-output": t("TXT_CODE_57a3aae"),
          "demo-command-output": t("TXT_CODE_53761955"),
          "credits-command-output": t("TXT_CODE_c20e5d16"),
          "tpsbar-command-output": t("TXT_CODE_a725a5b1"),
          "ram-command-output": t("TXT_CODE_d42566ff"),
          "rambar-command-output": t("TXT_CODE_fabfaadc"),
          "unverified-username": t("TXT_CODE_39bb14c1"),
          "sleep-skipping-night": t("TXT_CODE_87c5dcb4"),
          "sleeping-players-percent": t("TXT_CODE_49c48e0a"),
          "sleep-not-possible": t("TXT_CODE_1dc0000f"),
          "death-message": {
            stonecutter: t("TXT_CODE_16e2615"),
            "run-with-scissors": t("TXT_CODE_53e8e5af")
          }
        },
        network: {
          "kick-for-out-of-order-chat": t("TXT_CODE_d33e975f"),
          "upnp-port-forwarding": t("TXT_CODE_d372d72"),
          "max-joins-per-second": t("TXT_CODE_20d107f1")
        },
        blocks: {
          barrel: {
            rows: t("TXT_CODE_8cb5a1e6")
          },
          beehive: {
            "max-bees-inside": t("TXT_CODE_249df6f2")
          },
          grindstone: {
            "ignored-enchants": t("TXT_CODE_7a2b969f"),
            "remove-attributes": t("TXT_CODE_c15dcfec"),
            "remove-name-and-lore": t("TXT_CODE_f085ce38")
          },
          ender_chest: {
            "six-rows": t("TXT_CODE_c97dd046"),
            "use-permissions-for-rows": t("TXT_CODE_3489786b")
          },
          crying_obsidian: {
            "valid-for-portal-frame": t("TXT_CODE_41ae3d88")
          },
          twisting_vines: {
            "max-growth-age": t("TXT_CODE_442c0649")
          },
          weeping_vines: {
            "max-growth-age": t("TXT_CODE_442c0649")
          },
          cave_vines: {
            "max-growth-age": t("TXT_CODE_442c0649")
          },
          kelp: {
            "max-growth-age": t("TXT_CODE_442c0649")
          },
          anvil: {
            "cumulative-cost": t("TXT_CODE_4a70853b")
          },
          lightning_rod: {
            range: t("TXT_CODE_b7f19227")
          },
          "magma-block": {
            "reverse-bubble-column-flow": t("TXT_CODE_19140a89")
          },
          "soul-sand": {
            "reverse-bubble-column-flow": t("TXT_CODE_76d59e8")
          }
        },
        broadcasts: {
          advancement: {
            "only-broadcast-to-affected-player": t("TXT_CODE_5af5838a")
          },
          death: {
            "only-broadcast-to-affected-player": t("TXT_CODE_93191a82")
          }
        },
        logger: {
          "suppress-init-legacy-material-errors": t("TXT_CODE_559f4b1d"),
          "suppress-ignored-advancement-warnings": t("TXT_CODE_68928779"),
          "supress-unrecognized-recipe-errors": t("TXT_CODE_4c82f760"),
          "suppress-setblock-in-far-chunk-errors": t("TXT_CODE_4140aa4b"),
          "supress-library-loader": t("TXT_CODE_6623dde0")
        },
        "food-properties": {
          default: t("TXT_CODE_b1d19033")
        },
        entity: {
          enderman: {
            "short-height": t("TXT_CODE_7898c2b4")
          }
        },
        enchantment: {
          "allow-looting-on-shears": t("TXT_CODE_18de069c"),
          "allow-unsafe-enchant-command": t("TXT_CODE_a1e4c720"),
          "clamp-levels": t("TXT_CODE_9066472a"),
          anvil: {
            "allow-inapplicable-enchants": t("TXT_CODE_3579ab7d"),
            "allow-incompatible-enchants": t("TXT_CODE_1cafa176"),
            "allow-higher-enchants-levels": t("TXT_CODE_172c745e"),
            "replace-incompatible-enchants": t("TXT_CODE_2415440f")
          }
        }
      },
      "world-settings": {
        default: {
          hunger: {
            "starvation-damage": t("TXT_CODE_65a780a2")
          },
          settings: {
            entity: {
              "shared-random": t("TXT_CODE_42e25bc2")
            }
          },
          blocks: {
            anvil: {
              "use-mini-message": t("TXT_CODE_4c566219"),
              "allow-colors": t("TXT_CODE_69dbb08"),
              "iron-ingots-used-for-repair": t("TXT_CODE_b329418"),
              "obsidian-used-for-damage": t("TXT_CODE_1770c716")
            },
            azalea: {
              "growth-chance": t("TXT_CODE_fe46ac12")
            },
            beacon: {
              "allow-effects-with-tinted-glass": t("TXT_CODE_3da5e4e"),
              "effect-range": {
                "level-1": t("TXT_CODE_a48bdb09"),
                "level-2": t("TXT_CODE_a48bdb09"),
                "level-3": t("TXT_CODE_a48bdb09"),
                "level-4": t("TXT_CODE_a48bdb09")
              }
            },
            bed: {
              explode: t("TXT_CODE_786e2280"),
              "explode-on-villager-sleep": t("TXT_CODE_18b3d541"),
              "explosion-power": t("TXT_CODE_d1509da0"),
              "explosion-fire": t("TXT_CODE_3be23278"),
              "explosion-effect": t("TXT_CODE_7e0b9953")
            },
            big_dripleaf: {
              "tilt-delay": {
                FULL: t("TXT_CODE_2541ce4d"),
                UNSTABLE: t("TXT_CODE_9e9c0179"),
                PARTIAL: t("TXT_CODE_9e9c0179")
              }
            },
            blue_ice: {
              "allow-mob-spawns": t("TXT_CODE_e3116bba"),
              "allow-snow-formation": t("TXT_CODE_66ac4611")
            },
            cactus: {
              "breaks-from-solid-neighbors": t("TXT_CODE_1396f33c"),
              "affected-by-bonemeal": t("TXT_CODE_bb35dc39")
            },
            campfire: {
              "lit-when-placed": t("TXT_CODE_a9c9d05e")
            },
            cauldron: {
              "fill-chances": {
                rain: t("TXT_CODE_931e4c8"),
                "powder-snow": t("TXT_CODE_beacbdc"),
                "dripstone-water": t("TXT_CODE_5e56a7a5"),
                "dripstone-lava": t("TXT_CODE_edd8458c")
              }
            },
            chest: {
              "open-with-solid-block-on-top": t("TXT_CODE_5d589988")
            },
            composter: {
              "sneak-to-bulk-process": t("TXT_CODE_6ac327b4")
            },
            conduit: {
              "valid-ring-blocks": t("TXT_CODE_6f9d4bb7"),
              "effect-distance": t("TXT_CODE_3a24c7a3"),
              "mob-damage": {
                distance: t("TXT_CODE_dbc9b3e3"),
                "damage-amount": t("TXT_CODE_abadb770")
              }
            },
            coral: {
              "die-outside-water": t("TXT_CODE_10efed7c")
            },
            dispenser: {
              "apply-cursed-to-armor-slots": t("TXT_CODE_7b0b38e6"),
              "place-anvils": t("TXT_CODE_d149e3e6")
            },
            door: {
              "requires-redstone": t("TXT_CODE_8a7c57b9")
            },
            dragon_egg: {
              teleport: t("TXT_CODE_1348332a")
            },
            "enchantment-table": {
              "lapis-persists": t("TXT_CODE_3a5c9779")
            },
            "end-crystal": {
              "cramming-amount": t("TXT_CODE_7d28d924"),
              baseless: {
                explode: t("TXT_CODE_d8d6dca8"),
                "explosion-power": t("TXT_CODE_f2168ca9"),
                "explosion-fire": t("TXT_CODE_377a62dc"),
                "explosion-effect": t("TXT_CODE_7e0b9953")
              },
              base: {
                explode: t("TXT_CODE_d8d6dca8"),
                "explosion-power": t("TXT_CODE_f2168ca9"),
                "explosion-fire": t("TXT_CODE_377a62dc"),
                "explosion-effect": t("TXT_CODE_7e0b9953")
              }
            },
            farmland: {
              "gets-moist-from-below": t("TXT_CODE_ab483b69"),
              "use-alpha-farmland:": t("TXT_CODE_3a8fdbf1"),
              "bypass-mob-griefing": t("TXT_CODE_e948602a"),
              "only-players-trample": t("TXT_CODE_f309e464"),
              "disable-trampling": t("TXT_CODE_ab90dc44"),
              "trample-height": t("TXT_CODE_f287f6dd"),
              "feather-fall-distance-affects-trampling": t("TXT_CODE_6526494a")
            },
            flowering_azalea: {
              "growth-chance": t("TXT_CODE_35d52619")
            },
            furnace: {
              "use-lava-from-underneath": t("TXT_CODE_72c8d0bf")
            },
            lava: {
              "infinite-required-sources": t("TXT_CODE_22b5f37d"),
              speed: {
                nether: t("TXT_CODE_15c747a6"),
                "not-nether": t("TXT_CODE_15c747a6")
              }
            },
            "magma-block": {
              "damage-when-sneaking": t("TXT_CODE_55c91a9b"),
              "damage-with-frost-walker": t("TXT_CODE_5635dd6b")
            },
            nether_wart: {
              "affected-by-bonemeal": t("TXT_CODE_553c6ed2")
            },
            observer: {
              "disable-clock": t("TXT_CODE_5ddf3123")
            },
            packed_ice: {
              "allow-mob-spawns": t("TXT_CODE_e9da0615")
            },
            piston: {
              "block-push-limit": t("TXT_CODE_d15dc89c")
            },
            powder_snow: {
              "bypass-mob-griefing": t("TXT_CODE_9dc4ee75")
            },
            "powered-rail": {
              "activation-range": t("TXT_CODE_b3581555")
            },
            respawn_anchor: {
              explode: t("TXT_CODE_99fab05d"),
              "explosion-power": t("TXT_CODE_d1509da0"),
              "explosion-fire": t("TXT_CODE_3be23278"),
              "explosion-effect": t("TXT_CODE_7e0b9953")
            },
            sculk_shrieker: {
              "can-summon-default": t("TXT_CODE_99f8edf0")
            },
            shulker_box: {
              "allow-oversized-stacks": t("TXT_CODE_a8a375ae")
            },
            sign: {
              "allow-colors": t("TXT_CODE_479389a")
            },
            slab: {
              "break-individual-slabs-when-sneaking": t("TXT_CODE_2a370f1c")
            },
            spawner: {
              "deactivate-by-redstone": t("TXT_CODE_a4efbd21"),
              "fix-mc-238526": t("TXT_CODE_144caddf")
            },
            sponge: {
              "absorbs-lava": t("TXT_CODE_b2e9a60"),
              "absorbs-water-from-mud": t("TXT_CODE_d29be029"),
              absorption: {
                area: t("TXT_CODE_a3f8313f"),
                radius: t("TXT_CODE_79ccdee0")
              }
            },
            stonecutter: {
              damage: t("TXT_CODE_e4895a21")
            },
            sugar_cane: {
              "affected-by-bonemeal": t("TXT_CODE_fe402f41")
            },
            turtle_egg: {
              "break-from-exp-orbs": t("TXT_CODE_a132c796"),
              "break-from-items": t("TXT_CODE_b5253fae"),
              "break-from-minecarts": t("TXT_CODE_a0a00fc0"),
              "bypass-mob-griefing": t("TXT_CODE_3dee9250"),
              "random-tick-crack-chance": t("TXT_CODE_849c3911"),
              "feather-fall-distance-affects-trampling": t("TXT_CODE_6526494a")
            },
            water: {
              "infinite-required-sources": t("TXT_CODE_3247f016")
            }
          },
          mobs: {
            allay: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_facd4d3c"),
              "respect-nbt": t("TXT_CODE_5d488270"),
              attributes: {
                max_health: t("TXT_CODE_ce4a3230"),
                scale: t("TXT_CODE_2f87036a")
              }
            },
            armadillo: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_fc5c0e2e"),
              "breeding-delay-ticks": t("TXT_CODE_f0127843"),
              attributes: {
                max_health: t("TXT_CODE_ce4a3230"),
                scale: t("TXT_CODE_2f87036a")
              }
            },
            axolotl: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "breeding-delay-ticks": t("TXT_CODE_f0127843"),
              attributes: {
                max_health: t("TXT_CODE_ce4a3230"),
                scale: t("TXT_CODE_2f87036a")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            bat: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_fc5c0e2e"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "ridable-max-y": t("TXT_CODE_3dbf8890"),
              attributes: {
                follow_range: t("TXT_CODE_6f0a5984"),
                knockback_resistance: t("TXT_CODE_dd0a8173"),
                movement_speed: t("TXT_CODE_66b7b26e"),
                flying_speed: t("TXT_CODE_91ebfa75"),
                armor: t("TXT_CODE_49ab8e74"),
                armor_toughness: t("TXT_CODE_37931fa9"),
                attack_knockback: t("TXT_CODE_ed510830"),
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            bee: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_fc5c0e2e"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "ridable-max-y": t("TXT_CODE_3dbf8890"),
              "breeding-delay-ticks": t("TXT_CODE_f0127843"),
              "can-work-at-night": t("TXT_CODE_67509ff2"),
              "can-work-in-rain": t("TXT_CODE_ac0754f7"),
              "dies-after-sting": t("TXT_CODE_9fd05002"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            blaze: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_fc5c0e2e"),
              "ridable-max-y": t("TXT_CODE_3dbf8890"),
              "takes-damage-from-water": t("TXT_CODE_6cfeb776"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            bogged: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_fc5c0e2e"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              }
            },
            camel: {
              "ridable-in-water": t("TXT_CODE_fc5c0e2e"),
              "breeding-delay-ticks": t("TXT_CODE_f0127843"),
              attributes: {
                max_health: {
                  min: t("TXT_CODE_c9f303dd"),
                  max: t("TXT_CODE_e08dfec5")
                },
                jump_strength: {
                  min: t("TXT_CODE_e1276b33"),
                  max: t("TXT_CODE_87c20d47")
                },
                movement_speed: {
                  min: t("TXT_CODE_fff00e2b"),
                  max: t("TXT_CODE_a8fe5e68")
                }
              }
            },
            cat: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_fc5c0e2e"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "default-collar-color": t("TXT_CODE_dad61ed8"),
              "spawn-delay": t("TXT_CODE_e14b32b"),
              "scan-range-for-other-cats": {
                "swamp-hut": t("TXT_CODE_fbe67333"),
                village: t("TXT_CODE_fbe67333")
              },
              "breeding-delay-ticks": t("TXT_CODE_f0127843"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            cave_spider: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_fc5c0e2e"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            chicken: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_fc5c0e2e"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              retaliate: t("TXT_CODE_11cba563"),
              "breeding-delay-ticks": t("TXT_CODE_f0127843"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            cod: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            cow: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_fc5c0e2e"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "feed-mushrooms-for-mooshroom": t("TXT_CODE_1c6e2cd"),
              "breeding-delay-ticks": t("TXT_CODE_f0127843"),
              "naturally-aggressive-to-players": {
                chance: t("TXT_CODE_96c02044"),
                damage: t("TXT_CODE_7bcf35c1")
              },
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            creaking: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_fc5c0e2e"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              }
            },
            creeper: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_fc5c0e2e"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "encircle-target": t("TXT_CODE_deb2d85d"),
              "allow-griefing": t("TXT_CODE_9535104c"),
              "bypass-mob-griefing": t("TXT_CODE_57c09778"),
              "naturally-charged-chance": t("TXT_CODE_6b1984c0"),
              "explode-when-killed": t("TXT_CODE_95b08ec3"),
              "health-impacts-explosion": t("TXT_CODE_f1ed28e6"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "head-visibility-percent": t("TXT_CODE_952c2697"),
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            dolphin: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "naturally-aggressive-to-players-chance": t("TXT_CODE_96c02044"),
              "disable-treasure-searching": t("TXT_CODE_846683e4"),
              spit: {
                cooldown: t("TXT_CODE_154cd636"),
                speed: t("TXT_CODE_7a464bb4"),
                damage: t("TXT_CODE_342d5959")
              },
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            donkey: {
              "ridable-in-water": t("TXT_CODE_fc5c0e2e"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "breeding-delay-ticks": t("TXT_CODE_f0127843"),
              attributes: {
                max_health: {
                  min: t("TXT_CODE_c9f303dd"),
                  max: t("TXT_CODE_e08dfec5")
                },
                jump_strength: {
                  min: t("TXT_CODE_e1276b33"),
                  max: t("TXT_CODE_87c20d47")
                },
                movement_speed: {
                  min: t("TXT_CODE_fff00e2b"),
                  max: t("TXT_CODE_a8fe5e68")
                }
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            drowned: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_fc5c0e2e"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "can-break-doors": t("TXT_CODE_eb5fe3b6"),
              jockey: {
                "only-babies": t("TXT_CODE_eefcc58b"),
                chance: t("TXT_CODE_e29be84c"),
                "try-existing-chickens": t("TXT_CODE_9e5eb2a")
              },
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3"),
                spawn_reinforcements: t("TXT_CODE_b18c34fd")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            elder_guardian: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            ender_dragon: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_fc5c0e2e"),
              "ridable-max-y": t("TXT_CODE_3dbf8890"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "always-drop-full-exp": t("TXT_CODE_77816ef3"),
              "bypass-mob-griefing": t("TXT_CODE_a7813c72"),
              "can-ride-vehicles": t("TXT_CODE_1b858414"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              }
            },
            enderman: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_fc5c0e2e"),
              "allow-griefing": t("TXT_CODE_3816e0d9"),
              "can-despawn-with-held-block": t("TXT_CODE_4b971ef4"),
              "ignore-projectiles": t("TXT_CODE_3d07fa74"),
              "bypass-mob-griefing": t("TXT_CODE_662ae77"),
              "takes-damage-from-water": t("TXT_CODE_6cfeb776"),
              "aggressive-towards-endermites": t("TXT_CODE_f8501690"),
              "aggressive-towards-endermites-only-spawned-by-player-thrown-ender-pearls":
                t("TXT_CODE_7bdd0634"),
              "ignore-players-wearing-dragon-head": t("TXT_CODE_193605ab"),
              "disable-player-stare-aggression": t("TXT_CODE_fcb08d61"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            endermite: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_fc5c0e2e"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            evoker: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_fc5c0e2e"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "bypass-mob-griefing": t("TXT_CODE_88f7082"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            fox: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_fc5c0e2e"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "tulip-change-type": t("TXT_CODE_f728ba8"),
              "breeding-delay-ticks": t("TXT_CODE_f0127843"),
              "bypass-mob-griefing": t("TXT_CODE_1471ac98"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            frog: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_fc5c0e2e"),
              "ridable-jump-height": t("TXT_CODE_c30a5f37"),
              "breeding-delay-ticks": t("TXT_CODE_f0127843")
            },
            ghast: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_fc5c0e2e"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "ridable-max-y": t("TXT_CODE_3dbf8890"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            giant: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_fc5c0e2e"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "step-height": t("TXT_CODE_66968dc0"),
              "jump-height": t("TXT_CODE_a8f82885"),
              "movement-speed": t("TXT_CODE_66b7b26e"),
              "attack-damage": t("TXT_CODE_7f52e10d"),
              "have-ai": t("TXT_CODE_e35de72b"),
              "have-hostile-ai": t("TXT_CODE_7d81030f"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            glow_squid: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "can-fly": t("TXT_CODE_e95f3a9f"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            goat: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "breeding-delay-ticks": t("TXT_CODE_f0127843"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            guardian: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            hoglin: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_fc5c0e2e"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "breeding-delay-ticks": t("TXT_CODE_f0127843"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            horse: {
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "breeding-delay-ticks": t("TXT_CODE_f0127843"),
              attributes: {
                max_health: {
                  min: t("TXT_CODE_c9f303dd"),
                  max: t("TXT_CODE_e08dfec5")
                },
                jump_strength: {
                  min: t("TXT_CODE_e1276b33"),
                  max: t("TXT_CODE_87c20d47")
                },
                movement_speed: {
                  min: t("TXT_CODE_fff00e2b"),
                  max: t("TXT_CODE_a8fe5e68")
                }
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            husk: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_fc5c0e2e"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              jokey: {
                "only-babies": t("TXT_CODE_eefcc58b"),
                chance: t("TXT_CODE_e29be84c"),
                "try-existing-chickens": t("TXT_CODE_9e5eb2a")
              },
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3"),
                spawn_reinforcements: t("TXT_CODE_b18c34fd")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            illusioner: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_fc5c0e2e"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "naturally-spawn": t("TXT_CODE_ab4504ca"),
              "movement-speed": t("TXT_CODE_66b7b26e"),
              "follow-range": t("TXT_CODE_6f0a5984"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            iron_golem: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "healing-calms-anger": t("TXT_CODE_de1ece3c"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "can-spawn-in-air": t("TXT_CODE_8cba8d40"),
              "can-swim": t("TXT_CODE_860e2ce"),
              "poppy-calms-anger": t("TXT_CODE_8deb2054"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            llama: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "breeding-delay-ticks": t("TXT_CODE_f0127843"),
              "join-caravans": t("TXT_CODE_ccc0fec7"),
              attributes: {
                max_health: {
                  min: t("TXT_CODE_c9f303dd"),
                  max: t("TXT_CODE_e08dfec5")
                },
                jump_strength: {
                  min: t("TXT_CODE_e1276b33"),
                  max: t("TXT_CODE_87c20d47")
                },
                movement_speed: {
                  min: t("TXT_CODE_fff00e2b"),
                  max: t("TXT_CODE_a8fe5e68")
                }
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            magma_cube: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              attributes: {
                max_health: t("TXT_CODE_20bf7fdd"),
                attack_damage: t("TXT_CODE_a1833a27")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            mooshroom: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "breeding-delay-ticks": t("TXT_CODE_f0127843"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            mule: {
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "breeding-delay-ticks": t("TXT_CODE_f0127843"),
              attributes: {
                max_health: {
                  min: t("TXT_CODE_c9f303dd"),
                  max: t("TXT_CODE_e08dfec5")
                },
                jump_strength: {
                  min: t("TXT_CODE_e1276b33"),
                  max: t("TXT_CODE_87c20d47")
                },
                movement_speed: {
                  min: t("TXT_CODE_fff00e2b"),
                  max: t("TXT_CODE_a8fe5e68")
                }
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            ocelot: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "spawn-below-sea-level": t("TXT_CODE_f8bb9f10"),
              "breeeding-delay-ticks": t("TXT_CODE_f0127843"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            panda: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "breeding-delay-ticks": t("TXT_CODE_f0127843"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            parrot: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "ridable-max-y": t("TXT_CODE_3dbf8890"),
              "can-breed": t("TXT_CODE_a0a99beb"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            phantom: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "ridable-max-y": t("TXT_CODE_3dbf8890"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "attacked-by-crystal-range": t("TXT_CODE_ab9f8bfb"),
              "attacked-by-crystal-damage": t("TXT_CODE_772c4961"),
              "orbit-crystal-radius": t("TXT_CODE_cc446b0c"),
              "burn-in-light": t("TXT_CODE_43eedf83"),
              "burn-in-daylight": t("TXT_CODE_ef1f63d2"),
              "flames-on-swoop": t("TXT_CODE_3e4e61b3"),
              "ignore-players-with-torch": t("TXT_CODE_46410888"),
              "allow-griefing": t("TXT_CODE_c536b7c7"),
              flames: {
                damage: t("TXT_CODE_c91c29cd"),
                "fire-time": t("TXT_CODE_cdbd12d2")
              },
              size: {
                min: t("TXT_CODE_7b477c3"),
                max: t("TXT_CODE_e9839f54")
              },
              spawn: {
                "min-sky-darkness": t("TXT_CODE_3a51d817"),
                "only-above-sea-level": t("TXT_CODE_67b57086"),
                "only-with-visible-sky": t("TXT_CODE_e5d3b1a"),
                "local-difficulty-chance": t("TXT_CODE_afde4995"),
                "per-attempt": {
                  min: t("TXT_CODE_dfaa82f3"),
                  max: t("TXT_CODE_870b392e")
                }
              },
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3"),
                attack_damage: t("TXT_CODE_b0794aeb")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            pig: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "give-saddle-back": t("TXT_CODE_806441b5"),
              "breeding-delay-ticks": t("TXT_CODE_f0127843"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            piglin: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "bypass-mob-griefing": t("TXT_CODE_20e4ab72"),
              "portal-spawn-modifier": t("TXT_CODE_5020d183"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "head-visibility-percent": t("TXT_CODE_952c2697"),
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            piglin_brute: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            pillager: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "bypass-mob-griefing": t("TXT_CODE_aae43e39"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            polar_bear: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "breedable-item": t("TXT_CODE_c7952636"),
              "breeding-delay-ticks": t("TXT_CODE_f0127843"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_22c68314")
            },
            pufferfish: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            rabbit: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "spawn-killer-rabbit-chance": t("TXT_CODE_91a8d35c"),
              "spawn-toast-chance": t("TXT_CODE_cff4286"),
              "breeding-delay-ticks": t("TXT_CODE_f0127843"),
              "bypass-mob-griefing": t("TXT_CODE_b5e19c1"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            ravager: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "bypass-mob-griefing": t("TXT_CODE_e2be1e70"),
              "griefable-blocks": t("TXT_CODE_c840ab37"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8"),
              "avoid-rabbits": t("TXT_CODE_65e33205")
            },
            salmon: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            sheep: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "breeding-delay-ticks": t("TXT_CODE_f0127843"),
              "bypass-mob-griefing": t("TXT_CODE_95c65dc1"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            shulker: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "change-color-with-dye": t("TXT_CODE_1f62022c"),
              "spawn-from-bullet": {
                "base-cahnce": t("TXT_CODE_d0e78c58"),
                "require-open-lid": t("TXT_CODE_58aa8491"),
                "nearby-range": t("TXT_CODE_8259b3db"),
                "nearby-equation": t("TXT_CODE_196d6257"),
                "random-color": t("TXT_CODE_c51b86ff")
              },
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            silverfish: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "bypass-mob-griefing": t("TXT_CODE_1c38439b"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3"),
                movement_speed: t("TXT_CODE_66b7b26e"),
                attack_damage: t("TXT_CODE_73c7b4b")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            skeleton: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "head-visibility-percent": t("TXT_CODE_952c2697"),
              "always-drop-exp": t("TXT_CODE_c535fb8"),
              "feed-wither-roses": t("TXT_CODE_9e33445e"),
              "bow-accuracy": t("TXT_CODE_a3991784")
            },
            skeleton_horse: {
              ridable: t("TXT_CODE_6c94f562"),
              "can-swim": t("TXT_CODE_8aa7f7a0"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              attributes: {
                max_health: {
                  min: t("TXT_CODE_c9f303dd"),
                  max: t("TXT_CODE_e08dfec5")
                },
                jump_strength: {
                  min: t("TXT_CODE_e1276b33"),
                  max: t("TXT_CODE_87c20d47")
                },
                movement_speed: {
                  min: t("TXT_CODE_fff00e2b"),
                  max: t("TXT_CODE_a8fe5e68")
                }
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            slime: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              attributes: {
                max_health: t("TXT_CODE_20bf7fdd"),
                attack_damage: t("TXT_CODE_8cc8e9e2")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            sniffer: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "breeeding-delay-ticks": t("TXT_CODE_f0127843"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5")
              }
            },
            snow_golem: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "leave-trail-when-ridden": t("TXT_CODE_2266908"),
              "pumpkin-can-be-added-back": t("TXT_CODE_d9a5c0c2"),
              "min-shoot-interval-ticks": t("TXT_CODE_b9af1460"),
              "max-shoot-interval-ticks": t("TXT_CODE_3549ea82"),
              "snow-ball-modifier": t("TXT_CODE_37658aab"),
              "attack-distance": t("TXT_CODE_1732276b"),
              "bypass-mob-griefing": t("TXT_CODE_238c4c01"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            spider: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            squid: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "immune-to-EAR": t("TXT_CODE_24c2172c"),
              "water-offset-check": t("TXT_CODE_56197d09"),
              "can-fly": t("TXT_CODE_e95f3a9f"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            stray: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            strider: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "give-saddle-back": t("TXT_CODE_7702d818"),
              "breeeding-delay-ticks": t("TXT_CODE_f0127843"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            tadpole: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08")
            },
            trader_llama: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_71f715e2"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "breeding-delay-ticks": t("TXT_CODE_f0127843"),
              attributes: {
                max_health: {
                  min: t("TXT_CODE_c9f303dd"),
                  max: t("TXT_CODE_e08dfec5")
                },
                jump_strength: {
                  min: t("TXT_CODE_e1276b33"),
                  max: t("TXT_CODE_87c20d47")
                },
                movement_speed: {
                  min: t("TXT_CODE_fff00e2b"),
                  max: t("TXT_CODE_a8fe5e68")
                }
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            tropical_fish: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            turtle: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "breeding-delay-ticks": t("TXT_CODE_f0127843"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            vex: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "ridable-max-y": t("TXT_CODE_3dbf8890"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            villager: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "bypass-mob-griefing": t("TXT_CODE_d572c313"),
              "can-be-leashed": t("TXT_CODE_9d8e6107"),
              "follow-emerald-blocks": t("TXT_CODE_4745436a"),
              "allow-trading": t("TXT_CODE_e612a8a2"),
              "display-trade-item": t("TXT_CODE_34100777"),
              lobotomize: {
                enabled: t("TXT_CODE_e679197e"),
                "check-interval": t("TXT_CODE_34999278"),
                "wait-until-trade-locked": t("TXT_CODE_adcce2c7")
              },
              "minimum-demand": t("TXT_CODE_2f09a53c"),
              "can-breed": t("TXT_CODE_e812e21d"),
              "breeding-delay-ticks": t("TXT_CODE_f0127843"),
              "clerics-farm-warts": t("TXT_CODE_743c6bf3"),
              "cleric-wart-farmers-thow-warts-at-villagers": t("TXT_CODE_247f6613"),
              "spawn-iron-golem": {
                radius: t("TXT_CODE_2cfbaa90"),
                limit: t("TXT_CODE_ed38c8ae")
              },
              "search-radius": {
                "aquire-poi": t("TXT_CODE_5bba3e38"),
                "nearest-bed-sensor": t("TXT_CODE_6ac61ca1")
              },
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_f6dacecc")
            },
            vindicator: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              johnny: {
                "spawn-chance": t("TXT_CODE_877ef60c")
              },
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            wandering_trader: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "can-be-leashed": t("TXT_CODE_347ff81c"),
              "allow-trading": t("TXT_CODE_c0fcee47"),
              "follow-emerald-blocks": t("TXT_CODE_7d25f076"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            warden: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08")
            },
            witch: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            wither: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "ridable-max-y": t("TXT_CODE_3dbf8890"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "can-ride-vehicles": t("TXT_CODE_b0e39fd"),
              "play-spawn-sound": t("TXT_CODE_6c945cf8"),
              "explosion-radius": t("TXT_CODE_7f5ee413"),
              "health-regen-amount": t("TXT_CODE_d3d88894"),
              "health-regen-delay": t("TXT_CODE_233dd4f8"),
              "bypass-mob-griefing": t("TXT_CODE_f6468fe8"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            wither_skeleton: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            wolf: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "milk-cures-rabid-wolves": t("TXT_CODE_7818efd1"),
              "spawn-rabid-chancs": t("TXT_CODE_1c84154f"),
              "default-collar-color": t("TXT_CODE_feaa97d4"),
              "breeeding-delay-ticks": t("TXT_CODE_f0127843"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            zoglin: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            zombie: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              jockey: {
                "only-babies": t("TXT_CODE_eefcc58b"),
                chance: t("TXT_CODE_e29be84c"),
                "try-existing-chickens": t("TXT_CODE_9e5eb2a")
              },
              "aggressive-towards-villager-when-lagging": t("TXT_CODE_e95ee23f"),
              "bypass-mob-griefing": t("TXT_CODE_c709edac"),
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3"),
                spawn_reinforcements: t("TXT_CODE_b18c34fd")
              },
              "head-visibility-percent": t("TXT_CODE_952c2697"),
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            zombie_horse: {
              ridable: t("TXT_CODE_6c94f562"),
              "can-swim": t("TXT_CODE_a1cc8b68"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "spawn-chance": t("TXT_CODE_4d5432bd"),
              attributes: {
                max_health: {
                  min: t("TXT_CODE_c9f303dd"),
                  max: t("TXT_CODE_e08dfec5")
                },
                jump_strength: {
                  min: t("TXT_CODE_e1276b33"),
                  max: t("TXT_CODE_87c20d47")
                },
                movement_speed: {
                  min: t("TXT_CODE_fff00e2b"),
                  max: t("TXT_CODE_a8fe5e68")
                }
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            zombie_villager: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              cure: t("TXT_CODE_83d5cbbe"),
              curing_time: {
                min: t("TXT_CODE_382ec256"),
                max: t("TXT_CODE_1a77954")
              },
              jockey: {
                "only-babies": t("TXT_CODE_eefcc58b"),
                chance: t("TXT_CODE_e29be84c"),
                "try-existing-chickens": t("TXT_CODE_9e5eb2a")
              },
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3"),
                spawn_reinforcements: t("TXT_CODE_b18c34fd")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            },
            zombified_piglin: {
              ridable: t("TXT_CODE_6c94f562"),
              controllable: t("TXT_CODE_4f64db47"),
              "ridable-in-water": t("TXT_CODE_93610b08"),
              "takes-damage-from-water": t("TXT_CODE_61700077"),
              "count-as-player-kill-when-angry": t("TXT_CODE_31edf78"),
              jockey: {
                "only-babies": t("TXT_CODE_eefcc58b"),
                chance: t("TXT_CODE_e29be84c"),
                "try-existing-chickens": t("TXT_CODE_9e5eb2a")
              },
              attributes: {
                max_health: t("TXT_CODE_e08dfec5"),
                scale: t("TXT_CODE_341bc7f3"),
                spawn_reinforcements: t("TXT_CODE_b18c34fd")
              },
              "always-drop-exp": t("TXT_CODE_c535fb8")
            }
          }
        },
        "gameplay-mechanics": {
          "always-tame-in-creative": t("TXT_CODE_5d41afbf"),
          "animal-breeding-cooldown-seconds": t("TXT_CODE_8504218"),
          armorstand: {
            "step-height": t("TXT_CODE_aa47f5ed"),
            "set-name-visible-when-placing-with-custom-name": t("TXT_CODE_b1b30b86"),
            "fix-nametags": t("TXT_CODE_4f2f381b"),
            "place-with-arms-visible": t("TXT_CODE_1eea2726"),
            "can-movement-tick": t("TXT_CODE_46ba576a"),
            "can-move-in-water": t("TXT_CODE_81c2f4ae"),
            "can-move-in-water-over-fence": t("TXT_CODE_bf6bec1a")
          },
          arrow: {
            "movement-resets-despawn-counter": t("TXT_CODE_1a124d6")
          },
          boat: {
            "eject-players-on-land": t("TXT_CODE_57358a8b"),
            "do-fall-damage": t("TXT_CODE_c9d34339")
          },
          "clamp-explosion-radius": t("TXT_CODE_c59f077d"),
          "daylight-cycle-ticks": {
            daytime: t("TXT_CODE_3beb6e5c"),
            nighttime: t("TXT_CODE_d928da57")
          },
          "disable-drops-on-cramming-death": t("TXT_CODE_f9c65693"),
          "disable-oxidation-proximity-penalty": t("TXT_CODE_d245f00d"),
          drowning: {
            "air-ticks": t("TXT_CODE_6a826e8b"),
            "ticks-per-damage": t("TXT_CODE_8be0e39b"),
            "damage-from-drowning": t("TXT_CODE_d01532d")
          },
          elytra: {
            "damage-per-second": t("TXT_CODE_ebc235d5"),
            "damage-multiplied-by-speed": t("TXT_CODE_9651d0b3"),
            "kinetic-damage": t("TXT_CODE_e5a52cee"),
            "ignore-unbreaking": t("TXT_CODE_70fe20dd"),
            "damage-per-boost": {
              firework: t("TXT_CODE_eb9584d"),
              trident: t("TXT_CODE_6ed13fd")
            }
          },
          "entities-can-use-portals": t("TXT_CODE_e88884ba"),
          "entities-pick-up-loot-bypass-mob-griefing": t("TXT_CODE_c132a726"),
          "entity-blindness-multiplier": t("TXT_CODE_86076132"),
          "entity-left-handed-chance": t("TXT_CODE_2a82b720"),
          "entity-lifespan": t("TXT_CODE_3f810f66"),
          "fireballs-bypass-mob-griefing": t("TXT_CODE_8a71a4d7"),
          halloween: {
            force: t("TXT_CODE_f0e6cbc"),
            "head-chance": t("TXT_CODE_59f7c3a2")
          },
          "impose-teleport-restrictions-on-end-portals": t("TXT_CODE_448d08eb"),
          "impose-teleport-restrictions-on-gateways": t("TXT_CODE_59976e2c"),
          "impose-teleport-restrictions-on-nether-portals": t("TXT_CODE_8eb1ae3e"),
          "infinity-bow": {
            "works-without-arrows": t("TXT_CODE_f02ff9cc")
          },
          item: {
            "end-crystal": {
              "place-anywhere": t("TXT_CODE_74788d9e")
            },
            shears: {
              "damage-if-sprinting": t("TXT_CODE_ef61e06a"),
              "ignore-in-water": t("TXT_CODE_f9d92e18"),
              "ignore-in-lava": t("TXT_CODE_1f600912"),
              "sprinting-damage": t("TXT_CODE_1f991d"),
              "defuse-tnt-chance": t("TXT_CODE_d47ff7e5")
            },
            snowball: {
              extinguish: {
                fire: t("TXT_CODE_53d04392"),
                candles: t("TXT_CODE_88405298"),
                campfires: t("TXT_CODE_4a9822f")
              }
            },
            shulker_box: {
              "drop-contents-when-destroyed": t("TXT_CODE_d4dafc41")
            },
            compass: {
              "holding-shows-bossbar": t("TXT_CODE_4126fc53")
            },
            glow_berries: {
              "eat-glow-duration": t("TXT_CODE_bea85b64")
            },
            "ender-pearl": {
              damage: t("TXT_CODE_a7e1976"),
              cooldown: t("TXT_CODE_f255aee0"),
              "creative-cooldown": t("TXT_CODE_ebf479f2"),
              "endermite-spawn-chance": t("TXT_CODE_4d3b4548")
            },
            immune: {
              explosion: t("TXT_CODE_cdb213a3"),
              fire: t("TXT_CODE_e3efef30"),
              lightning: t("TXT_CODE_9aa1872c"),
              cactus: t("TXT_CODE_a092b6f0")
            }
          },
          "mending-multiplier": t("TXT_CODE_9c7f8eb8"),
          "milk-clears-beneficial-effects": t("TXT_CODE_3f65b1f2"),
          "milk-cures-bad-omen": t("TXT_CODE_e9cee11e"),
          minecart: {
            "max-speed": t("TXT_CODE_8638bb65"),
            "place-anywhere": t("TXT_CODE_97b80a79"),
            "powered-rail": {
              "boost-modifier": t("TXT_CODE_da521b59")
            },
            controllable: {
              enabled: t("TXT_CODE_99167cda"),
              "fall-damage": t("TXT_CODE_79b77e31"),
              "step-height": t("TXT_CODE_15e80e9d"),
              "hop-boost": t("TXT_CODE_d2e3b565"),
              "base-speed": t("TXT_CODE_837501b0"),
              "block-speed": t("TXT_CODE_aaecb7ff")
            }
          },
          "mob-effects": {
            "health-regen-amount": t("TXT_CODE_2c19f3b2"),
            "minimal-health-poison-amount": t("TXT_CODE_2c19f3b2"),
            "poison-degeneration-amount": t("TXT_CODE_2c19f3b2"),
            "wither-degeneration-amount": t("TXT_CODE_2c19f3b2"),
            "hunger-exhaustion-amount": t("TXT_CODE_2c19f3b2"),
            "saturation-regen-amount": t("TXT_CODE_2c19f3b2")
          },
          "mob-last-hurt-by-player-time": t("TXT_CODE_be769e64"),
          "mob-spawning": {
            "village-cats": t("TXT_CODE_6b313c"),
            "raid-patrols:": t("TXT_CODE_6b313c"),
            phantoms: t("TXT_CODE_6b313c"),
            "wandering-traders": t("TXT_CODE_6b313c"),
            "village-sieges": t("TXT_CODE_6b313c"),
            "ignore-creative-players": t("TXT_CODE_1bc41425")
          },
          "mobs-ignore-rails": t("TXT_CODE_bd84e700"),
          "note-block-ignore-above": t("TXT_CODE_b6ba38a4"),
          "persistent-droppable-entity-display-names": t("TXT_CODE_bd0aa3c7"),
          "persistent-tileentity-display-name": t("TXT_CODE_8bf86cbc"),
          "persistent-tileentity-lore": t("TXT_CODE_5eb49cd"),
          player: {
            "exp-pickup-delay-ticks": t("TXT_CODE_bb729416"),
            "shift-right-click-repairs-mending-points": t("TXT_CODE_d3ddefb5"),
            "spawn-invulnerable-ticks": t("TXT_CODE_14688b70"),
            "invulnerable-while-accepting-resource-pack": t("TXT_CODE_f0be5e98"),
            "teleport-if-outside-border": t("TXT_CODE_db07cf9e"),
            "teleport-on-nether-ceiling-damage": t("TXT_CODE_d6e124c1"),
            "allow-void-trading": t("TXT_CODE_d73c037b"),
            "totem-of-undying-works-in-inventory": t("TXT_CODE_b6d926ab"),
            "ridable-in-water": t("TXT_CODE_aaba7ab8"),
            "fix-stuck-in-portal": t("TXT_CODE_2fe6e00e"),
            "one-punch-in-creative": t("TXT_CODE_fa301a5"),
            "sleep-ignore-nearby-mobs": t("TXT_CODE_5b719d7b"),
            "can-skip-night": t("TXT_CODE_11dd341b"),
            "critical-damage-multiplier": t("TXT_CODE_3f59b48"),
            "burp-when-full": t("TXT_CODE_116db655"),
            "burp-delay": t("TXT_CODE_5e4c9793"),
            "curse-of-binding": {
              "remove-with-weakness": t("TXT_CODE_25023ad0")
            },
            "idle-timeout": {
              "kick-if-idle": t("TXT_CODE_67b4d0ba"),
              "tick-nearby-entities": t("TXT_CODE_7546cc5"),
              "mobs-target": t("TXT_CODE_ec9dec9d"),
              "count-as-sleeping": t("TXT_CODE_6d32ea04"),
              "update-tab-list": t("TXT_CODE_b0ae5b42")
            },
            "exp-dropped-on-death": {
              equation: t("TXT_CODE_9e090ff6"),
              maximum: t("TXT_CODE_9095d186")
            },
            "netherite-fire-resistance": {
              duration: t("TXT_CODE_f73a2ad2"),
              amplifier: t("TXT_CODE_ac7a5f17"),
              ambient: t("TXT_CODE_34148d2b"),
              "show-particles": t("TXT_CODE_31c10b14"),
              "show-icon": t("TXT_CODE_5aa330f0")
            },
            "projectile-damage": {
              snowball: t("TXT_CODE_21077dc4")
            }
          },
          "projectile-offset": {
            bow: t("TXT_CODE_8c18a6ac"),
            crossbow: t("TXT_CODE_1b7f826e"),
            egg: t("TXT_CODE_4fb30d0a"),
            "ender-pearl": t("TXT_CODE_abac12f6"),
            "throwable-potion": t("TXT_CODE_195215f7"),
            trident: t("TXT_CODE_afc104e0"),
            snowball: t("TXT_CODE_7991f7b3")
          },
          "projectiles-bypass-mob-griefing": t("TXT_CODE_5936d79"),
          "raid-cooldown-seconds": t("TXT_CODE_f801a9d2"),
          "rain-stops-after-sleep": t("TXT_CODE_e576a340"),
          "shovel-turns-block-to-grass-path": t("TXT_CODE_543356c1"),
          "silk-touch": {
            enabled: t("TXT_CODE_e9712ce1"),
            "minimal-level": t("TXT_CODE_95d43994"),
            tools: t("TXT_CODE_710a2e6c"),
            "spawner-name": t("TXT_CODE_4b39143b"),
            "spawner-lore": t("TXT_CODE_f773aaeb")
          },
          "thunder-stops-after-sleep": t("TXT_CODE_8677ef57"),
          "tick-fluids": t("TXT_CODE_28013340"),
          "trident-loyalty-void-return-height": t("TXT_CODE_f1f9ff1c"),
          "use-better-mending": t("TXT_CODE_1d8746ed")
        },
        "ridable-settings": {
          "babies-are-ridable": t("TXT_CODE_9fb9e6a8"),
          "untamed-tamables-are-ridable": t("TXT_CODE_ae0e0126"),
          "use-dismounts-underwater-tag": t("TXT_CODE_1f2d95eb"),
          "use-night-vision": t("TXT_CODE_36622cee")
        }
      }
    }
  },
  "paper/paper-global.yml": {
    desc: t("TXT_CODE_ca500df8"),
    config: {
      _version: t("TXT_CODE_d7ad19af"),
      "block-updates": {
        "disable-chorus-plant-updates": t("TXT_CODE_64282335"),
        "disable-mushroom-block-updates": t("TXT_CODE_86ab6e1e"),
        "disable-noteblock-updates": t("TXT_CODE_de61c48c"),
        "disable-tripwire-updates": t("TXT_CODE_e7cb14e2")
      },
      "chunk-loading-advanced": {
        "auto-config-send-distance": t("TXT_CODE_3969cb6b"),
        "player-max-concurrent-chunk-generates": t("TXT_CODE_179eb7ce"),
        "player-max-concurrent-chunk-loads": t("TXT_CODE_3897eb89")
      },
      "chunk-loading-basic": {
        "player-max-chunk-generate-rate": t("TXT_CODE_af11ca2a"),
        "player-max-chunk-load-rate": t("TXT_CODE_8dd7bc1a"),
        "player-max-chunk-send-rate": t("TXT_CODE_1dc16497")
      },
      "chunk-system": {
        "gen-parallelism": t("TXT_CODE_40ee4eaf"),
        "io-threads": t("TXT_CODE_7d197c39"),
        "worker-threads": t("TXT_CODE_7b8f01b5")
      },
      collisions: {
        "enable-player-collisions": t("TXT_CODE_a519b5ff"),
        "send-full-pos-for-hard-colliding-entities": t("TXT_CODE_84d56d69")
      },
      commands: {
        "fix-target-selector-tag-completion": t("TXT_CODE_c059faee"),
        "suggest-player-names-when-null-tab-completions": t("TXT_CODE_859b2d24"),
        "time-command-affects-all-worlds": t("TXT_CODE_e01e51f3")
      },
      console: {
        "enable-brigadier-completions": t("TXT_CODE_bb98d45"),
        "enable-brigadier-highlighting": t("TXT_CODE_871feca"),
        "has-all-permissions": t("TXT_CODE_dfa27a93")
      },
      "item-validation": {
        book: {
          author: t("TXT_CODE_e641b54c"),
          page: t("TXT_CODE_7ce3c6e"),
          title: t("TXT_CODE_e8d9c341")
        },
        "book-size": {
          "page-max": t("TXT_CODE_684eb7e3"),
          "total-multiplier": t("TXT_CODE_66b01c4e")
        },
        "display-name": t("TXT_CODE_b251fa6d"),
        "lore-line": t("TXT_CODE_143e55cb"),
        "resolve-selectors-in-books": t("TXT_CODE_bb9657ff")
      },
      logging: {
        "deobfuscate-stacktraces": t("TXT_CODE_f5feed4e")
      },
      messages: {
        kick: {
          "authentication-servers-down": t("TXT_CODE_d0c78699"),
          "connection-throttle": t("TXT_CODE_e7a42e0e"),
          "flying-player": t("TXT_CODE_fdd8effa"),
          "flying-vehicle": t("TXT_CODE_c135338")
        },
        "no-permission": t("TXT_CODE_27b7102a"),
        "use-display-name-in-quit-message": t("TXT_CODE_15022f3e")
      },
      misc: {
        "chat-threads": {
          "chat-executor-core-size": t("TXT_CODE_cd40249d"),
          "chat-executor-max-size": t("TXT_CODE_da782f63")
        },
        "compression-level": t("TXT_CODE_743ed87f"),
        "fix-entity-position-desync": t("TXT_CODE_7f0daff7"),
        "load-permissions-yml-before-plugins": t("TXT_CODE_5a280280"),
        "max-joins-per-tick": t("TXT_CODE_90edf4ad"),
        "region-file-cache-size": t("TXT_CODE_ff2c2f20"),
        "strict-advancement-dimension-check": t("TXT_CODE_8d6e5b1f"),
        "use-alternative-luck-formula": t("TXT_CODE_ef676a8f"),
        "use-dimension-type-for-custom-spawners": t("TXT_CODE_3f5a2028")
      },
      "packet-limiter": {
        "all-packets": {
          action: t("TXT_CODE_2203d4ff"),
          interval: t("TXT_CODE_36b878dc"),
          "max-packet-rate": t("TXT_CODE_2645196f")
        },
        "kick-message": t("TXT_CODE_b355c681"),
        overrides: {
          ServerboundPlaceRecipePacket: {
            action: t("TXT_CODE_312cd9f0"),
            interval: t("TXT_CODE_2db37427"),
            "max-packet-rate": t("TXT_CODE_3d4e1594")
          }
        }
      },
      "player-auto-save": {
        "max-per-tick": t("TXT_CODE_2a84466d"),
        rate: t("TXT_CODE_63a4602e")
      },
      proxies: {
        "bungee-cord": {
          "online-mode": t("TXT_CODE_2fb7e284")
        },
        "proxy-protocol": t("TXT_CODE_f5cbef5c"),
        velocity: {
          enabled: t("TXT_CODE_ab839970"),
          "online-mode": t("TXT_CODE_f2d5dd5"),
          secret: t("TXT_CODE_7f8f267f")
        }
      },
      scoreboards: {
        "save-empty-scoreboard-teams": t("TXT_CODE_d649b01e"),
        "track-plugin-scoreboards": t("TXT_CODE_13aa13dd")
      },
      "spam-limiter": {
        "incoming-packet-threshold": t("TXT_CODE_f59bbcef"),
        "recipe-spam-increment": t("TXT_CODE_d6321094"),
        "recipe-spam-limit": t("TXT_CODE_b10cbef0"),
        "tab-spam-increment": t("TXT_CODE_76c66252"),
        "tab-spam-limit": t("TXT_CODE_11f8cc36")
      },
      timings: {
        enabled: t("TXT_CODE_28bf8a1b"),
        "hidden-config-entries": t("TXT_CODE_56516e92"),
        "history-interval": t("TXT_CODE_ea579dec"),
        "history-length": t("TXT_CODE_13dfc5cb"),
        "server-name": t("TXT_CODE_e81c77bc"),
        "server-name-privacy": t("TXT_CODE_9ac035d0"),
        url: t("TXT_CODE_f8f3218a"),
        verbose: t("TXT_CODE_afd43f2")
      },
      "unsupported-settings": {
        "allow-grindstone-overstacking": t("TXT_CODE_39e7fa63"),
        "allow-headless-pistons": t("TXT_CODE_59b1cb55"),
        "allow-permanent-block-break-exploits": t("TXT_CODE_bc3e529c"),
        "allow-piston-duplication": t("TXT_CODE_f86b456a"),
        "compression-format": t("TXT_CODE_e06c1cea"),
        "perform-username-validation": t("TXT_CODE_1fe2257b")
      },
      watchdog: {
        "early-warning-delay": t("TXT_CODE_c1507dd6"),
        "early-warning-every": t("TXT_CODE_ea8aaf1b")
      }
    }
  },
  "paper/paper-world-defaults.yml": {
    desc: t("TXT_CODE_2931127f"),
    config: {
      _version: t("TXT_CODE_d7ad19af"),
      anticheat: {
        "anti-xray": {
          enabled: t("TXT_CODE_8f9533b5"),
          "engine-mode": t("TXT_CODE_6b583898"),
          "hidden-blocks": t("TXT_CODE_5d033431"),
          "lava-obscures": t("TXT_CODE_e8adf231"),
          "max-block-height": t("TXT_CODE_88419e99"),
          "replacement-blocks": t("TXT_CODE_57d76ece"),
          "update-radius": t("TXT_CODE_9341498a"),
          "use-permission": t("TXT_CODE_2493e6fc")
        },
        obfuscation: {
          items: {
            "hide-durability": t("TXT_CODE_de161f0c"),
            "hide-itemmeta": t("TXT_CODE_4d571cda"),
            "hide-itemmeta-with-visual-effects": t("TXT_CODE_ad40abfb")
          }
        }
      },
      chunks: {
        "auto-save-interval": t("TXT_CODE_f115eff"),
        "delay-chunk-unloads-by": t("TXT_CODE_83c9cb05"),
        "entity-per-chunk-save-limit": t("TXT_CODE_23178d7d"),
        "fixed-chunk-inhabited-time": t("TXT_CODE_1181762b"),
        "flush-regions-on-save": t("TXT_CODE_9268932c"),
        "max-auto-save-chunks-per-tick": t("TXT_CODE_2930907c"),
        "prevent-moving-into-unloaded-chunks": t("TXT_CODE_c7d340bc")
      },
      collisions: {
        "allow-player-cramming-damage": t("TXT_CODE_c174fbb4"),
        "allow-vehicle-collisions": t("TXT_CODE_70750fa"),
        "fix-climbing-bypassing-cramming-rule": t("TXT_CODE_60a11735"),
        "max-entity-collisions": t("TXT_CODE_b3ea8245"),
        "only-players-collide": t("TXT_CODE_aea11899")
      },
      entities: {
        "armor-stands": {
          "do-collision-entity-lookups": t("TXT_CODE_ab5d758e"),
          tick: t("TXT_CODE_5a6463fb")
        },
        behavior: {
          "allow-spider-world-border-climbing": t("TXT_CODE_b05c6947"),
          "baby-zombie-movement-modifier": t("TXT_CODE_b32f926d"),
          "disable-chest-cat-detection": t("TXT_CODE_6f7c50c2"),
          "disable-creeper-lingering-effect": t("TXT_CODE_b815f6f6"),
          "disable-player-crits": t("TXT_CODE_a22e749a"),
          behavior: {
            "door-breaking-difficulty": {
              husk: t("TXT_CODE_597c11cc"),
              vindicator: t("TXT_CODE_5f282a51"),
              zombie: t("TXT_CODE_d97eaef3"),
              zombie_villager: t("TXT_CODE_875e804b"),
              zombified_piglin: t("TXT_CODE_9d902725")
            },
            "ender-dragons-death-always-places-dragon-egg": t("TXT_CODE_af28bbfd"),
            "experience-merge-max-value": t("TXT_CODE_44454300"),
            "mobs-can-always-pick-up-loot": {
              skeletons: t("TXT_CODE_4ca9e35f"),
              zombies: t("TXT_CODE_a5f7d835")
            },
            "nerf-pigmen-from-nether-portals": t("TXT_CODE_451f9968"),
            "parrots-are-unaffected-by-player-movement": t("TXT_CODE_981c59e6"),
            "phantoms-do-not-spawn-on-creative-players": t("TXT_CODE_2a2dfc09"),
            "phantoms-only-attack-insomniacs": t("TXT_CODE_8a9fd2b4"),
            "phantoms-spawn-attempt-max-seconds": t("TXT_CODE_de854aa6"),
            "phantoms-spawn-attempt-min-seconds": t("TXT_CODE_da26028c"),
            "piglins-guard-chests": t("TXT_CODE_3243b4f8"),
            "pillager-patrols": {
              disable: t("TXT_CODE_5c3ba572"),
              "spawn-chance": t("TXT_CODE_4ad9f75d"),
              "spawn-delay": {
                "per-player": t("TXT_CODE_79d2800b"),
                ticks: t("TXT_CODE_27ecd5c9")
              },
              start: {
                day: t("TXT_CODE_337da349"),
                "per-player": t("TXT_CODE_2a07bba3")
              }
            },
            "player-insomnia-start-ticks": t("TXT_CODE_5275cb62"),
            "should-remove-dragon": t("TXT_CODE_16e58cc1"),
            "spawner-nerfed-mobs-should-jump": t("TXT_CODE_85d134f2"),
            "zombie-villager-infection-chance": t("TXT_CODE_df1ceee"),
            "zombies-target-turtle-eggs": t("TXT_CODE_b6eb8851"),
            entities: {
              "armor-stands": {
                "do-collision-entity-lookups": t("TXT_CODE_eb7966f6"),
                tick: t("TXT_CODE_ff81b31e")
              },
              behavior: {
                "allow-spider-world-border-climbing": t("TXT_CODE_fa6d3490"),
                "baby-zombie-movement-modifier": t("TXT_CODE_3e724e40"),
                "disable-chest-cat-detection": t("TXT_CODE_87f0a517"),
                "disable-creeper-lingering-effect": t("TXT_CODE_c117a10c"),
                "disable-player-crits": t("TXT_CODE_a22e749a")
              },
              "entities-target-with-follow-range": t("TXT_CODE_ca06ec2a"),
              markers: {
                tick: t("TXT_CODE_ff81b31e")
              },
              "mob-effects": {
                "immune-to-wither-effect": {
                  wither: t("TXT_CODE_d851d86d"),
                  "wither-skeleton": t("TXT_CODE_b16dc70c")
                },
                "spiders-immune-to-poison-effect": t("TXT_CODE_6d6ceab5"),
                "undead-immune-to-certain-effects": t("TXT_CODE_c698246c")
              },
              sniffer: {
                "boosted-hatch-time": t("TXT_CODE_858d8728"),
                "hatch-time": t("TXT_CODE_cee5802c")
              },
              spawning: {
                "all-chunks-are-slime-chunks": t("TXT_CODE_fd838916"),
                "alt-item-despawn-rate": {
                  enabled: t("TXT_CODE_52c8a730"),
                  items: {
                    cobblestone: t("TXT_CODE_2393baa2")
                  }
                },
                "count-all-mobs-for-spawning": t("TXT_CODE_99e98174"),
                "creative-arrow-despawn-rate": t("TXT_CODE_1ac19459"),
                "despawn-ranges": {
                  ambient: {
                    hard: t("TXT_CODE_4dab643d"),
                    soft: t("TXT_CODE_39ac8ed3")
                  },
                  axolotls: {
                    hard: t("TXT_CODE_4dab643d"),
                    soft: t("TXT_CODE_39ac8ed3")
                  },
                  creature: {
                    hard: t("TXT_CODE_4dab643d"),
                    soft: t("TXT_CODE_39ac8ed3")
                  }
                }
              },
              "tracking-range-y": {
                animal: t("TXT_CODE_6d244c20"),
                display: t("TXT_CODE_2076e91e"),
                enabled: t("TXT_CODE_52c8a730"),
                misc: t("TXT_CODE_6e23c48"),
                monster: t("TXT_CODE_b09eea4"),
                other: t("TXT_CODE_6e23c48"),
                player: t("TXT_CODE_39994770")
              }
            }
          }
        },
        "entities-target-with-follow-range": t("TXT_CODE_928653c6")
      },
      environment: {
        "disable-explosion-knockback": t("TXT_CODE_f61bf5f3"),
        "disable-ice-and-snow": t("TXT_CODE_a0eb8b37"),
        "disable-teleportation-suffocation-check": t("TXT_CODE_2793b84")
      },
      scoreboards: {
        "allow-non-player-entities-on-scoreboards": t("TXT_CODE_de150623"),
        "use-vanilla-world-scoreboard-name-coloring": t("TXT_CODE_72f69b34")
      },
      spawn: {
        "allow-using-signs-inside-spawn-protection": t("TXT_CODE_3e83082b"),
        "keep-spawn-loaded": t("TXT_CODE_9c9c19f0"),
        "keep-spawn-loaded-range": t("TXT_CODE_fb93942a")
      },
      "tick-rates": {
        behavior: {
          villager: {
            validatenearbypoi: t("TXT_CODE_a41a4820")
          }
        }
      },
      "unsupported-settings": {
        "fix-invulnerable-end-crystal-exploit": t("TXT_CODE_1301e748")
      }
    }
  },
  "pufferfish/pufferfish.yml": {
    desc: t("TXT_CODE_9213f8e3"),
    config: {
      info: {
        version: t("TXT_CODE_7214ead7")
      },
      "sentry-dsn": t("TXT_CODE_2e0e1dfa"),
      projectile: {
        "max-loads-per-tick": t("TXT_CODE_e66bfef9"),
        "max-loads-per-projectile": t("TXT_CODE_b47dbe7d")
      },
      misc: {
        "disable-method-profiler": t("TXT_CODE_90865a4")
      },
      flare: {
        url: t("TXT_CODE_a7aa53a3")
      },
      "enable-async-mob-spawning": t("TXT_CODE_41813325"),
      "tps-catchup": t("TXT_CODE_32eb350b"),
      "inactive-goal-selector-throttle": t("TXT_CODE_b5022f5d"),
      "enable-books": t("TXT_CODE_33d91ef6"),
      "allow-end-crystal-respawn": t("TXT_CODE_e707d042"),
      dab: {
        enabled: t("TXT_CODE_f738c45c"),
        "start-distance": t("TXT_CODE_bd2534da"),
        "max-tick-freq": t("TXT_CODE_a02a0849"),
        "activation-dist-mod": t("TXT_CODE_cfe187b0"),
        "blacklisted-entities": t("TXT_CODE_2e660675")
      },
      "web-services": {
        token: t("TXT_CODE_779553fb")
      },
      "enable-suffocation-optimization": t("TXT_CODE_ae566b56")
    }
  },
  "mohist/mohist.yml": {
    desc: t("TXT_CODE_6eead111"),
    config: {
      mohist: {
        lang: t("TXT_CODE_2a34c50a"),
        check_update: t("TXT_CODE_4d36128b"),
        libraries: {
          check: t("TXT_CODE_8d4e6058"),
          downloadsource: t("TXT_CODE_69ecec1")
        },
        "installation-finished": t("TXT_CODE_51289627")
      }
    }
  },
  "velocity/velocity.toml": {
    desc: t("TXT_CODE_751f9bc1"),
    config: {
      "config-version": t("TXT_CODE_139ef152"),
      bind: t("TXT_CODE_e6044db2"),
      motd: t("TXT_CODE_881213df"),
      "show-max-players": t("TXT_CODE_3378e8a5"),
      "online-mode": t("TXT_CODE_196253a2"),
      "force-key-authentication": t("TXT_CODE_4bf93cf1"),
      "prevent-client-proxy-connections": t("TXT_CODE_28bfb02"),
      "player-info-forwarding-mode": t("TXT_CODE_8956123b"),
      "forwarding-secret-file": t("TXT_CODE_75696661"),
      "announce-forge": t("TXT_CODE_eed84e8d"),
      "kick-existing-players": t("TXT_CODE_91381d5c"),
      "ping-passthrough": t("TXT_CODE_d29c8730"),
      "enable-player-address-logging": t("TXT_CODE_c52c93f7"),
      servers: t("TXT_CODE_c62e2f11"),
      try: t("TXT_CODE_7010d780"),
      "forced-hosts": t("TXT_CODE_94b6cd6e"),
      advanced: t("TXT_CODE_86caaf6c"),
      "compression-threshold": t("TXT_CODE_2ad9f3a0"),
      "compression-level": t("TXT_CODE_604d3041"),
      "login-ratelimit": t("TXT_CODE_97f5d91f"),
      "connection-timeout": t("TXT_CODE_6b69f1d"),
      "read-timeout": t("TXT_CODE_22cf9c9d"),
      "haproxy-protocol": t("TXT_CODE_90e959d2"),
      "tcp-fast-open": t("TXT_CODE_40c4894a"),
      "bungee-plugin-message-channel": t("TXT_CODE_4d00c085"),
      "show-ping-requests": t("TXT_CODE_ab4d93"),
      "failover-on-unexpected-server-disconnect": t("TXT_CODE_9878c2bc"),
      "announce-proxy-commands": t("TXT_CODE_70c3b6e"),
      "log-command-executions": t("TXT_CODE_7680e37f"),
      "log-player-connections": t("TXT_CODE_504b84d9"),
      query: t("TXT_CODE_ee8ae330"),
      enabled: t("TXT_CODE_2313aab2"),
      port: t("TXT_CODE_7e426b47"),
      map: t("TXT_CODE_e1ddd156"),
      "show-plugins": t("TXT_CODE_ac696f4d")
    }
  },
  "geyser/config.yml": {
    desc: t("TXT_CODE_1d39feca"),
    config: {
      bedrock: {
        port: t("TXT_CODE_9fe98f3"),
        "clone-remote-port": t("TXT_CODE_aeb10fea"),
        motd1: t("TXT_CODE_7b763c56"),
        motd2: t("TXT_CODE_6557efaf"),
        "server-name": t("TXT_CODE_8965b2cf"),
        "compression-level": t("TXT_CODE_92bedafa"),
        "enable-proxy-protocol": t("TXT_CODE_ce8f3dc1")
      },

      remote: {
        address: t("TXT_CODE_30aa5133"),
        port: t("TXT_CODE_65a057ec"),
        "auth-type": t("TXT_CODE_5f42b528"),
        "allow-password-authentication": t("TXT_CODE_5a56ccca"),
        "use-proxy-protocol": t("TXT_CODE_b0ad88c4"),
        "forward-hostname": t("TXT_CODE_314aa817")
      },

      "floodgate-key-file": t("TXT_CODE_28357e8b"),
      "saved-user-logins": t("TXT_CODE_4f225afd"),
      "pending-authentication-timeout": t("TXT_CODE_c24c2569"),
      "command-suggestions": t("TXT_CODE_7fc92d9"),
      "passthrough-motd": t("TXT_CODE_4ed501a1"),
      "passthrough-protocol-name": t("TXT_CODE_2bfc02ef"),
      "passthrough-player-counts": t("TXT_CODE_240252a"),
      "legacy-ping-passthrough": t("TXT_CODE_5fed0011"),
      "ping-passthrough-interval": t("TXT_CODE_19cada2a"),
      "forward-player-ping": t("TXT_CODE_6cd13a66"),
      "max-players": t("TXT_CODE_a89ab67c"),
      "debug-mode": t("TXT_CODE_85d8d0a3"),
      "allow-third-party-capes": t("TXT_CODE_59917c84"),
      "allow-third-party-ears": t("TXT_CODE_47667d86"),
      "show-cooldown": t("TXT_CODE_221bf389"),
      "show-coordinates": t("TXT_CODE_3d046b93"),
      "disable-bedrock-scaffolding": t("TXT_CODE_94d4c80c"),
      "emote-offhand-workaround": t("TXT_CODE_49c040e1"),
      "default-locale": t("TXT_CODE_1594de63"),
      "cache-images": t("TXT_CODE_cf1cb995"),
      "allow-custom-skulls": t("TXT_CODE_a6f8f61a"),
      "max-visible-custom-skulls": t("TXT_CODE_96520bce"),
      "custom-skull-render-distance": t("TXT_CODE_2a4f13d4"),
      "add-non-bedrock-items": t("TXT_CODE_ffe9366a"),
      "above-bedrock-nether-building": t("TXT_CODE_e093012e"),
      "force-resource-packs": t("TXT_CODE_4908e15b"),
      "xbox-achievements-enabled": t("TXT_CODE_fec66aca"),
      "log-player-ip-addresses": t("TXT_CODE_a1587e9d"),
      "notify-on-new-bedrock-update": t("TXT_CODE_aadfb5c0"),
      "unusable-space-block": t("TXT_CODE_9ac051fb"),

      metrics: {
        enabled: t("TXT_CODE_e2a11a62"),
        uuid: t("TXT_CODE_462ba96")
      },
      "scoreboard-packet-threshold": t("TXT_CODE_70ff09a8"),
      "enable-proxy-connections": t("TXT_CODE_bea356aa"),
      mtu: t("TXT_CODE_2c41a36d"),
      "use-direct-connection": t("TXT_CODE_92c21a08"),
      "disable-compression": t("TXT_CODE_c7362d3d"),
      "config-version": t("TXT_CODE_c8cdeeee")
    }
  },
  "forge/fml.toml": {
    desc: t("TXT_CODE_7e6a82d8"),
    config: {
      earlyWindowHeight: t("TXT_CODE_341dfd11"),
      versionCheck: t("TXT_CODE_ea04fb32"),
      earlyWindowControl: t("TXT_CODE_703cdd68"),
      earlyWindowFBScale: t("TXT_CODE_ecc99fb6"),
      earlyWindowProvider: t("TXT_CODE_55e91545"),
      earlyWindowWidth: t("TXT_CODE_bd1ff011"),
      earlyWindowMaximized: t("TXT_CODE_2ce63943"),
      defaultConfigPath: t("TXT_CODE_b02f295d"),
      disableOptimizedDFU: t("TXT_CODE_1f3aac40"),
      earlyWindowSkipGLVersions: t("TXT_CODE_44c67809"),
      maxThreads: t("TXT_CODE_e75ed0b5"),
      earlyWindowSquir: t("TXT_CODE_4fe284cd"),
      disableConfigWatcher: t("TXT_CODE_7c25c81a")
    }
  },
  "neoforge/neoforge-server.toml": {
    desc: t("TXT_CODE_5b6f3691"),
    config: {
      removeErroringBlockEntities: t("TXT_CODE_f4c15e78"),
      removeErroringEntities: t("TXT_CODE_c53c342e"),
      fullBoundingBoxLadders: t("TXT_CODE_1fec78cc"),
      permissionHandler: t("TXT_CODE_dd65f101"),
      advertiseDedicatedServerToLan: t("TXT_CODE_176b2151")
    }
  },
  "neoforge/neoforge-common.toml": {
    desc: t("TXT_CODE_1efc7c5f"),
    config: {
      logUntranslatedItemTagWarnings: t("TXT_CODE_cf393058"),
      logLegacyTagWarnings: t("TXT_CODE_b2f1310e"),
      attributeAdvancedTooltipDebugInfo: t("TXT_CODE_94d885d1")
    }
  },
  //   "mcdr/permission.yml": {},
  //   "mcdr/config.yml": {},
  "tshock/config.json": {
    desc: t("TXT_CODE_68821d80"),
    config: {
      Settings: {
        ServerPassword: t("TXT_CODE_448df2bd"),
        ServerPort: t("TXT_CODE_a379038f"),
        MaxSlots: t("TXT_CODE_e304faa"),
        ReservedSlots: t("TXT_CODE_369a4a22"),
        ServerName: t("TXT_CODE_60e3c342"),
        UseServerName: t("TXT_CODE_8a924345"),
        LogPath: t("TXT_CODE_447a9fc4"),
        DebugLogs: t("TXT_CODE_a8b402a9"),
        DisableLoginBeforeJoin: t("TXT_CODE_c4430fa6"),
        IgnoreChestStacksOnLoad: t("TXT_CODE_d9b7a6a3"),
        WorldTileProvider: "",
        AutoSave: t("TXT_CODE_9cefd73"),
        AnnounceSave: t("TXT_CODE_2c194599"),
        ShowBackupAutosaveMessages: t("TXT_CODE_cd3ae89e"),
        BackupInterval: t("TXT_CODE_40c2c2ee"),
        BackupKeepFor: t("TXT_CODE_255606fb"),
        SaveWorldOnCrash: t("TXT_CODE_bec3d0ea"),
        SaveWorldOnLastPlayerExit: t("TXT_CODE_f7f57aec"),
        InvasionMultiplier: t("TXT_CODE_3e252bc9"),
        DefaultMaximumSpawns: t("TXT_CODE_7d874fad"),
        DefaultSpawnRate: t("TXT_CODE_2033383b"),
        InfiniteInvasion: t("TXT_CODE_226b6c9e"),
        PvPMode: t("TXT_CODE_85b01e01"),
        SpawnProtection: t("TXT_CODE_7b759c13"),
        SpawnProtectionRadius: t("TXT_CODE_965360cd"),
        RangeChecks: t("TXT_CODE_443ac54f"),
        HardcoreOnly: t("TXT_CODE_d092c3b"),
        MediumcoreOnly: t("TXT_CODE_1a6d30de"),
        SoftcoreOnly: t("TXT_CODE_b5ce1069"),
        DisableBuild: t("TXT_CODE_c8c91afc"),
        DisableHardmode: t("TXT_CODE_3f739f9c"),
        DisableDungeonGuardian: t("TXT_CODE_c9e4d5c1"),
        DisableClownBombs: t("TXT_CODE_f51ce97e"),
        DisableSnowBalls: t("TXT_CODE_115e891f"),
        DisableTombstones: t("TXT_CODE_90912e04"),
        DisablePrimeBombs: t("TXT_CODE_ce953a4"),
        ForceTime: t("TXT_CODE_b0b67785"),
        DisableInvisPvP: t("TXT_CODE_584af0ab"),
        MaxRangeForDisabled: t("TXT_CODE_d764908b"),
        RegionProtectChests: t("TXT_CODE_3b346a65"),
        RegionProtectGemLocks: t("TXT_CODE_603cbc35"),
        IgnoreProjUpdate: t("TXT_CODE_33c223c"),
        IgnoreProjKill: t("TXT_CODE_da65ecbd"),
        AllowCutTilesAndBreakables: t("TXT_CODE_8c2ad2cb"),
        AllowIce: t("TXT_CODE_ba1a222b"),
        AllowCrimsonCreep: t("TXT_CODE_b30daa03"),
        AllowCorruptionCreep: t("TXT_CODE_372e97f4"),
        AllowHallowCreep: "",
        StatueSpawn200: t("TXT_CODE_66820e23"),
        StatueSpawn600: t("TXT_CODE_32bf92a1"),
        StatueSpawnWorld: t("TXT_CODE_3b4260f8"),
        PreventBannedItemSpawn: t("TXT_CODE_cd62c9d4"),
        PreventDeadModification: t("TXT_CODE_ed9bab79"),
        PreventInvalidPlaceStyle: t("TXT_CODE_fe82609a"),
        ForceXmas: t("TXT_CODE_b649a71a"),
        ForceHalloween: t("TXT_CODE_ac52ad06"),
        AllowAllowedGroupsToSpawnBannedItems: t("TXT_CODE_3f3e734b"),
        RespawnSeconds: t("TXT_CODE_288830f4"),
        RespawnBossSeconds: t("TXT_CODE_b45e73fb"),
        AnonymousBossInvasions: t("TXT_CODE_87e18bb5"),
        MaxHP: t("TXT_CODE_3f470950"),
        MaxMP: t("TXT_CODE_95dfd5bd"),
        BombExplosionRadius: t("TXT_CODE_f71475e2"),
        GiveItemsDirectly: t("TXT_CODE_260d96a0"),
        DefaultRegistrationGroupName: t("TXT_CODE_cfd64e73"),
        DefaultGuestGroupName: t("TXT_CODE_90896d08"),
        RememberLeavePos: t("TXT_CODE_52b31aef"),
        MaximumLoginAttempts: t("TXT_CODE_3e98e22f"),
        KickOnMediumcoreDeath: "",
        MediumcoreKickReason: "",
        BanOnMediumcoreDeath: "",
        MediumcoreBanReason: "",
        DisableDefaultIPBan: t("TXT_CODE_3855e22f"),
        EnableWhitelist: t("TXT_CODE_d0e37f20"),
        WhitelistKickReason: t("TXT_CODE_f160d877"),
        ServerFullReason: t("TXT_CODE_4ff6a125"),
        ServerFullNoReservedReason: t("TXT_CODE_5f23008"),
        KickOnHardcoreDeath: t("TXT_CODE_95340802"),
        HardcoreKickReason: t("TXT_CODE_129475a7"),
        BanOnHardcoreDeath: t("TXT_CODE_8ab0cc1a"),
        HardcoreBanReason: t("TXT_CODE_b7c8eb9f"),
        KickProxyUsers: t("TXT_CODE_78223e62"),
        RequireLogin: t("TXT_CODE_cb1fef78"),
        AllowLoginAnyUsername: t("TXT_CODE_f2577f17"),
        AllowRegisterAnyUsername: t("TXT_CODE_206f0c11"),
        MinimumPasswordLength: t("TXT_CODE_ab7672dd"),
        BCryptWorkFactor: "",
        DisableUUIDLogin: t("TXT_CODE_94002354"),
        KickEmptyUUID: t("TXT_CODE_7141866a"),
        TilePaintThreshold: t("TXT_CODE_6d912e27"),
        KickOnTilePaintThresholdBroken: t("TXT_CODE_192078c6"),
        MaxDamage: t("TXT_CODE_5e6e46bb"),
        MaxProjDamage: t("TXT_CODE_e1af7c8b"),
        KickOnDamageThresholdBroken: t("TXT_CODE_57417f60"),
        TileKillThreshold: t("TXT_CODE_4fb66c81"),
        KickOnTileKillThresholdBroken: t("TXT_CODE_4aba9745"),
        TilePlaceThreshold: t("TXT_CODE_17cbacf6"),
        KickOnTilePlaceThresholdBroken: t("TXT_CODE_617701dc"),
        TileLiquidThreshold: "",
        KickOnTileLiquidThresholdBroken: t("TXT_CODE_9394aadf"),
        ProjIgnoreShrapnel: t("TXT_CODE_c9c27711"),
        ProjectileThreshold: t("TXT_CODE_6d6c7e9a"),
        KickOnProjectileThresholdBroken: t("TXT_CODE_946d4401"),
        HealOtherThreshold: t("TXT_CODE_449efd26"),
        KickOnHealOtherThresholdBroken: t("TXT_CODE_e0643e6f"),
        SuppressPermissionFailureNotices: t("TXT_CODE_decf21ee"),
        DisableModifiedZenith: t("TXT_CODE_d4b058a9"),
        DisableCustomDeathMessages: t("TXT_CODE_5143c584"),
        CommandSpecifier: t("TXT_CODE_235cd293"),
        CommandSilentSpecifier: t("TXT_CODE_1049cbd1"),
        DisableSpewLogs: t("TXT_CODE_f29d5d2"),
        DisableSecondUpdateLogs: t("TXT_CODE_ef97db20"),
        SuperAdminChatRGB: t("TXT_CODE_b3127cba"),
        SuperAdminChatPrefix: t("TXT_CODE_24843187"),
        SuperAdminChatSuffix: t("TXT_CODE_5bc16b9a"),
        EnableGeoIP: t("TXT_CODE_6bf4665b"),
        DisplayIPToAdmins: t("TXT_CODE_1b763e24"),
        ChatFormat: t("TXT_CODE_2374966e"),
        ChatAboveHeadsFormat: t("TXT_CODE_97535446"),
        EnableChatAboveHeads: t("TXT_CODE_9c39c7ae"),
        BroadcastRGB: t("TXT_CODE_11d2ab6b"),
        StorageType: t("TXT_CODE_8e5f865e"),
        SqliteDBPath: t("TXT_CODE_90f00679"),
        MySqlHost: t("TXT_CODE_17f1f440"),
        MySqlDbName: t("TXT_CODE_d0b40386"),
        MySqlUsername: t("TXT_CODE_929a9ee4"),
        MySqlPassword: t("TXT_CODE_3a5b3d2d"),
        UseSqlLogs: t("TXT_CODE_ce99026b"),
        RevertToTextLogsOnSqlFailures: t("TXT_CODE_2ba4bf6f"),
        RestApiEnabled: t("TXT_CODE_6683b887"),
        RestApiPort: t("TXT_CODE_daca92c1"),
        LogRest: t("TXT_CODE_fdd1a61"),
        EnableTokenEndpointAuthentication: t("TXT_CODE_b9d7fe43"),
        RESTMaximumRequestsPerInterval: t("TXT_CODE_8298bfde"),
        RESTRequestBucketDecreaseIntervalMinutes: t("TXT_CODE_5b190bc4"),
        ApplicationRestTokens: t("TXT_CODE_f0ca2761")
      }
    }
  },
  "leaves/leaves.yml": {
    desc: t("TXT_CODE_LEAVES_DESCRIPTION"),
    config: {
      "config-version": t("TXT_CODE_LEAVES_CONFIG_VERSION"),
      settings: {
        misc: {
          "auto-update": {
            enable: t("TXT_CODE_LEAVES_AUTO_UPDATE_ENABLE"),
            "download-source": t("TXT_CODE_LEAVES_DOWNLOAD_SOURCE"),
            "allow-experimental": t("TXT_CODE_LEAVES_ALLOW_EXPERIMENTAL")
          },
          "extra-yggdrasil-service": {
            enable: t("TXT_CODE_LEAVES_YGGDRASIL_ENABLE"),
            "login-protect": t("TXT_CODE_LEAVES_LOGIN_PROTECT")
          },
          "disable-method-profiler": t("TXT_CODE_LEAVES_DISABLE_METHOD_PROFILER"),
          "no-chat-sign": t("TXT_CODE_LEAVES_NO_CHAT_SIGN"),
          "dont-respond-ping-before-start-fully": t("TXT_CODE_LEAVES_DONT_RESPOND_PING"),
          "server-lang": t("TXT_CODE_LEAVES_SERVER_LANG"),
          "server-mod-name": t("TXT_CODE_LEAVES_SERVER_MOD_NAME"),
          "bstats-privacy-mode": t("TXT_CODE_LEAVES_BSTATS_PRIVACY_MODE"),
          "force-minecraft-command": t("TXT_CODE_LEAVES_FORCE_MINECRAFT_COMMAND"),
          "leaves-packet-event": t("TXT_CODE_LEAVES_PACKET_EVENT")
        },
        modify: {
          fakeplayer: {
            enable: t("TXT_CODE_LEAVES_FAKEPLAYER_ENABLE"),
            limit: t("TXT_CODE_LEAVES_FAKEPLAYER_LIMIT"),
            prefix: t("TXT_CODE_LEAVES_FAKEPLAYER_PREFIX"),
            suffix: t("TXT_CODE_LEAVES_FAKEPLAYER_SUFFIX"),
            "regen-amount": t("TXT_CODE_LEAVES_FAKEPLAYER_REGEN_AMOUNT"),
            "always-send-data": t("TXT_CODE_LEAVES_FAKEPLAYER_ALWAYS_SEND_DATA"),
            "resident-fakeplayer": t("TXT_CODE_LEAVES_FAKEPLAYER_RESIDENT"),
            "open-fakeplayer-inventory": t("TXT_CODE_LEAVES_FAKEPLAYER_OPEN_INVENTORY"),
            "skip-sleep-check": t("TXT_CODE_LEAVES_FAKEPLAYER_SKIP_SLEEP_CHECK"),
            "spawn-phantom": t("TXT_CODE_LEAVES_FAKEPLAYER_SPAWN_PHANTOM"),
            "use-action": t("TXT_CODE_LEAVES_FAKEPLAYER_USE_ACTION"),
            "modify-config": t("TXT_CODE_LEAVES_FAKEPLAYER_MODIFY_CONFIG"),
            "manual-save-and-load": t("TXT_CODE_LEAVES_FAKEPLAYER_MANUAL_SAVE"),
            "cache-skin": t("TXT_CODE_LEAVES_FAKEPLAYER_CACHE_SKIN"),
            "tick-type": t("TXT_CODE_LEAVES_FAKEPLAYER_TICK_TYPE")
          },
          "elytra-aeronautics": {
            "no-chunk-load": t("TXT_CODE_LEAVES_ELYTRA_NO_CHUNK_LOAD"),
            "no-chunk-height": t("TXT_CODE_LEAVES_ELYTRA_NO_CHUNK_HEIGHT"),
            "no-chunk-speed": t("TXT_CODE_LEAVES_ELYTRA_NO_CHUNK_SPEED"),
            message: t("TXT_CODE_LEAVES_ELYTRA_MESSAGE"),
            "message-start": t("TXT_CODE_LEAVES_ELYTRA_MESSAGE_START"),
            "message-end": t("TXT_CODE_LEAVES_ELYTRA_MESSAGE_END")
          },
          "redstone-shears-wrench": t("TXT_CODE_LEAVES_REDSTONE_SHEARS_WRENCH"),
          "budding-amethyst-can-push-by-piston": t("TXT_CODE_LEAVES_AMETHYST_PUSHABLE"),
          "spectator-dont-get-advancement": t("TXT_CODE_LEAVES_SPECTATOR_NO_ADVANCEMENT"),
          "stick-change-armorstand-arm-status": t("TXT_CODE_LEAVES_STICK_CHANGE_ARMORSTAND"),
          "snowball-and-egg-can-knockback-player": t("TXT_CODE_LEAVES_SNOWBALL_KNOCKBACK"),
          "flatten-triangular-distribution": t("TXT_CODE_LEAVES_FLATTEN_TRIANGULAR_DIST"),
          "player-operation-limiter": t("TXT_CODE_LEAVES_PLAYER_OPERATION_LIMITER"),
          "renewable-elytra": t("TXT_CODE_LEAVES_RENEWABLE_ELYTRA"),
          "stackable-shulker-boxes": t("TXT_CODE_LEAVES_STACKABLE_SHULKER_BOXES"),
          "force-void-trade": t("TXT_CODE_LEAVES_FORCE_VOID_TRADE"),
          "mc-technical-survival-mode": t("TXT_CODE_LEAVES_TECHNICAL_SURVIVAL_MODE"),
          "return-nether-portal-fix": t("TXT_CODE_LEAVES_RETURN_NETHER_PORTAL_FIX"),
          "use-vanilla-random": t("TXT_CODE_LEAVES_USE_VANILLA_RANDOM"),
          "fix-update-suppression-crash": t("TXT_CODE_LEAVES_FIX_UPDATE_SUPPRESSION"),
          "bedrock-break-list": t("TXT_CODE_LEAVES_BEDROCK_BREAK_LIST"),
          "disable-distance-check-for-use-item": t("TXT_CODE_LEAVES_DISABLE_DISTANCE_CHECK"),
          "no-feather-falling-trample": t("TXT_CODE_LEAVES_NO_FEATHER_FALLING_TRAMPLE"),
          "shared-villager-discounts": t("TXT_CODE_LEAVES_SHARED_VILLAGER_DISCOUNTS"),
          "disable-check-out-of-order-command": t("TXT_CODE_LEAVES_DISABLE_OUT_OF_ORDER_CHECK"),
          "despawn-enderman-with-block": t("TXT_CODE_LEAVES_DESPAWN_ENDERMAN_WITH_BLOCK"),
          "creative-no-clip": t("TXT_CODE_LEAVES_CREATIVE_NO_CLIP"),
          "shave-snow-layers": t("TXT_CODE_LEAVES_SHAVE_SNOW_LAYERS"),
          "ignore-lc": t("TXT_CODE_LEAVES_IGNORE_LC"),
          "disable-packet-limit": t("TXT_CODE_LEAVES_DISABLE_PACKET_LIMIT"),
          "lava-riptide": t("TXT_CODE_LEAVES_LAVA_RIPTIDE"),
          "no-block-update-command": t("TXT_CODE_LEAVES_NO_BLOCK_UPDATE_COMMAND"),
          "no-tnt-place-update": t("TXT_CODE_LEAVES_NO_TNT_PLACE_UPDATE"),
          "raider-die-skip-self-raid-check": t("TXT_CODE_LEAVES_RAIDER_DIE_SKIP_RAID_CHECK"),
          "container-passthrough": t("TXT_CODE_LEAVES_CONTAINER_PASSTHROUGH"),
          "avoid-anvil-too-expensive": t("TXT_CODE_LEAVES_AVOID_ANVIL_EXPENSIVE"),
          "bow-infinity-fix": t("TXT_CODE_LEAVES_BOW_INFINITY_FIX"),
          "hopper-counter": t("TXT_CODE_LEAVES_HOPPER_COUNTER"),
          "spider-jockeys-drop-gapples": t("TXT_CODE_LEAVES_SPIDER_JOCKEYS_DROP_GAPPLES"),
          "renewable-deepslate": t("TXT_CODE_LEAVES_RENEWABLE_DEEPSLATE"),
          "renewable-sponges": t("TXT_CODE_LEAVES_RENEWABLE_SPONGES"),
          "renewable-coral": t("TXT_CODE_LEAVES_RENEWABLE_CORAL"),
          "fast-resume": t("TXT_CODE_LEAVES_FAST_RESUME"),
          "force-peaceful-mode-switch": {
            tick: t("TXT_CODE_LEAVES_FORCE_PEACEFUL_TICK")
          },
          "disable-vault-blacklist": t("TXT_CODE_LEAVES_DISABLE_VAULT_BLACKLIST"),
          "minecraft-old": {
            "void-trade": t("TXT_CODE_LEAVES_OLD_VOID_TRADE"),
            "block-updater": {
              "instant-block-updater-reintroduced": t("TXT_CODE_LEAVES_INSTANT_BLOCK_UPDATER"),
              "cce-update-suppression": t("TXT_CODE_LEAVES_CCE_UPDATE_SUPPRESSION"),
              "redstone-wire-dont-connect-if-on-trapdoor": t(
                "TXT_CODE_LEAVES_REDSTONE_NO_TRAPDOOR_CONNECT"
              ),
              "old-block-entity-behaviour": t("TXT_CODE_LEAVES_OLD_BLOCK_ENTITY_BEHAVIOUR")
            },
            "shears-in-dispenser-can-zero-amount": t("TXT_CODE_LEAVES_SHEARS_ZERO_AMOUNT"),
            "armor-stand-cant-kill-by-mob-projectile": t(
              "TXT_CODE_LEAVES_ARMOR_STAND_NO_PROJECTILE_KILL"
            ),
            "villager-infinite-discounts": t("TXT_CODE_LEAVES_VILLAGER_INFINITE_DISCOUNTS"),
            "copper-bulb-1gt-delay": t("TXT_CODE_LEAVES_COPPER_BULB_DELAY"),
            "crafter-1gt-delay": t("TXT_CODE_LEAVES_CRAFTER_DELAY"),
            "zero-tick-plants": t("TXT_CODE_LEAVES_ZERO_TICK_PLANTS"),
            "rng-fishing": t("TXT_CODE_LEAVES_RNG_FISHING"),
            "allow-grindstone-overstacking": t("TXT_CODE_LEAVES_GRINDSTONE_OVERSTACKING"),
            "allow-entity-portal-with-passenger": t("TXT_CODE_LEAVES_ENTITY_PORTAL_PASSENGER"),
            "disable-gateway-portal-entity-ticking": t("TXT_CODE_LEAVES_DISABLE_GATEWAY_TICKING"),
            "disable-LivingEntity-ai-step-alive-check": t("TXT_CODE_LEAVES_DISABLE_AI_STEP_CHECK"),
            "fix-fortress-mob-spawn": t("TXT_CODE_LEAVES_FIX_FORTRESS_SPAWN"),
            "old-hopper-suck-in-behavior": t("TXT_CODE_LEAVES_OLD_HOPPER_BEHAVIOR"),
            "revert-raid-changes": {
              "allow-bad-omen-trigger-raid": t("TXT_CODE_LEAVES_ALLOW_BAD_OMEN_RAID"),
              "give-bad-omen-when-kill-patrol-leader": t("TXT_CODE_LEAVES_GIVE_BAD_OMEN"),
              "use-old-find-spawn-position": t("TXT_CODE_LEAVES_OLD_SPAWN_POSITION"),
              "skip-height-check": t("TXT_CODE_LEAVES_SKIP_HEIGHT_CHECK")
            },
            "allow-anvil-destroy-item-entities": t("TXT_CODE_LEAVES_ANVIL_DESTROY_ITEMS"),
            "string-tripwire-hook-duplicate": t("TXT_CODE_LEAVES_TRIPWIRE_HOOK_DUPLICATE")
          }
        },
        performance: {
          "optimized-dragon-respawn": t("TXT_CODE_LEAVES_OPTIMIZED_DRAGON_RESPAWN"),
          "dont-send-useless-entity-packets": t("TXT_CODE_LEAVES_NO_USELESS_ENTITY_PACKETS"),
          "enable-suffocation-optimization": t("TXT_CODE_LEAVES_ENABLE_SUFFOCATION_OPTIMIZATION"),
          "check-spooky-season-once-an-hour": t("TXT_CODE_LEAVES_CHECK_SPOOKY_SEASON"),
          "inactive-goal-selector-disable": t("TXT_CODE_LEAVES_INACTIVE_GOAL_SELECTOR_DISABLE"),
          "reduce-entity-allocations": t("TXT_CODE_LEAVES_REDUCE_ENTITY_ALLOCATIONS"),
          "cache-climb-check": t("TXT_CODE_LEAVES_CACHE_CLIMB_CHECK"),
          "reduce-chuck-load-and-lookup": t("TXT_CODE_LEAVES_REDUCE_CHUNK_LOAD"),
          "cache-ignite-odds": t("TXT_CODE_LEAVES_CACHE_IGNITE_ODDS"),
          "faster-chunk-serialization": t("TXT_CODE_LEAVES_FASTER_CHUNK_SERIALIZATION"),
          "skip-secondary-POI-sensor-if-absent": t("TXT_CODE_LEAVES_SKIP_SECONDARY_POI_SENSOR"),
          "store-mob-counts-in-array": t("TXT_CODE_LEAVES_STORE_MOB_COUNTS_IN_ARRAY"),
          "optimize-noise-generation": t("TXT_CODE_LEAVES_OPTIMIZE_NOISE_GENERATION"),
          "optimize-sun-burn-tick": t("TXT_CODE_LEAVES_OPTIMIZE_SUN_BURN_TICK"),
          "optimized-CubePointRange": t("TXT_CODE_LEAVES_OPTIMIZED_CUBE_POINT_RANGE"),
          "check-frozen-ticks-before-landing-block": t("TXT_CODE_LEAVES_CHECK_FROZEN_TICKS"),
          "skip-entity-move-if-movement-is-zero": t("TXT_CODE_LEAVES_SKIP_ZERO_MOVEMENT"),
          "skip-cloning-advancement-criteria": t("TXT_CODE_LEAVES_SKIP_CLONING_ADVANCEMENT"),
          "skip-negligible-planar-movement-multiplication": t(
            "TXT_CODE_LEAVES_SKIP_NEGLIGIBLE_MOVEMENT"
          ),
          "fix-villagers-dont-release-memory": t("TXT_CODE_LEAVES_FIX_VILLAGERS_MEMORY"),
          remove: {
            "tick-guard-lambda": t("TXT_CODE_LEAVES_REMOVE_TICK_GUARD_LAMBDA"),
            "damage-lambda": t("TXT_CODE_LEAVES_REMOVE_DAMAGE_LAMBDA")
          }
        },
        protocol: {
          bladeren: {
            protocol: t("TXT_CODE_LEAVES_BLADEREN_PROTOCOL"),
            "mspt-sync-protocol": t("TXT_CODE_LEAVES_MSPT_SYNC_PROTOCOL"),
            "mspt-sync-tick-interval": t("TXT_CODE_LEAVES_MSPT_SYNC_TICK_INTERVAL")
          },
          syncmatica: {
            enable: t("TXT_CODE_LEAVES_SYNCMATICA_ENABLE"),
            quota: t("TXT_CODE_LEAVES_SYNCMATICA_QUOTA"),
            "quota-limit": t("TXT_CODE_LEAVES_SYNCMATICA_QUOTA_LIMIT")
          },
          pca: {
            "pca-sync-protocol": t("TXT_CODE_LEAVES_PCA_SYNC_PROTOCOL"),
            "pca-sync-player-entity": t("TXT_CODE_LEAVES_PCA_SYNC_PLAYER_ENTITY")
          },
          appleskin: {
            protocol: t("TXT_CODE_LEAVES_APPLESKIN_PROTOCOL"),
            "sync-tick-interval": t("TXT_CODE_LEAVES_APPLESKIN_SYNC_INTERVAL")
          },
          servux: {
            "structure-protocol": t("TXT_CODE_LEAVES_SERVUX_STRUCTURE_PROTOCOL"),
            "entity-protocol": t("TXT_CODE_LEAVES_SERVUX_ENTITY_PROTOCOL"),
            "hud-metadata-protocol": t("TXT_CODE_LEAVES_SERVUX_HUD_METADATA_PROTOCOL"),
            "hud-metadata-protocol-share-seed": t("TXT_CODE_LEAVES_SERVUX_HUD_SHARE_SEED"),
            "litematics-protocol": t("TXT_CODE_LEAVES_SERVUX_LITEMATICS_PROTOCOL")
          },
          "bbor-protocol": t("TXT_CODE_LEAVES_BBOR_PROTOCOL"),
          "jade-protocol": t("TXT_CODE_LEAVES_JADE_PROTOCOL"),
          "alternative-block-placement": t("TXT_CODE_LEAVES_ALTERNATIVE_BLOCK_PLACEMENT"),
          "xaero-map-protocol": t("TXT_CODE_LEAVES_XAERO_MAP_PROTOCOL"),
          "xaero-map-server-id": t("TXT_CODE_LEAVES_XAERO_MAP_SERVER_ID"),
          "leaves-carpet-support": t("TXT_CODE_LEAVES_CARPET_SUPPORT"),
          "lms-paster-protocol": t("TXT_CODE_LEAVES_LMS_PASTER_PROTOCOL"),
          "rei-server-protocol": t("TXT_CODE_LEAVES_REI_SERVER_PROTOCOL"),
          "chat-image-protocol": t("TXT_CODE_LEAVES_CHAT_IMAGE_PROTOCOL")
        },
        region: {
          format: t("TXT_CODE_LEAVES_REGION_FORMAT"),
          linear: {
            version: t("TXT_CODE_LEAVES_LINEAR_VERSION"),
            "auto-convert-anvil-to-linear": t("TXT_CODE_LEAVES_AUTO_CONVERT_ANVIL"),
            "flush-max-threads": t("TXT_CODE_LEAVES_FLUSH_MAX_THREADS"),
            "flush-delay-ms": t("TXT_CODE_LEAVES_FLUSH_DELAY_MS"),
            "use-virtual-thread": t("TXT_CODE_LEAVES_USE_VIRTUAL_THREAD"),
            "compression-level": t("TXT_CODE_LEAVES_COMPRESSION_LEVEL")
          }
        },
        fix: {
          "vanilla-hopper": t("TXT_CODE_LEAVES_FIX_VANILLA_HOPPER"),
          "vanilla-display-name": t("TXT_CODE_LEAVES_FIX_VANILLA_DISPLAY_NAME")
        }
      }
    }
  },
  "terraria/serverconfig.txt": {
    desc: t("TXT_CODE_TERRARIA_CONFIG_DESC"),
    config: {
      port: t("TXT_CODE_TERRARIA_PORT"),
      password: t("TXT_CODE_TERRARIA_PASSWORD"),
      world: t("TXT_CODE_TERRARIA_WORLD"),
      logpath: t("TXT_CODE_TERRARIA_LOG_PATH"),
      maxplayers: t("TXT_CODE_TERRARIA_MAX_PLAYERS"),
      motd: t("TXT_CODE_TERRARIA_MOTD")
    }
  },
  "hytale/config.json": {
    desc: t("TXT_CODE_HYTALE_CONFIG_DESC"),
    config: {
      ServerName: t("TXT_CODE_e59f909f"),
      MOTD: t("TXT_CODE_b5ebbc0b"),
      Password: t("TXT_CODE_d417058f"),
      MaxPlayers: t("TXT_CODE_6702c53e"),
      MaxViewRadius: t("TXT_CODE_d99ffe16"),
      Defaults: {
        World: t("TXT_CODE_2b58a46"),
        GameMode: t("TXT_CODE_783807df")
      },
      DisplayTmpTagsInStrings: t("TXT_CODE_938b5975"),
      PlayerStorage: {
        Type: t("TXT_CODE_78d240bf")
      }
    }
  }
};
