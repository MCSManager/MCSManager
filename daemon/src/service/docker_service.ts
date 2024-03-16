import Docker from "dockerode";

export class DockerManager {
  // 1=creating 2=creating completed -1=creating error
  public static readonly builderProgress = new Map<string, number>();

  public docker: Docker;

  constructor(p?: any) {
    this.docker = new Docker(p);
  }

  public getDocker() {
    return this.docker;
  }

  public static setBuilderProgress(imageName: string, status: number) {
    DockerManager.builderProgress.set(imageName, status);
  }

  public static getBuilderProgress(imageName: string) {
    return DockerManager.builderProgress.get(imageName);
  }

  async startBuildImage(dockerFileDir: string, dockerImageName: string) {
    try {
      // Set the current image creation progress
      DockerManager.setBuilderProgress(dockerImageName, 1);
      // Issue the create image command
      const stream = await this.docker.buildImage(
        {
          context: dockerFileDir,
          src: ["Dockerfile"]
        },
        { t: dockerImageName }
      );
      // wait for creation to complete
      await new Promise((resolve, reject) => {
        this.docker.modem.followProgress(stream, (err, res) => (err ? reject(err) : resolve(res)));
      });
      // Set the current image creation progress
      DockerManager.setBuilderProgress(dockerImageName, 2);
    } catch (error: any) {
      // Set the current image creation progress
      DockerManager.setBuilderProgress(dockerImageName, -1);
    }
  }
}
