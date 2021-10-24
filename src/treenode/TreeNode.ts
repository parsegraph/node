import WindowNode from "../WindowNode";

export default interface TreeNode {
  root(): WindowNode;
  getValue(): any;
}
