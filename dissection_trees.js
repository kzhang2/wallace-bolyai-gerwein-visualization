import { arrange_vertices, random_color, intersect_a, make_id} from "./geometry.js";
import { shape, vert_eq, vertex, mag, sub_v } from "./geom_obj.js";


// change outer_shapes to outer_shape
export function shape_collection(shape, regions, transform) {
    this.outer_shape = shape;
    this.child_regions = regions;
    this.transform = transform;
}

// These functions assume your regions are 
// convex and have no holes 
function split_regions_helper(s_c, p1, p2, curr_list) {
    if (s_c.child_regions.length == 0) {
        let new_regions = split_shape(s_c.outer_shape, p1, p2);
        s_c.child_regions = new_regions;
        // if (new_regions.length > 1) {
        //     s_c.child_regions = new_regions; 
        // }
        for (let i = 0; i < new_regions.length; i++) {
            curr_list.push(new_regions[i]);
        }
        return;
    }
    let old_regions = s_c.child_regions;
    for (let i = 0; i < old_regions.length; i++) {
        split_regions_helper(old_regions[i], p1, p2, curr_list);
    } 
}

export function split_regions(s_c, p1, p2) {
    let result = []
    split_regions_helper(s_c, p1, p2, result);
    return result;
}

function leaf_regions_helper(region, curr_list) {
    if (region.child_regions.length == 0) {
        curr_list.push(region);
    } else {
        for (let i = 0; i < region.child_regions.length; i++) {
            leaf_regions_helper(region.child_regions[i], curr_list);
        }
    }
}

export function get_leaf_regions(s_c) {
    let regions = [];
    leaf_regions_helper(s_c, regions);
    return regions; 
}

function leaf_shape_helper(region, curr_list) {
    if (region.child_regions.length == 0) {
        curr_list.push(region.outer_shape);
    } else {
        for (let i = 0; i < region.child_regions.length; i++) {
            leaf_shape_helper(region.child_regions[i], curr_list);
        }
    }
}

export function get_leaf_shapes(s_c) {
    let leaves = [];
    leaf_shape_helper(s_c, leaves);
    return leaves;
}

function compose(f, g) {
    return (x) => g(f(x));
}

function leaves_inverted_helper(region, curr_list, curr_func) {
    let children = region.child_regions;
    let transform = region.transform;
    let next_func = compose(transform.inv_tr, curr_func);
    if (children.length == 0) { 
        curr_list.push(next_func(region.outer_shape));
    } else {
        for (let i = 0; i < children.length; i++) {
            leaves_inverted_helper(children[i], curr_list, next_func);
        }
    }
}

export function get_leaves_inverted(s_c) {
    let leaves = [];
    leaves_inverted_helper(s_c, leaves, (new make_id()).inv_tr);
    return leaves;
}

function leaves_inverted_histories_helper(region, region_list, curr_func, transform_history, history_list) {
    let children = region.child_regions;
    let transform = region.transform;
    let next_func = compose(transform.inv_tr, curr_func);
    transform_history.push(transform);
    if (children.length == 0) { 
        region_list.push(next_func(region.outer_shape));
        history_list.push(transform_history);
    } else {
        for (let i = 0; i < children.length; i++) {
            leaves_inverted_histories_helper(children[i], region_list, next_func, [...transform_history], history_list);
        }
    } 
}

export function get_leaves_inverted_histories(s_c) {
    let leaves = [];
    let histories = [];
    leaves_inverted_histories_helper(s_c, leaves, (new make_id()).tr, [], histories);
    return [leaves, histories];
}

function split_shape(shp, p3, p4) {
    let V = shp.v_list;
    let new_points = [];
    let locations = [-1, -1];
    for (let i = 0; i < V.length; i++) {
        let p1 = V[i];
        let p2 = V[(i + 1) % V.length];
        let a = intersect_a(p1, p2, p3, p4);
        if (a >= 0 && a <= 1) {
            let new_x = p1.x * a + p2.x * (1 - a);
            let new_y = p1.y * a + p2.y * (1 - a);
            let new_v = new vertex("red", new_x, new_y);
            if (new_points.length == 0 || mag(sub_v(new_points[0], new_v)) > 1e-3) {
                new_points.push(new_v);
            }
        }
        if (new_points.length == 2) {
            break;
        }
    }
    if (new_points.length < 2) {
        return [new shape_collection(shp, [], new make_id())];
    } else {
        let point1_in = false;
        let point2_in = false;
        for (let i = 0; i < V.length; i++) {
            if (vert_eq(V[i], new_points[0])) {
                point1_in = true;
            }
            if (vert_eq(V[i], new_points[1])) {
                point2_in = true;
            }
        }
        if (point1_in && point2_in) {
            return [new shape_collection(shp, [], new make_id())];
        }
    }
    let V_new = [...V];
    V_new = arrange_vertices(V_new.concat(new_points));
    for (let i = 0; i < V_new.length; i++) {
        if (vert_eq(V_new[i], new_points[0])) {
            locations[0] = i;
        } else if (vert_eq(V_new[i], new_points[1])) {
            locations[1] = i;
        }
    }
    locations.sort();
    let region1 = V_new.slice(locations[0], locations[1] + 1);
    let region2 = V_new.slice(locations[1]).concat(V_new.slice(0, locations[0] + 1));

    let clr1 = random_color();
    let clr2 = random_color();

    let shape1 = new shape(clr1, region1);
    let shape2 = new shape(clr2, region2);

    let sc1 = new shape_collection(shape1, [], new make_id());
    let sc2 = new shape_collection(shape2, [], new make_id());

    return [sc1, sc2];
}
