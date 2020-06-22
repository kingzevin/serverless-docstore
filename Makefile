all: update

update: 
	./rezip.sh docstore
	wsk -i action update /guest/sharelatex/docstore docstore.zip --kind  nodejs:10 --web true


