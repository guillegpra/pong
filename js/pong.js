// ------------------------ Global variables ------------------------
let start_time;
let end_time;

// TODO: create highest score in display

// ------------------------ CANVAS ------------------------
class Canvas {

    constructor(id, width, height, colour) {
        this.id = id;
        this.width = width;
        this.height = height;
        this.colour = colour;
        this.paddles = [];
        this.ball = null;
        this.user_points = 10;
        this.computer_points = 10;
    }

    show() {
        $('body').append(`
            <div class="pong-grid">
                <div id=${this.id}></div>
                <div class="info">
                    <h1>Pong Game</h1>
                    <div class="scoreboard">${this.user_points} - ${this.computer_points}</div>
                    <div class="description">&emsp;your points &emsp; &emsp; &emsp; their points</div>
                    <h3>Past wins: &emsp; Highest score:</h3>
                    <div class="history">${getWinHistory('USER')} - ${getWinHistory('COMPUTER')} &nbsp; &emsp; &emsp; &emsp; &emsp; ${getHighestScore()} <span>seconds</span></div>
                    <button id="start-btn" class="start-btn">Start the game</button>
                </div>
            </div>
        `);

        $(`#${this.id}`).css({
            'width': `${this.width}px`,
            'height': `${this.height}px`,
            'background': `${this.colour}`
        });
    }

    ballMissed(who) {
        // who missed the ball
        switch (who) {
            case 'USER':
                this.user_points--;
                break;
            case 'COMPUTER':
                this.computer_points--;
                break;
            default:
                console.error('Something went wrong');
        }

        // update scoreboard
        $('.scoreboard').text(`${this.user_points} - ${this.computer_points}`);
        if (this.user_points < 10) {
            $('.description').html(`your points &emsp; their points`);
        }

        // check points
        if (this.user_points === 0 || this.computer_points === 0) {
            // stop game
            this.ball.stop();
            this.paddles[1].stop();
            end_time = new Date().getTime(); // stop timer

            // show winner
            this.showWinner();

            // restart scoreboard
            this.user_points = 10;
            this.computer_points = 10;
        }
    }

    showWinner() {
        if (this.user_points === 0) { // computer wins
            setWinHistory('COMPUTER', getWinHistory('COMPUTER') + 1); // update win history
            $('.scoreboard').text('You lost... Try again?');
        } else { // user wins
            setWinHistory('USER', getWinHistory('USER') + 1); // update win history
            $('.scoreboard').text('YOU WON!!');

            setHighestScore(start_time, end_time);
        }

        // update history
        $('.description').css({
            'visibility': 'hidden'
        });
        $('.history').html(`${getWinHistory('USER')} - ${getWinHistory('COMPUTER')} &nbsp; &emsp; &emsp; &emsp; &emsp; ${getHighestScore()} <span>seconds</span>`);
        $('.start-btn').text('Try again');
    }

    setPaddles(user_paddle, computer_paddle) {
        this.paddles.push(user_paddle);
        this.paddles.push(computer_paddle);
    }

    setBall(ball) {
        this.ball = ball;
    }

}

// ------------------------ BALL ------------------------
class Ball {

    constructor(x, y, dx, dy, size, colour, canvas) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.size = size;
        this.colour = colour;
        this.canvas = canvas;
        this.animationFrame;
        this.animate = false;
    }

    show() {
        $('#canvas').append(`<div id="ball"></div>`);
        $(`#ball`).css({
            'left': `${this.x}px`,
            'top': `${this.y}px`,
            'width': `${this.size}px`,
            'height': `${this.size}px`,
            'background': `${this.colour}`
        });
    }

    move() {
        // update value
        this.x += this.dx;
        this.y += this.dy;

        this.checkLimits();
        $(`#ball`).css({
            'left': `${this.x}px`,
            'top': `${this.y}px`
        });

        // only animate if the game is not finished
        if (this.animate) {
            requestAnimationFrame(() => this.move());
        }

    }

    checkLimits() {

        // vertical limits
        if (this.y > this.canvas.height - this.size || this.y < 0) {
            this.dy *= -1; // rebounce
        }

        // horizontal limits
        if (this.x > this.canvas.width - this.size) { // computer missed a ball
            this.canvas.ballMissed('COMPUTER') // decrease scoreboard
            this.restart(); // make ball reappear on the screen
        }
        
        if (this.x <= 0) { // user missed a ball
            this.canvas.ballMissed('USER') // decrease scoreboard
            this.restart(); // make ball reappear on the screen
        }

        // paddle limits
        if (this.canvas.paddles !== []) {

            for (let i = 0; i < this.canvas.paddles.length; i++) {
                // paddle borders
                let paddle_top = this.canvas.paddles[i].y;
                let paddle_bottom = this.canvas.paddles[i].y + this.canvas.paddles[i].height;
                let paddle_left = this.canvas.paddles[i].x;
                let paddle_right = this.canvas.paddles[i].x + this.canvas.paddles[i].width;

                // ball borders
                let ball_top = this.y;
                let ball_bottom = this.y + this.size;
                let ball_left = this.x;
                let ball_right = this.x + this.size;

                if (paddle_left < ball_right && paddle_top < ball_bottom && 
                        paddle_right > ball_left && paddle_bottom > ball_top) {
                    this.dx *= -1;
                }
            }

        } else {
            console.error('Game started before the paddles were loaded');
        }

    }

    restart() {
        // make ball reappear on screen
        this.x = this.canvas.width/2;
        this.y = this.canvas.height/2;

        // get random direction to restart the ball
        let arr = [-1, 1];
        this.dx = arr[Math.floor(Math.random()*arr.length)] * this.dx; 
        this.dy = arr[Math.floor(Math.random()*arr.length)] * this.dy; 

        $(`#ball`).css({
            'left': `${this.x}px`,
            'top': `${this.y}px`
        });
    }

    stop() {
        this.animate = false; // stop animating

        // move ball back to the center
        this.x = this.canvas.width/2;
        this.y = this.canvas.height/2;
    }

}

// ------------------------ PADDLE ------------------------
class Paddle {
    constructor(id, x, y, width, height, speed, canvas) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.canvas = canvas;
        this.score = 0;
        this.animate = false;
    }

    show() {
        $('#canvas').append(`<div class="paddle" id="paddle${this.id}"></div>`);
        $(`#paddle${this.id}`).css({
            'left': `${this.x}px`,
            'top': `${this.y}px`,
            'width': `${this.width}px`,
            'height': `${this.height}px`,
        });
    }

    move() {
        this.y += this.speed;
        this.checkLimits();
        $(`#paddle${this.id}`).css('top', `${this.y}px`); // update position

        // only animate if the game is not finished
        if (this.animate) {
            requestAnimationFrame(() => this.move());
        }
    } 

    checkLimits() {} // to be defined by children

    stop() {
        this.animate = false; // stop animating
    }

}

class ComputerPaddle extends Paddle {

    checkLimits() {
        if (this.y < 0) {
            this.speed *= -1;
        }
        if (this.y > this.canvas.height - this.height) {
            this.speed *= -1;
        }
    }

}

class UserPaddle extends Paddle {

    checkLimits() {
        if (this.y < 0) {
            this.y = 0;
        }
        if (this.y > this.canvas.height - this.height) {
            this.y = this.canvas.height - this.height;
        }
    }

    handleKeydown(event) {
        if (event.keyCode === 38) { // arrow up
            this.speed = (this.speed > 0) ? this.speed*-1 : this.speed; 
        }
        if (event.keyCode === 40) { // arrow down
            this.speed = (this.speed < 0) ? this.speed*-1 : this.speed;
        }
    }

}

// ------------------------ GAME ------------------------
$(document).ready(function() {
    // create canvas
    const canvas = new Canvas('canvas', 700, 500, '#000000');
    canvas.show();

    // create ball
    const ball = new Ball(canvas.width/2, canvas.height/2, 4, 4, 30, '#ffffff', canvas);

    // create user-controlled paddle
    const paddle1 = new UserPaddle(1, 5, 300, 20, 60, 6, canvas);

    // create computer-controlled paddle (x position is the limit - its width - 5)
    const paddle2 = new ComputerPaddle(2, canvas.width - 20 - 5, 0, 20, 200, 12, canvas);

    // update canvas attributes
    canvas.setPaddles(paddle1, paddle2);
    canvas.setBall(ball);

    // show elements
    ball.show();
    paddle1.show(); paddle1.animate = true;
    paddle2.show(); 

    // user-paddle movement
    $(document).on('keydown', e => {
        paddle1.handleKeydown(e);
    });
    requestAnimationFrame(() => paddle1.move()); 

    // start button functionality
    $('.start-btn').click(() => {
        start_time = new Date().getTime();

        // update scoreboard
        $('.scoreboard').text(`${canvas.user_points} - ${canvas.computer_points}`);
        $('.description').html('&emsp;your points &emsp; &emsp; &emsp; their points');
        $('.description').css({
            'visibility': 'visible'
        });

        // (re)animate objects
        ball.animate = true;
        paddle2.animate = true;

        ball.move();
        paddle2.move(); // computer-controlled paddle
    });
});

// ------------------------ AUXILIARY FUNCTIONS ------------------------
function getWinHistory(who) {
    switch (who) {
        case 'COMPUTER':
            if (window.localStorage.getItem('computer_wins') === null) { // first time
                setWinHistory('COMPUTER', 0);
                return 0;
            }
            return parseInt(window.localStorage.getItem('computer_wins'));
        case 'USER':
            if (window.localStorage.getItem('user_wins') === null) { // first time
                setWinHistory('USER', 0);
                return 0;
            }
            return parseInt(window.localStorage.getItem('user_wins'));
        default:
            console.error('There was an error');
            return null;
    }
}

function setWinHistory(who, value) {
    switch (who) {
        case 'COMPUTER':
            window.localStorage.setItem('computer_wins', value);
            return true;
        case 'USER':
            window.localStorage.setItem('user_wins', value);
            return true;
        default:
            console.error('There was an error');
            return false;
    }
}

function setHighestScore(start, end) {
    let score = (end - start)/1000; // current score in seconds
    let highest_score = window.localStorage.getItem('highest_score');

    if (highest_score === null || parseFloat(highest_score) > score) {
        window.localStorage.setItem('highest_score', score); // update highest score only if it is better
    }
}

function getHighestScore() {
    if (window.localStorage.getItem('highest_score') === null) {
        return 0;
    }
    return window.localStorage.getItem('highest_score');
}
