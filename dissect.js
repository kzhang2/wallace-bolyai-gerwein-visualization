var vertices = [];
var offset = 8;
var radius = 2;

function startGame() {
    myGameArea.start();
}

var myGameArea = {
    canvas : document.createElement("canvas"),
    start : function() {
        this.canvas.width = 480;
        this.canvas.height = 270;
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.canvas.addEventListener('click', (e) => {
          var new_vertex = new vertex("red", e.clientX, e.clientY);
          vertices.push(new_vertex);
          if(vertices.length > 3){
            vertices = arrange_vertices(vertices);
          }
          this.update()
        });
    },
    clear : function() {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    update : function() {
      this.clear();
      draw_vertices(vertices);
      draw_edges(vertices);
    }
}

function remove() {
  if(vertices.length > 0){
    vertices.pop();
    myGameArea.clear();
  }
  myGameArea.update();
}

function clear_all(){
  vertices = []
  myGameArea.update();
}

function compare_asc(a, b){
  if(a.x < b.x){
    return -1;
  } else if (a.x > b.x){
    return 1;
  } else {
    return 0;
  }
}

function compare_dsc(a, b){
  if(a.x < b.x){
    return 1;
  } else if (a.x > b.x){
    return -1;
  } else {
    return 0;
  }
}

function above(p1, p2, p3){
  var cross_p = (p2.x-p1.x)*(p3.y-p1.y) - (p2.y-p1.y)*(p3.x-p1.x);
  return cross_p >= 0;
}

function below(p1, p2, p3){
  var cross_p = (p2.x-p1.x)*(p3.y-p1.y) - (p2.y-p1.y)*(p3.x-p1.x);
  return cross_p < 0;
}

function same_side(p1, p2, a, b){
  return (above(a, p1, b) && above(a, p2, b)) || (below(a, p1, b) && below(a, p2, b));
}

function inside_triangle(p, t){
  return same_side(p, t.p1, t.p2, t.p3) && same_side(p, t.p2, t.p1, t.p3) && same_side(p, t.p3, t.p1, t.p2);
}

function arrange_vertices(v){
  var cpy = v.slice();
  cpy.sort(compare_asc);
  var left = cpy[0]
  var right = cpy.pop();
  cpy.splice(0, 1);
  var above_vertices = cpy.filter((z) => above(left, right, z));
  var below_vertices = cpy.filter((z) => below(left, right, z));
  above_vertices.sort(compare_asc);
  below_vertices.sort(compare_dsc);
  return [left].concat(above_vertices).concat([right]).concat(below_vertices);
}

function triangle(p1, p2, p3){
  this.p1 = p1;
  this.p2 = p2;
  this.p3 = p3;
}

function area(v){
  var result = 0
  for(var i = 0; i < v.length; i++){
    result += v[i].x * v[(i+1)%v.length].y - v[i].y * v[(i+1)%v.length].x;
  }
  return Math.abs(result) / 2;
}

function find_ear(v){
  for(var i = 0; i < v.length; i++){
    var is_ear = true;
    var i1 = (i-1+v.length)%v.length;
    var i2 = (i+1)%v.length;
    var tri = new triangle(v[i1], v[i], v[i2]);
    if (!is_convex_point(v, i)){
      continue;
    }
    for(var j = 0; j < v.length; j++){
      if(i1 != j && i2 != j && i != j){
        if(inside_triangle(v[j], tri)){
          is_ear = false;
        }
      }
    }
    if(is_ear){
      return i;
    }
  }
  return 0;
}

function midpoint(p1, p2){
  return new vertex("red", (p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
}

// v is vertex set and i is index of vertex in question
function is_convex_point(v, i){
  return below(v[(v.length-1+i)%v.length], v[i], v[(i+1)%v.length]);
}

function print_vertices(v){
  console.log("vertices:");
  for (var i = 0; i < v.length; i++){
    console.log(v[i]);
  }
}

function is_convex(v){
  if(v.length == 3){
    return true;
  }
  for (var i = 0; i < v.length; i++){
    if(!inside(v, midpoint(v[(i+v.length-1)%v.length], v[(i+1)%v.length]))){
      return false;
    }
  }
  return true;
}

function convex_t(v){
  var cpy = v.slice();
  var visited = [];
  var triangles = [];
  while (cpy.length > 3){
    var i = 0
    while (i < cpy.length){
      visited.push(cpy[i]);
      triangles.push(new triangle(cpy[i], cpy[i+1], cpy[i+2]));
      i+=2;
    }
    print_vertices(visited);
    draw_edges(visited);
    cpy = visited
    visited = []
  }
}

function t(v){
  var copy = v.slice();
  while(copy.length > 3){
    var index = find_ear(copy);
    draw_edges([copy[(index-1+copy.length)%copy.length], copy[(index+1)%copy.length]]);
    copy.splice(index, 1);
  }
}

function triangulate(){
  t(vertices);
}

function vertex(color, x, y){
  this.color = color;
  this.x = x;
  this.y = y;
}

function draw_vertices(v){
  var ctx = myGameArea.context;
  for(var i = 0; i < vertices.length; i++){
    ctx.beginPath();
    ctx.fillStyle = v[i].color;
    var vx = v[i].x;
    var vy = v[i].y;
    ctx.arc(vx- offset, vy - offset, radius, 0, 2*Math.PI);
    ctx.fill();
    ctx.stroke();
  }
}

function draw_edges(v){
  var ctx = myGameArea.context;
  for(var i = 0; i < v.length-1; i++){
    ctx.beginPath();
    var vx = v[i].x;
    var vy = v[i].y;
    ctx.beginPath()
    ctx.moveTo(vx-offset, vy-offset);
    ctx.lineTo(v[i+1].x-offset, v[i+1].y-offset);
    ctx.stroke();
  }
  var last = v[v.length-1];
  var first = v[0];
  ctx.beginPath();
  ctx.moveTo(last.x-offset, last.y-offset);
  ctx.lineTo(first.x-offset, first.y-offset);
  ctx.stroke();
}
