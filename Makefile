SRC=src/game2.ts src/GUITypes.ts
all: clean release lint
release:
	tsc --removeComments --strictFunctionTypes --noImplicitThis --alwaysStrict --noUnusedLocals \
	--noUnusedParameters --noImplicitReturns --strict --noImplicitAny --noFallthroughCasesInSwitch \
	--charset ASCII --diagnostics --extendedDiagnostics --pretty --outFile build/game2.js --module amd \
	$(SRC)
lint:
	tslint -c tslint.json $(SRC)
clean:
	rm build/* || true
