import { ref, watch, createVNode, type Ref } from "vue";
import { t } from "@/lang/i18n";
import { Modal, message } from "ant-design-vue";
import { ExclamationCircleOutlined } from "@ant-design/icons-vue";
import uploadService from "@/services/uploadService";
import { useFileManager } from "@/hooks/useFileManager";

export function useModUpload(
  instanceId: string,
  daemonId: string,
  activeKey: Ref<string>,
  loadMods: () => void
) {
  const { selectedFiles } = useFileManager(instanceId, daemonId);
  const opacity = ref(false);
  const fileInput = ref<HTMLInputElement>();

  let uploading = false;
  watch(
    () => uploadService.uiData.value,
    (newValue) => {
      if (newValue.current) {
        uploading = true;
      } else if (uploading) {
        uploading = false;
        loadMods();
      }
    },
    { immediate: true }
  );

  const onUploadClick = () => {
    fileInput.value?.click();
  };

  const onFileChange = async (e: Event) => {
    const files = (e.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;

    // Filter out directories (size 0 and no extension is a common heuristic, but not perfect)
    // Better: check if file has size or use a more robust check if available
    const validFiles = Array.from(files).filter(f => f.size > 0);
    if (validFiles.length === 0) {
      return message.warning(t("TXT_CODE_MOD_UPLOAD_NO_FOLDER"));
    }

    const targetDir = activeKey.value === "1" ? "mods" : "plugins";
    await selectedFiles(validFiles, targetDir);
    if (fileInput.value) fileInput.value.value = "";
  };

  const handleDragover = (e: DragEvent) => {
    e.preventDefault();
    if (activeKey.value === "3") return;
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
    opacity.value = true;
  };

  const handleDragleave = (e: DragEvent) => {
    e.preventDefault();
    if (e.relatedTarget === null || !((e.currentTarget as HTMLElement).contains(e.relatedTarget as Node))) {
      opacity.value = false;
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    opacity.value = false;
    if (activeKey.value === "3") return;

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter(f => f.size > 0);
    if (validFiles.length === 0) {
      return message.warning(t("TXT_CODE_MOD_UPLOAD_NO_FOLDER"));
    }

    let name = "";
    if (validFiles.length === 1) {
      name = validFiles[0].name;
    } else {
      for (const file of validFiles) {
        name += file.name + ", ";
      }
      name = name.slice(0, -2);
    }
    if (name.length > 30) {
      name = name.slice(0, 27) + "...";
    }
    if (validFiles.length > 1) {
      name += ` (${validFiles.length})`;
    }

    Modal.confirm({
      title: t("TXT_CODE_CONFIRM_UPLOAD"),
      icon: createVNode(ExclamationCircleOutlined),
      content: `${t("TXT_CODE_CONFIRM_UPLOAD")} ${name} ?`,
      async onOk() {
        const targetDir = activeKey.value === "1" ? "mods" : "plugins";
        await selectedFiles(validFiles, targetDir);
      }
    });
  };

  return {
    opacity,
    fileInput,
    onUploadClick,
    onFileChange,
    handleDragover,
    handleDragleave,
    handleDrop
  };
}
