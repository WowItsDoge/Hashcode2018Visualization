// initialize the visualization
const app = new PIXI.Application({
    width: window.innerWidth, height: window.innerHeight, backgroundColor: 0x1099bb,
    resolution: window.devicePixelRatio || 1,
});

// add the visualization to the canvas
document.getElementById("canvas").appendChild(app.view);

// Listen for animate update
app.ticker.add((delta) => {
    // rotate the container!
    // use delta to create frame-independent transform
    //container.rotation -= 0.01 * delta;
});

// current frame values
var currentFrame = 0;
var maxFrames = 100;

// the city grid size
var cityHeight = 100;
var cityWidth = 100;

// the input and output file data
var inputData = {};
var outputData = {};

// current score
var score = 0;

function ClearCanvas() {
    for (var i = app.stage.children.length - 1; i >= 0; i--) {
        app.stage.removeChild(app.stage.children[i]);
    }
}

function DisplayGrid() {
    const container = new PIXI.Container();
    app.stage.addChild(container);

    // draw the city map
    var mapOffsetX = 50;
    var mapOffsetY = 50;
    var mapWidth =  app.screen.width - mapOffsetX * 2;
    var mapHeight = app.screen.height - mapOffsetY * 2;
    var graphics = new PIXI.Graphics();
    graphics.beginFill(0xbae7ff);
    graphics.lineStyle(0, 0x0000FF);
    graphics.drawRect(0, 0, mapWidth, mapHeight);
    graphics.x = mapOffsetX;
    graphics.y = mapOffsetY;
    container.addChild(graphics);

    // set the score to the initialization value
    score = 0;

    // draw the vehicles
    for (var i = 0; i < inputData.numberVehicles; i++) {
        var vehicle = CalculatePositionForVehicle(i, currentFrame);
        console.log("vehicle " + i, vehicle);

        // get the vehicle position
        var position = vehicle.position;

        // add the vehicle points to the score
        score += vehicle.points;

        if (position != null) {
            var graphics = new PIXI.Graphics();
            graphics.beginFill(0x286351);
            graphics.lineStyle(0, 0x0000F0);
            graphics.drawRect(-2, -2, 4, 4);
            graphics.x = position.x / cityWidth * mapWidth + mapOffsetX;
            graphics.y = mapHeight - position.y / cityHeight * mapHeight + mapOffsetY;
            container.addChild(graphics);
        }
    }

    // draw the people
    for (var i = 0; i < inputData.numberRides; i++) {
        var person = CalculatePositionForRide(i, currentFrame);

        console.log("person " + i, person);

        if (person != null) {
            // draw the people
            var graphics = new PIXI.Graphics();
            graphics.beginFill(0xc938aa);
            graphics.lineStyle(0, 0x0000F0);
            graphics.drawCircle(-1, -1, 2);
            graphics.x = person.x / cityWidth * mapWidth + mapOffsetX;
            graphics.y = mapHeight - person.y / cityHeight * mapHeight + mapOffsetY;
            container.addChild(graphics);
        }
    }
}

// displays the current frame number and score
function DisplayFrameNr() {
    document.getElementById("frameNr").innerHTML = "Frame " + (currentFrame + 1) + " / " + maxFrames;

    document.getElementById("score").innerHTML = "Score " + score;
}

// updates the view
function UpdateView() {
    ClearCanvas();

    DisplayGrid();

    DisplayFrameNr();
}

var loadButtonClick = function()
{
    var inputText = document.getElementById('inputFile').value;
    var outputText = document.getElementById('outputFile').value;

    inputData = processInputFile(inputText);
    outputData = processOutputFile(outputText);

    console.log(inputData);
    console.log(outputData);

    // set the current and max frames
    currentFrame = 0;
    maxFrames = inputData.steps;

    // set the city size
    cityWidth = inputData.columns;
    cityHeight = inputData.rows;

    UpdateView();
}

var previousButtonClick = function() {
    if (currentFrame > 0) {
        currentFrame--;

        UpdateView();
    }
}

var nextButtonClick = function() {
    if (currentFrame < maxFrames - 1) {
        currentFrame++;

        UpdateView();
    }
}

var firstFrameClick = function() {
    currentFrame = 0;

    UpdateView();
}

var lastFrameClick = function() {
    currentFrame = maxFrames - 1;

    UpdateView();
}

function processInputFile(inputText){
    var lines = inputText.split('\n');
    var firstLineElements = lines[0].split(' ');

    var inputData = {};

    inputData.rows = parseInt(firstLineElements[0]);
    inputData.columns = parseInt(firstLineElements[1]);
    inputData.numberVehicles = parseInt(firstLineElements[2]);
    inputData.numberRides = parseInt(firstLineElements[3]);
    inputData.bonus = parseInt(firstLineElements[4]);
    inputData.steps = parseInt(firstLineElements[5]);

    inputData.rides = [];
    for (var i = 1; i < lines.length; i++) {
        if (lines[i] == '') {
            continue;
        }

        var lineElements = lines[i].split(' ');

        inputData.rides.push({
            fromX: parseInt(lineElements[0]),
            fromY: parseInt(lineElements[1]),
            toX: parseInt(lineElements[2]),
            toY: parseInt(lineElements[3]),
            earliestStart: parseInt(lineElements[4]),
            latestFinish: parseInt(lineElements[5])
        });
    }

    return inputData;
}

function processOutputFile(outputText){
    var lines = outputText.split('\n');

    var outputData = {};

    outputData.vehicles = [];
    for (var i = 0; i < lines.length; i++) {
        if (lines[i] == '') {
            continue;
        }

        var lineElements = lines[i].split(' ');

        outputData.vehicles[i] = [];
        for (var n = 1; n < lineElements.length; n++) {
            outputData.vehicles[i].push(parseInt(lineElements[n]));
        }
    }

    return outputData;
}

// calculates the position and points for a vehicle in the selected frame
function CalculatePositionForVehicle(vehicleNr, frameNr) {
    var points = 0;
    var position = null;

    // at the begin the vehicles are at a fixed position
    if (frameNr == 0) {
        return {
            points: 0,
            position: {
                x: 0,
                y: 0
            }
        };
    }

    var rides = outputData.vehicles[vehicleNr];

    var x = 0;
    var y = 0;
    var time = 0;
    for (var i = 0; i < rides.length; i++) {
        var currentRide = inputData.rides[rides[i]];
        var distance = GetDistance(x, y, currentRide.fromX, currentRide.fromY);

        if (time + distance <= frameNr) {
            time += distance;
            x = currentRide.fromX;
            y = currentRide.fromY;

            distance = GetDistance(x, y, currentRide.toX, currentRide.toY);

            if (time + distance <= frameNr) {
                time += distance;
                x = currentRide.toX;
                y = currentRide.toY;

                // if the ride finished on time, add the points equal to the distance
                if (currentRide.latestFinish > time) {
                    points += distance;

                    console.log("vehicleNr: " + vehicleNr + " frame: " + frameNr +
                                " points distance: " + distance);
                }

                // if the ride earliest start was on time, add the bonus points
                if (currentRide.earliestStart > time - distance &&
                    currentRide.latestFinish > time) {
                    points += inputData.bonus;

                    console.log("vehicleNr: " + vehicleNr + " frame: " + frameNr +
                        " points bonus: " + inputData.bonus);
                }
            }
            else {
                // travel only until the frame nr is reached
                var possibleDistance = frameNr - time;

                return {
                    points: points,
                    position: MoveInDirection(x, y, currentRide.toX, currentRide.toY, possibleDistance)
                };
            }
        }
        else {
            // travel only until the frame nr is reached
            var possibleDistance = frameNr - time;

            return {
                points: points,
                position: MoveInDirection(x, y, currentRide.fromX, currentRide.fromY, possibleDistance)
            };
        }
    }

    return {
        points: points,
        position: position
    };
}

// moves the number of steps to the target position
function MoveInDirection(currentX, currentY, targetX, targetY, steps) {
    console.log("MoveInDirection, currentX: " + currentX + ", currentY: " + currentY +
                ", targetX: " + targetX + ", targetY: " + targetY + ", steps: " + steps);

    // the distance has to be greater than the number of steps
    if (steps <= 0 || GetDistance(currentX, currentY, targetX, targetY) < steps) {
        return {
            x: currentX,
            y: currentY
        };
    }

    while (steps > 0) {
        if (Math.abs(currentX - targetX) > Math.abs(currentY - targetY)) {
            if (currentX > targetX) {
                currentX--;
            }
            else {
                currentX++;
            }
        }
        else {
            if (currentY > targetY) {
                currentY--;
            }
            else {
                currentY++;
            }
        }

        steps--;
    }

    return {
        x: currentX,
        y: currentY
    };
}

// calculates the position for a ride in the selected frame
function CalculatePositionForRide(rideNr, frameNr) {
    var ride = inputData.rides[rideNr];

    if (ride.latestFinish >= frameNr) {
        var vehicleNr = GetVehicleNrForRide(rideNr);
        var vehicle = outputData.vehicles[vehicleNr];

        var pickupTime = GetPickupTimeForRide(vehicle, rideNr);

        if (pickupTime >= frameNr) {
            return {
                x: ride.fromX,
                y: ride.fromY
            };
        }
    }

    return null;
}

// returns the time until a vehicle picks up the ride
function GetPickupTimeForRide(vehicle, rideNr) {
    var time = 0;

    var x = 0;
    var y = 0;
    for (var i = 0; i < vehicle.length; i++) {
        var currentRide = inputData.rides[vehicle[i]];

        // add the distance to the pick up position
        time += GetDistance(x, y, currentRide.fromX, currentRide.fromY);

        // set the new position
        x = currentRide.fromX;
        y = currentRide.fromY;

        if (vehicle[i] == rideNr) {
            return time;
        }

        // add the distance to the target position
        time += GetDistance(x, y, currentRide.toX, currentRide.toY);

        // set the new position
        x = currentRide.toX;
        y = currentRide.toY;
    }

    return 0;
}

// returns the city distance between two points
function GetDistance(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

// returns the vehicle number for a ride number
function GetVehicleNrForRide(rideNr) {
    var vehicleNr = null;

    for (var i = 0; i < outputData.vehicles.length; i++) {
        if (outputData.vehicles[i].includes(i))
        {
            vehicleNr = i;
        }
    }

    return vehicleNr;
}

// add the button click listener
document.getElementById("loadButton").onclick = loadButtonClick;
document.getElementById("previousButton").onclick = previousButtonClick;
document.getElementById("nextButton").onclick = nextButtonClick;
document.getElementById("firstFrameButton").onclick = firstFrameClick;
document.getElementById("lastFrameButton").onclick = lastFrameClick;

// actions after the window loading is completed
window.addEventListener("load",function(event_){
    // resize the canvas
    app.view.style.width = (window.innerWidth - 40) + "px";
    app.view.style.height = (window.innerHeight - 40) + "px";

    // display the current frame number
    DisplayFrameNr();
});
