import { t } from "@/lang/i18n";
import { getOperationLog } from "@/services/apis/operationLog";
import type { OperationLoggerItem, OperationLoggerType } from "@/types/operationLog";
import { computed, ref } from "vue";

type TextRenderResult = {
  text: string;
  managementText?: string;
  // Placeholders are matched by name, so "text" and "managementText"
  // can use any subset of them in any order.
  data: Record<string, string>;
};

type TextRenderType = "text" | "managementText";

type OperationRenderer = {
  [K in OperationLoggerType]: {
    title: string;
    render: (
      // This variable is actually used internally. Fix the plugin's false positive error.
      // eslint-disable-next-line no-unused-vars
      item: Extract<OperationLoggerItem, { type: K }>
    ) => TextRenderResult;
  };
};

const getOperatorLabel = (item: OperationLoggerItem) => {
  const operatorName = item.operator_name || item.operation_id;
  return item.operator_source ? `${operatorName} (${item.operator_source})` : operatorName;
};

const getChangedKeys = (item: { config_after?: Record<string, any> }) => {
  const keys = Object.keys(item.config_after ?? {});
  if (keys.length === 0) return "";
  return `${t("TXT_CODE_fafe0a1")}: ${keys.join(", ")}`;
};

export const useOperationLog = () => {
  const logs = ref<OperationLoggerItem[]>([]);

  const renderMap: OperationRenderer = {
    instance_start: {
      title: t("TXT_CODE_967f4e93"),
      render: (item) => ({
        text: t("TXT_CODE_e4605c4"),
        data: {
          operator_name: getOperatorLabel(item),
          instance_name: item.instance_name || item.instance_id
        }
      })
    },
    instance_stop: {
      title: t("TXT_CODE_27febf35"),
      render: (item) => ({
        text: t("TXT_CODE_48c286cc"),
        data: {
          operator_name: getOperatorLabel(item),
          instance_name: item.instance_name || item.instance_id
        }
      })
    },
    instance_restart: {
      title: t("TXT_CODE_77cc12da"),
      render: (item) => ({
        text: t("TXT_CODE_fa7002ef"),
        data: {
          operator_name: getOperatorLabel(item),
          instance_name: item.instance_name || item.instance_id
        }
      })
    },
    instance_update: {
      title: t("TXT_CODE_5b26ab30"),
      render: (item) => ({
        text: t("TXT_CODE_e1454ba7"),
        data: {
          operator_name: getOperatorLabel(item),
          instance_name: item.instance_name || item.instance_id
        }
      })
    },
    instance_kill: {
      title: t("TXT_CODE_6a707901"),
      render: (item) => ({
        text: t("TXT_CODE_ee54440"),
        data: {
          operator_name: getOperatorLabel(item),
          instance_name: item.instance_name || item.instance_id
        }
      })
    },
    instance_config_change: {
      title: t("TXT_CODE_e0398e0a"),
      render: (item) => ({
        text: t("TXT_CODE_30fcc19a"),
        managementText: getChangedKeys(item),
        data: {
          operator_name: getOperatorLabel(item),
          instance_name: item.instance_name || item.instance_id
        }
      })
    },
    instance_create: {
      title: t("TXT_CODE_5a74975b"),
      render: (item) => ({
        text: t("TXT_CODE_9ab6fd"),
        data: {
          operator_name: getOperatorLabel(item),
          instance_name: item.instance_name || item.instance_id
        }
      })
    },
    instance_delete: {
      title: t("TXT_CODE_a0e19f38"),
      render: (item) => ({
        text: t("TXT_CODE_61b6facb"),
        data: {
          operator_name: getOperatorLabel(item),
          instance_name: item.instance_name || item.instance_id
        }
      })
    },
    instance_file_download_from_url: {
      title: t("TXT_CODE_95848ebc"),
      render: (item) => ({
        text: t("TXT_CODE_fef2078b"),
        managementText: "<<file_name>>",
        data: {
          operator_name: getOperatorLabel(item),
          instance_name: item.instance_name || item.instance_id,
          file_name: item.file || item.url || ""
        }
      })
    },
    instance_file_upload: {
      title: t("TXT_CODE_e00c858c"),
      render: (item) => ({
        text: t("TXT_CODE_58e4a9bd"),
        managementText: "<<file>>",
        data: {
          operator_name: getOperatorLabel(item),
          instance_name: item.instance_name || item.instance_id,
          file: item.file || ""
        }
      })
    },
    instance_file_update: {
      title: t("TXT_CODE_b0dc1f17"),
      render: (item) => ({
        text: t("TXT_CODE_c5687e56"),
        managementText: "<<file>>",
        data: {
          operator_name: getOperatorLabel(item),
          instance_name: item.instance_name || item.instance_id,
          file: item.file || ""
        }
      })
    },
    instance_file_download: {
      title: t("TXT_CODE_2359e036"),
      render: (item) => ({
        text: t("TXT_CODE_6f43f95f"),
        managementText: "<<file>>",
        data: {
          operator_name: getOperatorLabel(item),
          instance_name: item.instance_name || item.instance_id,
          file: item.file
        }
      })
    },
    instance_file_delete: {
      title: t("TXT_CODE_bf2abe90"),
      render: (item) => ({
        text: t("TXT_CODE_de567e84"),
        managementText: "<<file>>",
        data: {
          operator_name: getOperatorLabel(item),
          instance_name: item.instance_name || item.instance_id,
          file: Array.isArray(item.file) ? item.file.join(", ") : String(item.file ?? "")
        }
      })
    },
    instance_file_rename: {
      title: t("TXT_CODE_ccaabd02"),
      render: (item) => ({
        text: t(
          "TXT_CODE_5487e155"
        ),
        managementText: "<<file_before>> → <<file_after>>",
        data: {
          operator_name: getOperatorLabel(item),
          instance_name: item.instance_name || item.instance_id,
          file_before: item.file_before,
          file_after: item.file_after
        }
      })
    },
    instance_file_move: {
      title: t("TXT_CODE_4a9b8ea9"),
      render: (item) => ({
        text: t(
          "TXT_CODE_76773e23"
        ),
        managementText: "<<file_before>> → <<file_after>>",
        data: {
          operator_name: getOperatorLabel(item),
          instance_name: item.instance_name || item.instance_id,
          file_before: item.file_before,
          file_after: item.file_after
        }
      })
    },
    instance_file_compress: {
      title: t("TXT_CODE_f8a15a94"),
      render: (item) => ({
        text: t("TXT_CODE_ca58a1ec"),
        managementText: "<<file>>",
        data: {
          operator_name: getOperatorLabel(item),
          instance_name: item.instance_name || item.instance_id,
          file: item.file
        }
      })
    },
    instance_file_decompress: {
      title: t("TXT_CODE_7669fd3f"),
      render: (item) => ({
        text: t("TXT_CODE_1389014c"),
        managementText: "<<file>>",
        data: {
          operator_name: getOperatorLabel(item),
          instance_name: item.instance_name || item.instance_id,
          file: item.file
        }
      })
    },
    instance_task_create: {
      title: t("TXT_CODE_7f36293b"),
      render: (item) => ({
        text: t("TXT_CODE_5ddb00f2"),
        managementText: "<<task_name>>",
        data: {
          operator_name: getOperatorLabel(item),
          instance_name: item.instance_name || item.instance_id,
          task_name: item.task_name
        }
      })
    },
    instance_task_delete: {
      title: t("TXT_CODE_f3ebf89e"),
      render: (item) => ({
        text: t("TXT_CODE_41f86ac"),
        managementText: "<<task_name>>",
        data: {
          operator_name: getOperatorLabel(item),
          instance_name: item.instance_name || item.instance_id,
          task_name: item.task_name
        }
      })
    },
    daemon_create: {
      title: t("TXT_CODE_15a381d5"),
      render: (item) => ({
        text: t("TXT_CODE_f7969e5a"),
        data: {
          operator_name: getOperatorLabel(item),
          daemon_id: item.daemon_name || item.daemon_id
        }
      })
    },
    daemon_remove: {
      title: t("TXT_CODE_8b937b23"),
      render: (item) => ({
        text: t("TXT_CODE_384d278f"),
        data: {
          operator_name: getOperatorLabel(item),
          daemon_id: item.daemon_name || item.daemon_id
        }
      })
    },
    daemon_config_change: {
      title: t("TXT_CODE_a152dc5b"),
      render: (item) => ({
        text: t("TXT_CODE_b6ac7af4"),
        managementText: getChangedKeys(item),
        data: {
          operator_name: getOperatorLabel(item),
          daemon_id: item.daemon_name || item.daemon_id
        }
      })
    },
    user_create: {
      title: t("TXT_CODE_e83ffa03"),
      render: (item) => ({
        text: t("TXT_CODE_faa1962b"),
        managementText: `${t("TXT_CODE_887a895")}: <<target_user_name>>`,
        data: {
          operator_name: getOperatorLabel(item),
          target_user_name: item.target_user_name
        }
      })
    },
    user_delete: {
      title: t("TXT_CODE_760f00f5"),
      render: (item) => ({
        text: t("TXT_CODE_cd76bc9"),
        managementText: `${t("TXT_CODE_887a895")}: <<target_user_name>>`,
        data: {
          operator_name: getOperatorLabel(item),
          target_user_name: item.target_user_name
        }
      })
    },
    user_config_change: {
      title: t("TXT_CODE_a1bd4c28"),
      render: (item) => {
        const managementText: string[] = [];
        if (item.target_user_name) {
          managementText.push(`${t("TXT_CODE_887a895")}: <<target_user_name>>`);
        }
        if (item.password_reset) managementText.push(t("TXT_CODE_9c9025b1"));
        const changed = getChangedKeys(item);
        if (changed) managementText.push(changed);
        return {
          text: item.target_user_name
            ? t("TXT_CODE_3268ae52")
            : t("TXT_CODE_5564bc4c"),
          managementText: managementText.join("  "),
          data: {
            operator_name: getOperatorLabel(item),
            target_user_name: item.target_user_name || ""
          }
        };
      }
    },
    user_apikey_change: {
      title: t("TXT_CODE_c6bd6421"),
      render: (item) => ({
        text: item.enabled
          ? t("TXT_CODE_d0ea7f96")
          : t("TXT_CODE_1e9cadb1"),
        managementText: item.enabled ? t("TXT_CODE_71c45450") : t("TXT_CODE_52806070"),
        data: {
          operator_name: getOperatorLabel(item),
          target_user_name: item.target_user_name
        }
      })
    },
    user_login: {
      title: t("TXT_CODE_dbbaf16e"),
      render: (item) => ({
        text: t("TXT_CODE_31a48870") + ` (${item.operator_ip})`,
        managementText: "<<login_result>>",
        data: {
          operator_name: getOperatorLabel(item),
          login_result: item.login_result ? t("TXT_CODE_43fcaf94") : t("TXT_CODE_56c686f8")
        }
      })
    },
    sso_unbind: {
      title: t("TXT_CODE_80e93277"),
      render: (item) => ({
        text: t("TXT_CODE_162672b7"),
        managementText: `${t("TXT_CODE_887a895")}: <<target_user_name>>`,
        data: {
          operator_name: getOperatorLabel(item),
          target_user_name: item.target_user_name
        }
      })
    },
    system_config_change: {
      title: t("TXT_CODE_bd3b414e"),
      render: (item) => ({
        text: t("TXT_CODE_d6312bd5"),
        managementText: getChangedKeys(item),
        data: { operator_name: getOperatorLabel(item) }
      })
    }
  };

  const operationTypeNameMap = Object.fromEntries(
    Object.entries(renderMap).map(([type, { title }]) => [type, title])
  ) as Record<OperationLoggerType, string>;

  const levelColors = {
    info: "blue",
    warning: "orange",
    error: "red",
    unknown: "gray"
  };

  const fetchData = async () => {
    const { execute } = getOperationLog();
    const data = await execute();
    logs.value = data.value?.reverse() || [];
  };

  const generateTextByItem = (item: OperationLoggerItem, textType: TextRenderType = "text") => {
    const handler = renderMap[item.type];
    if (!handler) return t("TXT_CODE_43df9305");

    const renderer = handler.render(item as any);
    const data = renderer.data;
    const text = renderer[textType] || "--";

    return text.replace(/\<\<\s*([\w_]+)\s*\>\>/g, (_, key: string) => data[key] ?? "--");
  };

  const getColorByLevel = (level: OperationLoggerItem["operation_level"]) => {
    return levelColors[level] ?? levelColors.unknown;
  };

  const formattedLogs = computed(() => {
    return logs.value.map((item) => {
      return {
        ...item,
        color: getColorByLevel(item.operation_level),
        text: generateTextByItem(item)
      };
    });
  });

  return {
    fetchData,
    logs,
    getColorByLevel,
    generateTextByItem,
    operationTypeNameMap,
    formattedLogs
  };
};
