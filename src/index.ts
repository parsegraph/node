import TestSuite, { getAllTests } from "parsegraph-testsuite";
import Rect from "parsegraph-rect";
import { Direction, Axis } from "parsegraph-direction";
import DefaultNodeType, { Type } from "./DefaultNodeType";
import Node from "./Node";
import Label from "./Label";
import Line from "./Line";
import GlyphIterator from "./GlyphIterator";

import { copyStyle, BUD_RADIUS } from "./DefaultNodeStyle";

import ImageBuilder from "./ImageBuilder";

import DirectionNode, {
  PreferredAxis,
  LayoutState,
  nameLayoutState,
  namePreferredAxis,
  readPreferredAxis,
  turnRight,
  turnLeft,
  readDirection,
  turnPositive,
  turnNegative,
  AxisOverlap,
  Alignment,
  nameAlignment,
  readAlignment,
  readAxisOverlap,
  nameAxisOverlap,
  Fit,
  nameFit,
  readFit,
} from "parsegraph-direction";

import { LayoutNode } from "parsegraph-layout";
import showGraph from "./showGraph";
import { showInCamera, showNodeInCamera } from "./showInCamera";
import { addEventMethod, addEventListener } from "./event";
import Viewport, {
  FullscreenViewportDisplayMode,
  SingleScreenViewportDisplayMode,
  FixedWidthViewportDisplayMode,
  ViewportDisplayMode,
  FitInWindowViewportDisplayMode,
} from "./Viewport";
import Window, {
  Component,
  ProxyComponent,
  LayoutList,
  TimingBelt,
} from "parsegraph-window";
import World from "./World";
import Caret from "./Caret";
import Color from "parsegraph-color";
import {
  elapsed,
  AnimationTimer,
  TimeoutTimer,
  IntervalTimer,
} from "parsegraph-timing";
import Unicode, { defaultUnicode, setDefaultUnicode } from "parsegraph-unicode";
import { CREASE, FONT_SIZE, FIT_LOOSE, defaultFont } from "./settings";
import {
  getImpulse,
  setImpulse,
  getMouseImpulseAdjustment,
  setMouseImpulseAdjustment,
  getWheelImpulseAdjustment,
  setWheelImpulseAdjustment,
} from "./Input";
import CameraFilter from "./CameraFilter";
import ActionCarousel from "./ActionCarousel";
import Carousel from "./Carousel";
import CarouselAction from "./CarouselAction";
import Camera from "parsegraph-camera";

import EnvironmentWidget from "./EnvironmentWidget";
import Widget from "./Widget";

import DefaultNodePalette from "./DefaultNodePalette";

const pal = new DefaultNodePalette();
export const BUD = pal.readType("bud");
export const SLOT = pal.readType("s");
export const BLOCK = pal.readType("b");
export const SLIDER = pal.readType("sl");
export const SCENE = pal.readType("sc");
export const NULL_TYPE: DefaultNodeType = null;

export const FORWARD = Direction.FORWARD;
export const BACKWARD = Direction.BACKWARD;
export const DOWNWARD = Direction.DOWNWARD;
export const UPWARD = Direction.UPWARD;
export const INWARD = Direction.INWARD;
export const OUTWARD = Direction.OUTWARD;
export const NULL_DIRECTION: Direction = null;

import render, {
  renderFullscreen,
  renderSingleScreen,
  renderFixedWidth,
  renderFitInWindow,
} from "./render";

// Tree Node
import AbstractTreeList from "./treenode/AbstractTreeList";
import BasicTreeList from "./treenode/BasicTreeList";
import TreeLabel from "./treenode/TreeLabel";
import InlineTreeList from "./treenode/InlineTreeList";
import TreeList from "./treenode/TreeList";
import TreeNode from "./treenode/TreeNode";
import WrappingTreeList from "./treenode/WrappingTreeList";
import BlockTreeNode from "./treenode/BlockTreeNode";

export {
  render,
  renderFullscreen,
  renderSingleScreen,
  renderFixedWidth,
  renderFitInWindow,
  copyStyle,
  BUD_RADIUS,
  Camera,
  CREASE,
  FONT_SIZE,
  FIT_LOOSE,
  defaultFont,
  elapsed,
  AnimationTimer,
  TimeoutTimer,
  IntervalTimer,
  TestSuite,
  getAllTests,
  LayoutNode,
  DirectionNode,
  DefaultNodeType,
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
  addEventListener,
  TimingBelt,
  Viewport,
  FullscreenViewportDisplayMode,
  SingleScreenViewportDisplayMode,
  FixedWidthViewportDisplayMode,
  ViewportDisplayMode,
  FitInWindowViewportDisplayMode,
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
  Widget,
  Label,
  Line,
  GlyphIterator,
  turnRight,
  turnLeft,
  turnPositive,
  turnNegative,
  readDirection,
  AbstractTreeList,
  BlockTreeNode,
  BasicTreeList,
  TreeLabel,
  InlineTreeList,
  TreeList,
  TreeNode,
  WrappingTreeList,
  ImageBuilder,
  showInCamera,
  showNodeInCamera,
};
