import { AnimationTimer, elapsed } from "parsegraph-timing";
import { ImageWindow, INTERVAL } from "parsegraph-window";
import Viewport from "./Viewport";
import World from "./World";

export default class ImageBuilder {
  _renderTimer: AnimationTimer;
  _window: ImageWindow;
  _world: World;
  _viewport: Viewport;

  _jobs: any[];
  _builders: any[];

  constructor(width: number, height: number) {
    this._renderTimer = new AnimationTimer();
    this._renderTimer.setListener(this.cycle, this);

    this._jobs = [];
    this._builders = [];
    this._window = new ImageWindow(width, height);
    this._window.setOnScheduleUpdate(this.scheduleUpdate, this);
    this._world = new World();
    this._viewport = new Viewport(this._world);
    this._window.addComponent(this._viewport);

    this.scheduleUpdate();
  }

  scheduleUpdate() {
    this._renderTimer.schedule();
  }

  window() {
    return this._window;
  }

  viewport() {
    return this._viewport;
  }

  world() {
    return this._world;
  }

  createImage(
    creatorFunc: Function,
    creatorFuncThisArg?: any,
    callbackFunc?: Function,
    callbackFuncThisArg?: any
  ) {
    this._jobs.push({
      creatorFunc: creatorFunc,
      creatorFuncThisArg: creatorFuncThisArg,
      callbackFunc: callbackFunc,
      callbackFuncThisArg: callbackFuncThisArg,
    });
  }

  queueJob(builderFunc: Function, builderFuncThisArg?: any) {
    const job = this._jobs[0];
    if (!job) {
      throw new Error(
        "ImageBuilder must have a scene in progress to queue a builder."
      );
    }
    if (!job.builders) {
      job.builders = [];
    }
    job.builders.push([builderFunc, builderFuncThisArg]);
  }

  cycle() {
    const timeout = INTERVAL;
    const startTime = new Date();
    const timeLeft = function () {
      return timeout - elapsed(startTime);
    };
    const job = this._jobs[0];
    if (!job) {
      // console.log("No scenes to build.");
      return false;
    }
    if (!job.rootless && !job.root) {
      job.root = job.creatorFunc.call(job.creatorFuncThisArg);
      if (!job.root) {
        job.rootless = true;
      } else {
        this._viewport.showInCamera(job.root);
        this._world.plot(job.root);
        this._world.scheduleRepaint();
      }
      job.callbackFunc.call(job.callbackFuncThisArg, this._window.image());
    }
    if (job.builders) {
      for (let builder = job.builders[0]; builder; builder = job.builders[0]) {
        const callAgain = builder[0].call(builder[1], timeLeft());
        if (!callAgain) {
          // console.log("Finished with builder");
          job.builders.shift();
        }
        if (timeLeft() < 0) {
          this.scheduleUpdate();
          return;
        }
      }
    }
    let needsUpdate = job.builders && job.builders.length > 0;
    needsUpdate = this._window.paint(timeLeft()) || needsUpdate;
    needsUpdate = this._window.render() || needsUpdate;
    if (needsUpdate) {
      this.scheduleUpdate();
      return;
    }
    // console.log("Completed render");
    this._jobs.shift();
    this._window.newImage();
    if (job.root) {
      this._world.removePlot(job.root);
    }
    this.scheduleUpdate();
  }
}
