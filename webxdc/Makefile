build:
	rm -f marl.xdc
	(cd ../dist && zip -9 --recurse-paths - index.html _astro/ js/) > marl.xdc
	zip marl.xdc manifest.toml icon.png
