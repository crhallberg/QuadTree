// Daniel Shiffman
// http://codingtra.in
// http://patreon.com/codingtrain

// QuadTree
// [video url 1]
// [video url 2]

let qtree;
let loaded = false;
let cached = false;
let mapCache;
const SCALE = 3;

function setup() {
    createCanvas(360 * SCALE, 180 * SCALE);
    textAlign(CENTER, CENTER);
    fetch("./world-cities.json")
        .then(function(response) {
            return response.json();
        })
        .then(function(myJson) {
            qtree = QuadTree.fromJSON(myJson);
            loaded = true;
        });
}

function draw() {
    background(0);
    if (!loaded) {
        fill(151);
        text("LOADING...", width / 2, height / 2);
    } else {
        if (!cached) {
            push();
            translate(width / 2, height / 2);
            rotate(-PI / 2);
            showGrid(qtree);
            showPoints(qtree);
            mapCache = get();
            cached = true;
            pop();
        }
        image(mapCache, 0, 0);
        const mousePoint = new Point(
            (height / 2 - mouseY) / SCALE,
            (mouseX - width / 2) / SCALE
        );
        const closest = qtree.closest(mousePoint, 1)[0];
        stroke(0, 255, 0);
        strokeWeight(1);
        line(
            mouseX,
            mouseY,
            closest.y * SCALE + width / 2,
            -closest.x * SCALE + height / 2
        );
        strokeWeight(5);
        point(closest.y * SCALE + width / 2, -closest.x * SCALE + height / 2);

        stroke(0);
        strokeWeight(3);
        fill(255);
        let label = closest.userData.city + ", " + closest.userData.country;
        if (closest.userData.population > 0) {
            label +=
                "\n(" +
                closest.userData.population
                    .toString()
                    .replace(/,/g, "")
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
                " people)";
        }
        text(label, mouseX, mouseY - 20);
    }
}

function showGrid(qtree) {
    noStroke();
    fill(255, 10);
    rectMode(CENTER);
    rect(
        qtree.boundary.x * SCALE,
        qtree.boundary.y * SCALE,
        qtree.boundary.w * 2 * SCALE,
        qtree.boundary.h * 2 * SCALE
    );

    if (qtree.divided) {
        showGrid(qtree.northeast);
        showGrid(qtree.northwest);
        showGrid(qtree.southeast);
        showGrid(qtree.southwest);
    }
}

function showPoints(qtree) {
    if (qtree.divided) {
        showPoints(qtree.northeast);
        showPoints(qtree.northwest);
        showPoints(qtree.southeast);
        showPoints(qtree.southwest);
    } else {
        for (let p of qtree.points) {
            stroke(255);
            point(p.x * SCALE, p.y * SCALE);
        }
    }
}
