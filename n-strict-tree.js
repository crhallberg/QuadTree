function NStrictTree({ dimensions = 3, resolution = 10 } = {}) {
  let tree = [];
  let childData = [];
  const sep = "/";

  function snap(op) {
    return Math.floor(op / resolution);
  }

  function expand(arr) {
    if (arr.length === 1) {
      if (arr[0] === 0) {
        return [arr[0], arr[0] + 1];
      }
      return [arr[0] - 1, arr[0], arr[0] + 1];
    }
    // Array
    let ret = [];
    const head = arr.shift();
    const tail = expand(arr);
    for (let h = Math.max(head - 1, 0); h <= head + 1; h++) {
      for (let i = tail.length; i--; ) {
        ret.push(h + sep + tail[i]);
      }
    }
    return ret;
  }

  function expandVectors(vectors) {
    let ret = new Set();
    for (let i = vectors.length; i--;) {
      const exp = expand(vectors[i].split(sep).map(Number));
      for (let j = exp.length; j--;) {
        ret.add(exp[j]);
      }
    }
    return Array.from(ret);
  }

  function getVectors(minVec, maxVec) {
    let vectors, tempVectors;
    for (let axis = 0; axis < dimensions; axis++ ) {
      const from = snap(minVec[axis]);
      const to = snap(maxVec[axis]);
      let index = 0;
      if (axis === 0) {
        vectors = new Array(to - from + 1);
        for (let v = from; v <= to; v++) {
          vectors[index++] = String(v);
        }
      } else {
        tempVectors = new Array((to - from + 1) * vectors.length);
        for (let v = from; v <= to; v++) {
          for (let j = 0; j < vectors.length; j++) {
            tempVectors[index++] = v + sep + vectors[j];
          }
        }
        vectors = tempVectors;
      }
    }
    return vectors;
  }

  function insert(minVec, maxVec, data) {
    childData.push({ minVec, maxVec, data });
    const index = childData.length - 1;
    const vectors = getVectors(minVec, maxVec);
    for (let i = vectors.length; i--; ) {
      const vec = vectors[i];
      if (typeof tree[vec] === "undefined") {
        tree[vec] = [index];
      } else {
        tree[vec].push(index);
      }
    }
  }

  function distToSq(center, minVec, maxVec) {
    let distSq = 0;
    for (let axis = minVec.length; axis--; ) {
      if (center[axis] < minVec[axis]) {
        distSq += Math.pow(center[axis] - minVec[axis], 2);
      } else if (center[axis] > maxVec[axis]) {
        distSq += Math.pow(center[axis] - maxVec[axis], 2);
      }
    }
    return distSq;
  }

  function closest(point, _targetNum) {
    const targetNum = typeof _targetNum === "number" ? _targetNum : 1;
    let indexes = new Set();
    let vectors = getVectors(point, point);
    while (true) {
      for (let i = 0; i < vectors.length; i++) {
        if (typeof tree[vectors[i]] === "undefined") {
          continue;
        }
        for (let j = 0; j < tree[vectors[i]].length; j++) {
          indexes.add(tree[vectors[i]][j]);
        }
      }
      if (indexes.size >= targetNum) {
        break;
      }
      vectors = expandVectors(vectors);
    }
    // Sort
    let sorted = [];
    for (let index of indexes) {
      const { minVec, maxVec, data } = childData[index];
      const op = { data, _distSq: distToSq(point, minVec, maxVec) };
      for (let i = 0; i < targetNum && i < sorted.length; i++) {
        if (op._distSq <= sorted[i]._distSq) {
          sorted.splice(i, 0, op);
          break;
        }
      }
      if (sorted.length < targetNum) {
        sorted.push({ data: op.data, _distSq: op._distSq });
      }
    }
    return sorted.slice(0, targetNum);
  }

  return { insert, closest };
}
