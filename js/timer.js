export class Timer{
    constructor(onComplete, onTick) {
        this.duration = 0;
        this.remaining = 0;
        this.intervalId = 0;
        this.onComplete = onComplete;
        this.onTick = onTick;
        this.isRunning = false;
    }

    //Start timer with duration in minutes
    start(minutes){
        if(minutes <= 0){
            this.stop();
            return;
        }

        this.duration = minutes * 60 // convert to seconds
        this.remaining = this.duration;
        this.isRunning = true;

        //clear any existing intervals
        if(this.intervalId){
            clearInterval(this.intervalId)
        }

        //update display 
        this.updateDisplay();

        //start countdown
        this.intervalId = setInterval(()=>{
            this.remaining--;
            this.updateDisplay();
            if(this.remaining <= 0){
                this.complete()
            }
        }, 1000)
    }

    //stop timer
    stop(){
        if(this.intervalId){
            clearInterval(this.intervalId);
            this.intervalId;
        }

        this.duration = 0;
        this.remaining = 0;
        this.isRunning = false;
        this.updateDisplay();
    }

    //Timer completed
    complete(){
        this.stop();
        if(this.onComplete){
            this.onComplete();
        }
    }

    // update Display
    updateDisplay(){
        const minutes = Math.floor(this.remaining / 60);
        const seconds = this.remaining % 60;

        if(this.onTick){
            this.onTick(minutes,seconds)
        }
    }
}