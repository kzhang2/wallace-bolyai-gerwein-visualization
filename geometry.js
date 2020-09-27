

import { vertex, cross, sub_v, dot, mag, add_v, scale_v, shape, vert_eq } from "./geom_obj.js";

// misc math
function solve_quad(a, b, c) {
  var discriminant = b * b - 4 * a * c;
  if (discriminant < 0) {
    return "no solutions";
  } else {
    var root1 = Math.sqrt(discriminant);
    var root2 = -1 * root1;
    return [(-b + root1) / (2 * a), (-b + root2) / (2 * a)];
  }
}

export function random_color() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

//methods for drawing polygons from a set of points
//needed to add edge case for stuff on same vertical line?
export function compare_asc(a, b) {
  if (a.x < b.x) {
    return -1;
  } else if (a.x > b.x) {
    return 1;
  } else {
    if (a.y < b.y) {
      return -1;
    } else if (a.y > b.y) {
      return 1;
    }
    return 0;
  }
}

export function compare_dsc(a, b) {
  return compare_asc(a, b) * -1;
}

export function arrange_vertices(v) {
  var cpy = v.slice();
  cpy.sort(compare_asc);
  var left = cpy[0]
  var right = cpy.pop();
  cpy.splice(0, 1);
  var above_vertices = cpy.filter((z) => above(left, right, z));
  var below_vertices = cpy.filter((z) => below(left, right, z));
  let line_vertices = cpy.filter((z) => on_line(left, right, z));
  if (below_vertices.length == 0) {
    below_vertices = below_vertices.concat(line_vertices);
  }
  if (above_vertices.length == 0) {
    above_vertices = above_vertices.concat(line_vertices);
  }
  above_vertices.sort(compare_asc);
  below_vertices.sort(compare_dsc);
  let result = [left].concat(above_vertices).concat([right]).concat(below_vertices);
  return result;
}

//above & below return whether p3 is above/below the line connecting p1 and p2
export function above(p1, p2, p3) {
  let cross_p = cross(sub_v(p2, p1), sub_v(p3, p1));
  return Math.abs(cross_p) > 1e-3 && cross_p > 0;
}

export function below(p1, p2, p3) {
  let cross_p = cross(sub_v(p2, p1), sub_v(p3, p1));
  return Math.abs(cross_p) > 1e-3 && cross_p < 0;
}

export function on_line(p1, p2, p3) {
  let cross_p = cross(sub_v(p2, p1), sub_v(p3, p1));
  return Math.abs(cross_p) < 1e-3;
  // return Math.abs(cross_p)
}

function same_side(p1, p2, a, b) {
  return (above(a, p1, b) && above(a, p2, b)) || (below(a, p1, b) && below(a, p2, b));
}

export function inside_triangle(p, t) {
  return same_side(p, t.v1, t.v2, t.v3) &&
    same_side(p, t.v2, t.v1, t.v3) && same_side(p, t.v3, t.v1, t.v2);
}

export function on_boundary(P, poly) {
  poly = arrange_vertices(poly);
  for (let i = 0; i < poly.length; i++) {
    let i_next = (i+1) % poly.length; 
    let v_curr =poly[i];
    let v_next = poly[i_next]; 
    let online = on_line(v_curr, v_next, P);
    let max_x = Math.max(v_curr.x, v_next.x);
    let max_y = Math.max(v_curr.y, v_next.y);
    let min_x = Math.min(v_curr.x, v_next.x);
    let min_y = Math.min(v_curr.y, v_next.y);
    let between = (P.x >= min_x) && (P.y >= min_y) 
                  && (P.x <= max_x) && (P.y <= max_y);
    if (online && (between || vert_eq(P, v_curr) || vert_eq(P, v_next))) {
      return true;
    }
  }
  return false;
}

// also works for non-convex shapes
export function inside_polygon(P, poly) {
  // let V = poly.v_list;
  let V = arrange_vertices(poly);
  let wn = 0;    // the  winding number counter

  // loop through all edges of the polygon
  for (let i = 0; i < V.length; i++) {   // edge from V[i] to  V[i+1]
    let i_next = (i+1) % V.length;
    if (V[i].y <= P.y) {          // start y <= P.y
      if (V[i_next].y > P.y)      // an upward crossing
        if (below(V[i], V[i_next], P))  // P left of  edge
          ++wn;            // have  a valid up intersect
    }
    else {                        // start y > P.y (no test needed)
      if (V[i_next].y <= P.y)     // a downward crossing
        if (above(V[i], V[i_next], P))  // P right of  edge
          --wn;            // have  a valid down intersect
    }
  }
  return wn;
}

export function shp_inside_shp(in_shp, out_shp) {
  let in_v = in_shp.v_list;
  for (let i = 0; i < in_v.length; i++) {
    let curr_v = in_v[i];
    if (!(inside_polygon(curr_v, out_shp.v_list) || on_boundary(curr_v, out_shp.v_list))) {
      return false;
    }
  }
  return true;
}

//geometry utilities

export function area(v) {
  var result = 0
  for (var i = 0; i < v.length; i++) {
    // replace with cross product?
    result += v[i].x * v[(i + 1) % v.length].y - v[i].y * v[(i + 1) % v.length].x;
  }
  return Math.abs(result) / 2;
}

export function distance(v1, v2) {
  return mag(sub_v(v2, v1));
}

export function midpoint(p1, p2) {
  return new vertex("red", (p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
}

// v is vertex set and i is index of vertex in question
export function is_convex_point(v, i) {
  return below(v[(v.length - 1 + i) % v.length], v[i], v[(i + 1) % v.length]);
}

export function angle(v1, vertex, v3) {
  let leg1 = sub_v(v3, vertex);
  let leg2 = sub_v(v1, vertex);
  let dotted = dot(leg1, leg2);
  let cos = dotted / (mag(leg1) * mag(leg2));
  return Math.acos(cos);
}

// 2D transformations, acts on shapes

export function rotate_shape(p, theta, shp) {
  let new_points = [];
  let points = shp.v_list;
  for (let i = 0; i < points.length; i++) {
    let curr_p = sub_v(points[i], p);
    let new_x = curr_p.x * Math.cos(theta) - curr_p.y * Math.sin(theta) + p.x;
    let new_y = curr_p.x * Math.sin(theta) + curr_p.y * Math.cos(theta) + p.y;
    new_points.push(new vertex("red", new_x, new_y));
  }
  // console.log(new_points);
  return new shape(shp.color, new_points);
}

export function translate_shape(v, shp) {
  let new_points = [];
  let points = shp.v_list;
  for (let i = 0; i < points.length; i++) {
    new_points.push(add_v(v, points[i]));
  }
  return new shape(shp.color, new_points);
}

export function make_shape_rotation(p, theta) {
  this.theta = theta;
  this.p = p;
  this.tr = (shape) => {
    return rotate_shape(p, theta, shape);
  }
  this.inv_tr = (shape) => {
    return rotate_shape(p, -1 * theta, shape);
  }
}

export function make_shape_translation(v) {
  this.v = v;
  this.tr = (shape) => {
    return translate_shape(v, shape);
  }
  this.inv_tr = (shape) => {
    return translate_shape(scale_v(v, -1), shape);
  }
}

export function make_id() {
  this.tr = (shape) => {
    return shape;
  };
  this.inv_tr = (shape) => {
    return shape;
  };
}

// tr1 compose tr2 is apply tr1 first, then tr2
export function compose_transforms(tr1, tr2) {
  this.tr1 = tr1;
  this.tr2 = tr2;
  this.tr = (shape) => {
    return this.tr2.tr(this.tr1.tr(shape));
  };
  this.inv_tr = (shape) => {
    return this.tr1.inv_tr(this.tr2.inv_tr(shape));
  };
}

// returns, proportionally, where along 
// p1-p2 the intersection of p1-p2 and p3-p4 
// lies

// issue with vertical/horizontal lines? 
export function intersect_a(p1, p2, p3, p4) {
  // a is for p1-p2
  let a = ((p2.y - p4.y) * (p3.x - p4.x) + (p4.x - p2.x) * (p3.y - p4.y)) /
    ((p1.x - p2.x) * (p3.y - p4.y) + (p2.y - p1.y) * (p3.x - p4.x));
  // b is for p3-p4
  // let b = (a*(p1.y-p2.y) + p2.y - p4.y) / (p3.y - p4.y);
  // let point_x = a*p1.x + (1-a)*p2.x;
  // let point_y = a*p1.y + (1-a)*p2.y;

  return a;
}
