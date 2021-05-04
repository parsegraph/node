import TestSuite, {getAllTests} from 'parsegraph-testsuite';
import Rect from 'parsegraph-rect';
import {Direction, Axis} from 'parsegraph-direction';
import DefaultNodeType, {Type} from './DefaultNodeType';
import Node from './Node';
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
import showGraph from './showGraph';
import {addEventMethod} from './event';
import Viewport from './Viewport';
import Window, {Component, ProxyComponent, LayoutList, TimingBelt} from 'parsegraph-window';
import World from './World';
import Caret from './Caret';
import Color from 'parsegraph-color';
import {elapsed, AnimationTimer, TimeoutTimer, IntervalTimer} from 'parsegraph-timing';
import Unicode, {
  defaultUnicode,
  setDefaultUnicode,
} from 'parsegraph-unicode';
import {
  CREASE,
} from './settings';
import {
  getImpulse,
  setImpulse,
  getMouseImpulseAdjustment,
  setMouseImpulseAdjustment,
  getWheelImpulseAdjustment,
  setWheelImpulseAdjustment
} from './Input';
import CameraFilter from './CameraFilter';
import ActionCarousel from './ActionCarousel';
import Carousel from './Carousel';
import CarouselAction from './CarouselAction';
import Camera from 'parsegraph-camera'

import EnvironmentWidget from './EnvironmentWidget';
import Widget from './Widget';

import DefaultNodePalette from './DefaultNodePalette';

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
  Caret,
  Unicode,
  defaultUnicode,
  setDefaultUnicode,
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
  DefaultNodePalette,
  PreferredAxis,
  LayoutState,
  nameLayoutState,
  namePreferredAxis,
  readPreferredAxis,
  EnvironmentWidget,
  Widget
};
