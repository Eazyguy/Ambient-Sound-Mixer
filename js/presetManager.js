export class presetManager {
    constructor() {
        this.customPresets = this.loadCustomPresets();
    }

    //load presets from local storage
    loadCustomPresets(){
        const stored = localStorage.getItem('ambientMixerPresets')
        return stored? JSON.parse(stored) : {};
    }

    //load custom preset by id
    loadPreset(presetId){
        return this.customPresets[presetId] || null;
    }

    //save custom presets to localStorage
    saveCustomPresets() {
        localStorage.setItem(
            'ambientMixerPresets',
            JSON.stringify(this.customPresets)
        )
    }

    //save cureent mix as preset
    savePreset(name, soundStates) {
        const presetId = `custom-${Date.now()}`

        //create preset object with only active sounds
        const preset = {
            name,
            sounds: {}
        }

        for (const [soundId, volume] of Object.entries(soundStates)){
            if (volume > 0){
                preset.sounds[soundId] = volume;
            }
        }
        this.customPresets[presetId] = preset;
        this.saveCustomPresets();

        return presetId
    }

    //check if preset name already exist
    presetNameExists(name){
        return Object.values(this.customPresets).some(preset=>{
            preset.name == name
        })
    }

    //delete a custom preset
    deletePreset(presetId) {
        if(this.customPresets[presetId]){
            delete this.customPresets[presetId];
            this.saveCustomPresets();
            return true;
        }
        return false;
    } 
}