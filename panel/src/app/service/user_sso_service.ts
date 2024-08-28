import { v4 } from "uuid";

export default class UserSSOService {
  private static tokens = new Map<string, string>();

  constructor() {}

  public static generateSSOToken(username: string) {
    const token = v4();
    UserSSOService.tokens.set(token, username);
    return token;
  }

  public static verifySSOToken(username: string, token: string) {
    const name = UserSSOService.tokens.get(token);
    if (name === username) {
      UserSSOService.tokens.delete(token);
      return true;
    } else {
      return false;
    }
  }
}
