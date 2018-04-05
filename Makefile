
all:
	tsc --removeComments --strictFunctionTypes \
	--noImplicitThis --alwaysStrict --noUnusedLocals \
	--noUnusedParameters --noImplicitReturns game.ts
