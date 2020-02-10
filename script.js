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

// the calculated simulation data
var simulation = [];

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
    graphics.beginFill(0x1099bb);
    graphics.lineStyle(1, 0x0000FF);
    graphics.drawRect(0, 0, mapWidth, mapHeight);
    graphics.x = mapOffsetX;
    graphics.y = mapOffsetY;
    container.addChild(graphics);

    // example car data
    var cars = [];
    cars.push([0, 0]);
    cars.push([cityWidth / 2, cityHeight / 2]);
    cars.push([cityWidth, cityHeight]);

    for (var i = 0; i < cars.length; i++)
    {
        // draw the car
        var graphics = new PIXI.Graphics();
        graphics.beginFill(0x0000F0);
        graphics.lineStyle(0, 0x0000F0);
        graphics.drawRect(-2, -2, 4, 4);
        graphics.x = cars[i][0] / cityWidth * mapWidth + mapOffsetX;
        graphics.y = mapHeight - cars[i][1] / cityHeight * mapHeight + mapOffsetY;
        container.addChild(graphics);
    }

    // example people data
    var people = [];
    people.push([20, 20]);
    people.push([60, 80]);
    people.push([60, 90]);

    for (var i = 0; i < people.length; i++)
    {
        // draw the people
        var graphics = new PIXI.Graphics();
        graphics.beginFill(0xed82ab);
        graphics.lineStyle(0, 0x0000F0);
        graphics.drawCircle(-1, -1, 2);
        graphics.x = people[i][0] / cityWidth * mapWidth + mapOffsetX;
        graphics.y = mapHeight - people[i][1] / cityHeight * mapHeight + mapOffsetY;
        container.addChild(graphics);
    }

    // // Move container to the center
    // container.x = app.screen.width / 2;
    // container.y = app.screen.height / 2;
    //
    // // Center bunny sprite in local container coordinates
    // container.pivot.x = container.width / 2;
    // container.pivot.y = container.height / 2;
}

// displays the current frame number
function DisplayFrameNr() {
    document.getElementById("frameNr").innerHTML = "Frame " + (currentFrame + 1) + " / " + maxFrames;
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

    inputData.rows = firstLineElements[0];
    inputData.columns = firstLineElements[1];
    inputData.numberVehicles = firstLineElements[2];
    inputData.numberRides = firstLineElements[3];
    inputData.bonus = firstLineElements[4];
    inputData.steps = firstLineElements[5];

    inputData.rides = [];
    for (var i = 1; i < lines.length; i++) {
        var lineElements = lines[i].split(' ');

        inputData.rides.push({
            fromX: lineElements[0],
            fromY: lineElements[1],
            toX: lineElements[2],
            toY: lineElements[3],
            earliestStart: lineElements[4],
            latestFinish: lineElements[5]
        });
    }

    return inputData;
}

function processOutputFile(outputText){
    var lines = outputText.split('\n');

    var outputData = {};

    outputData.vehicles = [];
    for (var i = 0; i < lines.length; i++) {
        var lineElements = lines[i].split(' ');

        outputData.vehicles[i] = [];
        for (var n = 1; n < lineElements.length; n++) {
            outputData.vehicles[i].push(lineElements[n]);
        }
    }

    return outputData;
}

// calculates the simulation
function CalculateSimulation() {
    simulation = [];

    // calculate every simulation frame
    for (var i = 0; i < inputData.steps; i++) {
        var people = [];
        var cars = [];

        var score = 0;
        if (i > 0) {
            score += simulation[i - 1].score;
        }

        simulation.push({
            score: score,
            people: people,
            cars: cars
        });
    }
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
