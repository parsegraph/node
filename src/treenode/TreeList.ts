import TreeNode from "./TreeNode";

export default interface TreeList extends TreeNode {
  appendChild(child: TreeNode): void;
  indexOf(child: TreeNode): number;
  insertBefore(child: TreeNode, ref: TreeNode): boolean;
  removeChild(child: TreeNode): boolean;
}
