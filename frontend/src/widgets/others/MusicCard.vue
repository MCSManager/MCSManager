<!-- eslint-disable no-unused-vars -->
<script setup lang="ts">
import { ref, h } from "vue";
import { Empty, message } from "ant-design-vue";
import dayjs from "dayjs";
import { getRandomId } from "@/tools/randId";
import { PlayCircleOutlined, PauseCircleOutlined } from "@ant-design/icons-vue";
import { t } from "@/lang/i18n";
import { useUploadFileDialog } from "@/components/fc";
import { useAppToolsStore } from "@/stores/useAppToolsStore";
import { useLayoutCardTools } from "@/hooks/useCardTools";
import WaveSurfer from "wavesurfer.js";
import type { LayoutCard } from "@/types";
import { onMounted } from "vue";
import { useAppConfigStore } from "@/stores/useAppConfigStore";

const { isDarkTheme } = useAppConfigStore();

const prop = defineProps<{
  card: LayoutCard;
}>();

const { openInputDialog } = useAppToolsStore();

const { getMetaValue, setMetaValue } = useLayoutCardTools(prop.card);

const musicUrl = ref(getMetaValue<string>("musicUrl", ""));

const timeLineId = `timeline-${getRandomId()}`;

enum UploadType {
  File = "FILE",
  Url = "URL"
}

const uploadMusic = async (type: UploadType) => {
  try {
    if (type === UploadType.File) {
      const path = await useUploadFileDialog();
      if (path) (musicUrl.value = path) && message.success(t("TXT_CODE_9d498b20"));
    }
    if (type === UploadType.Url) {
      musicUrl.value =
        ((await openInputDialog(t("TXT_CODE_f4617d31"))) as string) || musicUrl.value;
      message.success(t("TXT_CODE_9d498b20"));
    }
    setMetaValue("musicUrl", musicUrl.value);
  } catch (error: any) {}
};

let wavesurfer: WaveSurfer | null = null;

enum PlayerStatus {
  Play = "PLAY",
  Pause = "PAUSE"
}

const playerStatus = ref(PlayerStatus.Pause);
const playerButtonIcon = ref(h(PlayCircleOutlined));
const changePlayerStatis = (setStatus?: PlayerStatus) => {
  if (setStatus) {
    playerStatus.value = setStatus;
  } else {
    playerStatus.value =
      playerStatus.value === PlayerStatus.Play ? PlayerStatus.Pause : PlayerStatus.Play;
  }

  if (playerStatus.value === PlayerStatus.Play) {
    wavesurfer?.play();
    playerButtonIcon.value = h(PauseCircleOutlined);
  } else {
    wavesurfer?.pause();
    playerButtonIcon.value = h(PlayCircleOutlined);
  }
};
const playTime = ref("0:00");
const maxTime = ref("0:00");

const processingTime = (s: number = 0) => {
  const duration = dayjs.duration(s, "seconds");
  return duration.asHours() >= 1 ? duration.format("H:mm:ss") : duration.format("m:ss");
};

onMounted(() => {
  const time = document.getElementById(timeLineId);

  if (time) {
    wavesurfer = WaveSurfer.create({
      container: time || "",
      waveColor: isDarkTheme() ? "#707070" : "#7a7a7a",
      progressColor: isDarkTheme() ? "#bababa" : "#000",
      cursorColor: "#8f8f8f",
      url: musicUrl.value,
      height: 50,
      barWidth: 4,
      barGap: 6,
      barRadius: 8,
      cursorWidth: 2
    });

    wavesurfer.on("ready", function () {
      maxTime.value = processingTime(wavesurfer?.getDuration());
    });
    wavesurfer.on("click", () => {
      changePlayerStatis(PlayerStatus.Play);
    });
    wavesurfer.on("pause", () => {
      changePlayerStatis(PlayerStatus.Pause);
    });
    wavesurfer.on("finish", () => {
      changePlayerStatis(PlayerStatus.Play);
    });
    wavesurfer.on("timeupdate", (currentTime) => {
      playTime.value = processingTime(currentTime);
    });
  }
});
</script>

<template>
  <div class="h-100 position-relative">
    <card-panel>
      <template #title>
        {{ card.title }}
      </template>

      <template #body>
        <div v-if="musicUrl" class="h-100 flex-center">
          <div class="player">
            <div class="time-line">
              <div :id="timeLineId" class="time"></div>
            </div>
            <div class="button">
              <a-button
                type="link"
                size="large"
                shape="circle"
                :icon="playerButtonIcon"
                style="width: auto; height: auto; font-size: 14px"
                @click="changePlayerStatis()"
              />
              <span>{{ playTime }}&nbsp;/&nbsp;{{ maxTime }}</span>
            </div>
          </div>
        </div>
        <div v-else>
          <a-empty class="h-100" :image="Empty.PRESENTED_IMAGE_SIMPLE">
            <template #description>
              <span>{{ t("TXT_CODE_28ce635a") }}</span>
              <br />
              <span>{{ t("TXT_CODE_be1354f5") }}</span>
            </template>
          </a-empty>
        </div>
      </template>
      <template #body-design>
        <a-space align="center" direction="vertical" class="w-100 h-100 edit">
          <h2>{{ t("TXT_CODE_c2697552") }}</h2>
          <a-space>
            <a-button type="primary" @click="uploadMusic(UploadType.File)">
              {{ t("TXT_CODE_a106108c") }}
            </a-button>
            <a-button type="primary" @click="uploadMusic(UploadType.Url)">
              {{ t("TXT_CODE_b3f2ea10") }}
            </a-button>
          </a-space>
        </a-space>
      </template>
    </card-panel>
  </div>
</template>

<style lang="less" scoped>
.edit {
  z-index: 5;
  opacity: 0;
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  border-radius: 6px;
  background-color: rgba(0, 0, 0, 0.3);
  color: #fff;
  text-shadow: 0 0 10px #000;
  transition: all 0.1s ease-in-out;

  &:hover {
    opacity: 1;
  }
}

.player {
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: 86%;
  height: 100%;
  .time-line {
    width: 100%;
  }
  .button {
    margin-left: -20px;
    margin-top: 5px;
    display: flex;
    align-items: center;
  }
}
</style>
