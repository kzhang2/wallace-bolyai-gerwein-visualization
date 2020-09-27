import { midpoint, distance, angle, make_shape_rotation, make_shape_translation, random_color, shp_inside_shp, above, arrange_vertices, area, make_id } from "./geometry.js";
import { add_v, sub_v, mag, scale_v, shape, normalize, vertex } from "./geom_obj.js";
import { split_regions, get_leaf_regions, shape_collection } from "./dissection_trees.js";

function transform_shape_helper(new_regions, shp, transform) {
  for (let i = 0; i < new_regions.length; i++) {
    // curr_region is always a leaf?
    let curr_region = new_regions[i];
    let curr_shape = curr_region.outer_shape;
    if (shp_inside_shp(curr_shape, shp)) {
      let new_shape = transform.tr(curr_shape);
      if (curr_region.transform.constructor.name == "make_id") {
        curr_region.outer_shape = new_shape;
        curr_region.transform = transform;
      } else {
        let new_region = new shape_collection(new_shape, [], transform);
        curr_region.child_regions.push(new_region);
      }
    }
  }
}

export function transform_sc(sc, transform) {
  console.log(sc);
  transform_shape_helper(get_leaf_regions(sc), sc.outer_shape, transform);
  sc.outer_shape = transform.tr(sc.outer_shape);
}

function tri_to_parallel(t) {
  let tri = t.outer_shape;
  let mid1 = midpoint(tri.v1, tri.v2);
  let mid2 = midpoint(tri.v2, tri.v3);

  let new_regions = split_regions(t, mid1, mid2);
  let tr_shp = new shape(random_color(), [mid1, tri.v2, mid2]);
  let transform = new make_shape_rotation(mid2, -1 * Math.PI);
  transform_shape_helper(new_regions, tr_shp, transform);

  let v4 = add_v(mid2, sub_v(mid2, mid1));
  let new_quad = new shape(random_color(), [tri.v1, tri.v3, v4, mid1]);
  t.outer_shape = new_quad;

  return new_regions;
}

function par_to_rect(par_sc) {
  let par = par_sc.outer_shape;
  let v_tr = par.v3;
  let v_tl = par.v4;
  let v_br = par.v2;
  let v_bl = par.v1;

  // condense using arrange_vertices?
  // v1-v2 longer side
  if (distance(par.v1, par.v2) > distance(par.v2, par.v3)) {
    // v1-v2-v3 larger angle
    if (angle(par.v1, par.v2, par.v3) > Math.PI / 2) {

      // v4-v1-v2 larger angle
    } else {
      v_tr = par.v4;
      v_tl = par.v3;
      v_br = par.v1;
      v_bl = par.v2;
    }
    // v2-v3 longer side
  } else {
    // v2-v3-v4 larger angle
    if (angle(par.v2, par.v3, par.v4) > Math.PI / 2) {
      v_tr = par.v4;
      v_tl = par.v1;
      v_br = par.v3;
      v_bl = par.v2;
      // v1-v2-v3 larger angle
    } else {
      v_tr = par.v1;
      v_tl = par.v4;
      v_br = par.v2;
      v_bl = par.v3;
    }
  }
  let theta = angle(v_bl, v_br, v_tr) - (Math.PI / 2);
  let leg_long = sub_v(v_tl, v_tr);
  let leg_short = sub_v(v_tr, v_br);
  let dist = mag(leg_short) * Math.sin(theta);
  let offset = scale_v(leg_long, dist / mag(leg_long))

  let new_v_tr = add_v(v_tr, offset);
  let new_v_tl = add_v(v_tl, offset);

  let new_regions = split_regions(par_sc, v_br, new_v_tr);
  let tr_shp = new shape(random_color(), [v_br, v_tr, new_v_tr]);
  let transform = new make_shape_translation(sub_v(v_tl, v_tr));
  transform_shape_helper(new_regions, tr_shp, transform);

  let new_quad = new shape(random_color(), [v_bl, v_br, new_v_tr, new_v_tl]);
  par_sc.outer_shape = new_quad;
  console.log(v_bl, v_br, v_tr, v_tl);
  return new_regions;
}

function rect_to_sqr(rect_sc) {
  let rect = rect_sc.outer_shape;
  let v_tr = rect.v3;
  let v_tl = rect.v4;
  let v_br = rect.v2;
  let v_bl = rect.v1;

  if (distance(rect.v1, rect.v2) < distance(rect.v2, rect.v3)) {
    v_tr = rect.v4;
    v_tl = rect.v1;
    v_br = rect.v2;
    v_bl = rect.v3;
  }

  let leg_short = sub_v(v_tr, v_br);
  let leg_long = sub_v(v_bl, v_br);
  let area = mag(leg_short) * mag(leg_long);
  let sq_len = Math.sqrt(area);

  let leg_short_unit = normalize(leg_short);
  let leg_long_unit = normalize(leg_long);

  let s_br = v_br;
  let s_tr = add_v(s_br, scale_v(leg_short_unit, sq_len));
  let s_bl = add_v(s_br, scale_v(leg_long_unit, sq_len));
  let s_tl = add_v(s_bl, scale_v(leg_short_unit, sq_len));
  let square = new shape(random_color(), [s_bl, s_br, s_tr, s_tl]);
  rect_sc.outer_shape = square;

  let diag = sub_v(s_tr, v_bl);
  let diag_unit = normalize(diag);

  let len1 = mag(diag) * (mag(leg_short) / sq_len);
  let len2 = mag(diag) * ((mag(leg_long) - sq_len) / mag(leg_long));

  let tform1 = new make_shape_translation(scale_v(diag_unit, len2));

  let tri_v_1 = add_v(v_bl, scale_v(diag_unit, len1));

  let tri1 = new shape(random_color(), [v_bl, tri_v_1, v_tl]);

  let new_regions = split_regions(rect_sc, v_bl, s_tr);
  transform_shape_helper(new_regions, tri1, tform1);

  // cut rectangles out here 
  // this split causes pause in animation?
  new_regions = split_regions(rect_sc, s_bl, s_tl);
  let transforms = [];
  let shapes = [];
  let counter = 1;
  let sq_leg_1 = sub_v(s_bl, s_br);
  let curr_p = scale_v(sq_leg_1, counter);
  while (mag(curr_p) < mag(leg_long)) {
    let new_transform = new make_shape_translation(scale_v(diag_unit, len1 * counter));

    let new_br = add_v(scale_v(sq_leg_1, counter), s_br);
    let new_bl = add_v(scale_v(sq_leg_1, counter + 1), s_br);
    let new_tr = add_v(new_br, leg_short);
    let new_tl = add_v(new_bl, leg_short);
    let new_shp = new shape(random_color(), [new_br, new_bl, new_tr, new_tl]);
    new_regions = split_regions(rect_sc, new_bl, new_tl);
    transform_shape_helper(new_regions, new_shp, new_transform);
    shapes.push(new_shp);
    transforms.push(new_transform);
    counter += 1;
    curr_p = scale_v(sq_leg_1, counter);
  }

  return new_regions;
}

// b:big, t:tiny
function combine_squares(sc1, sc2) {
  let sq_b = sc1.outer_shape;
  let sq_t = sc2.outer_shape;
  sq_b.v_list = arrange_vertices(sq_b.v_list);
  sq_t.v_list = arrange_vertices(sq_t.v_list);
  let sc_b = sc1;
  let sc_t = sc2;

  console.log(sq_b, sq_t);

  if (area(sq_t.v_list) > area(sq_b.v_list)) {
    let temp = sq_b;
    sq_b = sq_t;
    sq_t = temp;
    
    temp = sc_b;
    sc_b = sc_t;
    sc_t = temp;
  }
  let side_b = sub_v(sq_b.v_list[0], sq_b.v_list[1]);
  let side_t = sub_v(sq_t.v_list[0], sq_t.v_list[1]);

  let len_t = mag(side_t);

  let sq_gap = sub_v(sq_b.v_list[0], sq_t.v_list[0]);
  let gap_translate = new make_shape_translation(sq_gap);
  let gap_angle = angle(side_b, new vertex("red", 0, 0), side_t);
  console.log("angle", gap_angle)
  if (above(new vertex("red", 0, 0), side_b, side_t)) {
    gap_angle *= -1;
  }
  let gap_rotate = new make_shape_rotation(sq_b.v_list[0], gap_angle);

  if (shp_inside_shp(gap_rotate.tr(gap_translate.tr(sq_t)), sq_b)) {
    gap_rotate = new make_shape_rotation(sq_b.v_list[0], gap_angle + Math.PI / 2);
  }

  transform_shape_helper(get_leaf_regions(sc_t), sq_t, gap_translate);
  transform_shape_helper(get_leaf_regions(sc_t), gap_translate.tr(sq_t), gap_rotate);

  sq_t = gap_rotate.tr(gap_translate.tr(sq_t));

  let b_br = sq_b.v_list[0];
  let b_tr = sq_b.v_list[1];
  let b_tl = sq_b.v_list[2];
  let b_bl = sq_b.v_list[3];

  let t_br = sq_t.v_list[1];
  let t_tr = sq_t.v_list[2];
  let t_tl = sq_t.v_list[3];

  let long_edge = sub_v(t_br, b_bl);
  let new_pt = add_v(b_bl, scale_v(long_edge, len_t / mag(long_edge)));

  let tri_b = new shape(random_color(), [b_bl, new_pt, b_tl]);
  let tri_t = new shape(random_color(), [new_pt, t_br, t_tr]);

  let translate_b = new make_shape_translation(sub_v(t_tl, b_bl));
  let translate_t = new make_shape_translation(sub_v(b_tl, new_pt));

  let new_regions = split_regions(sc_b, new_pt, b_tl);
  
  transform_shape_helper(new_regions, tri_b, translate_b);
  
  new_regions = split_regions(sc_t, new_pt, t_tr);

  transform_shape_helper(new_regions, tri_t, translate_t);

  new_regions = split_regions(sc_b, new_pt, t_tr);

  transform_shape_helper(new_regions, tri_t, translate_t);

  let leg_perp = sub_v(b_tr, b_br);
  let new_pt_2 = add_v(b_tr, scale_v(leg_perp, len_t / mag(leg_perp)));
  let new_shape = new shape(random_color(), [new_pt, t_tr, new_pt_2, b_tl]);
  let new_region = new shape_collection(new_shape, [sc1, sc2], new make_id());

  console.log(new_shape);

  return [new_region, sq_t, sq_b];
}


export { tri_to_parallel, par_to_rect, rect_to_sqr, combine_squares };
