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
  //   "mcdr/permission.yml": {},
  //   "mcdr/config.yml": {},
  "tshock/config.json": {
    desc: t("此配置文件为 Tshock 服务端常见的配置文件。"),
    config: {
      Settings: {
        ServerPassword: t("加入服务器所需的密码"),
        ServerPort: t("服务器端口"),
        MaxSlots: t(
          "最大同时连接数。如果你想让玩家被踢出“服务器已满”的设定，请将其设置为你设置的最大玩家数，然后将泰拉瑞亚的最大玩家设置为2个或以上"
        ),
        ReservedSlots: t("预留插槽。超过最大服务器插槽数的保留玩家可以加入的保留插槽数"),
        ServerName: t("服务器名称。如果 UseServerName 为 true，则在会话期间替换世界名称"),
        UseServerName: t("是否使用 ServerName 代替世界名称"),
        LogPath: t("日志路径"),
        DebugLogs: t("启用调试日志"),
        DisableLoginBeforeJoin: t("阻止用户在完成连接之前登录"),
        IgnoreChestStacksOnLoad: t("允许箱子中物品的堆叠在世界加载期间超出堆叠限制"),
        WorldTileProvider: "",
        AutoSave: t("自动保存"),
        AnnounceSave: t("保存时是否发出公告"),
        ShowBackupAutosaveMessages: t("显示备份自动保存消息"),
        BackupInterval: t("备份之间的间隔（以分钟为单位）。备份存储在 tshock/backups 文件夹中"),
        BackupKeepFor: t("备份的保留时间（以分钟为单位）"),
        SaveWorldOnCrash: t("如果服务器因未经处理的异常而崩溃，是否保存世界"),
        SaveWorldOnLastPlayerExit: t("在最后一个玩家断开连接时保存世界"),
        InvasionMultiplier: t("入侵事件的大小"),
        DefaultMaximumSpawns: t("每波生成的默认最大生物数。越高意味着那一波中的生物更多"),
        DefaultSpawnRate: t("波之间的延迟。值越低，生物越多"),
        InfiniteInvasion: t("启用永无止境的入侵事件"),
        PvPMode: t("设置 PvP 模式。有效类型为：“normal”、“always”和“disabled”"),
        SpawnProtection: t("防止默认瓷砖生成在生成保护半径内"),
        SpawnProtectionRadius: t("生成保护半径"),
        RangeChecks: t("根据玩家与其瓷砖位置之间的距离启用或禁用反作弊范围检查"),
        HardcoreOnly: t("仅允许 hardcore 玩家连接"),
        MediumcoreOnly: t("阻止 softcore 玩家连接"),
        SoftcoreOnly: t("阻止 non-softcore 玩家连接"),
        DisableBuild: t("禁用放置、移动瓷砖"),
        DisableHardmode: t("禁用困难模式"),
        DisableDungeonGuardian: t("防止地牢守卫在将玩家送往其出生点时生成"),
        DisableClownBombs: t("禁用小丑炸弹生成"),
        DisableSnowBalls: t("禁用雪球生成"),
        DisableTombstones: t("禁用玩家死亡时掉落墓碑"),
        DisablePrimeBombs: t("禁用 PrimeBombs"),
        ForceTime: t("强制世界时间为正常时间，白天或黑"),
        DisableInvisPvP: t("禁用隐身药水的效果"),
        MaxRangeForDisabled: t("禁止玩家可以移动的最大距离（以瓷砖为单位）"),
        RegionProtectChests: t("区域保护是否应适用于箱子"),
        RegionProtectGemLocks: t("区域保护是否适用于钻石宝石锁"),
        IgnoreProjUpdate: t("忽略检查以查看玩家是否“可以”更新射弹"),
        IgnoreProjKill: t("忽略检查玩家是否“可以”杀死射弹"),
        AllowCutTilesAndBreakables: t("允许玩家打破无法建造的临时瓷砖（草、花盆等）"),
        AllowIce: t("允许玩家在无法建造的地方放置冰"),
        AllowCrimsonCreep: t("当世界处于困难模式时，允许 CrimsonCreep"),
        AllowCorruptionCreep: t("当世界处于困难模式时，允许腐败蔓延"),
        AllowHallowCreep: "",
        StatueSpawn200: t("在停止生成之前，雕像可以在 200 像素内生成多少个 NPC。默认值 3"),
        StatueSpawn600: t("在停止生成之前，雕像可以在 600 像素内生成多少个 NPC。默认值 6"),
        StatueSpawnWorld: t("雕像在停止生成之前可以生成多少个 NPC。默认值 10。"),
        PreventBannedItemSpawn: t("阻止违禁物品生成或通过命令调出"),
        PreventDeadModification: t("阻止玩家在死亡时与世界互动"),
        PreventInvalidPlaceStyle: t("防止玩家放置样式无效的瓷砖"),
        ForceXmas: t("强制全年举办仅限圣诞节的活动"),
        ForceHalloween: t("强制全年举办仅限万圣节的活动"),
        AllowAllowedGroupsToSpawnBannedItems: t(
          "允许禁止项目允许列表中的组生成被禁止的项目，即使 PreventBannedItemSpawn 设置为 true"
        ),
        RespawnSeconds: t(
          "玩家在重生之前必须等待的秒数。有效范围：0（默认值）到 15 秒。使用风险自负"
        ),
        RespawnBossSeconds: t(
          "如果附近有 Boss，玩家在重生之前必须等待的秒数。有效范围：0（默认值）到 30 秒。使用风险自负"
        ),
        AnonymousBossInvasions: t("是否广播 Boss 生成或入侵开始"),
        MaxHP: t("在装备增益之前，玩家可以拥有的最大生命值"),
        MaxMP: t("在装备增益之前，玩家可以拥有的最大 MP"),
        BombExplosionRadius: t("炸弹从爆炸点开始可以影响瓷砖的射程（以格为单位）"),
        GiveItemsDirectly: t(
          "如果设置为 true，则给予玩家的物品将直接插入到他们的物品栏中。否则，给予玩家的物品将作为掉落的物品生成。实验性功能，可能无法正常工作或导致物品丢失"
        ),
        DefaultRegistrationGroupName: t("新注册玩家的默认组名称"),
        DefaultGuestGroupName: t("未注册玩家的默认组名称"),
        RememberLeavePos: t("根据玩家的 IP 记录玩家下线的地方。服务器重新启动后会清空"),
        MaximumLoginAttempts: t("玩家登录失败次数，超过则直接踢"),
        KickOnMediumcoreDeath: "",
        MediumcoreKickReason: "",
        BanOnMediumcoreDeath: "",
        MediumcoreBanReason: "",
        DisableDefaultIPBan: t("如果未向 ban 命令传递任何参数，则取消 IP 封禁"),
        EnableWhitelist: t("启用白名单"),
        WhitelistKickReason: t("玩家不在白名单上时被踢出的原因"),
        ServerFullReason: t("服务器人满时加入提示"),
        ServerFullNoReservedReason: t(
          "在服务器已满且没有可用预留插槽的情况下踢出试图加入的玩家时给出的原因"
        ),
        KickOnHardcoreDeath: t("是否踢出硬核玩家"),
        HardcoreKickReason: t("踢出硬核玩家的原因"),
        BanOnHardcoreDeath: t("禁止硬核玩家死亡"),
        HardcoreBanReason: t("禁止硬核玩家死亡的原因"),
        KickProxyUsers: t("如果启用了 GeoIP，将踢出被标识为使用代理的玩家"),
        RequireLogin: t("所有玩家在游戏之前必须注册或登录"),
        AllowLoginAnyUsername: t("允许玩家登录任何帐户，即使用户名与其角色名称不匹配"),
        AllowRegisterAnyUsername: t("允许玩家注册与其角色名称不一定匹配"),
        MinimumPasswordLength: t("新玩家帐户的最小密码长度。不能低于 4"),
        BCryptWorkFactor: "",
        DisableUUIDLogin: t("阻止玩家使用其客户端 UUID 登录"),
        KickEmptyUUID: t("踢出不向服务器发送 UUID 的客户端"),
        TilePaintThreshold: t("如果在 1 秒内绘制了此数量的瓷砖，则封禁玩家"),
        KickOnTilePaintThresholdBroken: t("当玩家超过 TilePaint 阈值时，是否踢出"),
        MaxDamage: t("玩家 / NPC 可以造成的最大伤害"),
        MaxProjDamage: t("射弹可以造成的最大伤害"),
        KickOnDamageThresholdBroken: t("当玩家超过 MaxDamage 阈值时是否踢出"),
        TileKillThreshold: t("如果 1 秒内破坏超过此数量的瓷砖，则封禁玩家并恢复其操作"),
        KickOnTileKillThresholdBroken: t("当玩家超过 TileKill 阈值时是否踢出玩家"),
        TilePlaceThreshold: t("如果在 1 秒内放置了此数量的瓷砖，则封禁玩家"),
        KickOnTilePlaceThresholdBroken: t("当玩家超过 TilePlace 阈值时是否踢出玩家"),
        TileLiquidThreshold: "",
        KickOnTileLiquidThresholdBroken: t("当玩家超过 TileLiquid 阈值时是否踢出玩家"),
        ProjIgnoreShrapnel: t("是否忽略水晶子弹的弹片以计算弹丸阈值"),
        ProjectileThreshold: t("如果在 1 秒内创建了此数量的射弹，则封禁玩家"),
        KickOnProjectileThresholdBroken: t("当玩家超过投射物阈值时是否踢出玩家"),
        HealOtherThreshold: t("如果在 1 秒内发送了此数量的 HealOtherPlayer 数据包，则禁用玩家"),
        KickOnHealOtherThresholdBroken: t("当玩家超过 HealOther 阈值时是否踢出玩家"),
        SuppressPermissionFailureNotices: t(
          "禁止来自区域、重生点或服务器编辑失败的生成权限失败的警告"
        ),
        DisableModifiedZenith: t("禁止将Zenith射弹与不同的物体一起使用，而不是武器"),
        DisableCustomDeathMessages: t("防止创建带有死亡信息的自定义消息的保护机制"),
        CommandSpecifier: t(
          "指定哪个字符串作为命令的起始部分。如果长度大于1，则可能无法正常工作。"
        ),
        CommandSilentSpecifier: t("服务器是否应输出与系统操作相关的调试级别消息"),
        DisableSpewLogs: t("禁止将日志作为消息发送给具有日志权限的玩家"),
        DisableSecondUpdateLogs: t("阻止 OnSecondUpdate 检查将内容写入日志文件"),
        SuperAdminChatRGB: t("超级管理员组的聊天颜色"),
        SuperAdminChatPrefix: t("超级管理员组聊天前缀"),
        SuperAdminChatSuffix: t("超级管理员组聊天后缀"),
        EnableGeoIP: t("在加入时根据玩家的 IP 广播玩家的地理位置"),
        DisplayIPToAdmins: t("向具有日志权限的玩家显示玩家加入时的 IP"),
        ChatFormat: t(
          "更改游戏内聊天格式：{0} = 群组名称，{1} = 群组前缀，{2} = 玩家名称，{3} = 群组后缀，{4} = 聊天消息。"
        ),
        ChatAboveHeadsFormat: t(
          "更改在头顶聊天时使用的玩家名称。以方括号包裹的玩家名称开头，格式与 Terraria 的一致。与 ChatFormat 相同的格式，但不包括消息。"
        ),
        EnableChatAboveHeads: t("是否在玩家头顶上方显示聊天消息"),
        BroadcastRGB: t("用于广播消息颜色的 RGB 值"),
        StorageType: t("存储数据时使用的数据库类型（sqlite或mysql）"),
        SqliteDBPath: t("sqlite db 的路径"),
        MySqlHost: t("MySQL 数据库地址"),
        MySqlDbName: t("MySQL 数据库名称"),
        MySqlUsername: t("MySQL 数据库用户名"),
        MySqlPassword: t("MySQL 数据库密码"),
        UseSqlLogs: t("将日志保存到 SQL 数据库而不是文本文件。默认 false"),
        RevertToTextLogsOnSqlFailures: t("SQL日志在插入记录失败多少次后，将回退到文本日志"),
        RestApiEnabled: t("启用或禁用 REST API"),
        RestApiPort: t("REST API 使用的端口"),
        LogRest: t("记录 REST API 连接信息"),
        EnableTokenEndpointAuthentication: t("要求使用公共REST API端点时进行令牌身份验证"),
        RESTMaximumRequestsPerInterval: t("在拒绝请求之前，存储桶中的最大 REST 请求数。最小值为 5"),
        RESTRequestBucketDecreaseIntervalMinutes: t(
          "REST 请求存储桶减少 1 的频率（以分钟为单位）。最小值为 1 分钟"
        ),
        ApplicationRestTokens: t("外部应用程序可用于对服务器进行查询的 REST 令牌字典")
      }
    }
  }
};
