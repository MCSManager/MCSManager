import { ref } from "vue";
import { QUICKSTART_ACTION_TYPE } from "./widgets/quickStartFlow";
import { TYPE_MINECRAFT_JAVA } from "./useInstance";

type SystemType = "win32" | "linux";

export function useStartCmdBuilder() {
  const gameType = ref<QUICKSTART_ACTION_TYPE>();
  const appType = ref<string>();
  const systemType = ref<SystemType>("linux");

  const browserLanguage = navigator.language;
  const [language, country] = browserLanguage.split("-");
  const additionalArray = ["-Dfile.encoding=UTF-8"];
  if (language) additionalArray.push(`-Duser.language=${language}`);
  if (country) additionalArray.push(`-Duser.country=${country}`);

  const minecraftJava = ref({
    javaPath: "",
    jarName: "",
    maxMemory: "",
    minMemory: "",
    suffix: "nogui",
    additional: additionalArray.join(" ")
  });

  const setSystem = (type: SystemType) => {
    systemType.value = type;
  };

  const setAppType = (type: string) => {
    appType.value = type;
  };

  const setGameType = (type: QUICKSTART_ACTION_TYPE) => {
    gameType.value = type;
  };

  const buildCmd = () => {
    if (
      gameType.value === QUICKSTART_ACTION_TYPE.Minecraft &&
      appType.value === TYPE_MINECRAFT_JAVA
    ) {
      const config = minecraftJava.value;
      const javaPath = config.javaPath ? `"${config.javaPath}"` : "java";
      const jarName = config.jarName.includes(" ") ? `"${config.jarName}"` : config.jarName;
      return `${javaPath} -Xms${config.minMemory} -Xmx${config.maxMemory} ${additionalArray} -jar "${jarName}" ${config.suffix}`;
    }
  };

  return {
    setSystem,
    buildCmd,
    setAppType,
    setGameType,
    gameType,
    appType,
    minecraftJava
  };
}
