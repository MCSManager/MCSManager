<script setup lang="ts">
import {
  ApiTwoTone,
  AppstoreTwoTone,
  BugTwoTone,
  CiTwoTone,
  CloudTwoTone,
  CodeTwoTone,
  CopyrightCircleTwoTone,
  DatabaseTwoTone,
  DollarCircleTwoTone,
  FileTwoTone,
  GiftTwoTone,
  GoldTwoTone,
  HddTwoTone,
  IdcardTwoTone,
  InsuranceTwoTone,
  ProjectTwoTone,
  RocketTwoTone,
  SettingTwoTone,
  TabletTwoTone,
  TagTwoTone,
  ThunderboltTwoTone
} from "@ant-design/icons-vue";
import { computed, onMounted, ref } from "vue";

const ALL_ICONS = [
  ProjectTwoTone,
  SettingTwoTone,
  TabletTwoTone,
  HddTwoTone,
  GiftTwoTone,
  CloudTwoTone,
  DatabaseTwoTone,
  ThunderboltTwoTone,
  RocketTwoTone,
  BugTwoTone,
  CodeTwoTone,
  ApiTwoTone,
  GoldTwoTone,
  IdcardTwoTone,
  FileTwoTone,
  InsuranceTwoTone,
  CiTwoTone,
  TagTwoTone,
  CopyrightCircleTwoTone,
  DollarCircleTwoTone
];

const icons = computed(() => {
  const tmpArr = [...ALL_ICONS];
  tmpArr.sort(() => Math.random() - 0.5);
  return tmpArr.slice(0, 10);
});

const isVisible = ref(false);

onMounted(() => {
  setTimeout(() => {
    isVisible.value = true;
  }, 500);
});
</script>

<template>
  <div class="icon-fly-container" :class="{ visible: isVisible }">
    <!-- 中心主图标 -->
    <div class="center-icon">
      <div class="center-glow"></div>
      <AppstoreTwoTone :style="{ fontSize: '28px' }" />
    </div>

    <!-- 围绕的图标群 -->
    <div class="orbit-container">
      <div
        v-for="(icon, index) in icons"
        :key="index"
        class="orbit-icon"
        :class="`orbit-icon-${index}`"
        :style="{
          '--delay': `${index * 0.4}s`,
          '--rotation': `${(360 / icons.length) * index}deg`
        }"
      >
        <div class="icon-wrapper">
          <component :is="icon" />
        </div>
      </div>
    </div>

    <!-- 装饰性粒子 -->
    <div class="particles">
      <div v-for="i in 30" :key="i" class="particle" :style="{ '--index': Number(i / 14) }"></div>
    </div>

    <!-- 背景光晕 -->
    <div class="background-glow"></div>
  </div>
</template>

<style scoped lang="scss">
.icon-fly-container {
  position: relative;
  width: 400px;
  height: 400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0.5);
  transition: all 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  &.visible {
    opacity: 1;
    transform: scale(1);
  }
}

.center-icon {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3);
  animation: centerPulse 4s ease-in-out infinite;

  .anticon {
    color: var(--color-gray-10);
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  }
}

.center-glow {
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 0.3;
  animation: glowPulse 3s ease-in-out infinite;
  z-index: -1;
}

.orbit-container {
  position: absolute;
  width: 100%;
  height: 100%;
  animation: orbitRotate 60s linear infinite;
}

.orbit-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60px;
  height: 60px;
  margin: -30px 0 0 -30px;
  transform-origin: 150px 0;
  transform: rotate(var(--rotation)) translateX(150px) rotate(calc(-1 * var(--rotation)));
  animation: iconFloat 6s ease-in-out infinite;
  animation-delay: var(--delay);
  opacity: 0;
  animation-fill-mode: forwards;
}

.icon-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(var(--color-gray-12), 1);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;

  .anticon {
    font-size: 24px;
    transition: all 0.6s ease;
  }

  &:hover {
    transform: scale(1.2);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);
    background: var(--color-primary);

    .anticon {
      transform: rotate(360deg) scale(1.1);
    }
  }
}

.particles {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: linear-gradient(45deg, #667eea, #764ba2);
  opacity: 0;
  animation: particleFloat 10s ease-in-out infinite;
  animation-delay: calc(var(--index) * 0.5s);

  /* 随机分布粒子位置 */
  left: calc((var(--index) * 37) * 1% + 10%);
  top: calc((var(--index) * 23) * 1% + 10%);

  &:nth-child(even) {
    background: linear-gradient(45deg, #f093fb, #f5576c);
    left: calc((var(--index) * 41) * 1% + 5%);
    top: calc((var(--index) * 29) * 1% + 15%);
  }

  &:nth-child(3n) {
    background: linear-gradient(45deg, #4facfe, #00f2fe);
    left: calc((var(--index) * 43) * 1% + 15%);
    top: calc((var(--index) * 31) * 1% + 5%);
  }

  &:nth-child(4n) {
    left: calc((var(--index) * 47) * 1% + 20%);
    top: calc((var(--index) * 17) * 1% + 25%);
  }

  &:nth-child(5n) {
    left: calc((var(--index) * 53) * 1% + 8%);
    top: calc((var(--index) * 19) * 1% + 12%);
  }
}

.background-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle,
    rgba(102, 126, 234, 0.1) 0%,
    rgba(118, 75, 162, 0.05) 40%,
    transparent 70%
  );
  animation: backgroundRotate 60s linear infinite;
  z-index: -2;
}

@keyframes centerPulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 25px 50px rgba(102, 126, 234, 0.4);
  }
}

@keyframes glowPulse {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
}

@keyframes orbitRotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes iconFloat {
  0% {
    opacity: 0;
    transform: rotate(var(--rotation)) translateX(150px) rotate(calc(-1 * var(--rotation)))
      translateY(20px);
  }
  10% {
    opacity: 1;
  }
  50% {
    opacity: 1;
    transform: rotate(var(--rotation)) translateX(150px) rotate(calc(-1 * var(--rotation)))
      translateY(-10px);
  }
  90% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: rotate(var(--rotation)) translateX(150px) rotate(calc(-1 * var(--rotation)))
      translateY(0px);
  }
}

@keyframes particleFloat {
  0% {
    opacity: 0;
    transform: translateY(0px) translateX(0px) rotate(0deg) scale(0.5);
  }
  25% {
    opacity: 0.8;
    transform: translateY(-20px) translateX(10px) rotate(90deg) scale(1);
  }
  50% {
    opacity: 0.6;
    transform: translateY(-15px) translateX(-8px) rotate(180deg) scale(1.2);
  }
  75% {
    opacity: 0.4;
    transform: translateY(-25px) translateX(15px) rotate(270deg) scale(0.8);
  }
  100% {
    opacity: 0;
    transform: translateY(-30px) translateX(0px) rotate(360deg) scale(0.3);
  }
}

@keyframes backgroundRotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .icon-fly-container {
    width: 300px;
    height: 300px;
  }

  .orbit-icon {
    transform-origin: 100px 0;
    transform: rotate(var(--rotation)) translateX(100px) rotate(calc(-1 * var(--rotation)));
  }

  .center-icon {
    width: 60px;
    height: 60px;

    .anticon {
      font-size: 36px;
    }
  }

  .icon-wrapper {
    width: 45px;
    height: 45px;

    .anticon {
      font-size: 20px;
    }
  }
}

@media (max-width: 480px) {
  .icon-fly-container {
    width: 250px;
    height: 250px;
  }

  .orbit-icon {
    transform-origin: 80px 0;
    transform: rotate(var(--rotation)) translateX(80px) rotate(calc(-1 * var(--rotation)));
  }
}
</style>
