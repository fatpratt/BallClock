
(function() {

    // ----------------- Ball -----------------

    var Ball = function(orderNum) {
        this.orderNum = orderNum;
    };

    Ball.prototype = {
        getOrderNum: function() {
            return this.orderNum;
        }
    };

    // ----------------- Indicator -----------------

    var Indicator = function(capacity, hasFixedBall) {
        this.capacity = capacity;
        this.extraBall = hasFixedBall ? 1 : 0;
        this.balls = [];
    };

    Indicator.prototype = {
        // this method may return nothing, or it may spit back all balls, if at capacity
        addBall: function(ball) {
            this.balls.push(ball);  // the code is cleaner if we maintain balls in order added and reverse when ejected
            if (this.balls.length === this.capacity) {                
                var topBall = this.balls.pop();
                var returnBalls = this.balls.reverse();
                returnBalls.push(ball);     
                this.balls = [];    
                return returnBalls; // if at capacity, return all balls, with last on top
            } else {                
                return null;        // return null if ball accepted
            }
        },

        // report current ball positions
        reportStatus: function() {
            var str = this.extraBall ? "0" : "";
            var delimiter = this.extraBall ? ", " : "";
            // reverse for display purposes to simulate real world
            for (var i = this.balls.length - 1; i >= 0; i--) {  
                str = str + delimiter + this.balls[i].getOrderNum();
                delimiter = ', ';
            }       
            return str;         
        }
    };

    // ----------------- Queue -----------------

    var Queue = function() {
       this.balls = []; 
    };

    Queue.prototype = {
        addBall: function(ball) {
            this.balls.push(ball);
        },

        addBalls: function(balls) {
            this.balls.push.apply(this.balls, balls)
        },

        removeBall: function() {
            var retBall = this.balls[0];
            this.balls.shift();  
            return retBall;
        },

        reportStatus: function() {
            var str = "";
            var delimiter = "";
            for (var i = 0; i < this.balls.length; i++) {
                str = str + delimiter + this.balls[i].getOrderNum();
                delimiter = ', ';
            }       
            return str;         
        },

        getNumBalls: function() {
            return this.balls.length;
        },

        areBallsInOrder: function() {
            for (var i = 0; i < this.balls.length - 1; i++) {
                if (this.balls[i].getOrderNum() + 1 !== this.balls[i + 1].getOrderNum()) return false;
            }       
            return true;         
        }
    };        

    // ----------------- Clock -----------------

    var Clock = function(numBalls) {
        this.numBalls = numBalls;
        this.queue = new Queue();
        this.minIndict = new Indicator(5); 
        this.fiveMinIndict = new Indicator(12); 
        this.hourIndict = new Indicator(12, true); 
        this.tickCnt = 0;
    };

    Clock.prototype = {
        initialize: function() {
            this.tickCnt = 0;      
            for (var i = 1; i <= this.numBalls; i++) {
                var ball = new Ball(i);
                this.queue.addBall(ball);
            }
        },

        // one minute tick where ball from queue is elevated to the track...
        tick: function() {  
            this.tickCnt++;
            var ball = this.queue.removeBall();    
            var minEjectBalls = this.minIndict.addBall(ball);
            if (minEjectBalls) {
                var topBall = minEjectBalls.pop();
                this.queue.addBalls(minEjectBalls);
                var fiveMinEjectBalls = this.fiveMinIndict.addBall(topBall);
                if (fiveMinEjectBalls) {
                    topBall = fiveMinEjectBalls.pop();
                    this.queue.addBalls(fiveMinEjectBalls);  
                    var hourEjectBalls = this.hourIndict.addBall(topBall);
                    if (hourEjectBalls) {
                        topBall = hourEjectBalls.pop();
                        this.queue.addBalls(hourEjectBalls);  
                        this.queue.addBall(topBall);
                    }    
                }
            }
        },

        // returns true if balls have properly reordered
        haveBallsReordered: function() {
            if (this.queue.getNumBalls() === this.numBalls) {
                console.log('Clock says:  All balls are in queue. TickCount: ' + this.tickCnt);
                if (this.tickCnt > 0 && this.queue.areBallsInOrder()) {
                    console.log('Clock says:  All balls are in order.');
                    return true;
                }    
            }
            return false;
        },

        reportTime: function() {
            $("#textMinInd").val(this.minIndict.reportStatus());
            $("#textFiveMinInd").val(this.fiveMinIndict.reportStatus());
            $("#textHourInd").val(this.hourIndict.reportStatus());
            $("#textQueue").val(this.queue.reportStatus());
        }

    };

    // ----------------- doc ready -----------------

    var MIN_IN_DAY = 1440;
    var SAFETY_NET = 100000000;

    $(document).ready(function() {

        var clock = new Clock(30);
        clock.initialize();
        clock.reportTime();

        $('#btnTick').click(function() {
            clock.tick();
            clock.reportTime();
        });

        $('#btnCalc').click(function() {
            var numBalls = parseInt($('#textNumBalls').val(), 10);
            if (!numBalls || numBalls < 27 || numBalls > 127) {
                alert('Balls must be in the range of 27 to 127.');
                return;
            }              

            var animate = $("#chkAnimate").is(":checked");
            if (animate) animatedCalcuation(numBalls);
            else fasterCalcuation(numBalls);
            
        }); 

        // This calc routine animates the indicator fields while working on a solution, but it is SLOW!
        function animatedCalcuation(numBalls) {
            var clock = new Clock(numBalls);
            clock.initialize();
            clock.reportTime();

            var cntTick = 0;
            var cntDays = 1;

            var cycle = function() {
                if (cntTick === SAFETY_NET) {
                    console.log('Too long... give up.  Count Tick: ' + cntTick);
                    $('#spanNumOfDays').html('' + cntDays + ' (gave up)');
                    return;
                }    
                if (cntTick > 0 && cntTick % MIN_IN_DAY === 0) {
                    console.log('Day(s) passed:' + cntDays);
                    $('#spanNumOfDays').html('' + cntDays + ' (working...)');
                    cntDays++;
                }                    
                clock.tick();
                clock.reportTime();
                if (clock.haveBallsReordered()) {
                    console.log('Number of day(s): ' + cntDays);
                    $('#spanNumOfDays').html('' + cntDays + ' (DONE)');
                    return;
                }                    
                cntTick++;
                requestAnimationFrame(cycle);
            } 
            cycle();  
        }    

        // This calc routine is not as entertaining and locks up the UI, but is much faster (time flies).
        function fasterCalcuation(numBalls) {
            var clock = new Clock(numBalls);
            clock.initialize();

            var cntTick = 0;
            var cntDays = 1;
            var found = false;

            while (cntTick <= SAFETY_NET && !found) {
                if (cntTick === SAFETY_NET) {
                    console.log('Too long... give up.  Count Tick: ' + cntTick);
                    $('#spanNumOfDays').html('' + cntDays + ' (gave up)');
                }   
                if (cntTick > 0 && cntTick % MIN_IN_DAY === 0) {
                    console.log('Day(s) passed:' + cntDays);
                    $('#spanNumOfDays').html('' + cntDays + ' (working...)');
                    cntDays++;
                }                    
                clock.tick();
                found = clock.haveBallsReordered();
                if (found) {
                    console.log('Number of day(s): ' + cntDays);
                    $('#spanNumOfDays').html('' + cntDays + ' (DONE)');
                }                    
                cntTick++;
            } 
        }    

    });
})();
