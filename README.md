# idk
![alt text](image.png)
![alt text](image-1.png)
## Lobby characters (Party Dash Sprite)

The lobby automatically discovers characters from subfolders in `public/characters`. Each character folder must contain `stand`, `walk_left`, and `walk_right` image files (`.gif`, `.webp`, `.png`, `.jpg`, `.jpeg`, and `.avif` are supported; each file can use its own extension) to appear in the scene. An optional `link.txt` containing an `http://` or `https://` URL makes that character open the link in a new tab when clicked. Characters wander in random directions, pause between walks, and remain still when reduced motion is enabled.