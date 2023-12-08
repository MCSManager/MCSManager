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
  }
};
