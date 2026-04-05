import { ref } from "vue";
import { QUICKSTART_ACTION_TYPE } from "./widgets/quickStartFlow";
import { TYPE_MINECRAFT_JAVA, TYPE_STEAM_SERVER_UNIVERSAL, TYPE_UNIVERSAL } from "./useInstance";

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

  const anyAppForm = ref({
    softwarePath: "",
    params: ""
  });

  const setSystem = (type: SystemType) => {
    systemType.value = type;
  };

  const setAppType = (type: string) => {
    appType.value = type;
  };

  const setGameType = (type: QUICKSTART_ACTION_TYPE) => {
    gameType.value = type;
    if (type === QUICKSTART_ACTION_TYPE.Minecraft) {
      return setAppType(TYPE_MINECRAFT_JAVA);
    }
    if (type === QUICKSTART_ACTION_TYPE.SteamGameServer) {
      return setAppType(TYPE_STEAM_SERVER_UNIVERSAL);
    }
    setAppType(TYPE_UNIVERSAL);
  };

  const buildCmd = () => {
    if (
      gameType.value === QUICKSTART_ACTION_TYPE.Minecraft &&
      appType.value === TYPE_MINECRAFT_JAVA
    ) {
      const config = minecraftJava.value;
      const javaPath = config.javaPath ? `"${config.javaPath}"` : "java";
      const jarName = config.jarName.includes(" ") ? `"${config.jarName}"` : config.jarName;
      const memArray = [];
      if (config.minMemory) memArray.push(`-Xms${config.minMemory}`);
      if (config.maxMemory) memArray.push(`-Xmx${config.maxMemory}`);
      const cmd = [javaPath, ...memArray, ...additionalArray, "-jar", jarName, config.suffix];
      return cmd.join(" ");
    }
    const config = anyAppForm.value;
    const softPath = config.softwarePath.includes(" ")
      ? `"${config.softwarePath}"`
      : config.softwarePath;
    return `${softPath} ${config.params}`;
  };

  return {
    setSystem,
    buildCmd,
    setAppType,
    setGameType,
    gameType,
    appType,
    minecraftJava,
    anyAppForm
  };
}
