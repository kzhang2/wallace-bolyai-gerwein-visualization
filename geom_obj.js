import { arrange_vertices } from "./geometry.js";

//constructors


function vertex(color="red", x, y){
    this.color = color;
    this.x = x;
    this.y = y;
}

function shape(color, v_list) {
  this.v_list = v_list;
  this.color = color;
  for (let i = 0; i < v_list.length; i++) {
    this["v" + (i+1).toString()] = v_list[i];
  }
}

function shape_eq(shp1, shp2) {
  if (shp1.v_list.length != shp2.v_list.length) {
    return false;
  }
  let shp1_sorted = arrange_vertices(shp1.v_list);
  let shp2_sorted = arrange_vertices(shp2.v_list);
  for (let i = 0; i < shp1_sorted.length; i++) {
    if (!vert_eq(shp1_sorted[i], shp2_sorted[i])) {
      return false;
    }
  }
  return true;
}

function vert_eq(v1, v2) {
  return mag(sub_v(v1, v2)) < 1e-3;
}
  
function triangle(color, p1, p2, p3){
  return new shape(color, [p1, p2, p3]);
}
  
function quad(color, p1, p2, p3, p4){
  return new shape(color, [p1,p2,p3,p4]);
}

function add_v(v1, v2) {
  return new vertex(v1.color, v1.x + v2.x, v1.y + v2.y);
}

function scale_v(v, k) {
  return new vertex(v.color, v.x * k , v.y * k);
}

function sub_v(v1, v2) {
  return add_v(v1, scale_v(v2, -1));
}

function dot(v1, v2) {
  return v1.x * v2.x + v1.y*v2.y;
}

function cross(v1, v2) {
  return v1.x*v2.y - v2.x*v1.y;
}

function mag(v) {
  return Math.sqrt(v.x*v.x + v.y*v.y);
}

function normalize(v) {
  return scale_v(v, 1 / mag(v));
}

export {vertex, triangle, quad, add_v, scale_v, sub_v, dot, cross, mag, vert_eq, shape, 
  shape_eq, normalize};