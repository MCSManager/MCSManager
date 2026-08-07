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
  return `${t("修改项目")}: ${keys.join(", ")}`;
};

export const useOperationLog = () => {
  const logs = ref<OperationLoggerItem[]>([]);

  const renderMap: OperationRenderer = {
    instance_start: {
      title: t("启动实例"),
      render: (item) => ({
        text: t("TXT_CODE_e4605c4"),
        data: {
          operator_name: getOperatorLabel(item),
          instance_name: item.instance_name || item.instance_id
        }
      })
    },
    instance_stop: {
      title: t("关闭实例"),
      render: (item) => ({
        text: t("TXT_CODE_48c286cc"),
        data: {
          operator_name: getOperatorLabel(item),
          instance_name: item.instance_name || item.instance_id
        }
      })
    },
    instance_restart: {
      title: t("重启实例"),
      render: (item) => ({
        text: t("TXT_CODE_fa7002ef"),
        data: {
          operator_name: getOperatorLabel(item),
          instance_name: item.instance_name || item.instance_id
        }
      })
    },
    instance_update: {
      title: t("更新实例"),
      render: (item) => ({
        text: t("TXT_CODE_e1454ba7"),
        data: {
          operator_name: getOperatorLabel(item),
          instance_name: item.instance_name || item.instance_id
        }
      })
    },
    instance_kill: {
      title: t("强制终止实例"),
      render: (item) => ({
        text: t("TXT_CODE_ee54440"),
        data: {
          operator_name: getOperatorLabel(item),
          instance_name: item.instance_name || item.instance_id
        }
      })
    },
    instance_config_change: {
      title: t("修改实例配置"),
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
      title: t("创建实例"),
      render: (item) => ({
        text: t("TXT_CODE_9ab6fd"),
        data: {
          operator_name: getOperatorLabel(item),
          instance_name: item.instance_name || item.instance_id
        }
      })
    },
    instance_delete: {
      title: t("删除实例"),
      render: (item) => ({
        text: t("TXT_CODE_61b6facb"),
        data: {
          operator_name: getOperatorLabel(item),
          instance_name: item.instance_name || item.instance_id
        }
      })
    },
    instance_file_download_from_url: {
      title: t("链接下载文件"),
      render: (item) => ({
        text: t("用户 <<operator_name>> 向 <<instance_name>> 实例通过链接下载文件 <<file_name>>"),
        managementText: "<<file_name>>",
        data: {
          operator_name: getOperatorLabel(item),
          instance_name: item.instance_name || item.instance_id,
          file_name: item.file || item.url || ""
        }
      })
    },
    instance_file_upload: {
      title: t("上传文件"),
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
      title: t("编辑文件"),
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
      title: t("下载文件"),
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
      title: t("删除文件"),
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
      title: t("重命名文件"),
      render: (item) => ({
        text: t(
          "用户 <<operator_name>> 将 <<instance_name>> 实例的文件 <<file_before>> 重命名为 <<file_after>>"
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
      title: t("移动文件"),
      render: (item) => ({
        text: t(
          "用户 <<operator_name>> 将 <<instance_name>> 实例的文件 <<file_before>> 移动至 <<file_after>>"
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
      title: t("压缩文件"),
      render: (item) => ({
        text: t("用户 <<operator_name>> 在 <<instance_name>> 实例中压缩生成文件 <<file>>"),
        managementText: "<<file>>",
        data: {
          operator_name: getOperatorLabel(item),
          instance_name: item.instance_name || item.instance_id,
          file: item.file
        }
      })
    },
    instance_file_decompress: {
      title: t("解压文件"),
      render: (item) => ({
        text: t("用户 <<operator_name>> 在 <<instance_name>> 实例中解压了文件 <<file>>"),
        managementText: "<<file>>",
        data: {
          operator_name: getOperatorLabel(item),
          instance_name: item.instance_name || item.instance_id,
          file: item.file
        }
      })
    },
    instance_task_create: {
      title: t("创建计划任务"),
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
      title: t("删除计划任务"),
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
      title: t("新增节点"),
      render: (item) => ({
        text: t("TXT_CODE_f7969e5a"),
        data: {
          operator_name: getOperatorLabel(item),
          daemon_id: item.daemon_name || item.daemon_id
        }
      })
    },
    daemon_remove: {
      title: t("删除节点"),
      render: (item) => ({
        text: t("TXT_CODE_384d278f"),
        data: {
          operator_name: getOperatorLabel(item),
          daemon_id: item.daemon_name || item.daemon_id
        }
      })
    },
    daemon_config_change: {
      title: t("修改节点配置"),
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
      title: t("新增用户"),
      render: (item) => ({
        text: t("TXT_CODE_faa1962b"),
        managementText: `${t("目标用户")}: <<target_user_name>>`,
        data: {
          operator_name: getOperatorLabel(item),
          target_user_name: item.target_user_name
        }
      })
    },
    user_delete: {
      title: t("删除用户"),
      render: (item) => ({
        text: t("TXT_CODE_cd76bc9"),
        managementText: `${t("目标用户")}: <<target_user_name>>`,
        data: {
          operator_name: getOperatorLabel(item),
          target_user_name: item.target_user_name
        }
      })
    },
    user_config_change: {
      title: t("修改用户配置"),
      render: (item) => {
        const managementText: string[] = [];
        if (item.target_user_name) {
          managementText.push(`${t("目标用户")}: <<target_user_name>>`);
        }
        if (item.password_reset) managementText.push(t("重置了密码"));
        const changed = getChangedKeys(item);
        if (changed) managementText.push(changed);
        return {
          text: item.target_user_name
            ? t("用户 <<operator_name>> 修改了用户 <<target_user_name>> 的配置")
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
      title: t("开关 API 密钥"),
      render: (item) => ({
        text: item.enabled
          ? t("用户 <<operator_name>> 开启了用户 <<target_user_name>> 的 API 密钥")
          : t("用户 <<operator_name>> 关闭了用户 <<target_user_name>> 的 API 密钥"),
        managementText: item.enabled ? t("将 API 设置为启用") : t("将 API 设置为禁用"),
        data: {
          operator_name: getOperatorLabel(item),
          target_user_name: item.target_user_name
        }
      })
    },
    user_login: {
      title: t("用户登录"),
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
      title: t("解绑 SSO"),
      render: (item) => ({
        text: t("用户 <<operator_name>> 解绑了用户 <<target_user_name>> 的 SSO 账号"),
        managementText: `${t("目标用户")}: <<target_user_name>>`,
        data: {
          operator_name: getOperatorLabel(item),
          target_user_name: item.target_user_name
        }
      })
    },
    system_config_change: {
      title: t("修改系统设置"),
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
