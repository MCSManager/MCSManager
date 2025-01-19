import RouterContext from "../entity/ctx";

interface IMission {
  name: string;
  parameter: any;
  start: number;
  end: number;
  count?: number;
  isDeleted?: boolean;
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
        if (t > m.end || m.isDeleted) this.missions.delete(k);
      });
    }, 1000 * 60);
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
    if (m?.name === missionName) return m;
    return null;
  }

  public deleteMission(password: string) {
    const m = this.missions.get(password);
    if (m) m.isDeleted = true;
  }
}

const LOGIN_BY_TOP_LEVEL = "TOP_LEVEL";
const LOGIN_FROM_STREAM = "STREAM";

// This function must be executed after successful login
function loginSuccessful(ctx: RouterContext, key: string) {
  ctx.session.key = key;
  ctx.session.login = true;
  ctx.session.id = ctx.socket.id;
  ctx.session.type = LOGIN_BY_TOP_LEVEL;
  ctx.session.stream = {};
  return ctx.session;
}

function streamLoginSuccessful(ctx: RouterContext, instanceUuid: string) {
  ctx.session.id = ctx.socket.id;
  ctx.session.login = true;
  ctx.session.type = LOGIN_FROM_STREAM;
  ctx.session.stream = {
    check: true,
    instanceUuid
  };
  return ctx.session;
}

const missionPassport = new MissionPassport();

export {
  missionPassport,
  IMission,
  LOGIN_BY_TOP_LEVEL,
  LOGIN_FROM_STREAM,
  loginSuccessful,
  streamLoginSuccessful
};
