import { $t } from "../i18n";
import { routerApp } from "../service/router";
import { missionPassport } from "../service/mission_passport";
import * as protocol from "../service/protocol";

const ONE_HOUR_TIME = 3600000;
const TASK_MAX_TIME = 1;

// register temporary task passport
// For example, file upload, file download, these operations that need to bypass the Web side,
// all need to use this route
routerApp.on("passport/register", (ctx, data) => {
  const name = data.name;
  const password = data.password;
  const parameter = data.parameter;
  const count = data.count;
  const start = new Date().getTime();
  const end = start + ONE_HOUR_TIME * TASK_MAX_TIME;
  if (!name || !password) throw new Error($t("TXT_CODE_passport_router.registerErr"));
  missionPassport.registerMission(password, {
    name,
    parameter,
    count,
    start,
    end
  });
  protocol.response(ctx, true);
});
