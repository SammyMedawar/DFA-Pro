function render(cls = true) {
    if (cls) {
        ctx.save();

        //set background color or pattern
        ctx.fillStyle = ctx.createPattern(createSquarePattern(), 'repeat');
        ctx.fillRect(0, 0, cnv.width, cnv.height);

        ctx.restore();
    }

    fa.render(ctx);
}

function createSquarePattern() {
    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d');

    //adjust the size of each square and border width
    const squareSize = 20;
    const borderWidth = 1;

    //set the size of the pattern canvas
    patternCanvas.width = squareSize;
    patternCanvas.height = squareSize;

    //draw the pattern on the pattern canvas
    patternCtx.fillStyle = '#fff'; // White fill
    patternCtx.fillRect(0, 0, squareSize, squareSize);

    //draw black border
    patternCtx.strokeStyle = 'rgb(242,242,242)'; // Black border
    patternCtx.lineWidth = borderWidth;
    patternCtx.strokeRect(0, 0, squareSize, squareSize);

    return patternCanvas;
}