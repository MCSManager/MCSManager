import { t } from "@/lang/i18n";
import {
  uploadFile as uploadFileApi,
  uploadFilePiece as uploadFilePieceApi
} from "@/services/apis/fileManager";
import { reportErrorMsg } from "@/tools/validator";
import { message } from "ant-design-vue";
import { ref, type Ref } from "vue";

const PIECE_SIZE = 1024 * 1024 * 2;

type UploadOptions = {
  overwrite: boolean;
  unzip?: boolean;
  code?: string;
};

export class UploadFiles {
  file: File;
  id: string | undefined;
  url: string;
  offset: number = 0;
  uploadedSize: number = 0;
  pieceUrl: string | undefined;
  prepared = false;
  canceled = false;
  removing = false;
  instanceInfo:
    | {
        daemonId: string;
        instanceId: string;
      }
    | undefined;
  callbacks: {
    onStart: Set<() => void>;
    onEnd: Set<() => void>;
  };

  constructor(tempId: string, file: File, url: string, password: string, options: UploadOptions) {
    this.file = file;
    this.url = url;
    this.id = tempId;
    this.callbacks = {
      onStart: new Set(),
      onEnd: new Set()
    };
    this.init(tempId, url, password, options); // async
  }

  async init(tempId: string, url: string, password: string, options: UploadOptions) {
    const { state: uploadCfg, execute: uploadFile } = uploadFileApi();
    try {
      await uploadFile({
        timeout: Number.MAX_VALUE,
        url: `${url}/upload-new/${password}`,
        params: {
          filename: this.file.name,
          size: this.file.size,
          // sum: await fileSum(this.file),
          sum: "",
          ...options
        }
      });

      if (!uploadCfg.value?.id) {
        throw new Error(t("TXT_CODE_62051fcc"));
      }
      const id = uploadCfg.value?.id;
      this.id = id;
      this.pieceUrl = `${url}/upload-piece/${id}`;
      uploadService.changeId(tempId, id);

      const received: { start: number; end: number }[] = uploadCfg.value?.received!;
      if (received.length > 0 && received[0].start == 0) {
        this.offset = received[0].end;
      }

      this.prepared = true;
      if (this.canceled) {
        await this.stop();
      }

      uploadService.update();
    } catch (err: any) {
      this.removing = true;
      return reportErrorMsg(err.response?.data || err.message);
    }
  }

  addCallback(type: "start" | "end", callback: () => void) {
    if (type == "start") {
      this.callbacks.onStart.add(callback);
    }
    if (type == "end") {
      this.callbacks.onEnd.add(callback);
    }
  }

  removeCallback(type: "start" | "end", callback: () => void) {
    if (type == "start") {
      this.callbacks.onStart.delete(callback);
    }
    if (type == "end") {
      this.callbacks.onEnd.delete(callback);
    }
  }

  onStart() {
    this.callbacks.onStart.forEach((callback) => {
      try {
        callback();
      } catch (e) {
        console.error("Error in upload start callback:", e);
      }
    });
    this.callbacks.onStart.clear();
  }

  onEnd() {
    this.callbacks.onEnd.forEach((callback) => {
      try {
        callback();
      } catch (e) {
        console.error("Error in upload end callback:", e);
      }
    });
    this.callbacks.onEnd.clear();
  }

  nextTask(): UploadTask | undefined {
    const rangeStart = this.offset;
    const rangeEnd = Math.min(this.offset + PIECE_SIZE, this.file.size);
    this.offset = rangeEnd;

    if (rangeStart >= this.file.size) return;

    return new UploadTask({
      file: this,
      range: [rangeStart, rangeEnd]
    });
  }

  async stop() {
    if (!this.prepared) {
      this.canceled = true;
      return;
    }

    const { execute: uploadFile } = uploadFileApi();
    await uploadFile({
      url: `${this.url}/upload-new/${this.id}`,
      params: {
        stop: true
      }
    });
    this.onEnd();
    uploadService.files.delete(this.id!);
  }
}

class UploadTask {
  status: "pending" | "uploading" | "completed" | "failed" | "stopping" | "removing" = "pending";
  progress: number = 0; // byte
  file: UploadFiles;
  rangeStart: number;
  rangeEnd: number;
  worker?: Promise<any>;
  abortController?: AbortController;
  retries: number = 0;

  constructor(config: { file: UploadFiles; range: [number, number] }) {
    this.file = config.file;
    this.rangeStart = config.range[0];
    this.rangeEnd = config.range[1];
  }

  start() {
    const { execute: uploadFilePiece } = uploadFilePieceApi();

    const formData = new FormData();
    formData.append("file", this.file.file.slice(this.rangeStart, this.rangeEnd));
    this.abortController = new AbortController();

    this.worker = uploadFilePiece({
      url: this.file.pieceUrl,
      data: formData,
      params: {
        offset: this.rangeStart
      },
      onUploadProgress: (progressEvent: any) => this.onProgress(progressEvent.loaded),
      signal: this.abortController.signal
    })
      .then(() => this.onCompleted())
      .catch((e) => this.onError(e));

    this.status = "uploading";
  }

  stop() {
    this.status = "stopping";
    if (!this.worker) {
      return;
    }
    this.abortController?.abort();
  }

  onError(error: any) {
    const isStopping = this.status == "stopping";
    console.error("Upload error:", error);
    if (!isStopping) {
      this.retries += 1;
      message.error(
        t("TXT_CODE_6adffa20") +
          (this.retries < 3
            ? t("TXT_CODE_31145b04", {
                retries: this.retries + 1,
                maxRetries: 3
              })
            : t("TXT_CODE_3f828072"))
      );
    }
    const msg = error.response?.data || error.message;
    console.error(msg);
    if (msg == "Access denied: No task found" || msg == "File is not opened") {
      // usually caused by multi-tab upload, just remove the task
      this.status = "removing";
      return uploadService.update();
    }
    this.status = "failed";
    this.onProgress(0);

    if (!isStopping && this.retries < 3) {
      this.start(); // async
    } else {
      uploadService.update();
      console.error(
        "Max retries reached for file piece:",
        this.file.file.name,
        "Range:",
        this.rangeStart,
        "-",
        this.rangeEnd
      );
    }
  }

  onProgress(progress: number) {
    this.progress = progress;
    uploadService.updateProgress();
  }

  onCompleted() {
    this.status = "completed";
    this.file.uploadedSize += this.rangeEnd - this.rangeStart;
    uploadService.update();
  }
}

class UploadService {
  static concurrency = 5;
  files: Map<string, UploadFiles> = new Map();
  uploaded = 0;
  task: (UploadTask | undefined)[] = [];
  current?: string;
  status: "stopped" | "working" | "suspend" = "stopped";
  uiData: Ref<{
    files: number[];
    current?: number[];
    currentFile?: string;
    suspending: boolean;
    instanceInfo?: {
      daemonId: string;
      instanceId: string;
    };
  }> = ref({
    files: [],
    suspending: false
  });

  append(
    file: File,
    url: string,
    password: string,
    options: UploadOptions,
    // eslint-disable-next-line no-unused-vars
    beforeMounted?: (uploadFile: UploadFiles) => void
  ) {
    const tempId = Date.now().toString();
    const uploadFile = new UploadFiles(tempId, file, url, password, options);
    if (beforeMounted) {
      beforeMounted(uploadFile);
    }
    this.files.set(tempId, uploadFile);
    if (this.status == "stopped") {
      this.status = "working";
      this.current = tempId;
      uploadFile.onStart();
    }
    this.update();
    return uploadFile;
  }

  changeId(oldId: string, newId: string) {
    if (this.files.get(newId)) {
      return;
    }
    const file = this.files.get(oldId)!;
    this.files.set(newId, file);
    this.files.delete(oldId);
    if (this.current == oldId) {
      this.current = newId;
    }
  }

  update() {
    for (let i = 0; i < this.task.length; i++) {
      if (!this.task[i]) continue;
      if (this.task[i]!.status == "completed") {
        this.task[i] = undefined;
      }
    }
    if (this.status == "suspend") {
      if (this.files.size == 0) {
        this.status = "stopped";
      }
      return;
    }
    let removeFile = false;
    for (const task of this.task) {
      if (!task) continue;
      if (task.status == "removing") {
        removeFile = true;
      }
      if (task.status == "failed") {
        task.status = "pending";
        this.suspend();
      }
    }
    if (this.status == "working" && this.current) {
      const currentFile = this.files.get(this.current)!;
      let reachTaskEnd = removeFile;

      if (removeFile) {
        this.task = [];
      }

      for (let i = 0; i < UploadService.concurrency; i++) {
        if (reachTaskEnd || !currentFile.prepared) {
          break;
        }
        if (this.task[i] == undefined) {
          const nextTask = currentFile.nextTask();
          if (!nextTask) {
            reachTaskEnd = true;
            break;
          }
          this.task[i] = nextTask;
        }
      }

      let tasks = 0;
      for (const uploadTask of this.task) {
        if (!uploadTask) continue;
        tasks++;
        if (uploadTask.status != "pending") continue;
        uploadTask.retries = 0;
        uploadTask.start(); // async
      }
      if (reachTaskEnd && currentFile.prepared && tasks == 0) {
        const currentFile = this.files.get(this.current)!;
        currentFile.onEnd();
        if (!removeFile) {
          this.uploaded += 1;
        }
        this.files.delete(this.current);
        if (removeFile) {
          message.error(t("TXT_CODE_c3adc044") + ": " + currentFile.file.name);
        } else {
          message.success(currentFile.file.name + " " + t("TXT_CODE_773f36a0"));
        }
        while (this.files.size > 0) {
          const current = this.files.keys().next().value ?? "";
          const currentFile = this.files.get(current)!;
          if (currentFile.removing) {
            this.files.delete(current);
            continue;
          }

          this.current = current;
          currentFile.onStart();
          this.updateProgress();
          this.update();
          return;
        }
        this.current = undefined;
        this.status = "stopped";
        this.updateProgress();
      }
    }
    this.updateProgress();
  }

  suspend() {
    if (this.status == "suspend") return;
    this.status = "suspend";
    this.task.forEach((t) => {
      if (!t) return;
      if (t.status != "completed") {
        t.stop();
      }
    });
    this.updateProgress();
  }

  unsuspend() {
    if (this.status != "suspend") return;
    if (this.files.size > 0) {
      this.status = "working";
      for (const uploadTask of this.task) {
        if (!uploadTask) continue;
        uploadTask.status = "pending";
      }
    }
    this.update();
  }

  async stop() {
    if (this.status == "stopped") return;
    this.status = "stopped";
    for (const task of this.task) {
      if (!task) continue;
      if (task.status !== "completed") {
        task.stop();
      }
    }
    this.task = [];
    this.current = undefined;
    const stopTask: Promise<any>[] = [];
    for (const file of this.files) {
      stopTask.push(file[1].stop());
    }
    await Promise.all(stopTask);
    this.files.clear();
    this.uploaded = 0;
    this.updateProgress();
  }

  updateProgress() {
    if (!this.current) {
      this.uiData.value = {
        files: [this.uploaded, this.uploaded + this.files.size],
        suspending: this.status == "suspend"
      };
      return;
    }
    const currentFile = this.files.get(this.current)!;
    let progress = currentFile.uploadedSize;

    this.uiData.value = {
      current: [progress, currentFile.file.size],
      currentFile: currentFile.file.name,
      files: [this.uploaded + (this.current ? 1 : 0), this.uploaded + this.files.size],
      suspending: this.status == "suspend",
      instanceInfo: currentFile.instanceInfo
    };
  }

  getFileNth(id: string): number {
    for (const string of this.files.keys()) {
      if (string == id) {
        return Array.from(this.files.keys()).indexOf(string);
      }
    }
    return -1;
  }
}

const uploadService = new UploadService();
export default uploadService;
