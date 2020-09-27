import { vertex, triangle, shape, sub_v, scale_v, add_v } from "./geom_obj.js";
import { t } from "./triangulate.js";
import { arrange_vertices, inside_polygon, make_id, random_color, make_shape_translation, distance, angle, make_shape_rotation, above } from "./geometry.js";
import { tri_to_parallel, par_to_rect, rect_to_sqr, combine_squares, transform_sc } from "./shape_dissections.js";
import { shape_collection, get_leaf_shapes, get_leaves_inverted, get_leaves_inverted_histories } from "./dissection_trees.js";
import { make_history_generator } from "./history_animations.js";


// 0: vertex {color: "red", x: 216, y: 224}
// 1: vertex {color: "red", x: 307, y: 411}
// 2: vertex {color: "red", x: 526, y: 338}
// 3: vertex {color: "red", x: 614, y: 231}
// 4: vertex {color: "red", x: 459, y: 188}

let test_point = new vertex("red",351.896466994951, 245.9966770323292);
var test_quad1 = [new vertex("red", 369.9694200668638, 268.7444424631747), 
new vertex("red", 376.9388401337276, 7444424631747),
   new vertex("red", 312.2481339585219 ,143.5059513005166),
  new vertex("red", 319.2175540253857, 271.878172532104)];

console.log("inside_test", inside_polygon(test_point, test_quad1));

var t_poly = new shape(random_color(), []);
let vertices = t_poly.v_list;
let t_sc = new shape_collection(t_poly, [], new make_id());
var triangles = [];
var radius = 1;
// (100, 100), (150, 150), (150, 500)
var test_triangle = [new vertex("red", 523, 428), new vertex("red", 571, 100), new vertex("red", 523, 142)];
var test_quad = [new vertex("red", 216, 224), new vertex("red", 307, 411),
   new vertex("red", 526, 338), new vertex("red", 614, 231), new vertex("red", 459, 188)];
// test_quad = arrange_vertices(test_quad);
//new vertex("red", 779, 398)
var test_tri = new triangle("red", test_triangle[0], test_triangle[1], test_triangle[2]);
var test_sc = new shape_collection(test_tri, [], new make_id());

function startGame() {
  myGameArea.start();
}

window.addEventListener("load", startGame);
let rm_btn = document.getElementById("remove");
let clr_btn = document.getElementById("clear");
let tri_btn = document.getElementById("triangulate");
rm_btn.addEventListener("click", remove);
clr_btn.addEventListener("click", clear_all);
tri_btn.addEventListener("click", triangulate);

let x_disp = document.getElementById("x");
let y_disp = document.getElementById("y");
let inside_disp = document.getElementById("inside");
let which_disp = document.getElementById("inside_which");

var myGameArea = {
  canvas: document.createElement("canvas"),
  start: function () {
    this.canvas.width = 800;
    this.canvas.height = 600;
    this.context = this.canvas.getContext("2d");
    document.body.insertBefore(this.canvas, document.body.childNodes[0]);
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      var new_vertex = new vertex("red", x, y);
      vertices.push(new_vertex);
      if (vertices.length > 3) {
        vertices = arrange_vertices(vertices);
        t_poly.v_list = vertices;
      }
      this.update();
    });
    t_poly.v_list = vertices.concat(test_quad);
    vertices = vertices.concat(test_quad);
    let regions1 = tri_to_parallel(test_sc);
    let regions2 = par_to_rect(test_sc);
    let regions3 = rect_to_sqr(test_sc);
    let histories = get_leaves_inverted_histories(test_sc);
    draw_sc(test_sc);
    // draw_histories(histories[0], histories[1]);
    console.log(histories);
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      let wn = inside_polygon(new vertex("red", x, y), vertices);
      x_disp.innerHTML = x.toString() + ", ";
      y_disp.innerHTML = y.toString();
      inside_disp.innerHTML = wn.toString();
      which_disp.innerHTML = inside_sc(new vertex("red", x, y), t_sc).toString();
    });
  },
  clear: function () {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  },
  update: function () {
    this.clear();
    draw_vertices(vertices);
    draw_edges(vertices);
  }
}

function draw_histories(shapes, histories) {
  let history_generators = []
  for (let i = 0; i < shapes.length; i++) {
    history_generators.push(make_history_generator(shapes[i], histories[i]));
  }
  function draw_generator_frames() {
    let ctx = myGameArea.context;
    let cleared = false;
    for (let i = 0; i < history_generators.length; i++) {
      const next_val = history_generators[i].next();
      if (next_val.done) {
        return;
      } else {
        if (!cleared) {
          ctx.clearRect(0, 0, myGameArea.canvas.width, myGameArea.canvas.height);
          cleared = true;
        }
        draw_poly(next_val.value);
      }
    }
    window.requestAnimationFrame(draw_generator_frames);
  }
  window.requestAnimationFrame(draw_generator_frames);
}



function remove() {
  if (vertices.length > 0) {
    vertices.pop();
    myGameArea.clear();
  }
  myGameArea.update();
}

function clear_all() {
  t_poly.v_list = [];
  vertices = t_poly.v_list;
  myGameArea.update();
}

function triangulate() {
  console.log("triangulating");
  triangles = t(t_sc);
  for (let i = 0; i < t_sc.child_regions.length; i++) {
    let curr_region = t_sc.child_regions[i];
    tri_to_parallel(curr_region);
    par_to_rect(curr_region);
    rect_to_sqr(curr_region);
  }
  let num_regions = t_sc.child_regions.length;
  console.log(t_sc)
  for (let i = 0; i < num_regions-1; i++) {
    let reg1 = t_sc.child_regions.pop(0);
    let reg2 = t_sc.child_regions.pop(0);
    let new_region = combine_squares(reg1, reg2);
    // console.log(reg1, reg2);
    // console.log(new_region);
    // console.log(new_region.outer_shape);
    // draw_poly(new_region[0].outer_shape);
    t_sc.child_regions.push(new_region[0]);
    // if (i == 1) {
    //   draw_poly(new_region[1]);
    //   draw_poly(new_region[2]);
    // }
  }
  // draw_sc(t_sc);
  console.log(t_sc);
  let outer_square = t_sc.child_regions[0].outer_shape;
  let canvas_center = new vertex("red", myGameArea.canvas.width/2, myGameArea.canvas.height/2);
  let sq_center = scale_v(add_v(outer_square.v_list[0], outer_square.v_list[2]), 0.5);
  let center_tr = new make_shape_translation(sub_v(canvas_center, sq_center));
  transform_sc(t_sc.child_regions[0], center_tr);
  outer_square = center_tr.tr(outer_square);

  let tar_corner = new vertex("red", 1 / Math.sqrt(2), 1 / Math.sqrt(2));
  let src_corner = sub_v(outer_square.v_list[0], canvas_center);
  let center_angle = angle(tar_corner, new vertex("red", 0, 0), src_corner);
  console.log("center angle", center_angle);
  if (above(new vertex("red", 0, 0), tar_corner, src_corner)) {
    center_angle *= -1;
  }
  let center_rot = new make_shape_rotation(canvas_center, center_angle);
  transform_sc(t_sc.child_regions[0], center_rot);

  let histories = get_leaves_inverted_histories(t_sc);
  let leaves = histories[0];
  let animations = histories[1];
  let maximum = -1;
  for(let i = 0; i < animations.length; i++) {
    if(animations[i].length > maximum) {
      maximum = animations[i].length;
    }
  }
  for(let i = 0; i < animations.length; i++) {
    for (let j = animations[i].length; j < maximum; j++) {
      animations[i].push(new make_id());
    }
  }
  draw_histories(leaves, animations);
}

//drawing utilities

function draw_vertices(v) {
  var ctx = myGameArea.context;
  for (var i = 0; i < v.length; i++) {
    ctx.beginPath();
    ctx.fillStyle = v[i].color;
    var vx = v[i].x;
    var vy = v[i].y;
    ctx.arc(vx, vy, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }
}

function inside_sc(v, sc) {
  let leaves = get_leaf_shapes(sc);
  for (let i = 0; i < leaves.length; i++) {
    if (inside_polygon(v, leaves[i].v_list)) {
      return leaves[i].v_list.map((v) => { return "(" + v.x.toFixed(2) + "," + v.y.toFixed(2) + ")" });
    }
  }
  return -1;
}

function draw_sc(sc) {
  let leaves = get_leaf_shapes(sc);
  for (let i = 0; i < leaves.length; i++) {
    draw_poly(leaves[i]);
  }
}

function draw_sc_inv(sc) {
  let leaves = get_leaves_inverted(sc);
  for (let i = 0; i < leaves.length; i++) {
    draw_poly(leaves[i]);
  }
}

function draw_poly(shp) {
  draw_vertices(shp.v_list);
  draw_edges(shp.v_list, shp.color);
}

function draw_edges(v, color) {
  var ctx = myGameArea.context;
  let start_x = v[0].x;
  let start_y = v[0].y;
  ctx.beginPath();
  ctx.moveTo(start_x, start_y);
  for (var i = 1; i < v.length; i++) {
    var vx = v[i].x;
    var vy = v[i].y;
    ctx.lineTo(vx, vy);
  }
  if (color) {
    ctx.fillStyle = color;
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.closePath();
    ctx.stroke();
  }
}
