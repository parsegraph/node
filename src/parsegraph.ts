import TestSuite, {getAllTests} from 'parsegraph-testsuite';
import Rect from 'parsegraph-rect';
import {Direction, Axis} from 'parsegraph-direction';
import DefaultNodeType, {Type} from './graph/DefaultNodeType';
import Node from './graph/Node';
import DirectionNode, {
  PreferredAxis,
  LayoutState,
  nameLayoutState,
  namePreferredAxis,
  readPreferredAxis
} from 'parsegraph-direction';
import {
  LayoutNode,
  AxisOverlap,
  Alignment,
  nameAlignment,
  readAlignment,
  readAxisOverlap,
  nameAxisOverlap,
  Fit,
  nameFit,
  readFit
} from 'parsegraph-layout';
import showGraph from './graph/showGraph';
import {addEventMethod} from './event';
import Viewport from './graph/Viewport';
import Window, {Component, ProxyComponent, LayoutList, TimingBelt} from 'parsegraph-window';
import World from './graph/World';
import Caret from './graph/Caret';
import Color from 'parsegraph-color';
import buildTextDemo from './widgets/text';
import PrimesWidget from './widgets/primes';
import ChessWidget from './widgets/chess';
import showCorporateStructure from './widgets/corporate';
import showFlowchartTemplate from './widgets/builder';
import MemoryPiers from './widgets/piers';
import Room, {Spawner, SpawnerRegistry} from './widgets/room';
import {elapsed, AnimationTimer, TimeoutTimer, IntervalTimer} from 'parsegraph-timing';
import Unicode, {
  defaultUnicode,
  setDefaultUnicode,
} from 'parsegraph-unicode';
import {
  CREASE,
} from './graph/settings';
import {
  getImpulse,
  setImpulse,
  getMouseImpulseAdjustment,
  setMouseImpulseAdjustment,
  getWheelImpulseAdjustment,
  setWheelImpulseAdjustment
} from './graph/Input';
import Multislot, {MultislotSpawner} from './widgets/multislot';
import CameraFilter from './graph/CameraFilter';
import ActionCarousel from './graph/ActionCarousel';
import Carousel from './graph/Carousel';
import CarouselAction from './graph/CarouselAction';
import Camera from 'parsegraph-camera'
import CreaseWidget from './widgets/crease';

import EnvironmentWidget from './graph/EnvironmentWidget';
import Widget from './graph/Widget';

import DefaultNodePalette from './graph/DefaultNodePalette';

const pal = new DefaultNodePalette();
export const BUD = pal.readType('bud');
export const SLOT = pal.readType('s');
export const BLOCK = pal.readType('b');
export const SLIDER = pal.readType('sl');
export const SCENE = pal.readType('sc');
export const NULL_TYPE:DefaultNodeType = null;

export const FORWARD = Direction.FORWARD;
export const BACKWARD = Direction.BACKWARD;
export const DOWNWARD = Direction.DOWNWARD;
export const UPWARD = Direction.UPWARD;
export const INWARD = Direction.INWARD;
export const OUTWARD = Direction.OUTWARD;
export const NULL_DIRECTION:Direction = null;

export {
  Camera,
  CREASE,
  elapsed,
  AnimationTimer,
  TimeoutTimer,
  IntervalTimer,
  TestSuite,
  getAllTests,
  LayoutNode,
  DirectionNode,
  Node,
  Rect,
  Color,
  showGraph,
  Type,
  Direction,
  Axis,
  Alignment,
  readAlignment,
  nameAlignment,
  AxisOverlap,
  nameAxisOverlap,
  readAxisOverlap,
  Fit,
  nameFit,
  readFit,
  addEventMethod,
  TimingBelt,
  Viewport,
  Window,
  ProxyComponent,
  Component,
  LayoutList,
  World,
  buildTextDemo,
  Caret,
  PrimesWidget,
  ChessWidget,
  showCorporateStructure,
  showFlowchartTemplate,
  Unicode,
  defaultUnicode,
  setDefaultUnicode,
  MemoryPiers,
  Multislot,
  MultislotSpawner,
  Room, Spawner, SpawnerRegistry,
  getImpulse,
  setImpulse,
  getMouseImpulseAdjustment,
  setMouseImpulseAdjustment,
  getWheelImpulseAdjustment,
  setWheelImpulseAdjustment,
  CameraFilter,
  ActionCarousel,
  Carousel,
  CarouselAction,
  CreaseWidget,
  DefaultNodePalette,
  PreferredAxis,
  LayoutState,
  nameLayoutState,
  namePreferredAxis,
  readPreferredAxis,
  EnvironmentWidget,
  Widget
};
