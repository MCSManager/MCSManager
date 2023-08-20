// task interface
interface IMission {
  name: string;
  parameter: any;
  start: number;
  end: number;
  count?: number;
}

// Task passport manager
class MissionPassport {
  // temporary task passport list
  public readonly missions = new Map<string, IMission>();

  constructor() {
    // Set up to check the task expiration every hour
    setInterval(() => {
      const t = new Date().getTime();
      this.missions.forEach((m, k) => {
        if (t > m.end) this.missions.delete(k);
      });
    }, 1000);
  }

  // register task passport
  public registerMission(password: string, mission: IMission) {
    if (this.missions.has(password))
      throw new Error("Duplicate primary key, failed to create task");
    this.missions.set(password, mission);
  }

  // Get the task based on the passport and task name
  public getMission(password: string, missionName: string) {
    if (!this.missions.has(password)) return null;
    const m = this.missions.get(password);
    if (m.name === missionName) return m;
    return null;
  }

  public deleteMission(password: string) {
    this.missions.delete(password);
  }
}

const missionPassport = new MissionPassport();

export { missionPassport, IMission };
