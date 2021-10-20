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
	src/index.ts \
	src/ActionCarousel.ts \
	src/AnimatedSpotlight.ts \
	src/BurgerMenu.ts \
	src/CameraBox.ts \
	src/CameraBoxPainter.ts \
	src/CameraFilter.ts \
	src/Caret.ts \
	src/Carousel.ts \
	src/CarouselAction.ts \
	src/date.js \
	src/DefaultNodePainter.ts \
	src/DefaultNodePalette.ts \
	src/DefaultNodeStyle.ts \
	src/DefaultNodeType.ts \
	src/EnvironmentWidget.ts \
	src/event.js \
	src/EventCaret.ts \
	src/EventNode.ts \
	src/Exception.ts \
	src/FanPainter.ts \
	src/Font.ts \
	src/Freezer.ts \
	src/getproperkeyname.ts \
	src/glsl.d.ts \
	src/GlyphPainter.ts \
	src/ImageBuilder.ts \
	src/Input.ts \
	src/KeyInput.ts \
	src/Label.ts \
	src/log.ts \
	src/math.ts \
	src/Node.ts \
	src/NodePainter.ts \
	src/NodeType.ts \
	src/parsegraph_Graph_Tests.js \
	src/settings.ts \
	src/showGraph.ts \
	src/TexturePainter.ts \
	src/TreeNode.ts \
	src/TreeListNode.ts \
	src/ConstantTreeNode.ts \
	src/TreeListStyle.ts \
	src/Viewport.ts \
	src/Widget.ts \
	src/WindowCaret.ts \
	src/WindowNode.ts \
	src/World.ts

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
	npx eslint --ext "$(SCRIPT_EXTENSIONS)" --fix $(SCRIPT_FOLDERS)
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
