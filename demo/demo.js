const glob = require("glob");

const express = require("express");
const app = express();
const args = process.argv.slice(2);
const port = args.length > 0 ? parseInt(args[0]) : 3001;

async function getDemos() {
  return new Promise((respond, reject) => {
    glob("www/*.html", {}, function (err, files) {
      if (err) {
        reject(err);
      }
      // files is an array of filenames.
      respond(
        files
          .map((file) => {
            const m = file.match(/www\/(\w+)\.html/);
            [1];
            return m ? m[1] : null;
          })
          .filter((file) => file)
      );
    });
  });
}

app.get("/demos", async (req, res) => {
  res.end((await getDemos()).join("\n"));
});

app.get("/", async (req, res) => {
  resp = "";
  const write = (text) => {
    resp += text + "\n";
  };

  write(`<!DOCTYPE html>`);
  write(`<html>`);
  write(`<head>`);
  write(`<title>node</title>`);
  write(`<script src="parsegraph-checkglerror.js"></script>`);
  write(`</head>`);
  write(`<body style="margin: 0; padding: 0">`);
  write(`<div style="width: 100vw; height: 100vh">`);
  write(`<div style="width: 100%; height: 100%" id="parsegraph-tree"></div>`);
  write(`</div>`);
  write(`<script src="parsegraph-node.demolist.js"></script>`);
  write(`</body>`);
  write(`</html>`);

  res.end(resp);
});

app.use(express.static("./src"));
app.use(express.static("./dist"));
app.use(express.static("./www"));

app.listen(port, () => {
  console.log(`See node build information at http://localhost:${port}`);
});
