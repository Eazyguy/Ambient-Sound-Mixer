export class SoundManager {
    constructor(){
        this.audioElements = new Map();
        this.isPlaying = false;
    }

    //load a sound file
    loadSound(soundId, filePath)
    {
        try {
            const audio = new Audio();
            audio.src = filePath;
            audio.loop = true;
            audio.preload = 'metadata';
            //Add sound to the audio elements app
            this.audioElements.set(soundId, audio)
            return true
        } catch (error) {
            console.error(`Failed to load sound ${soundId}`)
            return false
        }
    }
    async playSound(soundId){
      const audio =  this.audioElements.get(soundId)
        if(audio){
        try {
            await audio.play();
            console.log(`Playing ${soundId}`)
            return true;
        } catch (error) {
            console.error(`Failed to play ${soundId}`)
        }}
    }

    // Pause a specific Sound
    PauseSound(soundId){
        const audio = this.audioElements.get(soundId)

        if(audio && !audio.paused){
            audio.pause();
            console.log(`Paused: ${soundId}`)
        }
    }

    //set Volume for a specific sound
    setVolume(soundId, volume){
        const audio = this.audioElements.get(soundId);
        
        if(!audio){
            console.error(`Sound ${soundId} not found`);
            return false
        }

        //convert from 0 - 100
        audio.volume = volume/100
        return true
    }

//play all sounds
playAll(){
    for (const [soundId, audio] of this.audioElements){
        if(audio.paused){
            audio.play()
        }
    }
    this.isPlaying = true;
}

pauseAll(){
    for (const [soundId, audio] of this.audioElements) {
        if(!audio.paused){
            audio.pause();
        }
    }
    this.isPlaying = false;
}

stopAll(){
    for (const [soundId, audio] of this.audioElements) {
        if(!audio.paused){
            audio.pause();
        }
        audio.currentTime = 0; //Reset to beginning
    }
    this.isPlaying = false;
}

    }