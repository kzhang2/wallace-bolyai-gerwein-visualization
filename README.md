# Visualization of the wallace-bolyai gerwein theorem 
Statement of the theorem: any two simple polygons of equal area can be dissected into a finite number of congruent polygonal pieces. 
One consequence of this theorem is that there exists an algorithmic procedure for generating a tangram given a polygon, which is implemented here. 
## How to run locally
Because of browser security issues, rather than just open the index.html file 
it is necessary to serve the files from a web server. One simple way to do 
so is to run "python3 -m http.server" in a terminal while the terminal's current working directory 
is this repository and then navigate to localhost:8000. 
## TODOs
Add generic equidecomposition between any two shapes, not just a given shape and a square of the same area. 
