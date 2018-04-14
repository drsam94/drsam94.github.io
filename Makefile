
all:
	tsc --removeComments --strictFunctionTypes --noImplicitThis --alwaysStrict --noUnusedLocals \
	--noUnusedParameters --noImplicitReturns --strict --noImplicitAny --noFallthroughCasesInSwitch \
	--charset ASCII --diagnostics --extendedDiagnostics --pretty \
	game.ts GUITypes.ts
	tslint -c tslint.json game.ts
