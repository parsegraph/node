const path = require("path");

module.exports = {
  externals: {
    "parsegraph-checkglerror":{
      commonjs:"parsegraph-checkglerror",
      commonjs2:"parsegraph-checkglerror",
      amd:"parsegraph-checkglerror",
      root:"parsegraph_checkglerror"
    },
    "parsegraph-log":{
      commonjs:"parsegraph-log",
      commonjs2:"parsegraph-log",
      amd:"parsegraph-log",
      root:"parsegraph_log"
    }
  },
  entry: {
    lib: path.resolve(__dirname, "src/index.ts"),
    list: path.resolve(__dirname, "src/demo/list.tsx"),
    tree: path.resolve(__dirname, "src/demo/tree.tsx"),
    element: path.resolve(__dirname, "src/demo/element.tsx"),
    parsetree: path.resolve(__dirname, "src/demo/parsetree.tsx"),
    demolist: path.resolve(__dirname, "src/demo/demolist.tsx"),
    multislot: path.resolve(__dirname, "src/demo/multislot.tsx"),
    lisp: path.resolve(__dirname, "src/demo/lisp.tsx"),
    ebnf: path.resolve(__dirname, "src/demo/ebnf.tsx"),
    carousel: path.resolve(__dirname, "src/demo/carousel.tsx"),
    log: path.resolve(__dirname, "src/demo/log.tsx"),
    parsegraph: path.resolve(__dirname, "src/demo/parsegraph.tsx"),
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "parsegraph-node.[name].js",
    globalObject: "this",
    library: "parsegraph_node",
    libraryTarget: "umd",
  },
  module: {
    rules: [
      {
        test: /\.(js|ts|tsx?)$/,
        exclude: /node_modules/,
        use: ["babel-loader", "ts-loader"]
      },
      {
        test: /\.(glsl|vs|fs|vert|frag)$/,
        exclude: /node_modules/,
        use: ["ts-shader-loader"],
      },
      {
        test: /\.png/,
        type: "asset/inline"
      }
    ],
  },
  resolve: {
    extensions: [".js", ".ts", ".tsx", ".glsl"],
    modules: [
      path.resolve(__dirname, "src"),
      path.resolve(__dirname, "node_modules"),
    ]
  },
  mode: "development",
  devtool: "eval-source-map",
};
