function change_crossing(){
  crossovers = !crossovers;
  if (crossovers){
    document.getElementById("crossings").innerHTML = "Disallow crossing in polygons";
  } else {
    document.getElementById("crossings").innerHTML = "Allow crossing in polygons";
  }
}

function intersects(x1, y1, x2, y2, x3, y3, x4, y4){
  var m1 = (y1-y2)/(x1-x2);
  var m2 = (y3-y4)/(x3-x4);
  x_int = (y3 - y1 + m1*x1 - m2*x3) / (m1 - m2);
  return x_int > Math.min(x1, x2) && x_int < Math.max(x1, x2) && x_int > Math.min(x3, x4) && x_int < Math.max(x3, x4);
}

function is_same(v1, v2){
  return v1.x == v2.x && v1.y == v2.y;
}

function valid_point(x, y){
  var temp = new vertex("red", x, y);
  var first = vertices[0];
  var last = vertices[vertices.length-1];
  var result = true;
  for (var i = 0; i < vertices.length-1; i++){
    v_i = vertices[i];
    v_j = vertices[i+1];
    if (is_same(v_i, temp)){
      return false;
    }
    if (i == 0){
      result = result && !intersects(x, y, last.x, last.y, v_i.x, v_i.y, v_j.x, v_j.y);
    } else if (i == vertices.length-2){
      result = result && !intersects(x, y, first.x, first.y, v_i.x, v_i.y, v_j.x, v_j.y);
    } else {
      result = result && !intersects(x, y, first.x, first.y, v_i.x, v_i.y, v_j.x, v_j.y);
      result = result && !intersects(x, y, last.x, last.y, v_i.x, v_i.y, v_j.x, v_j.y);
    }
  }
  return result;
}
