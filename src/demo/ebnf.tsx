import { renderFullscreen } from "../render";
import Caret from "../Caret";
import { TimingBelt } from "parsegraph-window";
import World from "../World";
import Node from "../Node";
import DefaultNodeType from "../DefaultNodeType";
import TreeListNode from "../treenode/TreeListNode";
import TreeListStyle from "../treenode/TreeListStyle";
import BasicTreeListStyle from "../treenode/BasicTreeListStyle";
import WrappingTreeListStyle from "../treenode/WrappingTreeListStyle";
import { Grammars, IToken } from "ebnf";

function graphWithNewlines(
  root: TreeListNode<Node<DefaultNodeType>>,
  list: IToken[],
  style?: TreeListStyle<Node<DefaultNodeType>>
) {
  if (!style) {
    style = new WrappingTreeListStyle();
  }
  list.forEach((child) => {
    let newNode = style.createList();
    /*if (child.newLined) {
      let nl = style.createList();
      style.setType(nl, 'newline');
      root.appendChild(nl);
      }*/
    console.log("Creating node", child);
    switch (child.type) {
      case "Choice":
        newNode = style.createList();
        style.setType(newNode, "string");
        style.setLabel(newNode, child.type);
        graphWithNewlines(newNode, child.children, style);
        break;
      case "SequenceOrDifference":
        graphWithNewlines(root, child.children, style);
        return;
      case "Production":
      case "CharClass":
      case "CharRange":
      case "Item":
      case "SubItem":
        style.setType(newNode, "list");
        graphWithNewlines(newNode, child.children, style);
        break;
      case "PrimaryDecoration":
        style.setType(newNode, "literal");
        style.setLabel(newNode, child.text);
        break;
      case "StringLiteral":
      case "CharCodeRange":
      case "CharCode":
      case "RULE_Char":
      case "NCName":
        style.setType(newNode, "string");
        style.setLabel(newNode, child.text);
        break;
      default:
        style.setType(newNode, "literal");
        style.setLabel(newNode, child.type + " " + child.text);
        graphWithNewlines(newNode, child.children, style);
    }
    root.appendChild(newNode);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const belt = new TimingBelt();
  const world = new World();
  const caret = new Caret();

  const refresh = () => {
    console.log("Refreshing");
    const text = (document.getElementById("children") as HTMLInputElement)
      .value;
    console.log("children", text);
    let bnfParser = new Grammars.W3C.Parser(text);
    const children = bnfParser.getAST(text);
    console.log(children);
    caret.moveToRoot();
    caret.disconnect("f");
    caret.disconnect("b");
    caret.disconnect("d");
    caret.disconnect("u");
    const rootStyle = new BasicTreeListStyle();
    const root = new TreeListNode<Node<DefaultNodeType>>(rootStyle);
    rootStyle.setType(root, "u");
    graphWithNewlines(root, children.children);
    console.log("Tree root", root);
    caret.connect("f", root.root());
    world.scheduleRepaint();
    belt.scheduleUpdate();
  };
  document.getElementById("children").addEventListener("change", refresh);
  world.plot(caret.root());
  renderFullscreen(belt, world, document.getElementById("parsegraph-tree"));

  fetch("/w3cbnf.grammar")
    .then((resp) => resp.text())
    .then((text) => {
      (document.getElementById("children") as HTMLInputElement).value = text;
      refresh();
    });
});
