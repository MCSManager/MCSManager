import { ILifeCycleTask } from "../../instance/life_cycle";
import Instance from "../../instance/instance";

export default class RefreshPlayer implements ILifeCycleTask {
  public name: string = "RefreshPlayer";
  public status: number = 0;

  private task: any = null;
  private playersChartTask: any = null;
  private playersChart: Array<{ value: string }> = [];

  async start(instance: Instance) {
    this.task = setInterval(async () => {
      // {
      // host: 'localhost',
      // port: 28888,
      // status: true,
      // version: '1.17.1',
      // motd: 'A Minecraft Server',
      // current_players: '0',
      // max_players: '20',
      // latency: 1
      // }
      try {
        // Get information such as the number of players, version, etc.
        const result = await instance.execPreset("getPlayer");
        if (!result) return;
        instance.info.maxPlayers = result.max_players ? result.max_players : -1;
        instance.info.currentPlayers = result.current_players ? result.current_players : -1;
        instance.info.version = result.version ? result.version : "";

        // When the number of users is correctly obtained for the first time, initialize the number of players graph
        if (this.playersChart.length === 0) {
          this.initPlayersChart(instance);
        }
      } catch (error: any) {}
    }, 3000);

    // Start the timer for querying the online population report data
    this.playersChartTask = setInterval(() => {
      this.getPlayersChartData(instance);
    }, 600000);
  }

  initPlayersChart(instance: Instance) {
    while (this.playersChart.length < 60) {
      this.playersChart.push({ value: "0" });
    }
    instance.info.playersChart = this.playersChart;
    this.getPlayersChartData(instance);
  }

  getPlayersChartData(instance: Instance) {
    try {
      this.playersChart.shift();
      this.playersChart.push({
        value: String(instance.info.currentPlayers) ?? "0"
      });
      instance.info.playersChart = this.playersChart;
    } catch (error: any) {}
  }

  async stop(instance: Instance) {
    clearInterval(this.task);
    clearInterval(this.playersChartTask);
    instance.info.maxPlayers = -1;
    instance.info.currentPlayers = -1;
    instance.info.version = "";
    instance.info.playersChart = [];
    this.playersChart = [];
    this.playersChartTask = null;
    this.task = null;
  }
}
