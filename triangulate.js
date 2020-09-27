//triangulation and related functions

import {triangle, shape} from "./geom_obj.js";
import {is_convex_point, inside_triangle, random_color, make_id} from "./geometry.js";
import { shape_collection } from "./dissection_trees.js";

function find_ear(v){
    for(var i = 0; i < v.length; i++){
      var is_ear = true;
      var i1 = (i-1+v.length)%v.length;
      var i2 = (i+1)%v.length;
      var tri = new triangle("red", v[i1], v[i], v[i2]);
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
    return -1;
  }
  
 export function t(sc){
    let v = sc.outer_shape.v_list;
    console.log(v);
    var triangles = [];
    let triangles_sc = [];
    var copy = v.slice();
    if (v.length == 3) {
      let cpy_tri = new shape(random_color(), v);
      triangles.push(cpy_tri);
      triangles_sc.push(new shape_collection(cpy_tri, [], new make_id()));
    } else {
      while(copy.length >= 3){
        var index = find_ear(copy);
        var index1 = (index-1+copy.length)%copy.length;
        var index2 = (index+1)%copy.length;
        let ran_clr = random_color();
        let new_tri = new triangle(ran_clr, copy[index1], copy[index], copy[index2]);
        triangles.push(new_tri);
        triangles_sc.push(new shape_collection(new_tri, [], new make_id()));
        copy.splice(index, 1);
      }
    }
    sc.child_regions = triangles_sc;
    return triangles;
  }