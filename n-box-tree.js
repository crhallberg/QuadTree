function NTree({
  dimensions = 3,
  minCorner = [-100, -100, -100],
  maxCorner = [100, 100, 100],
  childLimit = 24,
  maxDepth = 6,
} = {}) {
  const quadNum = 2 ** dimensions;
  let childData = [];

  function distToBoxSq(center, boxMinVec, boxMaxVec) {
    let distSq = 0;
    for (let axis = boxMinVec.length; axis--; ) {
      if (center[axis] < boxMinVec[axis]) {
        distSq += Math.pow(center[axis] - boxMinVec[axis], 2);
      } else if (center[axis] > boxMaxVec[axis]) {
        distSq += Math.pow(center[axis] - boxMaxVec[axis], 2);
      }
    }
    return distSq;
  }

  function boxToSphere(boxMinVec, boxMaxVec, sphereCenter, sphereRadius) {
    return (
      distToBoxSq(sphereCenter, boxMinVec, boxMaxVec) <=
      sphereRadius * sphereRadius
    );
  }

  function boxToBox(aMinVec, aMaxVec, bMinVec, bMaxVec) {
    for (let axis = aMinVec.length; axis--; ) {
      if (aMinVec[axis] > bMaxVec[axis] || aMaxVec[axis] < bMinVec[axis]) {
        return false;
      }
    }
    return true;
  }

  function getCenter(minVec, maxVec) {
    let center = new Array(dimensions);
    for (let i = center.length; i--; ) {
      center[i] = (minVec[i] + maxVec[i]) / 2;
    }
    return center;
  }

  function Node(nodeMinVec, nodeMaxVec, _depth) {
    const depth = _depth || 0;
    let isSplit = false;
    let quadrants;
    let children = [];

    function split() {
      quadrants = new Array(quadNum);
      const nodeCenter = getCenter(nodeMinVec, nodeMaxVec);
      for (let quad = 0; quad < quadrants.length; quad++) {
        let newMin = new Array(dimensions);
        let newMax = new Array(dimensions);
        let dimBit = quadNum / 2;
        for (let i = 0; i < dimensions; i++) {
          newMin[i] = quad & dimBit ? nodeCenter[i] : nodeMinVec[i];
          newMax[i] = quad & dimBit ? nodeMaxVec[i] : nodeCenter[i];
          dimBit /= 2;
        }
        quadrants[quad] = Node(newMin, newMax, depth + 1);
      }
      isSplit = true;
      while (children.length > 0) {
        const index = children.pop();
        const { minVec, maxVec } = childData[index];
        insert(minVec, maxVec, index);
      }
    }

    function insert(minVec, maxVec, index) {
      if (!boxToBox(minVec, maxVec, nodeMinVec, nodeMaxVec)) {
        return;
      }
      if (isSplit) {
        for (let i = 0; i < quadrants.length; i++) {
          quadrants[i].insert(minVec, maxVec, index);
        }
      } else {
        children.push(index);
        if (depth < maxDepth && children.length === childLimit) {
          split();
        }
      }
    }

    function closest(center, radius, result) {
      if (!boxToSphere(nodeMinVec, nodeMaxVec, center, radius)) {
        return result;
      }
      if (isSplit) {
        for (let i = 0; i < quadrants.length; i++) {
          quadrants[i].closest(center, radius, result);
        }
        return result;
      }
      for (let i = 0; i < children.length; i++) {
        result.add(children[i]);
      }
      return result;
    }

    function draw(context) {
      if (isSplit) {
        for (let i = 0; i < quadrants.length; i++) {
          quadrants[i].draw(context);
        }
      } else {
        context.strokeRect(
          nodeMinVec[0],
          nodeMinVec[1],
          nodeMaxVec[0] - nodeMinVec[0],
          nodeMaxVec[1] - nodeMinVec[1]
        );
      }
    }

    return { insert, closest, draw };
  }

  return (function() {
    const root = Node(minCorner, maxCorner, 0);

    function insert(minVec, maxVec, data) {
      childData.push({ minVec, maxVec, data });
      root.insert(minVec, maxVec, childData.length - 1);
    }

    function closest(center, _targetNum) {
      const targetNum = typeof _targetNum === "number" ? _targetNum : 1;
      let result;
      let radius =
        (Math.max(...maxCorner) - Math.min(...minCorner)) / 2 ** maxDepth;
      do {
        result = root.closest(center, radius, new Set());
        radius *= 2;
      } while (result.size < targetNum);
      // Sort
      let sorted = [];
      for (let index of result) {
        const op = childData[index];
        op._distSq = distToBoxSq(center, op.minVec, op.maxVec);
        for (let i = 0; i < targetNum && i < sorted.length; i++) {
          if (op._distSq <= sorted[i]._distSq) {
            sorted.splice(i, 0, op);
            break;
          }
        }
        if (sorted.length < targetNum) {
          sorted.push(op);
        }
      }
      return sorted.slice(0, targetNum);
    }

    return { insert: insert, closest, draw: root.draw };
  })();
}
