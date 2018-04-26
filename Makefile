SRC=src/game.ts src/GUITypes.ts
all: clean release lint
release:
	tsc --removeComments --strictFunctionTypes --noImplicitThis --alwaysStrict --noUnusedLocals \
	--noUnusedParameters --noImplicitReturns --strict --noImplicitAny --noFallthroughCasesInSwitch \
	--charset ASCII --diagnostics --extendedDiagnostics --pretty --outFile build/game.js --module amd \
	$(SRC)
lint:
	tslint -c tslint.json $(SRC)
run:
	http-server -c-1 & $(BROWSER) 127.0.0.1:8080/index.html & sync build/game.js
clean:
	rm build/* || true
