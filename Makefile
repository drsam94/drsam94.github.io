SRC=src/game.ts src/GUITypes.ts
BROWSER=chromium-browser
all: clean release lint fixTheFactThatTypescriptIsAPieceOfShitThatCantDoAnythingOnItsOwn run
release:
	tsc --removeComments --strictFunctionTypes --noImplicitThis --alwaysStrict --noUnusedLocals \
	--noUnusedParameters --noImplicitReturns --strict --noImplicitAny --noFallthroughCasesInSwitch \
	--charset ASCII --diagnostics --extendedDiagnostics --pretty --outDir build --module es2015 \
	$(SRC)
lint:
	tslint -c tslint.json $(SRC)
run:
	http-server -c-1 & $(BROWSER) 127.0.0.1:8080/index.html & sync build/game.js
fixTheFactThatTypescriptIsAPieceOfShitThatCantDoAnythingOnItsOwn:
	sed s/GUITypes/GUITypes.js/ build/game.js > build/tmp
	mv build/tmp build/game.js
	sync build/game.js
clean:
	(rm build/* || true) && (killall node || true)
