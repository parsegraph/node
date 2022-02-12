DIST_NAME = node

SCRIPT_FOLDERS = \
	src \
	test \
	demo

SCRIPT_EXTENSIONS = \
	.js \
	.jsx \
	.ts \
	.tsx \
	.cjs

SCRIPT_FILES = \
	src/camerabox/CameraBox.ts \
	src/camerabox/CameraBoxPainter.ts \
	src/carousel/Carousel.ts \
	src/carousel/ActionCarousel.ts \
	src/carousel/CarouselAction.ts \
	src/element/NestedDom.ts \
	src/node/Caret.ts \
	src/node/DefaultNodePainter.ts \
	src/node/DefaultNodePalette.ts \
	src/node/DefaultNodeStyle.ts \
	src/node/DefaultNodeType.ts \
	src/node/Node.ts \
	src/node/NodeType.ts \
	src/render/render.ts \
	src/render/showGraph.ts \
	src/treenode/AbstractTreeList.ts \
	src/treenode/BasicTreeList.ts \
	src/treenode/InlineTreeList.ts \
	src/treenode/WrappingTreeList.ts \
	src/treenode/TreeNode.ts \
	src/treenode/TreeList.ts \
	src/treenode/TreeLabel.ts \
	src/viewport/BurgerMenu.ts \
	src/viewport/CameraFilter.ts \
	src/viewport/ImageBuilder.ts \
	src/viewport/Input.ts \
	src/viewport/Viewport.ts \
	src/widget/EnvironmentWidget.ts \
	src/widget/Widget.ts \
	src/index.ts \
	src/settings.ts \
	src/World.ts \
	src/demo/anthonylisp/index.ts \
	src/demo/anthonylisp/LispAtom.ts \
	src/demo/anthonylisp/LispCell.ts \
	src/demo/anthonylisp/LispEnvironment.ts \
	src/demo/anthonylisp/LispRuntime.ts \
	src/demo/anthonylisp/parse.ts \
	src/demo/ebnf/EBNF.ts \
	src/demo/ebnf/JsonGraph.ts \
	src/demo/ebnf/Lisp.ts \
	src/demo/carousel.tsx \
	src/demo/demolist.tsx \
	src/demo/ebnf.tsx \
	src/demo/element.tsx \
	src/demo/lisp.tsx \
	src/demo/list.tsx \
	src/demo/log.tsx \
	src/demo/multislot.tsx \
	src/demo/parsegraph.tsx \
	src/demo/parsetree.tsx \
	src/demo/tree.tsx

GLSL_SCRIPTS = \
	src/FanPainter_FragmentShader.glsl \
	src/FanPainter_VertexShader.glsl \
	src/Freezer_FragmentShader.glsl \
	src/Freezer_VertexShader.glsl \
	src/GlyphPainter_FragmentShader.glsl \
	src/GlyphPainter_VertexShader.glsl \
	src/TexturePainter_FragmentShader.glsl \
	src/TexturePainter_VertexShader.glsl

all: build lint test coverage esdoc

build: dist/parsegraph-$(DIST_NAME).js
	echo Build complete.
.PHONY: build

build-prod: dist-prod/parsegraph-$(DIST_NAME).js
.PHONY: build-prod

demo: dist/$(DIST_NAME).js
	npm run demo
.PHONY: demo

check:
	npm run test
.PHONY: check

test: check
.PHONY: test

coverage:
	npm run coverage
.PHONY: coverage

prettier:
	npx prettier --write $(SCRIPT_FOLDERS)
.PHONY: prettier

lint:
	npx eslint --ext "$(SCRIPT_EXTENSIONS)" --fix $(SCRIPT_FILES)
.PHONY: lint

esdoc:
	npx esdoc
.PHONY: esdoc

doc: esdoc
.PHONY: doc

tar: parsegraph-$(DIST_NAME)-dev.tgz
.PHONY: tar

tar-prod: parsegraph-$(DIST_NAME)-prod.tgz
.PHONY: tar

parsegraph-$(DIST_NAME)-prod.tgz: dist-prod/parsegraph-$(DIST_NAME).js
	rm -rf parsegraph-$(DIST_NAME)
	mkdir parsegraph-$(DIST_NAME)
	cp -r README.md LICENSE parsegraph-$(DIST_NAME)
	cp -r dist-prod/ parsegraph-$(DIST_NAME)/dist
	cp -r package-prod.json parsegraph-$(DIST_NAME)/package.json
	tar cvzf $@ parsegraph-$(DIST_NAME)/
	rm -rf parsegraph-$(DIST_NAME)

parsegraph-$(DIST_NAME)-dev.tgz: dist/parsegraph-$(DIST_NAME).js
	rm -rf parsegraph-$(DIST_NAME)
	mkdir parsegraph-$(DIST_NAME)
	cp -r -t parsegraph-$(DIST_NAME) package.json package-lock.json README.md demo/ LICENSE dist/
	tar cvzf $@ parsegraph-$(DIST_NAME)/
	rm -rf parsegraph-$(DIST_NAME)

dist/parsegraph-$(DIST_NAME).js: package.json package-lock.json $(SCRIPT_FILES) $(GLSL_SCRIPTS)
	npm run build
	test ! -e dist-types/src/demo/ebnf || (mkdir -p dist/demo/ebnf && mv -v dist-types/src/demo/ebnf/* dist/demo/ebnf)
	rm -rf dist-types/src/demo/ebnf
	test ! -e dist-types/src/demo/anthonylisp || (mkdir -p dist/demo/anthonylisp && mv -v dist-types/src/demo/anthonylisp/* dist/demo/anthonylisp)
	rm -rf dist-types/src/demo/anthonylisp
	test ! -e dist-types/src/demo || (mkdir -p dist/demo && mv -v dist-types/src/demo/* dist/demo)
	rm -rf dist-types/src/demo
	test ! -e dist-types/src/treenode || (mkdir -p dist/treenode && mv -v dist-types/src/treenode/* dist/treenode)
	rm -rf dist-types/src/treenode
	mv -v dist-types/src/* dist/
	mv dist/index.d.ts dist/parsegraph-node.d.ts
	mv dist/index.d.ts.map dist/parsegraph-node.d.ts.map

dist-prod/parsegraph-$(DIST_NAME).js: package.json package-lock.json $(SCRIPT_FILES)
	npm run build-prod
	mv -v dist-types/src/* dist-prod/
	mv dist-prod/index.d.ts dist-prod/parsegraph-node.d.ts
	mv dist-prod/index.d.ts.map dist-prod/parsegraph-node.d.ts.map

clean:
	rm -rf dist dist-types dist-prod .nyc_output parsegraph-$(DIST_NAME) parsegraph-$(DIST_NAME)-dev.tgz parsegraph-$(DIST_NAME)-prod.tgz
.PHONY: clean
