const RESOLUTION = 1000;
const DRAW_LINES = true;
const DEFAULT_AIRFOIL = "2412";

let canvas;
let ctx;
let plotButton;
let downloadButton;
let digitInput;
let camberCheck;
let chordCheck;

let currentAirfoil = DEFAULT_AIRFOIL;
let points;

window.onload = (event) => {
    canvas = document.getElementById("plot");
    ctx = canvas.getContext("2d");

    plotButton = document.getElementById("plotButton");
    downloadPNG = document.getElementById("downloadPNG");
    downloadSVG = document.getElementById("downloadSVG");

    camberCheck = document.getElementById("camberCheck")
    chordCheck = document.getElementById("chordCheck")

    digitInput = document.getElementById("digits");

    errorDiv = document.getElementById("input_error");

    digitInput.addEventListener("keydown", function (event) {
        console.log(digits);
        if (event.keyCode === 13) {
            event.preventDefault();
            plotButton.click();
        }
    });

    plotButton.addEventListener("click", () => {
        currentAirfoil = digitInput.value;
        var error = airfoilFromString(digitInput.value);
        if (error.length > 0) {
            errorDiv.innerText = error;
            errorDiv.style.display = "block";
        } else {
            errorDiv.style.display = "none";
        }
    });

    downloadPNG.addEventListener("click", () => {
        let link = document.createElement("a");
        link.download = 'NACA' + currentAirfoil + ".png";
        link.href = document.getElementById("plot").toDataURL();
        link.click();
    });

    downloadSVG.addEventListener("click", () => {
        let m = .01 * parseFloat(currentAirfoil.charAt(0));
        let t = .01 * parseFloat(currentAirfoil.charAt(2) + currentAirfoil.charAt(3));
        let link = document.createElement("a");

        let svgString = 'data:image/svg+xml, <svg xmlns="http://www.w3.org/2000/svg"> ';
        svgString += '<polygon points="';
        for (let i = 0; i < points.length; i++) {
            svgString += 1000 * points[i][0] + ',' + 1000 * (m + .5 * t + points[i][1]) + ' ';
        }
        svgString += '" stroke="%234169E1" stroke-width="1" fill="%23d9e2ff"/>';
        svgString += ' </svg>';

        link.href = svgString;
        link.download = 'NACA' + currentAirfoil + ".svg";
        link.click();
    });

    camberCheck.addEventListener("change", () => {plotButton.click()})
    chordCheck.addEventListener("change", () => {plotButton.click()})

    window.addEventListener(
        "resize",
        () => {
            airfoilFromString(currentAirfoil);
        },
        false
    );

    airfoilFromString(DEFAULT_AIRFOIL);
};

function resizeCanvas(x, y) {
    canvas.width = x;
    canvas.height = y;
}

function airfoilFromString(text) {
    let chars = text.split("");

    var error = [];

    if (text.length < 4) {
        error.push("input is too short. ");
    }
    if (text.length > 4) {
        error.push("input is too long. ");
    }
    for (let i = 0; i < chars.length; i++) {
        if (isNaN(chars[i])) {
            error.push("input is not a number. ");
            break;
        }
    }
    if (error.length === 0) {
        NACA4Digit(
            1,
            0.01 * chars[0],
            0.1 * chars[1],
            0.01 * (chars[2] + chars[3])
        );
    }

    return error;
}

function debug() {
    console.log("debug");
}

function pad(n, width, z) {
    z = z || "0";
    n = n + "";
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function NACA4Digit(c, m, p, t) {
    //c = camber length
    resizeCanvas(
        window.innerWidth,
        0.1 * window.innerWidth + window.innerWidth * (t + 2 * m)
    );

    ctx.resetTransform();

    console.log("called gen");
    ctx.fillStyle = "rgba(0, 0, 0, 1)";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 0.02 * canvas.width + "px serif";
    ctx.fillStyle = "#4169E1";
    ctx.fillText(
        "NACA" +
        (100 * m).toFixed(0) +
        (10 * p).toFixed(0) +
        pad((100 * t).toFixed(0), 2),
        0.8 * canvas.width,
        0.9 * canvas.height
    );

    ctx.translate(0, canvas.height * 0.5);

    let step = 1 / RESOLUTION;

    // upper half
    points = [];
    ctx.beginPath();
    for (let x = 0; x < 1; x += step) {
        let thickness =
            5 *
            t *
            (0.2969 * Math.sqrt(x) -
                0.126 * x -
                0.3516 * Math.pow(x, 2) +
                0.2843 * Math.pow(x, 3) -
                0.1036 * Math.pow(x, 4)); //adjusted for zero thickness trailing edge

        var camber;
        var theta;

        if (m === 0 && p === 0) {
            camber = 0;
            theta = Math.PI;
        } else {
            if (x <= p * c) {
                camber = (m / Math.pow(p, 2)) * (2 * p * (x / c) - Math.pow(x / c, 2));
                theta = Math.atan(((2 * m) / Math.pow(p, 2)) * (p - x / c));
            } else if (x <= c) {
                camber =
                    (m / Math.pow(1 - p, 2)) *
                    (1 - 2 * p + 2 * p * (x / c) - Math.pow(x / c, 2));
                theta = Math.atan(((2 * m) / Math.pow(1 - p, 2)) * (p - x / c));
            }
            camber *= -1;
        }

        //upper
        let xU = x + thickness * Math.sin(theta);
        let yU = camber - thickness * Math.cos(theta);

        //stroke(outlineColor);
        if (DRAW_LINES) {
            if (x > 0) {
                points.push([xU, yU]);
                ctx.lineTo(
                    xU * 0.8 * canvas.width + 0.1 * canvas.width,
                    yU * 0.8 * canvas.width
                );
            } else {
                points.push([xU, yU]);
                ctx.moveTo(
                    xU * 0.8 * canvas.width + 0.1 * canvas.width,
                    yU * 0.8 * canvas.width
                );
            }
        }
    }

    // lower half
    for (let x = 1; x >= 0; x -= step) {
        //let thickness = 5*t*(0.2969*sqrt(x)-0.1260*x-0.3516*pow(x, 2)+0.2843*pow(x, 3)-0.1015*pow(x, 4));
        let thickness =
            5 *
            t *
            (0.2969 * Math.sqrt(x) -
                0.126 * x -
                0.3516 * Math.pow(x, 2) +
                0.2843 * Math.pow(x, 3) -
                0.1036 * Math.pow(x, 4)); //adjusted for zero thickness trailing edge

        var camber;
        var theta;

        if (m === 0 && p === 0) {
            camber = 0;
            theta = Math.PI;
        } else {
            if (x <= p * c) {
                camber = (m / Math.pow(p, 2)) * (2 * p * (x / c) - Math.pow(x / c, 2));
                theta = Math.atan(((2 * m) / Math.pow(p, 2)) * (p - x / c));
            } else if (x <= c) {
                camber =
                    (m / Math.pow(1 - p, 2)) *
                    (1 - 2 * p + 2 * p * (x / c) - Math.pow(x / c, 2));
                theta = Math.atan(((2 * m) / Math.pow(1 - p, 2)) * (p - x / c));
            }
            camber *= -1;
        }

        //lower half
        let xL = x - thickness * Math.sin(theta);
        let yL = camber + thickness * Math.cos(theta);

        //stroke(outlineColor);
        if (DRAW_LINES) {
            if (x > 0) {
                points.push([xL, yL]);
                ctx.lineTo(
                    xL * 0.8 * canvas.width + 0.1 * canvas.width,
                    yL * 0.8 * canvas.width
                );
            } else {
                //ctx.beginPath();
                points.push([xL, yL]);
                ctx.lineTo(
                    xL * 0.8 * canvas.width + 0.1 * canvas.width,
                    yL * 0.8 * canvas.width
                );
            }
        }
    }
    ctx.closePath();
    //ctx.moveTo(0.5 * canvas.width, -canvas.width * m);

    ctx.fillStyle = "#d9e2ff";
    ctx.fill();
    ctx.strokeStyle = "#4169E1";
    ctx.setLineDash([]);
    ctx.stroke();

    // camber
    if (camberCheck.checked) {
        ctx.beginPath();
        for (let x = 0; x < 1; x += step) {
            var camber;

            if (m === 0 && p === 0) {
                camber = 0;
                theta = Math.PI;
            } else {
                if (x <= p * c) {
                    camber =
                        (m / Math.pow(p, 2)) * (2 * p * (x / c) - Math.pow(x / c, 2));
                } else if (x <= c) {
                    camber =
                        (m / Math.pow(1 - p, 2)) *
                        (1 - 2 * p + 2 * p * (x / c) - Math.pow(x / c, 2));
                }
                camber *= -1;
            }

            ctx.lineTo(
                x * 0.8 * canvas.width + 0.1 * canvas.width,
                camber * 0.8 * canvas.width
            );

            ctx.setLineDash([3, 5]);
            ctx.strokeStyle = "#4169E1";
            ctx.stroke();
        }
    }

    if (chordCheck.checked) {
        // chord
        ctx.beginPath();
        ctx.moveTo(0.1 * canvas.width, 0);
        ctx.lineTo(0.9 * canvas.width, 0);

        ctx.setLineDash([2, 2, 5, 2]);
        ctx.strokeStyle = "#4169E1";
        ctx.stroke();
    }
}
