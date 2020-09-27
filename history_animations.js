
import {rotate_shape, translate_shape} from "./geometry.js";
import {mag, scale_v, normalize} from "./geom_obj.js";

export function* make_history_generator(shp, history) {
    let curr_shape = shp;
    for (let i = 0; i < history.length; i++) {
        yield* make_animation_generator(curr_shape, history[i]);
        curr_shape = history[i].tr(curr_shape);
    }
}

// par_transform: parameterised transform
export function* transform_to_generator(shp, par_transform, num_frames) {
    for (let i = 0; i < num_frames; i++) {
        yield par_transform(shp, i);
    }
    yield par_transform(shp, num_frames);
}

// make generators for frames
export function make_animation_generator(shp, transform, num_frames = 30) {
    let frames = [];
    const t_name = transform.constructor.name
    if (t_name == "make_id") {
        const dummy_id = (s, i) => { return s };
        return transform_to_generator(shp, dummy_id, num_frames);
    } else if (t_name == "make_shape_translation") {
        const v = transform.v;
        const v_len = mag(v);
        const v_norm = normalize(v);
        const inc = v_len / num_frames;
        const par_trans = (s, i) => { return translate_shape(scale_v(v_norm, i * inc), s) };
        return transform_to_generator(shp, par_trans, num_frames);
    } else if (t_name == "make_shape_rotation") {
        const theta = transform.theta;
        const p = transform.p;
        const inc = theta / num_frames;
        const par_rot = (s, i) => { return rotate_shape(p, i * inc, s); };
        return transform_to_generator(shp, par_rot, num_frames);
    }
    return frames
}