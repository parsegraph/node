DIST_NAME = node

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
	src/SpotlightPainter.ts \
	src/TexturePainter.ts \
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
	src/SpotlightPainter_FragmentShader.glsl \
	src/SpotlightPainter_VertexShader.glsl \
	src/TexturePainter_FragmentShader.glsl \
	src/TexturePainter_VertexShader.glsl

all: build lint test coverage esdoc

build: dist/$(DIST_NAME).js
.PHONY: build

build-prod:
	npm run build-prod
	mv -v dist/src/* dist/
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
	npx prettier --write src test demo
.PHONY: prettier

lint:
	npx eslint --fix $(SCRIPT_FILES)
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

parsegraph-$(DIST_NAME)-prod.tgz: dist/$(DIST_NAME)-prod.js
	rm -rf parsegraph-$(DIST_NAME)
	mkdir parsegraph-$(DIST_NAME)
	cp -r dist/ README.md LICENSE parsegraph-$(DIST_NAME)
	mv parsegraph-$(DIST_NAME)/dist/$(DIST_NAME)-prod.js parsegraph-$(DIST_NAME)/dist/$(DIST_NAME).js
	cp -r package-prod.json parsegraph-$(DIST_NAME)/package.json
	tar cvzf $@ parsegraph-$(DIST_NAME)/
	rm -rf parsegraph-$(DIST_NAME)

parsegraph-$(DIST_NAME)-dev.tgz: dist/$(DIST_NAME).js
	rm -rf parsegraph-$(DIST_NAME)
	mkdir parsegraph-$(DIST_NAME)
	cp -r -t parsegraph-$(DIST_NAME) package.json package-lock.json README.md demo/ LICENSE dist/
	tar cvzf $@ parsegraph-$(DIST_NAME)/
	rm -rf parsegraph-$(DIST_NAME)

dist/$(DIST_NAME).js: package.json package-lock.json $(SCRIPT_FILES) $(GLSL_SCRIPTS)
	npm run build
	mv -v dist/src/* dist/
	mv dist/index.d.ts dist/parsegraph-node.d.ts
	mv dist/index.d.ts.map dist/parsegraph-node.d.ts.map

dist/$(DIST_NAME)-prod.js: package.json package-lock.json $(SCRIPT_FILES)
	npm run build-prod
	mv -v dist/src/* dist/
	mv dist/index.d.ts dist/parsegraph-node.d.ts
	mv dist/index.d.ts.map dist/parsegraph-node.d.ts.map

clean:
	rm -rf dist .nyc_output
.PHONY: clean
