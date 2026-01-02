import { presetManager } from "./presetManager.js";
import {sounds, defaultPresets} from "./soundData.js"
import { SoundManager } from "./soundManager.js";
import {UI} from "./ui.js"
import { Timer } from "./timer.js";

class AmbientMixer {
    constructor() {
        this.soundManager = new SoundManager();
        this.ui = new UI();
        this.presetManager = new presetManager();
        this.timer = new Timer(
            ()=>this.onTimerComplete(),
            (minutes, seconds) => this.ui.updateTimerDisplay(minutes, seconds)
        );
        this.currentSoundState = {};
        this.masterVolume = 100
        this.isIntialized = false
    }

    init() {
        try {
            // initialize UI
            this.ui.init();

            // Render Sound cards using our data
            this.ui.renderSoundCards(sounds);

            // Event Listeners
            this.setupEventListeners()

            //load custom presets UI
            this.loadCustomPresetsUI();

            //load all sound files
            this.loadAllSounds();

            //initialize sound states after loading sounds
            sounds.forEach(sound=>{
                this.currentSoundState[sound.id] = 0;
            })

            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to intialie app', error)
        }
    }

    //set up all event listeners
    setupEventListeners() {
        //Handle all clicks with event delegation
        document.addEventListener('click', async e=>{
            //check if a play button was clicked
            if(e.target.closest('.play-btn')){
                const soundId = e.target.closest('.play-btn').dataset.sound

               await this.toggleSound(soundId)
            }

            //check if delete was clicked
            if(e.target.closest('.delete-preset')){
                e.stopPropagation();
                const presetId = e.target.closest('.delete-preset').dataset.preset;

                this.deleteCustomPreset(presetId);

                return;
            }

            //check if a default preset button was clicked
            if(e.target.closest('.preset-btn')){
                const presetKey = e.target.closest('.preset-btn').dataset.preset

               await this.loadPreset(presetKey)
            }

            //check if a custom preset button was clicked
            if(e.target.closest('.custom-preset-btn')){
                const presetKey = e.target.closest('.custom-preset-btn').dataset.preset

                console.log(presetKey)

               await this.loadPreset(presetKey, true)
            }
        });

        //Handle volume slider changes
        document.addEventListener('input', e => {
            if(e.target.classList.contains('volume-slider')){
            const soundId = e.target.dataset.sound;
            const volume = parseInt(e.target.value);
            this.setSoundVolume(soundId, volume)
            
        }
        });

       const masterVolumeSlider = document.getElementById('masterVolume')
        if(masterVolumeSlider){
            masterVolumeSlider.addEventListener('input', e=>{
                const volume = parseInt(e.target.value);
                this.setMasterVolume(volume)
            })
        }
        
        // Handle Master play/pause button
        if(this.ui.playPauseButton){
        this.ui.playPauseButton.addEventListener('click', ()=>{
            this.toggleAllSounds()
        })

        //save preset button
        const saveButton = document.getElementById('savePreset')
        if(saveButton){
            saveButton.addEventListener('click', ()=>{
                this.showSavePresetModal()
            })
        }

        //confirm save preset button
        const confirmSaveButton = document.getElementById('confirmSave')
        if(confirmSaveButton){
            confirmSaveButton.addEventListener('click', ()=>{
                this.saveCurrentPreset()
            })
        }

         //save preset button
        const cancelSaveButton = document.getElementById('cancelSave')
        if(cancelSaveButton){
            cancelSaveButton.addEventListener('click', ()=>{
                this.ui.hideModal()
            })
        }

        //close modal if backdrop is clicked
        if(this.ui.modal){
            this.ui.modal.addEventListener('click', (e)=>{
                if(e.target === this.ui.modal){
                    this.ui.hideModal();
                }
            })
        }
        
    }

    
     // Handle reset button
        if(this.ui.resetButton){
        this.ui.resetButton.addEventListener('click', ()=>{
            this.resetAll()
        })
      }

      // Timer select
    const timerSelect = document.getElementById('timerSelect')
    if(timerSelect){
        timerSelect.addEventListener('change', (e)=>{
            const minutes = parseInt(e.target.value);
            if(minutes > 0){
                this.timer.start(minutes);
                console.log(`Timer started for ${minutes} minutes`);
            }else{
                this.timer.stop();
            }
        })
    }

    //Theme toggle
    if(this.ui.themeToggle){
        this.ui.themeToggle.addEventListener('click', ()=>{
            this.ui.toggleTheme();
        })
    }

    }

    // load all sounds
    loadAllSounds() {
        sounds.forEach(sound=>{
            const audioUrl =`audio/${sound.file}`;
            const success = this.soundManager.loadSound(sound.id, audioUrl);
            if(!success){
                console.warn(`could not load sound:${sound.name} from ${audioUrl} `)
            }
        })
    }

    //Toggle all sounds
    toggleAllSounds(){
        if(this.soundManager.isPlaying){
            this.soundManager.pauseAll();
            this.ui.updateMainPlayButton(false);
            sounds.forEach(sound=>{
                this.ui.updatePlayButton(sound.id, false);
            })
        }else{
            //Toggle sounds on
            for (const [soundId, audio] of this.soundManager.audioElements){
                const card = document.querySelector(`[data-sound=${soundId}]`)
                const slider = card?.querySelector('.volume-slider')

                if(slider){
                    let volume = parseInt(slider.value);

                    //if slider is at 0, default to 50
                    if(volume === 0){
                        volume = 50;
                        slider.value = 50;
                        this.ui.updateVolumeDisplay(soundId, 50);
                    }

                    // set sound state
                    this.currentSoundState[soundId] = volume

                    const effectiveVolume = (volume * this.masterVolume)/100
                    audio.volume = effectiveVolume/100;
                    this.ui.updatePlayButton(soundId, true)
                }
            }

            //play all sounds 
            this.soundManager.playAll();
            this.ui.updateMainPlayButton(true)
        }
    }

    //toggle individual sound
    async toggleSound(soundId)  {
        const audio = this.soundManager.audioElements.get(soundId);

        if(!audio){
            console.error(`Sounds ${soundId} not found`)
            return false
        }

        if(audio.paused) {
            //Get the current slider value
            const card = document.querySelector(`[data-sound=${soundId}]`);
            const slider = card.querySelector('.volume-slider')
            let volume = parseInt(slider.value)

            //if slider is at 0, default to 50
            if(volume === 0){
                volume = 50;
                this.ui.updateVolumeDisplay(soundId, volume)
            }

            this.currentSoundState[soundId] = volume

            //Sound is off, turn it on
            this.soundManager.setVolume(soundId, volume)
            await this.soundManager.playSound(soundId)
            this.ui.updatePlayButton(soundId, true)
        }else{
            //sound is on, shut it off
            this.soundManager.PauseSound(soundId)
            this.currentSoundState[soundId] = 0;
            this.ui.updatePlayButton(soundId, false)

            // set the sound states to 0 when paused
            this.currentSoundState[soundId] = 0;
        }

        //update main play button state
        this.updateMainPlayButtonState();
    }

    setSoundVolume(soundId, volume) {

        //Set sound volume in state
        this.currentSoundState[soundId] = volume

        console.log(this.currentSoundState)

        //Calculate volume with Master volume
        const effectiveVolume = (volume * this.masterVolume) / 100

        const audio = this.soundManager.audioElements.get(soundId);

        if(audio){
            audio.volume = effectiveVolume / 100
        }

        //update visual display
        this.ui.updateVolumeDisplay(soundId, volume);

        //sync sounds
        this.updateMainPlayButtonState()
    }
    //set master volume
    setMasterVolume(volume){
        this.masterVolume = volume;

        //update the display
        const masterVolumeValue = document.getElementById('masterVolumeValue')
        if(masterVolumeValue){
            masterVolumeValue.textContent = `${volume}%`
        }

        //Apply master volume to all 
        this.applyMasterVolumeToAll();
    }

    //Apply master to all playing sounds
    applyMasterVolumeToAll(){
        for (const [soundId, audio] of this.soundManager.audioElements){
            if(!audio
                .paused
            ){
                const card = document.querySelector(`[data-sound="${soundId}"]`)
                const slider = card?.querySelector('.volume-slider');

                if(slider){
                    const individualVolume = parseInt(slider.value);
                    //calculate effective volume (individual * master/100)
                    const effectiveVolume = (individualVolume * this.masterVolume)/100;
                    
                    //apply to audio element
                    audio.volume = effectiveVolume / 100;
                }
            }
        }
    }

    //update main play button based on individual sounds
    updateMainPlayButtonState(){
        //check if any sounds are playing
        let anySoundsPlaying = false;
        for (const [soundId, audio] of this.soundManager.audioElements){
            if(!audio.paused){
                anySoundsPlaying = true;
                break;
            }
        }
        //update the main button and the internal state
        this.soundManager.isPlaying = anySoundsPlaying;
        this.ui.updateMainPlayButton(anySoundsPlaying);
    }

    //Reset everything to default state
    resetAll(){
        //stop all sounds 
        this.soundManager.stopAll();

        //Reset master volume 
        this.masterVolume = 100;

        //Reset timer
        this.timer.stop();
        if(this.ui.timerSelect){
            this.ui.timerSelect.value = '0';
        }

        //Reset UI
        this.ui.resetUI();

        //Reset Active preset
        this.ui.setActivePreset(null);

        //Reset sound states
        sounds.forEach(sound=>{
            this.currentSoundState[sound.id] = 0;
        })

        console.log('All sounds and settings reset')
    }

    //load a preset config
    loadPreset(presetKey, custom=false){
        let preset;

        if(custom){
            preset = this.presetManager.loadPreset(presetKey);
        }else{
           preset = defaultPresets[presetKey]
        }

        if(!preset){
            console.error(`Preset ${presetKey} not found`);
            return;
        }

        //first stop all sounds
        this.soundManager.stopAll();

        //Reset all volumes to 0
        sounds.forEach(sound=>{
            this.currentSoundState[sound.id] = 0;
            this.ui.updateVolumeDisplay(sound.id, 0)
            this.ui.updatePlayButton(sound.id, false)
        })

        //Apply the preset volumes
        for (const [soundId, volume] of Object.entries(preset.sounds)) {
            //set volume state
            this.currentSoundState[soundId] = volume

            //update UI
            this.ui.updateVolumeDisplay(soundId, volume)

            //calculate effective volume
            const effectiveVolume = (volume * this.masterVolume) / 100;

            //get audio elements and set value
            const audio = this.soundManager.audioElements.get(soundId);

            if(audio){
                audio.volume = effectiveVolume / 100

                //play sound
                audio.play()
                this.ui.updatePlayButton(soundId, true);
            }

        }

        //update main play button and state
        this.soundManager.isPlaying = true;
        this.ui.updateMainPlayButton(true)

        //set active preset
        if(presetKey){
            this.ui.setActivePreset(presetKey);
        }
    }

    //show save preset modal
    showSavePresetModal(){
        const hasActiveSounds = Object.values(this.currentSoundState).some(v => v > 0);

        if(!hasActiveSounds){
            alert('No active sounds for preset');
            return;
        }

        this.ui.showModal();
    }

    //save current preset
    saveCurrentPreset(){
        const nameInput = document.getElementById('presetName');
        const name = nameInput.value.trim();

        if(!name){
            alert('Please enter a preset name');
            return;
        }

        if(this.presetManager.presetNameExists(name)){
            alert(`A preset with the name ${name} already exists`)
        }

        const presetId = this.presetManager.savePreset(name, this.currentSoundState);
        this.ui.hideModal();

        //Add custom Preset button to ui
        this.ui.addCustomPreset(name, presetId)
        
        console.log(`Preset "${name}"  saved successfully with ID: ${presetId}`)
    }

    //load custom presets
    loadCustomPresetsUI(){
        const customPresets = this.presetManager.customPresets
        for (const [presetId, preset] of Object.entries              (customPresets)){
            this.ui.addCustomPreset(preset.name, presetId)
            }
        }

    //Delete custom preset
    deleteCustomPreset(presetId) {
        if(this.presetManager.deletePreset(presetId)){
            this.ui.removeCustomPresets(presetId);
            console.log(`Preset ${presetId} deleted`)
        }
    }

    //Timer complete callback
    onTimerComplete(){
        //Stop all sounds
        this.soundManager.pauseAll();
        this.ui.updateMainPlayButton(false);

        //update individual buttons
        sounds.forEach(sound=>{
            this.ui.updatePlayButton(sound.id, false);
        });

        //Reset timer dropdown
        const timerSelect = document.getElementById('timerSelect')

        if (!timerSelect) {
            timerSelect.value="0"
        }

        //clear and hider timer display
        if(this.ui.timerDisplay()){
            this.ui.timerDisplay.textContent = '';
            this.ui.timerDisplay.classList.add('hidden')
        }
    }

}

// initialize app when dom is ready
document.addEventListener('DOMContentLoaded', ()=>{
    const app = new AmbientMixer();
    app.init()
})
