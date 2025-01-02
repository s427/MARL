build:
	rm -f marl.xdc
	(cd .. && zip -9 --recurse-paths - index.html css/ js/ img/ svg/) > marl.xdc
	zip marl.xdc manifest.toml
